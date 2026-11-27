# Voxel style plan

Goal: give Dayrim the look of a voxel isometric game (the owner's reference video): block-built characters, a
tilted and turned camera, block terrain, warm light pools, punchy hit reactions and a smoothly zooming camera.
**The game itself does not change**: the same stages, maps, collisions, characters, kits, numbers, text,
networking and saves. It is a drawing and camera change only, and Classic 2D and Pixel 3D stay as they are.

**Scope of this round: the 20 heroes, on all 10 stages.** Everything a hero is, does or shows in the 2D game
must exist in voxel. The 20 villains, the 10 bosses and the Shade follow in a later round, built the same way.

Status (2026-11-27): proof of concept done (Z-96); Phases 0 and 1 done (Z-98, Z-99); Phase 2, the landscape, started (Z-106). The phase order changed on 2026-11-27 at the owner's request: the landscape moved up from Phase 8 to Phase 2. Task rows: Z-98
to Z-108 in [TASKS.md](TASKS.md), one per phase.

## Ground rules (every phase)

1. **Drawing only.** Rules stay in `game.js`/`rig.js` and are untouched; the server never draws. Voxel code lives
   in `game/three/` (bundled into `vendor/three-world.js`) and the voxel hooks in `effects3d.js`, `render.js`, `ui.js`.
2. **Aim and movement stay fair.** Aim is a world point; keys and the touch stick are turned to the camera
   before they reach the rules (`moveRot`, 0 on the server). The voxel view shows the same ground area as today.
3. **Nothing disappears.** Anything without a voxel version yet keeps its current art (a card facing the camera).
4. **Single-player keeps running from `dayrim.html`**, `npm test` stays green, and each phase ends with a browser
   check, a screenshot sheet and docs (TASKS row, HANDOFF, CHANGELOG, this file).
5. **Faces:** the isometric view mirrors face winding, so every solid shape uses flipped geometry (`flipBox`).

## The hero checklist ("replicate everything")

Each line below must have a voxel version before the round is done. The phase that delivers it is in brackets.

### The 20 heroes: body, weapon, kit and ability

| Hero | Look to rebuild (rig record in `rig.js`) | Starting weapon | Quick attack (blue, green, red) | Ability · Use (C, then C again) |
|---|---|---|---|---|
| Detective | fedora, tan trench coat, tie, stubble | Pistol | own kit: ×3/×4/×7 push shots, red also rolls aside | Wolf Form · Howl (werewolf in cap and coat, claws, pounce) |
| Vigilante | hood, bandana, dark hoodie | Crowbar (hook) | own kit: wide sweep, reach +1/+2/+4 | Lasso · Yank (rope, tied enemies, area snare) |
| Guardian | helm, armoured vest with gold, shield | Shield | own kit: tank tiers ×1.5/×2.5/×4, taunt | Aegis · Aegis Release (soak shield) |
| Ranger | green hood, shades, cape, belt | Longbow | own kit: ×3/×4/×7, red empowers shots | Vanish · Last Volley (invisible, arrow shower) |
| Inventor | goggles, brown coat | Blaster | own kit: slowing bolts, red ray beam | Cyborg Ally · Overload (summoned Cyborg) |
| Firefighter | fire helmet, hi-vis stripes, boots | Fire Axe | own kit: tiers up to ×10 | Fire Truck · Hose Blast (drivable truck, passenger seat) |
| Hero Shadow | hood, bandana, dark belt, cape | Knife | shared tiers | Vanish · Ambush |
| Prodigy | headband, open jacket | Baseball Bat | shared tiers | Grab · Home Run (grab and throw an enemy) |
| Sage | glasses, grey hair, coat | Spell Book | shared tiers | Arcane Bind · Seal |
| Falcon EX (Patriot) | winged falcon helm, glowing V visor, red falcon chest, red cape and scarf | Gale Gauntlets | shared tiers (+gun basic) | Falcon Dive · Triple Dive |
| Phantom | green spirit hood, glowing face | Magic Orb | shared tiers | Phase Run · Phase Dash |
| Pyromancer | dark hood, ember robe, glowing face | Magic Orb | own kit: Flame Wave, Fire Wall, Flame Pillar; burning | Meteor Storm · Call Meteors |
| Chronomancer | goggles, dark coat | Magic Orb | own kit: time tiers | Time Field · Time Stop |
| Beastmaster | long hair, open vest, tanned skin | Spear | shared tiers | Stalk · Pounce (leap) |
| Voidwalker | void hood, violet robe, glowing face | Magic Orb | own kit: pushing void shots, void area, scare | Void Field · Open Void |
| Exorcist | grey hair, white-trimmed robe | Censer (staff look) | shared tiers | Triage · Sacred Mend (heal) |
| Gravity Mage | purple cape, belt | Magic Orb | shared tiers | Singularity · Collapse |
| Druid | antlers, green tunic | Herb (staff look) | shared tiers | Thorn Field · Bloom |
| Cyborg | goggles, metal vest and limbs | Fists | shared tiers | Titan Form · Titan Stomp (grows big) |
| Illusionist | top hat, suit, red cape | Cards | shared tiers | Decoy · Swap (a copy of himself) |

### Shared by every hero

- **Weapons (all 30 can be picked up and swapped with Tab)** [1, 4]: fists, knife, cane, baton, rolling pin, wrench,
  crowbar, flashlight, money bag, gavel, baseball bat, shovel, cleaver, fire axe, pistol, gale gauntlets, flash
  camera, tommy gun, blaster, cursed candle, spell book, potion flask, magic orb, dark blade, reaper scythe, forge
  hammer, trident, magic staff, longbow, spear. The held weapon follows `p.weapon`.
- **Animations (the rig's poses)** [3]: idle, walk, sprint (run), attack (per weapon: shoot, swing, thrust, punch,
  throw, cast), hold-to-charge, beam, cast, guard, dodge roll, hit and stagger, pickup, downed (ko), revive,
  respawn, lunge ghost trail, flash when invulnerable, see-through when stealthy, bigger with size buffs, waist-deep
  when wading.
- **Basic attack** [4]: projectiles at chest height (bullets, arrows, orbs, bolts, flasks), muzzle flashes, melee
  swing arcs (colour per weapon), piercing shots, pushes, the gun heroes' "Rapid fire" streak glow, critical hits.
- **Quick attack tiers** [5]: hold to charge, blue, green and red rings and colours, the release burst, charged
  shots and lunges, beams that grow, the shared tier moves for the 11 heroes without their own kit.
- **Ability and Use** [6]: every aim type (self, target, spot, line, ally, grab), the armed marker, cast tracers,
  thrown orbs, closing rings, the finisher (C again), every form and summon in the table above.
- **Ultimate (Q, rage)** [7]: the full-screen banner (already screen space), plus in-world flashes and
  shockwaves; combo link between players; hit stop and screen shake.
- **Element reactions and passives** [7]: the hero's element (shock, bleed, holy, toxin, soak, void, burn, …)
  and the reaction bursts on enemies; passive auras (`AURA_RADIUS` rings); healing links.
- **Status on the hero** [8]: webbed, rust ring, toxic load and toxin %, burning, slowed, stunned, grabbed,
  carrying an item, on the fire truck as a passenger, potions (2× damage, fast), Second Wind.
- **Around the hero** [8]: name tag and level, life bar over others, your own tag, damage numbers and callouts,
  pickup glow rings, revive circle, downed body, respawn, the aim crosshair, danger arcs, the objective pointer.
- **Loot and pickups** [8]: gold, potions, fast and magic boosts, items by rarity, weapons on the ground.
- **Quest objects and NPCs** [1, 2]: villagers, scouts, story characters and side-quest givers as voxel chibi people
  (done); side-quest objects as blocks (done 2026-11-27): items to collect, cursed totems, the shrine to guard, the
  parcel and its drop flag, lost sheep and hounds, the lantern boat (Stage 3 escort), fuel canisters, purifiers and
  generators; still to do in Phase 2: egg sacs, crystal pillars, banshee lanterns, spore vents, the Rusted Ghoul's
  generator and coil, scrap parts, clean springs, hold plates and zones (flat parts stay on the ground).

### The 10 stages (what a hero walks through)

| Stage | Look and special things to rebuild [2] |
|---|---|
| 1 Sunrise Hollow (6:00) | oak woods, flower meadow, haven plaza, butterflies; boss Crystal Scurrier |
| 2 Noonshade Thicket (11:00) | pines, thickets to hide in (cover), pollen; boss Gloom Eye |
| 3 Duskwater Fen (17:00) | marsh, islands, wading water, reeds, lily pads, fireflies; boss Banshee Phantasm |
| 4 Webbed Barrow (21:00) | webbed ground, dust, egg sacs near the arena; boss Chitin Horror |
| 5 Sporefall Marsh (5:00) | toxin clouds, the toxin meter, clean springs, spores; boss Spore Brute |
| 6 Ruined Vale (10:00) | ruins, the vale's tide, falling leaves; boss Flesh Amalgam |
| 7 Rustleaf Woods (18:00) | rust fields and the rust meter, generator and coil, autumn leaves; boss Rusted Ghoul |
| 8 Midnight Warrens (23:00) | night warrens, mist; boss Cyber Dread |
| 9 Blightmoor (2:00) | blighted moor, ash; boss Void Weaver |
| 10 The Last Night (0:00) | the final realm, embers; boss Nameless King |
Every stage also has: walls and trees from its theme, water, bridges, lamps, the haven, the boss gate, quest givers
and side-quest props, day and night with lamp light, and weather. Bosses stay cards until the villain round.

## Phases

| Phase | Row | What it delivers | Size |
|---|---|---|---|
| 0 Groundwork | Z-98 | The checklist above; an **upright effect layer** (effects drawn around a hero stand up facing the camera instead of lying on the ground); voxel open to every hero on every stage while we build (no time limit); a **lineup tool** (`DAYRIM_GFX.lineup=true`) that stands all 20 heroes in voxel beside their 2D art for screenshot review | S |
| 1 Hero bodies | Z-99 | Block bodies for all 20 heroes with full chibi heads, faces, accessories and weapons from the game's own chibi drawings; Wolf Form, Fire Truck, Aegis; NPCs and side-quest objects. **Done 2026-11-27 (owner reviewed).** | L |
| 2 Landscape, Stages 1 to 10 | Z-106 | Every stage's own vegetation and scenery in blocks (the Pixel 3D theme kits voxelised: 10 tree kinds, bushes, grass, ferns, reeds, lilies, rocks and the scattered extras); ground detail (grass tufts, pebbles, puddles, mud with puddles, plank bridges with rails, shore stones, fallen logs, flowers); braziers and ruins; then the stage objective props (egg sacs, crystal pillars, banshee lanterns, spore vents, the generator and coil, scrap, springs, plates and zones), stage hazards (toxin clouds, rust fields, burning ground), walls by theme, water edges, wall fade and auto zoom. **Review stop: play Stages 1, 5 and 10.** | L |
| 3 Animations | Z-100 | Every rig pose and motion listed above, per weapon kind, with the same timing as the 2D frames | M |
| 4 Weapons and basic attacks | Z-101 | All 30 weapons swap with Tab (done in Phase 1); 3D projectiles, muzzle flashes, upright swing arcs, Rapid fire glow, pierce and push effects | M |
| 5 Quick attacks | Z-102 | Charge rings and tier colours in 3D; every kit's charged moves and the shared tiers. **Review stop: each hero's quick attacks on Stage 1.** | L |
| 6 Abilities and forms | Z-103 | All 20 abilities and their Use (Wolf, Fire Truck and Aegis done in Phase 1); aim shapes drawn right for the tilted camera | L |
| 7 Ultimates and combat feel | Z-104 | In-world ultimate effects, combo link, hit stop and shake, hit sparks, element reactions, passive auras, healing links | M |
| 8 Around the hero | Z-105 | Floating bars and tags, status markers, aim and danger marks, pickup and revive rings, block loot, downed bodies, respawn | M |
| 9 Other players, AI teammates, phones | Z-107 | Online players and AI teammates in voxel (drawing only); speed on phones with automatic step back to Pixel 3D; a lighter landscape on phones | M |
| 10 Release | Z-108 | Voxel becomes a saved graphics setting (the preview button goes); screenshot sheets for 20 heroes × 10 stages; tests and docs | S |
| 11 Fixes from the owner's testing | Z-110 | A running list of fixes the owner reports while testing on dev ("phase 11"), kept here so none are lost; each is fixed and ticked off with a date | ongoing |

## Phase 11: fixes from the owner's testing on dev

Reports the owner gives as "phase 11" go in this list (newest last), each with the date reported and, once fixed, the
date fixed.

| Reported | Fix | Status |
|---|---|---|
| (none yet) | | |

**Later round (not now):** the 20 villains (including the three video villains' kits and Vampire Form), the 10
bosses with their auras, the Shade, then villain abilities and boss attacks.

## Progress

**Proof of concept (2026-11-27, Z-96).** Isometric camera (45° turn, 40° tilt) with shared screen maths, aim,
turned keys and touch stick, same view area, 6 tests; block ground sampled from the stage's own ground art, low
block walls, block trees and flowers; block Detective, Wolf Form and all six minion types (`rigModel` builds a
block body from any rig record). Lessons: flipped geometry for this view; walls about 26 units high until wall fade
exists; block characters scaled to the height of the sprite cards (1.3×).

**Phase 0 (2026-11-27, Z-98).** Checklist above. Voxel is open to every hero on every stage with no time limit
(the button reads "Voxel view"). The upright effect layer is in for heroes: everything drawn around a hero (guard
arcs, swing arcs, charge effects, ability glows, status rings) stands up beside the block body. Lineup tool in.
Still flat: shots, hazards and ground-target markers, which move in Phases 4, 6 and 2.

**Phase 1 update (2026-11-27, owner request): chibi detail.** Heads, faces and face accessories now come from the
game's own chibi drawings, not hand-placed boxes: `vxHeadArt` draws `drawHead` front, side and back, and
`hullVoxels` (in `three/voxel.js`) keeps a block wherever the front and side views are both solid, colouring each
outside block from the view that faces it. The head keeps the sprite's size (0.75 model units a pixel) and tips back
0.3 rad so the face shows from the tilted camera. Weapons come from `drawWeaponSprite` (`vxWeaponArt`, given 3 blocks
of thickness). Code-drawn forms are voxelised whole from their own drawing functions (`vxFormArt`): Wolf Form (a
flipbook of standing plus four stride frames, every pixel) and the Fire Truck (every second pixel) with the driver
seated on it; the Guardian's Aegis is a golden dome with a lattice edge. Minions get chibi heads too. Close-ups in
`docs/playtests/2026-11-27-voxel-*.png|jpg`. `DAYRIM_GFX.vxZoom` (1 to 4) enlarges the voxel view for screenshots.

**Phase 2, landscape (2026-11-27, Z-106).** `kitGeometry` (in `three/vegetation.js`) hands the stage theme's own
Pixel 3D model of each tree, plant and scenery kind to `voxelizeGeometry` (in `three/voxel.js`), which samples its
triangles into blocks (`VOX_SIZE`: trees 6 units, bushes and rocks 4, small plants 2 to 2.5, scenery 3), keeps only
blocks that touch the outside, and places them on every spot the 2D map uses, turned in quarter steps; trees on wall
tiles stand on the wall. `scatterExtras` places each stage's extras as in Pixel 3D. Ground detail per tile: grass
tufts, fallen logs, pebbles and puddles on paths, plank bridges with posts and rails, mud slabs with puddles, stones
on the shore. Braziers are block posts with a flickering flame (`PROP_SHAPES.brazier`); ruins use the broken column.
Blocks are grouped in 640-unit areas so areas off screen are skipped. Block counts per stage (2026-11-27): 1: 471k,
2: 645k, 3: 477k, 4: 341k, 5: 512k, 6: 388k, 7: 500k, 8: 419k, 9: 335k, 10: 363k. Smooth on the agent's desktop;
phones need the lighter landscape planned in Phase 9. Screenshots: `docs/playtests/2026-11-27-voxel-stage-01.jpg`
to `-10.jpg`. Still to do in Phase 2: objective props, hazards, walls by theme, water edges, wall fade, auto zoom.

**Quest objects (2026-11-27, owner request).** `PROP_SHAPES` in `three/voxel.js` (block lists matching each 2D drawing,
with named colours for done and not done) and `vxProp` in `effects3d.js` (flat rings and arcs on the ground, the
standing part as a block model). Animals face the way they move and step their legs. Checked in the browser with
each kind placed for a look (`docs/playtests/2026-11-27-voxel-quest-objects.jpg`, `...-lost-sheep.jpg`).

**Phase 1 fix (2026-11-27, owner report): faces on the front only.** The profile drawing has an eye and a mouth, which
showed on both cheeks when a head turned. Now the front half of each side takes the front view's edge colour (skin,
hair, hat) and only the back half uses the side drawing. NPCs (villagers, scouts, story characters, side-quest
givers and lost villagers) are voxel chibi people too (`vxPerson`, `vxNpc`, `vxQuestPerson`). `DAYRIM_GFX.lineupFace`
turns the lineup for side checks.

**Phase 1 (2026-11-27, Z-99).** All 20 heroes have block bodies with their hats, masks, outfits, hair, capes and
per-hero extras, and hold their current weapon. Agent review of the lineup only; no human review yet.
