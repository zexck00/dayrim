# Handoff

For the next person or agent working on Dayrim. State as of version 0.1.0, 2026-11-05.

## Where things stand

Solo play is playable. Multiplayer works locally and passes its tests, but it has not been deployed or played by people over the internet.

| Area | Status |
|---|---|
| Rules with several players | Tested (`game/server/test-rules.js`) |
| Server, rooms, saves, abuse limits | Tested over real WebSockets (`game/server/test.js`) |
| Two browser tabs in one room | Tested by script |
| Full stage to boss kill and next stage online | Tested by a bot, one player |
| Movement with 184 ms of added lag | Tested by script, smooth |
| Solo Firefighter bot | 10 stages, 0 deaths, about 18 game minutes |
| 50 rooms of 4 | Simulated at about 12 ms of a 33 ms budget, on the dev Mac, with no networking |
| Docker image, Compose | **Never run.** Docker wasn't available. The server was run from the same file list. |
| systemd, Caddy, nginx samples | **Never run** |
| Touch controls, phones | **Never tested** |
| Voice lines | Decoded and triggered by code. **Nobody has listened to them.** |
| Hand play | **No person has played** the multiplayer version |

## Open work

Nothing here is promised, and the owner sets priorities.

- **Co-op balance:** the numbers are `partyCrowd` and `partyToughen` in `game.js`, and they are guesses.
- **Solo balance:** heroes may be too easy. In an earlier run, the Necromancer bot died 45 times without finishing in 90 game minutes.
- **Asset villains:** walking, dodge, pill and heal poses need video from the owner. They are built from idle frames for now.
- **Only 3 villains use videos:** the owner said "for now". The others still use the code-drawn rig.
- **Accounts:** none yet. Losing the browser token loses the character.
- **Stale page text:** the plan section in `src/page.html` ("How to execute it") still describes a single-player Phaser plan. Visitors to a public server will see it, so remove or rewrite it.
- **Leftovers:** `sprites/hero/`, `sprites/hero-cutout/`, `sprites/villain/` and `tools/heroes_fullbody.py` are unused and safe to delete.
- **Test hooks in the page:** `window.__dayrim` and `window.__botOn` ship in the page. They only affect that player's own browser, and online rules run on the server.
- **Licensing:** see "Before a public or commercial release" in `README.md`.

## How it fits together

```
          page.html + rig.js + game.js + render.js + net.js + ui.js
                              | tools/build.py, with all art inlined
                              v
                        game/dayrim.html ---------- works alone from a file
                              | served by
                              v
 Browser  <--- WebSocket /ws --->  server/index.js   rooms, HTTP, limits, saves
   net.js                              |  sync.js    per-player snapshots
                                       |  sim.js     loads rig.js + game.js in a vm
                                       '  sim-glue.js  overrides inside that vm
```

### Files

| File | Job |
|---|---|
| `src/rig.js` | Character specs and code-drawn pixel frames |
| `src/game.js` | All rules: data, maps, combat, enemies, rage, combo, `update(dt)` |
| `src/render.js` | Canvas drawing and HUD. Reads state and never changes the rules. |
| `src/net.js` | Online client: lobby, snapshots, prediction, party HUD |
| `src/ui.js` | Menus, input and the main loop. Starts the game, so it comes last in the build. |
| `server/index.js` | HTTP, WebSocket, rooms, message checks, game loop, saving |
| `server/sim.js` | Runs rules in a vm with stubbed browser objects |
| `server/sim-glue.js` | Runs inside the same closure as `game.js`. Turns effects into events and defines `ACTIONS`. |
| `server/sync.js` | Builds each client's snapshot: changed fields only, nearby things only |
| `server/profiles.js` | Save files |
| `tools/balance-bot.js` | Bot that plays solo at high speed |
| `tools/slice.py`, `hero_cards.py`, `minions.py`, `moves_*.py`, `make_voice.py` | Turn original art and video into `sprites/` |

## The ideas you must know

**`G` is the whole game state, and `G.p` is a pointer that moves.** The rules were written for one player, using `G.p` everywhere. Rather than rewrite them, the loop points `G.p` at whichever player matters right now, then runs the same code:

- In a player's turn, `G.p` is that player.
- Before each enemy's update, `G.p` is the nearest living player, so the enemy targets them.
- For a shot or hazard from a player, `G.p` is its owner (`ownerOf`, using `pid`), so kills and leech credit the right player.

So anything belonging to one player goes on the player object (`p.combo`, `p.ult`, `p.nearSafe`, `p.deadT`). Anything shared goes on `G`. Never add a loop that calls a rule function for several players without setting `G.p` each time. In the browser, online, `G.p` is always the local player.

**Solo and online use the same `update()`.** Solo is a party of one, with `G.players=[p]`. `G.mp` switches the few differences: no world slowdown during an ultimate, and `playerDown` instead of the death screen. In a browser online, `update()` never runs. `netUpdate()` runs instead.

**One closure, one set of rules, many rooms.** The server has one instance of the rules. `G` is swapped to `room.G` before each room's step. Everything is synchronous, so rooms can't interfere, but module-level variables in `game.js` are shared across rooms. `mouse`, `keys` and `joy` are reloaded per player by `applyInput`. Any new module-level state must live on `G` instead.

**Effects become events.** On the server, `sim-glue.js` replaces `sfx`, `voice`, `tone`, `noiseHit`, `stinger`, `shake`, `addLog`, `text`, `burst`, `glowP`, `bleed` and `addDecal` with event recorders, and anything pushed to `G.fx` is forwarded. The browser replays them in `netEvent`. To add an effect, either push to `G.fx` with JSON-safe values, or add a function and handle it in both `sim-glue.js` and `netEvent`. Events without a target reach players within 1500 units. `voice`, `shake`, `addLog` and sounds made with `tone` go only to `G.p`.

**Fields sync automatically, with exceptions.** `sync.js` sends every field of enemies and NPCs, except its `*_SKIP` lists. Other players get only the `OTHER_KEEP` list, so a new field that `drawPlayer` reads must be added there. Shots and hazards are sent once at creation and the browser moves them. Strings starting with `{` or `[` are parsed as JSON by the client.

**Maps come from a seed.** `genCitySeeded` swaps `Math.random` during `genCity`, so server and browsers build the same map. The server also sends the collision map, so a floating-point difference between browsers can only change decoration. Any new random call inside `genCity` still matches, because both sides run the same code, but server and page must be the same build.

**Your own movement is predicted.** The browser moves your character at once and records each move in `net.pending`. On each snapshot it takes the server's position, adds the moves not yet acknowledged, and eases toward the result. It snaps if the gap passes 110 units. Other players and enemies glide toward their last reported position. The speed formula in `netUpdate` must match `updatePlayer`.

## Recipes

**Add a player action**
1. Add a rule function in `game.js`.
2. Add it to `LOCAL_ACT` and the key or button handler in `ui.js`.
3. Add it to `ACTIONS` in `sim-glue.js`, validating its value.
4. Add a test in `test-rules.js`.

**Add a host-only choice:** add it to `hostAction` in `sim-glue.js`, and to the name check in `handle` in `index.js`.

**Add a saved field:** add it to `freshPlayer` in `game.js`, `writeSave` for solo, and `SAVE_KEYS` in `sim-glue.js`. Old saves won't have it, so give it a default.

**Add a message type:** handle it in `handle` in `index.js` and `netMessage` in `net.js`. The server limit is 4 KB per message and 200 per second.

## Sounds from the owner

1. Put the original in `ASSETS/audio/` and never edit it.
2. Add a line to `game/tools/make_sfx.sh` that writes a small copy to `game/sprites/sfx/`. AAC (`.m4a`) works in every major browser, and MP3 can be copied as is. Run `sh tools/make_sfx.sh` from `game/`. It needs macOS.
3. List it in `SOUND_CLIPS` in `game/tools/build.py`, then play it with `playSound('name')` in `ui.js`. Music works like `menuMusic`.
4. Every embedded sound makes the page bigger, as the 63-second menu loop adds about 1 MB. Long music should move to loading as needed (D-03, D-61).

Browsers allow sound only after the player clicks or presses a key, so nothing plays on the first screen until then.

## Balance bot

The bot isn't in the page by default. Paste `tools/balance-bot.js` into the browser console on the game page, then run:

```js
runBot('Firefighter',{maxMin:25})
```

It plays solo using the real rules and returns results per stage. It takes about a second per 18 game minutes, and it overwrites that browser's solo save.

## Testing in a browser

- A hidden browser pane doesn't fire `requestAnimationFrame`, so the loop stops. Set `window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16)` before the game's next frame, and bring the tab to the front once to get the chain going.
- Set `window.__botOn=true` to stop the game pausing when the window loses focus.
- `window.__renderErr` records the first drawing error. `render()` catches errors so that one bad frame can't freeze the loop.
- `window.__dayrim` exposes state and functions, including `net`.
- Two tabs share one token, and the newer one closes the older. To test two players in one browser, set `localStorage['dayrim-token']=''` in the second tab before connecting.

## Things that have already gone wrong

- **Timer name clash:** `e.healT` was used for both the enemy heal timer and an animation. A negative ellipse radius froze drawing. The animation timer is now `healFx`. Check for an existing name before adding one.
- **rembg:** its `new_session` hung at 0% CPU on this Mac. `tools/moves_void.py` calls onnxruntime with the isnet-anime model directly instead.
- **Room plates:** in `moves_cut.py`, a median background kept traces of the figure and left holes in the hood. The arch is rebuilt from the darkest percentile.
- **Hero portraits:** enlarged heads looked broken to the owner. Use normal proportions, and use their supplied cards where they exist.
- **Browser speech:** it can report 0 voices, which is why the voice lines are recorded and built in. Speech is only a backup.
- **Art pipeline tools:** they need Python with pillow, numpy, scipy, opencv and onnxruntime. There is no requirements file yet. `make_voice.py` needs macOS, and ffmpeg isn't used.

## Owner preferences seen so far

- Follow the supplied assets closely. "Fully follows the movement assets" is a firm request.
- No brick-style characters for the three video villains.
- Gear and weapon drops were removed "for now", so don't bring them back unasked.
