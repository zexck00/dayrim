# Agent guide

Dayrim is a browser action RPG with an optional multiplayer server. Read [HANDOFF.md](HANDOFF.md) before changing game rules or networking.

## Commands

Run these from the repository root.

```bash
python3 game/tools/build.py          # Rebuild game/dayrim.html. Required after any change in game/src/.
cd game/server && npm ci             # Install the server's one dependency.
cd game/server && npm test           # All tests. Starts its own server on a spare port.
cd game/server && npm start          # Run locally on port 8080.
```

## Rules

1. **Always rebuild and commit `game/dayrim.html`** with any `game/src/` change. It is the shipped game.
2. **One copy of the rules.** The server loads `game/src/rig.js` and `game/src/game.js` directly. Never copy rules into `game/server/`.
3. **Keep `rig.js` and `game.js` free of browser-only calls at load time.** The server only stubs a few. Run `npm test` to catch this.
4. **`G.p` means "the player being processed", not "the local player", in rules code.** Per-player values live on the player object. See HANDOFF.md.
5. **The browser never decides outcomes online.** A new player action needs a browser route (`doAct` or `netAct`) and a checked entry in `ACTIONS` in `game/server/sim-glue.js`.
6. **Treat all client messages as hostile.** Validate types and ranges on the server. Player names go through `cleanName` and `esc`.
7. **Do not edit the original art:** `ASSETS/` and the `.jpeg` and `.mp4` files at the root. Tools read from them.
8. **Keep single-player working.** It must run from `dayrim.html` with no server. The balance bot is the regression check.
9. **Never commit** `.env`, `game/data/` or `node_modules/`. Player saves live in `data/`.
10. **Update `CHANGELOG.md` for user-visible changes.** When releasing, change `VERSION` and `game/server/package.json` together.

## Style

- The JS sources are deliberately dense, with long lines and short names. Match the file you are in.
- There is no framework and no bundler. Sources are joined in order by `game/tools/build.py`.
- The server has one runtime dependency, `ws`. Justify any new one.
- Text players see should be plain and short, in sentence case.

## Testing changes

- **Rules or networking:** `npm test`.
- **Drawing or menus:** run the server and look at it in a browser. The tests don't draw anything.
- **Balance:** see "Balance bot" in HANDOFF.md.
- A hidden browser pane doesn't fire `requestAnimationFrame`, so the game looks frozen in automated tests. See "Testing in a browser" in HANDOFF.md.
