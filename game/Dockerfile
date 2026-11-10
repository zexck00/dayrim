FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --omit=dev
COPY server/index.js server/sim.js server/sim-glue.js server/sync.js server/profiles.js server/
COPY src/rig.js src/game.js src/
COPY dayrim.html ./
COPY assets ./assets
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data TRUST_PROXY=1
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node","server/index.js"]
