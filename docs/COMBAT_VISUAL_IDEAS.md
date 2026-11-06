# Combat visuals and replayability ideas

The active aura and upgrade values are prototypes for playtesting, not final balance or commitments. Z reviews player-facing mechanics and visual direction.

## Three.js feasibility

Dayrim currently renders a top-down 2D world, sprites, HUD and effects with Canvas 2D. Its rules run independently on the server. Three.js could render a separate visual layer without moving rules or hit detection to the browser. Its WebGL renderer accepts a canvas, and a CanvasTexture can carry existing 2D art into a scene, although an updated texture needs uploading again. A WebGL2-capable device is required for the current WebGLRenderer. See the [renderer reference](https://threejs.org/docs/pages/WebGLRenderer.html), [canvas texture guide](https://threejs.org/manual/pages/canvas-textures.html), and [compatibility guide](https://threejs.org/manual/pages/webgl-compatibility-check.html).

A possible next experiment is a toggleable, purely cosmetic Three.js boss-intro or menu scene: a lit arena model, particles and a short camera move. Keep the existing Canvas renderer as fallback, bundle any library locally so the standalone game works offline, and measure load size, frame time, memory, low-end mobile performance and WebGL context loss before considering a wider conversion. A layered in-game effect must align with the 2D camera, resize with the viewport, preserve readable telegraphs and obey reduced-motion settings. Avoid a second renderer per character: Three.js documents the resource and browser-context costs of multiple WebGL contexts in its [multiple-scenes guide](https://threejs.org/manual/pages/multiple-scenes.html).

## Replayability prototypes

- **Encounter choices:** after a fight, choose one of two visible paths with different threats and rewards. Preserve an uncomplicated route for solo players and measure whether choices change play.
- **Run modifiers:** the boss-gate prototype offers a choice of two dodge boons. Explore additional temporary, legible checkpoint upgrades, such as a larger dodge window, more stagger on heavy hits, or a shorter cooldown after a rescue. Reset them at the end of a run; avoid mandatory daily rewards or pressure to return.
- **Team challenges:** optional goals such as interrupting a charged attack or reviving an ally award cosmetics or modest bonus resources. A solo alternative should always be available.
- **Varied encounters:** combine enemy roles and objective modifiers after the roles and objective frameworks exist. Track completion time, deaths, retries and which options players actually pick.

## Current prototype

Each hero and villain projects a passive aura based on their role within 220 units: Bruiser damage reduction 8%, Marksman damage 8%, Striker critical chance 4%, Scout movement speed 8%, or Medic regeneration 0.6% of maximum life per second. Auras apply to their owner and nearby allies, stop while the owner is down, and duplicate roles do not stack. Values need human balance testing. The server evaluates the bonuses; clients use the same movement calculation for prediction.

Owned weapons can be upgraded at the safehouse for 80 and 180 gold. Melee upgrades increase damage, reach and arc; ranged upgrades add shots and widen their spread; spell upgrades spread and enlarge blasts. Necromancer, Void Empress and Toxin Alchemist upgrade the damage of their small, moderate and special signature moves by 20% and 50%; their ultimates are unchanged. At tier 2, pistols and bows pierce one additional enemy, shields interrupt ordinary enemy wind-ups, and healing weapons restore 2% life to the lowest-health nearby standing ally on an enemy hit, at most once per second. Shield interrupts do not cancel boss moves. The Weapons menu explains these effects before purchase and upgraded attacks emit a short pulse visible online. These numbers and visuals remain prototypes for human balance and readability checks. No weapon drops have been added.

The optional Three.js r187 layer is bundled locally from the pinned sources in `game/vendor/`, with its MIT license. `game/tools/three-layer-entry.js` is bundled to `game/vendor/three-layer.js` using esbuild (format ESM, minified, target ES2020); `game/tools/build.py` embeds that bundle in the standalone page. The layer is off by default, follows reduced-motion preference, and leaves rules and the Canvas fallback independent.

## Earlier aura idea (superseded by the current prototype)

After the revive and threat loops are playtested, try one support aura: allies within 200 world units receive 10% damage reduction while the owner is standing. Show the radius briefly on activation and a small buff icon on affected allies; do not obscure attacks. The owner receives the benefit in solo play. Duplicate copies should not stack; use the strongest applicable value. The server computes range and effects from authoritative positions, and clients only display the resulting status. Remove the bonus promptly on leaving range, death or disconnect, and test overlaps, room isolation, save compatibility and bandwidth. Treat the radius and bonus as starting values for Z and human playtests, not final balance.
