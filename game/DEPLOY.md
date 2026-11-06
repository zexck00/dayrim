# Running Dayrim on your server

The server is one Node program. It serves the game page and runs every multiplayer room. It needs Node 20 or newer, and the game itself needs nothing else.

## Try it on your own computer

```bash
cd server
npm ci
npm start
```

Open http://localhost:8080, pick a character and press **Play online**.

## Option A: Docker

Copy this whole `game` folder to the server, then:

```bash
cp .env.example .env
```

Set `ALLOWED_ORIGINS` in `.env` to your address, then:

```bash
docker compose up -d --build
```

Saves live in the `dayrim-data` volume. By default the game listens only on `127.0.0.1:8080`, so put a web server in front of it for HTTPS (below).

## Option B: Node with systemd

```bash
sudo useradd --system dayrim
sudo mkdir -p /opt/dayrim
sudo cp -r server src dayrim.html /opt/dayrim/
cd /opt/dayrim/server && sudo npm ci --omit=dev
sudo cp deploy/dayrim.service /etc/systemd/system/   # run this one from the game folder
sudo systemctl enable --now dayrim
```

Edit `dayrim.service` first: set `ALLOWED_ORIGINS` to your address.

## Behind a reverse proxy (optional)

`docker-compose.yml` is the only compose file the project ships. It publishes one ordinary port and
sets no proxy labels, so the same file runs on a laptop, a VPS or a NAS. If a reverse proxy such as
Caddy, nginx or Traefik handles HTTPS in front of it, keep your proxy configuration out of this
repository: it belongs to the host, not to the game.

Three things matter when you do:

- **Do not apply a strict Content-Security-Policy.** The game page is one file of inline scripts and styles.
- **Pass WebSockets through** at `/ws`, with no buffering and a read timeout of at least a minute.
- **Get `X-Forwarded-For` right.** `TRUST_PROXY=1` is correct only when the proxy replaces that header.
  A proxy that appends to it lets a visitor fake their address, so leave `TRUST_PROXY=0` in that case.

Never put an authentication prompt in front of `/ws`: the game's own token is the identity.

## HTTPS

Browsers on an HTTPS page will only connect to the game over secure WebSockets, so put Caddy or nginx in front. Both samples are in `deploy/`, and both pass WebSockets through. Replace `play.example.com` with your domain.

## Settings

| Variable | Default | What it does |
|---|---|---|
| `PORT` | 8080 | Port to listen on |
| `HOST` | 0.0.0.0 | Address to listen on |
| `DATA_DIR` | `../data` | Where saves are stored. **Back this up.** |
| `ALLOWED_ORIGINS` | same host only | Comma-separated websites allowed to connect |
| `TRUST_PROXY` | off | Set to `1` only behind your own web server, so per-address limits see the real visitor |
| `MAX_ROOMS` | 50 | Rooms at once |
| `MAX_PLAYERS_PER_ROOM` | 4 | Players per room |
| `MAX_CONNECTIONS` | 400 | Connections at once |
| `MAX_CONNECTIONS_PER_IP` | 12 | Connections from one address |

## Updating

After changing anything in `src/`, rebuild the page with `python3 tools/build.py`, copy the files over and restart. Everyone in a room is disconnected for a moment and rejoins on their own if the room still exists. Rooms live in memory, so a restart closes them, while saved characters are kept.

## Checking it

- `GET /healthz` answers `ok`.
- `GET /api/info` shows the number of rooms and connections.
- Tests: `cd server && npm test && node test-rules.js`

## Limits to know about

- **One process:** all rooms run in one Node process, so this is built for one machine.
- **Saves are files:** one JSON file per player in `DATA_DIR`. A database becomes worthwhile with many thousands of players.
- **No accounts yet:** a player's identity is a secret token in their browser. Clearing browser data or changing device starts a new character, and that progress can't be recovered.
