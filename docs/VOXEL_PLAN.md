# Voxel style plan (draft, 2026-11-27)

Goal: give Dayrim the look of a voxel isometric game, as in the owner's reference video: block-built
characters, a tilted isometric camera, block terrain, warm light pools, punchy hit reactions and a camera
that zooms smoothly. **Nothing about the game itself changes**: the same stages, map layouts, collisions,
characters, kits, bosses, quests, numbers, text, networking and saves. This is a drawing and camera
change only.

Status: a proof of concept is built (2026-11-27, row Z-96 in [TASKS.md](TASKS.md)). Task IDs are `V-01` to `V-48`.

## Proof of concept (2026-11-27)

Limited on purpose to **Stage 1 and the Detective**, behind a "Voxel preview (2 min)" button that switches
back after two minutes. Not committed or deployed yet; tested by automated checks and a short agent browser
look only.

| Task | State in the proof of concept |
|---|---|
| V-01 | A timed preview button instead of a saved setting |
| V-02, V-03, V-06, V-07, V-08 | Done: isometric camera (45° turn, 40° tilt), shared screen maths, turned keys and touch stick, same view area, 6 tests |
| V-04 | Done for mouse and touch aim |
| V-05 | Done for the objective pointer, danger arrows, name tags, callouts and damage numbers; health bars and effects not yet |
| V-10, V-11, V-13, V-14 | Early versions: ground sampled from the stage's own ground art, walls about 26 units high, block trees and flowers |
| V-25, V-28, V-29, V-35 | The Detective only: block body, walk, shoot, guard, dodge roll, downed pose, hurt tilt with a white flash |
| V-34 | Done: every other character, minion, boss and prop is its existing art on a card facing the camera |

**What the proof of concept taught us (plan revisions):**
- The isometric view mirrors face winding, so solid shapes need flipped geometry (`flipBox`). Any new model must use it.
- Walls taller than about 26 units hide players in the woods. Keep walls low until V-17 (cutaway) exists.
- The block Detective must be scaled to about the height of the sprite cards (1.3×), or he looks tiny next to quest givers.
- Effects, health bars and some labels are still drawn flat on the ground. Added **V-47** to stand them up.
- Added **V-48**: when the owner approves, replace the 2-minute button with the saved setting (V-01) and open it to every stage (V-18).


## Ground rules

1. **Drawing only.** The rules in `game.js` and `rig.js` stay as they are. The server never draws, so
   all new code lives in `game/three/` (bundled into `vendor/three-world.js`) and a little in
   `effects3d.js`, `render.js` and `ui.js`.
2. **A third graphics mode, "Voxel".** Classic 2D and Pixel 3D stay as they are and remain the
   fallback for weak devices, lost WebGL and reduced motion.
3. **Same map, new skin.** Every tile, wall, water cell, tree and prop the generator already makes is
   rebuilt from voxels in the same place. Nothing moves, and nothing is added that blocks movement.
4. **Aim stays fair.** Aim is still a world point. Only the conversion from screen to world changes,
   so the server sees exactly what it sees today.
5. **Single-player still runs from `dayrim.html`** with no server, and `npm test` stays green.

## Phase A: camera and projection (foundations)

| ID | Task | Size | Needs |
|---|---|---|---|
| V-01 | Add a "Voxel" option to the graphics setting, saved per player, falling back to Pixel 3D when WebGL2 is missing | S | |
| V-02 | Isometric camera in `three/world.js`: about 45° turn and 35° tilt, following the player with no lag, keeping them centred | M | V-01 |
| V-03 | One shared `project`/`unproject` pair (world to screen, and screen to ground), with a ray hitting the ground plane | M | V-02 |
| V-04 | `screenToWorld` and the mouse aim in `ui.js` use `unproject` in Voxel mode (touch joystick directions rotated to match the camera) | M | V-03 |
| V-05 | HUD markers that sit on the world (danger edge, pointer arrow, name tags, damage numbers, pop-ups) use `project` | M | V-03 |
| V-06 | Rotate movement keys to the camera, so "up" still moves up the screen. Rules get the same world direction they get today | S | V-02 |
| V-07 | View-range check: the isometric view must never show more of the map than today's view (no online advantage) | S | V-02 |
| V-08 | Tests: `unproject(project(p))` returns p, aim at the screen corners, keys mapped to the right directions | S | V-03 |

## Phase B: voxel map (same layout, block look)

| ID | Task | Size | Needs |
|---|---|---|---|
| V-09 | Voxel tile kit: 1 tile split into a 4×4 grid of blocks, with greedy-meshed chunks so big 156×110 stages stay fast | M | V-02 |
| V-10 | Ground: grass, dirt, path and sand tops with a small colour jitter per block, as in the video. Walking height stays flat | M | V-09 |
| V-11 | Walls: block walls with varied heights (stone, brick, wood, picket fence) chosen by stage theme, on the same wall tiles | M | V-09 |
| V-12 | Water and ponds: see-through blue blocks with light shimmer and foam blocks at the edges; wading looks the same as today | M | V-09 |
| V-13 | Trees and thickets as voxel trees (oak, pine, dead, crystal and so on per theme), on the same cells | M | V-09 |
| V-14 | Flower and pebble blocks scattered on grass (decoration only, never blocking) | S | V-10 |
| V-15 | Props (crates, chests, shrines, springs, totems, quest items, boss arena props) as small voxel models | L | V-09 |
| V-16 | Haven and quest givers: voxel buildings with lit windows on the existing haven spot | M | V-11 |
| V-17 | Wall cutaway: walls and canopies between the camera and a player fade or get cut away, like the roof in the video | M | V-11 |
| V-18 | Stage themes: map all 10 `STAGE_THEMES` colour sets to voxel palettes (Sunrise Hollow to the Nameless King's realm) | M | V-10 |
| V-19 | Minimap stays the same 2D minimap (no change) | S | |

## Phase C: light and atmosphere

| ID | Task | Size | Needs |
|---|---|---|---|
| V-20 | Time of day per stage from its theme (day stages bright, dusk and night stages dark blue) | S | V-18 |
| V-21 | Warm light pools: lamps, torches, springs, shots and glows as point lights with soft round pools on the ground | M | V-20 |
| V-22 | Soft shadows under characters, trees and walls | M | V-09 |
| V-23 | Gentle depth blur at the top and bottom edges of the screen, and a vignette | S | V-02 |
| V-24 | Weather per stage in voxel form (butterflies, pollen, spores, rain, embers) using the existing `WEATHER` table | M | V-20 |

## Phase D: voxel characters

| ID | Task | Size | Needs |
|---|---|---|---|
| V-25 | Chibi voxel body template: big head, body, two arms, two legs, as separate parts that can turn | M | V-02 |
| V-26 | Character style table: hair, skin, outfit colours, hat, cape and so on for each of the 40 characters, read from their current art | L | V-25 |
| V-27 | Weapons as voxel models (swords, bows, guns, staffs, shields and so on), held in the hand | M | V-25 |
| V-28 | Animations from the existing `anim` names: idle bob, walk swing, run, attack, cast, dodge, hurt, down, revive | L | V-25 |
| V-29 | Face the 8 directions smoothly (turn towards movement or aim) | S | V-28 |
| V-30 | Signature forms as voxel models: Fire Truck with passenger seat, werewolf, vampire bat, Cyborg and others that change shape | L | V-26 |
| V-31 | Minions: voxel versions of every minion type, reusing the body template with new heads and palettes | L | V-25 |
| V-32 | The 10 bosses and the Shade as larger voxel models, keeping their auras and colours | L | V-31 |
| V-33 | AI teammates, other players and summons use the same models; name tags stay | S | V-26 |
| V-34 | Fallback: any character without a voxel model yet uses its current sprite card, so nothing is ever missing | S | V-25 |

## Phase E: hit and combat feel (look only)

| ID | Task | Size | Needs |
|---|---|---|---|
| V-35 | Hurt reaction: a short body tilt away from the hit, arms flung out and a white flash, driven by the existing hurt event | M | V-28 |
| V-36 | Impact pop text in a chunky voxel-style font for big hits (the game's own words and numbers, not new ones) | S | V-05 |
| V-37 | Small block particles on hits, kills, pickups and breaking props | M | V-22 |
| V-38 | Knockback shown with a slight bounce when the rules move an actor, with no change to the distance | S | V-35 |
| V-39 | Downed and revive poses in voxel form | S | V-28 |
| V-40 | Glow rings on pickups and things to interact with when a player is close | S | V-15 |

## Phase F: camera feel and zoom

| ID | Task | Size | Needs |
|---|---|---|---|
| V-41 | Smooth automatic zoom: a little closer in the haven and during boss intros, back out in the open, over about 1 second | M | V-07 |
| V-42 | Zoom buttons (+ and −) inside a safe range, never wider than today's view | S | V-41 |
| V-43 | Screen shake and hit stop use the existing values, applied to the isometric camera | S | V-02 |

## Phase G: performance, tests and release

| ID | Task | Size | Needs |
|---|---|---|---|
| V-44 | Performance: instanced voxels, frame budget on a phone, automatic step down to Pixel 3D under 30 fps | M | all of B to D |
| V-45 | Tests in `test-three.mjs`: every stage builds in Voxel mode, every character has a model or a fallback, no change to rules results | M | all |
| V-46 | Browser checks and a screenshot sheet: all 10 stages, all 40 characters, bosses, hit reaction, zoom and phone width; then docs, CHANGELOG and the 3D bundle rebuild | M | all |
| V-47 | Health bars, ability shapes and hit effects stand up or float in the voxel view instead of lying on the ground | M | V-05 |
| V-48 | Replace the 2-minute preview with the saved "Voxel" setting and open it to all stages and characters | S | owner approval |

## Suggested order

1. Phase A first (V-01 to V-08): without the camera and fair aim, nothing else can be checked.
2. Phase B with one stage (Sunrise Hollow) and Phase D with one hero, as a playable slice. **Review stop.**
3. The rest of Phases B, C and D across all stages and characters.
4. Phases E and F for feel. **Review stop: play Stages 1, 5 and 10.**
5. Phase G and release to `dev`.

## Risks

- **Art workload:** 40 characters, about 30 minion types, 10 bosses and many props. The body template and
  style table keep each character to a short data entry, and V-34 means unfinished models never break
  play.
- **Aim feel:** an isometric camera changes how far the mouse must move. V-04 and V-08 must be right
  before anything else ships.
- **Phones:** voxel scenes are heavier than sprite cards. V-44 steps down automatically.
- **Hidden areas:** walls and trees in an isometric view can hide players and shots; V-17 handles that.

## Out of scope

No changes to rules, balance, map generation, stories, quests, kits, text, sound or networking. No art
copied from the reference game; all models are Dayrim's own.
