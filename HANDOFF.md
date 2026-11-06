# Handoff

For the next person or agent working on Dayrim. State as of 2026-11-06: unreleased work on top of version 0.1.0, local branch `combat-depth-fixes` after C-01–C-16 review fixes and C-14 coverage. The task and design documents distinguish prototypes from the target design.

## Where things stand

Solo play and local-network multiplayer are playable prototypes. The server has not been verified on a public internet deployment. A human was given the local-network address for a playtest; no results have been recorded yet.

| Area | Status |
|---|---|
| Latest rules and networking suite | 312 rule checks, 42 networking checks and all 780 reaction pairs passed after the weapon upgrade work |
| Server, rooms, saves, abuse limits | Tested over real WebSockets (`game/server/test.js`) |
| Browser checks | Automated checks cover two tabs, solo/online G actions, a checkpoint boon, viewport layout, weapon icons and the optional 3D layer; not a substitute for human playtests |
| Full stage to boss kill and next stage online | Tested by a bot, one player |
| Movement with 184 ms of added lag | Tested by script, smooth |
| Latest solo bot sample | Firefighter and Detective cleared 10 stages in about 16 game minutes each; Necromancer cleared 3 in 25 minutes with 1 death. The bot does not use team abilities or boons. |
| 50 rooms of 4 | Simulated at about 12 ms of a 33 ms budget, on the dev Mac, with no networking |
| Docker image, Compose | **Never run.** Docker wasn't available. The server was run from the same file list. |
| systemd, Caddy, nginx samples | **Never run** |
| Touch controls, phones | **Never tested** |
| Voice lines | Decoded and triggered by code. **Nobody has listened to them.** |
| Human playtest results | No results recorded; ask players about danger, role abilities, reactions, recovery and boon discovery |

## Open work

See [Combat depth review](docs/COMBAT_DEPTH_REVIEW.md) for C-01–C-16 findings and prioritized quality-of-life ideas.

Nothing here is promised, and the owner sets priorities.

- **Party runner:** `node game/tools/party-bot.js --url ws://127.0.0.1:8080/ws --players 4 --seconds 180` drives real clients and reports outcomes. Use an isolated server and data directory; one-, two- and four-bot samples cleared Stage 1; the three-bot sample timed out and none reached Stage 3. Further seeds and human playtests remain open.
- **Co-op balance:** `PARTY_SCALE` in `game.js` holds provisional scaling; initial one-to-four-player bot samples exist, but no human balance results are recorded. The ×8 four-player damage candidate can be punishing.
- **Solo balance:** the latest single bot sample suggests Necromancer may struggle; random results vary, and the bot does not use team abilities, checkpoint boons or weapon upgrades.
- **Asset villains:** walking, dodge, pill and heal poses need video from the owner. They are built from idle frames for now.
- **Only 3 villains use videos:** the owner said "for now". The others still use the code-drawn rig.
- **Accounts:** none yet. Losing the browser token loses the character.
- **Stale page text:** the old Phaser plan remains in `src/page.html`, but the full-window layout currently hides it. Remove or rewrite it as part of D-05.
- **Leftovers:** `sprites/hero/`, `sprites/hero-cutout/`, `sprites/villain/` and `tools/heroes_fullbody.py` are unused and safe to delete.
- **Test hooks in the page:** `window.__dayrim` and `window.__botOn` ship in the page. They only affect that player's own browser, and online rules run on the server.
- **Licensing:** see "Before a public or commercial release" in `README.md`.

## How it fits together

```
    page.html + rig.js + game.js + render.js + net.js + effects3d.js + ui.js
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
| `src/effects3d.js` | Optional visual-only Three.js layer; off by default, with Canvas fallback |
| `vendor/three-layer.js` | Bundled Three.js r187 effects module, embedded by the build; source and MIT license are in `vendor/` |
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
- Before each enemy's update, `G.p` is its living taunt target if present, otherwise the player with the highest threat score. Threat comes from damage and from active healing, damage measured as a percentage of the enemy's life and effective healing as a percentage of the healer's maximum life, plus a small proximity term; it decays 4 points a second and a challenger needs 15% more to take over, so enemies do not flip-flop. Rushers still prefer a nearby back-line ally until someone out-threatens them. Bosses keep to the nearest player until the boss framework defines their targeting. The tuning lives in one `THREAT` table.
- For a shot or hazard from a player, `G.p` is its owner (`ownerOf`, using `pid`), so kills and leech credit the right player.

So anything belonging to one player goes on the player object (`p.combo`, `p.ult`, `p.nearSafe`, `p.deadT`). Anything shared goes on `G`. Never add a loop that calls a rule function for several players without setting `G.p` each time. In the browser, online, `G.p` is always the local player.

**Solo and online use the same `update()`.** Solo is a party of one, with `G.players=[p]`. `G.mp` switches the few differences: no world slowdown during an ultimate, and `playerDown` instead of the death screen. In a browser online, `update()` never runs. `netUpdate()` runs instead.

**One closure, one set of rules, many rooms.** The server has one instance of the rules. `G` is swapped to `room.G` before each room's step. Everything is synchronous, so rooms can't interfere, but module-level variables in `game.js` are shared across rooms. `mouse`, `keys` and `joy` are reloaded per player by `applyInput`. Any new module-level state must live on `G` instead.

**Effects become events.** On the server, `sim-glue.js` replaces `sfx`, `voice`, `tone`, `noiseHit`, `stinger`, `shake`, `addLog`, `text`, `burst`, `glowP`, `bleed` and `addDecal` with event recorders, and anything pushed to `G.fx` is forwarded. The browser replays them in `netEvent`. To add an effect, either push to `G.fx` with JSON-safe values, or add a function and handle it in both `sim-glue.js` and `netEvent`. Events without a target reach players within 1500 units. `voice`, `shake`, `addLog` and sounds made with `tone` go only to `G.p`.

**Fields sync automatically, with exceptions.** `sync.js` sends every field of enemies and NPCs, except its `*_SKIP` lists. Other players get only the `OTHER_KEEP` list, so a new field that `drawPlayer` reads must be added there. Shots and hazards are sent once at creation and the browser moves them. Strings starting with `{` or `[` are parsed as JSON by the client.

**Maps come from a seed.** `genCitySeeded` swaps `Math.random` during `genCity`, so server and browsers build the same map. The server also sends the collision map, so a floating-point difference between browsers can only change decoration. Any new random call inside `genCity` still matches, because both sides run the same code, but server and page must be the same build.

**Your own movement is predicted.** The browser moves your character at once and records each move in `net.pending`. On each snapshot it takes the server's position, adds the moves not yet acknowledged, and eases toward the result. It snaps if the gap passes 110 units. Other players and enemies glide toward their last reported position. The speed formula in `netUpdate` must match `updatePlayer`, including the Scout aura and crawl/drag modifiers.

## Current prototypes

- Party-size scaling, recovery, shared Hope and wipe retries are provisional. A retry uses the stage start or open boss gate; bosses restart at full health until phase checkpoints exist.
- Objectives point at themselves: `objTargets()` (game.js) returns `{x,y,label}` for whatever the current step needs, and `drawObjPointer()` (render.js, last thing in `hudBody`) draws a marker in view or an edge arrow with distance out of view. Unit distance is 40 world units per metre, the tile size. A new objective kind needs one branch in `objTargets()` and nothing else.
- `frame()` in rig.js falls back to `SPECS.Tourist` when a name has no spec, and `drawNpc` draws `c.art||c.name`. The wounded scout had `name:'Scout'`, which had no spec, so every frame with the scout in view threw inside `buildFrame` and the render guard skipped the whole frame: the screen froze near the scout. Any new NPC or entity must have a spec or an `art` that has one.
- Enemy health is expressed in hits, not in raw life: `REC_HITS` (2.2), `recDamage(stage)` (level-only damage at the recommended level) and `mobUnit(stage)` give the health of one weak minion, with archetypes as multiples of it (`a.hp`, and 3.2 or 0.6 for the mob family). Do not reintroduce `stageScale` into enemy life: that curve is ×1.38 per stage and made stage 10 trash take 5.4 hits. `MELEE_UP` is the swing damage table for weapon upgrades, 1 / 1.2 / 1.5, matching what a ranged upgrade spreads across its extra shots.
- Split objectives have a fallback: `holdStep` compares `partySize()` with `st.need`. When the party cannot split, each zone is held alone for `HOLD_ALONE_T` (8 s) and stays down, which is the design's "one plate stays down for 8 seconds". `zoneNeed()` feeds the ring on the ground so the visual matches whichever rule is running. A step is now finished only when `st.met` says so (hold steps own their timer); `st.have` is display progress and must never be the completion test on its own.
- Linked ultimates live in `G.link` (`{t,ids,dmg,name,hits}`): `openLink` on each cast, `linkEffect` for the tier effects, `linkBonus(p)` read at hit time and `hits` records earlier damage so a later tier applies its incremental bonus, `tickLink` in `update`, and `ultDmgFor(e,p,lb)` so the link multiplies exactly once - after `bossUltDamage`'s party share, never twice. Solo casts do not open a window because there is nobody to link with. The window is synced as `lk` (`{n,t,in}` per client); the client derives the tier bonus from the count, and the HUD shows it with the linked count or "LINK NOW: press V" and a countdown bar. There is no per-ally screen takeover: `drawUlt` only ever runs for the local caster, and allies get the ground nova from the fx events.
- Party chain lives in `G.chain` (`{n,t,tier}`): `chainAdd` on every kill by anyone, `chainTick` in `update` for the shared six second window, `chainBonus()` for the four tiers (`CHAIN_BONUS`), `cdMulOf(p)` so every ability timer reads haste and chain through one function, and `rageShare` for the 500-unit rage split. The counter and timer cross the wire as `ch` and `ct` in the room-wide block.
- Stage 1 (Crystal Scurrier) has its own kit, wired through `bossPick`: `aim` for Skitter Rush, a `spray` act for the cone, and `burrow`/`erupt` at half life, which hides the boss (`e.buried`, immune to damage) and then erupts under `topThreatPlayer`. Pillars are ordinary props (`kind:'pillar'`) spawned by `BOSS_PHASE_FX[1]`; they are not solid, and while any stand the boss heals at `PILLAR_REGEN` per pillar per second. `pillarHit` is the timing rule: solo needs `charged` (a kit move that is not the small one), a party needs two different players inside `PILLAR_WINDOW`. Pillars are hit from the melee arc in `doAttack` and from kit moves in `doMove`.
- Bosses run on one framework. The numbers sit together at the top of the boss section: `BOSS_GUARD_MAX`, `BOSS_STAGGER`, `BOSS_TELEGRAPH` (minimum wind-up), `BOSS_ENRAGE_BASE/STEP/RATE` and `BOSS_STAGGER_DMG`. `bossGuard` is fed by Break, reactions and specials; a full bar staggers the boss for 5s, during which it does not act and takes 1.5x damage. `bossTelegraph` is the only way to start a big attack and refuses anything shorter than 0.6s, which the renderer draws as a filling marked area (circle or line). `bossEnrage` runs a clock of 240s + 30s per stage and shortens follow-up cooldowns once it fires. `bossPhaseCheck` reads `BOSS_PHASES[stage]`; crossing a threshold clears enemy shots, gives the boss a 2s breather and bumps the phase. The arena is `G.arena`, opened in `summonBoss` and cleared on death: it clamps the party inside and a respawn lands at its edge, which replaced the old trick of healing a boss that players ran away from.
- Stage objectives live on `G.obj` as ordered steps: `{i, done, steps:[{kind, need, have, label}]}`, built by `objectiveSteps(stage)` from `STAGE_STEPS`. `objStep()` runs every frame; the kill step reads `G.killsStage`, and the last step calls `openGate()`, which is now the only thing that opens the boss gate. Stages with no steps yet fall back to the kill quota, so no stage can dead-end. The wounded scout is a normal NPC with `wounded:true` and fallback art. If killed while its objective is active, a replacement spawns: `updateRevive` prefers a downed ally and falls back to a wounded NPC in reach, so one hold-F input serves both. Online, only the current step crosses the wire (`obj` in the room snapshot) and the client renders it from `objNow()`. Steps come in four more kinds: `revive`, `hold` (each zone lit in turn, or `simul` for zones held at once), `carry` (walk over an item to lift it, walk into the drop ring to deliver it; a carrier cannot attack, cast or use the team ability) and `escort` (moves only while a player is within 220). Every prop lives in one synced list, `G.props`, with a `kind`, and one renderer, `drawProp2`, so a new objective kind is a spawner plus a branch. `resetStepState` runs on a wipe: finished steps stay, the step in progress starts over.
- Enemy roles come from the weapon through `METHOD_ROLE`: heal to healer, shield to guard, spell to caster, shoot to shooter, everything else rusher, and strong minions stay brutes. Casters drop a `G.hazards` zone on their target every 6 to 9 seconds. A guard's block only applies when the hit arrives from the front (`facing < 1.05`), so flanking ignores it. The marker is drawn from the synced `targetId`, which the enemy loop writes every frame; solo players carry `id:1` so that field is never 0 in single-player.
- Reactions are a data table: `ELEMENT` (the design's element per character, keyed by roster name), `REACTIONS` (ten rows), and `REACT_FX` (one effect per id, each returning its damage multiplier). An id with no effect cannot fire. `reactionCoverage()` reports all 780 character pairs: 259 named reactions and 521 resonance pairs. `node game/tools/check-reactions.js` exercises each pair through online hit rules. New enemy fields: `shatterT` (armour off, takes 25% more), `frozenT`, `slowT` (40% slower, applied in `steer`), and `rotT`/`rotRate`/`rotBy`. A reaction consumes `statusT`. Splash damage goes through `reactHit`, which cannot trigger another reaction. Both players who build a reaction gain `REACTION_RAGE`. A solo player can trigger half-strength Resonance with a second hit on an active status.
- Every character has a role aura. G activates Taunt, Break, Mark, Mend Link or Rescue Dash. Rushers, brutes and healers have initial behavior; brutes can be exposed after a dodge and healer casts can be interrupted. Break Strike and all listed elemental reactions are implemented; other elemental pairs use resonance.
- Gore (C-30) is code-only and needs Z's review: blood volume scales with damage as a share of the target's life, heavy hits and criticals add chunks, kills leave a pool, wounded enemies under 35% life leave a trail, and minion blood takes its family colour. Decals carry their own colour and the client caps them at `GORE.cap`; the cap matters because unbounded spray used to evict pools within seconds. Wound trails are throttled by `GORE.trailT`. Drop marks are probabilistic (`GORE.mark`) so spray does not carpet the ground.
- Haste (C-29) shortens cooldowns. Levels and trained Agility shorten weapon, spell, heal, dash, team-ability and kit-special cooldowns through one `cdMul`, floored at 60% of base; passive regeneration and potion timers are deliberately excluded. Needs Z review and a balance pass.
- Boss-gate checkpoints offer one personal dodge boon. Boons persist with the current character run and saves; the team still needs to decide and test the exact end-of-run reset. Safehouse upgrades cost 80 and 180 gold. Ordinary weapons retain their melee, gun and spell progression; the three video-based villains can upgrade signature-move damage to 1.2× and 1.5×. Upgrades persist in `weaponUpgrades`, and the Weapons menu previews effects from the same tables the rules use. Short attack pulses are sent as visual events. Ultimate damage is unchanged.
- The game fills the browser window. Menu → Skills describes the G ability and offers any pending boon; Menu → Weapons handles upgrades; Return to main menu leaves an online room. The optional 3D effects toggle is visual only. No background music is implemented, and final music and SFX are Z’s responsibility.
- A local-network playtest server was verified at `http://192.168.1.10:8080` on 2026-11-06. It is a temporary process on this machine, not a public deployment or a stable address. The server caches the built page at startup; after changes, rebuild and restart it only when players will not be interrupted. Progress uses `game/data/` by default and must not be committed.

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

**Where each sound is wired** (all in `game/src/ui.js` unless noted):
- Footsteps: `footsteps()`, picked by the ground under each player. `STEP_OF` maps ground type to sound set. Ground 3 is water and 4 is wood, made by `pond()` in `genCity` (`game.js`).
- Announcer: `announce(name, priority)`. One voice at a time, and a higher priority interrupts. Combo tiers go through `announceTier`, boss and down lines through `soundWatch()`, and start game through the Start buttons and `netJoined`.
- Rule sounds with recordings: `ASSET_SFX` and `playAsset`, hooked from `sfx()` in `game.js`. `slash` uses melee, `pull` uses heal, and `rivalDown` uses the hero or villain down line.
- Music: `menuMusic`, `gameAmbience` and `setBossMusic`.
- `ASSETS/audio/villian:hero dead.wav` has a colon in its name, which Windows can't check out. Rename it if anyone works on Windows, and update `make_sfx.sh` to match.

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
