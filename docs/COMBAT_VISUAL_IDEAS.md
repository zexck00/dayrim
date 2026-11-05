# Combat visuals and replayability ideas

These are prototypes for playtesting, not final balance or commitments. Z reviews player-facing mechanics and visual direction.

## Three.js feasibility

Dayrim currently renders a top-down 2D world, sprites, HUD and effects with Canvas 2D. Its rules run independently on the server. Three.js could render a separate visual layer without moving rules or hit detection to the browser. Its WebGL renderer accepts a canvas, and a CanvasTexture can carry existing 2D art into a scene, although an updated texture needs uploading again. A WebGL2-capable device is required for the current WebGLRenderer. See the [renderer reference](https://threejs.org/docs/pages/WebGLRenderer.html), [canvas texture guide](https://threejs.org/manual/pages/canvas-textures.html), and [compatibility guide](https://threejs.org/manual/pages/webgl-compatibility-check.html).

A useful first experiment is a toggleable, purely cosmetic Three.js boss-intro or menu scene: a lit arena model, particles and a short camera move. Keep the existing Canvas renderer as fallback, bundle any library locally so the standalone game works offline, and measure load size, frame time, memory, low-end mobile performance and WebGL context loss before considering a wider conversion. A layered in-game effect must align with the 2D camera, resize with the viewport, preserve readable telegraphs and obey reduced-motion settings. Avoid a second renderer per character: Three.js documents the resource and browser-context costs of multiple WebGL contexts in its [multiple-scenes guide](https://threejs.org/manual/pages/multiple-scenes.html).

## Replayability prototypes

- **Encounter choices:** after a fight, choose one of two visible paths with different threats and rewards. Preserve an uncomplicated route for solo players and measure whether choices change play.
- **Run modifiers:** offer one of three temporary, legible upgrades at checkpoints, such as a larger dodge window, more stagger on heavy hits, or a shorter cooldown after a rescue. Reset them at the end of a run; avoid mandatory daily rewards or pressure to return.
- **Team challenges:** optional goals such as interrupting a charged attack or reviving an ally award cosmetics or modest bonus resources. A solo alternative should always be available.
- **Varied encounters:** combine enemy roles and objective modifiers after the roles and objective frameworks exist. Track completion time, deaths, retries and which options players actually pick.

## Ally aura prototype

After the revive and threat loops are playtested, try one support aura: allies within 200 world units receive 10% damage reduction while the owner is standing. Show the radius briefly on activation and a small buff icon on affected allies; do not obscure attacks. The owner receives the benefit in solo play. Duplicate copies should not stack; use the strongest applicable value. The server computes range and effects from authoritative positions, and clients only display the resulting status. Remove the bonus promptly on leaving range, death or disconnect, and test overlaps, room isolation, save compatibility and bandwidth. Treat the radius and bonus as starting values for Z and human playtests, not final balance.
