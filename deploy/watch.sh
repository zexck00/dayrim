#!/usr/bin/env bash
# Pull the published image for a stack and recreate the container only when the
# digest actually changed, with a health check and a rollback that cannot flap.
#
#   watch.sh all|prod|dev
#
# Run by dayrim-watch.timer every minute. No SSH anywhere: the box only pulls
# from GHCR, so GitHub needs no deploy secret and the box needs no open port.

set -uo pipefail

REPO_DIR="${DAYRIM_DIR:-/home/calypso/workspace/dayrim}"
ENV_DIR="${DAYRIM_ENV_DIR:-/home/calypso/dayrim}"
OWNER="${DAYRIM_OWNER:-zexck00}"
HEALTH_TRIES="${DAYRIM_HEALTH_TRIES:-30}"

log() { logger -t dayrim-deploy -- "$*" 2>/dev/null; printf '%s %s\n' "$(date -Is)" "$*"; }
die() { log "FAILED: $*"; exit 1; }

stacks() {
  case "${1:-all}" in
    all)  printf 'prod\ndev\n' ;;
    prod|dev) printf '%s\n' "$1" ;;
    *) die "usage: watch.sh [all|prod|dev]" ;;
  esac
}

config() {
  case "$1" in
    prod) TAG=latest; CONTAINER=dayrim-prod; HOST=dayrim.calypso.dedyn.io
          COMPOSE=deploy/compose.prod.yml; PROJECT=dayrim-prod; ENV_NAME=prod.env ;;
    dev)  TAG=dev;    CONTAINER=dayrim-dev;  HOST=dayrim-dev.calypso.dedyn.io
          COMPOSE=deploy/compose.dev.yml;  PROJECT=dayrim-dev;  ENV_NAME=dev.env ;;
    *) die "unknown stack $1" ;;
  esac
  IMAGE="ghcr.io/${OWNER}/dayrim:${TAG}"
  ENV_FILE="${ENV_DIR}/${ENV_NAME}"
  HOLD="${ENV_DIR}/${PROJECT}.hold"
}

# Put the previous image back. The hold file is already written by this point.
rollback() {
  [ -n "$RUNNING" ] || return 0
  docker tag "$RUNNING" "$IMAGE" || log "$STACK: could not retag the old image"
  docker compose -p "$PROJECT" -f "$REPO_DIR/$COMPOSE" --env-file "$ENV_FILE" up -d --no-build >>"$ENV_DIR/${PROJECT}.deploy.log" 2>&1 \
    || log "$STACK: rollback recreate failed, see ${ENV_DIR}/${PROJECT}.deploy.log"
}

for STACK in $(stacks "${1:-all}"); do
  config "$STACK"

  [ -f "$ENV_FILE" ] || { log "$STACK: no $ENV_FILE, skipping"; continue; }

  # A hold file means a deploy failed or was interrupted and must not be retried
  # until a human looks. It contains the image id that failed.
  if [ -f "$HOLD" ]; then
    log "$STACK: held at $(cat "$HOLD") — remove $HOLD to resume deploys"
    continue
  fi

  if ! docker pull -q "$IMAGE" >/dev/null 2>&1; then
    log "$STACK: could not pull $IMAGE (offline or not published yet), leaving the running container alone"
    continue
  fi

  WANT=$(docker image inspect -f '{{.Id}}' "$IMAGE" 2>/dev/null) || { log "$STACK: image vanished after pull"; continue; }
  RUNNING=$(docker inspect -f '{{.Image}}' "$CONTAINER" 2>/dev/null || true)

  # Already current: stay quiet, or the journal fills up every minute.
  if [ "$WANT" = "$RUNNING" ]; then continue; fi

  log "$STACK: new image ${WANT:7:12} (was ${RUNNING:7:12}), recreating $CONTAINER"

  # Hold first: if this run is killed part way, the next one must not treat a
  # half-finished deploy as current. Only a healthy check clears it.
  printf '%s\n' "${WANT:-unknown}" > "$HOLD"

  if ! docker compose -p "$PROJECT" -f "$REPO_DIR/$COMPOSE" --env-file "$ENV_FILE" up -d --no-build >>"$ENV_DIR/${PROJECT}.deploy.log" 2>&1; then
    log "$STACK: compose failed, see ${ENV_DIR}/${PROJECT}.deploy.log — rolling back to ${RUNNING:7:12} and holding"
    rollback
    continue
  fi

  # Health: ask traefik the way a player would.
  OK=0
  for _ in $(seq 1 "$HEALTH_TRIES"); do
    if curl -fsS --max-time 3 "https://${HOST}/healthz" >/dev/null 2>&1; then OK=1; break; fi
    sleep 2
  done

  if [ "$OK" = 1 ]; then
    log "$STACK: healthy on https://${HOST}/ with ${WANT:7:12}"
    rm -f "$HOLD"
  else
    log "$STACK: unhealthy after ${HEALTH_TRIES} tries — rolling back to ${RUNNING:7:12} and holding"
    rollback
  fi
done
