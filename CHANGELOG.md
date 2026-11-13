# Changelog

Versions follow [Semantic Versioning](https://semver.org). The version lives in `VERSION` and `game/server/package.json`. Keep both the same.

## [Unreleased]

### Added

**Characters**
- Every hero, villain, minion and townsperson is redrawn in a full chibi style: big heads (about 44% of the body), large eyes with a coloured iris and shine, eyebrows that show each character's mood, short legs, and a three-tone shading pass. Sprites are drawn on a 64 px grid at the same size on screen.
- Each of the 40 heroes and villains now matches the head design on its character card: the Detective's fedora and stubble, the Guardian's gold T-visor helm, the Necromancer's glowing eyes in a void hood, the Toxin Alchemist's quiff and gas mask, the Shadow Monarch's widow's peak and high collar, and so on.
- Weapons are oversized and chunky, and long weapons are held upright between attacks. Several characters hold what their card shows: a pocket watch, black-hole orbs, a skull staff, puppet strings, a soul lantern, a holo screen, an hourglass.
- Walking squashes a little as each foot lands, and idle characters breathe more slowly.

**Charge, beam and stagger**
- Hold the attack button to charge: a ball of your character's colour grows at your hands while you move slowly, and a ring turns once it is strong enough. A tap still attacks at once.
- Let go at 60% charge or more. Casters, shooters and the three kit villains fire a beam that burns along a line for half a second and holds you in place. Melee fighters lunge forward through every enemy in the way instead.
- Heavy hits stagger enemies: a red flash, a shove and a puff of dust. A beam's first hit freezes the moment briefly, and a fully charged beam darkens the screen for one frame (not with reduced motion).
- Beams and lunges are a share of your own basic hit, so they grow with your weapon, level and skills. They work online too.

**Story mode**
- A game modes screen opens after Play Game: Story, Quick Game and Warzone (not open yet) in a sidebar on the left, with the developers, the version and a Changelog button below. Quick Game is the stage game as before.
- Story mode, "The Ten Hours": three chapters, one for each of the first three bosses. Pick one of the first five heroes or the first five villains. The story is told differently for each side: heroes win the stolen Hours back, villains keep them.
- Each chapter has its own hand-laid map to roam: Sunrise Hollow (a farming village, wheat fields, an orchard and a crystal quarry), Noonshade Thicket (a logging camp, a river, three shrines and the heart-grove) and Duskwater Fen (a canal town, marsh boardwalks, a graveyard and the drowned chapel). They have streets, houses, bridges and their own plants.
- Chapters are a chain of objectives: talk to people, clear an area, collect things, defend a place, hold shrines, beat a lieutenant, then the boss. A marker and the minimap show where to go.
- Dialogue with portraits, a Skip button, and one choice per chapter that gives skill points, supplies or gold. Named people can be talked to with F or the Talk button; townsfolk have their own lines for heroes and villains.
- Treasure chests and enemy camps off the main path, and enemies that roam the wilds between objectives.
- Story progress saves after every objective, one save for the hero side and one for the villain side. Your character's level, skills and gear carry from chapter to chapter, and finished chapters can be replayed.

**Stages and bosses**
- Bosses share one framework: a guard bar that fills when you Break them or set off a reaction, a stagger that makes them take more damage and stop acting, a marked area on every big attack that fills up before it lands, an enrage timer that makes their attacks faster, a breather when they change phase that clears their incoming fire, and arena doors that keep the party in the fight until the boss dies.
- Stage 1's boss has its own fight: a Skitter Rush that charges along a marked line, a Shard Spray cone of crystals, and at half life it burrows and erupts under whoever it resents most while raising two crystal pillars. The pillars heal it until they break, and breaking one is a timing test: two players must hit it within two seconds, or one player must land a charged move.
- Objectives come in five kinds: clear a kill quota, revive a wounded scout, light or hold marked zones (some need several held at the same time), carry items to a marked drop while unable to attack, or escort a lantern boat that only moves while somebody stays close. A wipe restarts the step in progress instead of the whole stage.
- Stage 1 has a real objective: clear the villain quota, then find the wounded scout and hold F to revive them. The boss gate only opens when the whole objective is done, and the stage line shows the current step and its progress.
- The objective shows where it is: a marker over the thing you need (the wounded scout, a dark beacon, a canister, the drop, the escort boat) and an arrow on the screen edge with the distance when it is out of view.
- Shallow ponds you can wade through, with wooden bridges where paths cross them. Their colors follow each stage's theme.
- Gloom Eye, the Stage 2 boss: a sweeping gaze beam, triple tentacle slams, a blinding pulse at 60% and a second sweep at 25%. When it locks its gaze on you, face away; its back eye then opens and hits from behind it break its guard. Solo, dodging through the beam also opens the eye.
- Stage 2 has tall thicket that hides enemies until they are within 120 units. Marked enemies and ones just hit still show.
- Stalkers wait in the thicket, give a short warning, then lunge. Dodging the lunge leaves them open.
- Duskwater Fen, Stage 3: the water rises and falls, and it slows you off the islands. Lurkers grab and drag a player until an ally hits them; solo, your own hits free you.
- Banshee Phantasm, the Stage 3 boss: a wail ring with a gap to step through, untouchable drifts and, at half life, a possess that slows and pulls one player. She can only be hurt in lantern light. Carry a lantern and hold F to set it down.
- Webbed Barrow, Stage 4: cut four egg clusters before they hatch, and rescue allies caught by ranged Webbers. A player alone breaks free after five seconds.
- Chitin Horror, the Stage 4 boss: flank its armored front, dodge its bouncing charge, cut allies free from web spit, and burst egg sacs before they hatch. It sheds its armor and speeds up at low life.
- Sporefall Marsh, Stage 5: manage toxin, carry three purifier canisters to separate vents, and avoid the spore clouds released by Bloaters. The safehouse and activated vents clear toxin.
- Spore Brute, the Stage 5 boss: share Toxic Load with nearby allies, use the purifier or clean vents, destroy healing mushrooms, and reach a clean zone before Toxic Storm.
- Ruined Vale, Stage 6: avoid warned floor collapses and flank Shieldbearers. Hold both pressure plates to open the boss gate; a solo player can hold them one at a time.
- Flesh Amalgam, the Stage 6 boss: pull its two bodies apart to stop them healing, and bring a downed body's partner down before it revives. The bodies rejoin for the final phase.
- Rustleaf Woods, Stage 7: rust weakens armor at night, a fueled generator must be defended while it is repaired, and Scrap Golems rebuild unless their parts are destroyed. Solo players can break both parts.
- Rusted Ghoul, the Stage 7 boss: dodge its hook and cleaves, then power the generator and lure it onto the coil to stagger it and clear Rust Field. The coil charges itself for a lone standing player.

**Abilities**
- Every playable character has an Ability. C readies it (locks a target, picks an ally, aims a spot or line, grabs an enemy, or starts a buff) and a left click uses it; there is no separate Use button. On touch, tap Ability to ready it and tap it again to use it. C again cancels an aimed ability, or fires the finisher of a buff or grab. The click that uses an ability does not also attack. An ability hits for ten of that character's basic attacks, so it grows with level, stats, skills and weapon upgrades. The cast delay and 60 second cooldown match a special attack.
- Basic attacks have their own feel for each style: a glint as a melee swing starts; a muzzle flash, smoke puff and recoil kick for guns and bows; a turning rune circle at the hand and a release flash for spells. Enemies flash a short spark where they are hit.
- Thrown things look thrown: flasks, skulls and trick cards hop in a small arc with a shadow under them and spin as they fly. Flasks are drawn as cork-stoppered bottles that drip as they go and splash when they break; skulls scatter bone chips.
- The Necromancer's small attack throws a skull that breaks on the first enemy or wall, or at its range.
- The Toxin Alchemist's attacks are thrown flasks. The small attack throws one straight at your aim: it breaks on the first enemy or wall, or at 250 units, and leaves a small poison pool. The moderate attack lobs a heavier flask in an arc over enemies to the aimed spot (up to 300 units), where it bursts with a wider blast and pool. Enemy Toxin Alchemists throw them at their target the same way.
- Ranged abilities fire a real projectile: they wind up at the hand, then launch it, and the effect lands when it arrives. Lock On and the stuns fire a homing bullet or bolt, the piercing lines throw a spear that hits each enemy as it passes, hooks fly out on a chain and stop at the first enemy, and pools and singularities are lobbed in an arc to the aimed spot. Walls stop spears and hooks. Allies see the projectiles too.
- Sixteen kinds, shared out to fit each character:
  - Lock On → Execute (Detective): shoot a locked enemy; ordinary enemies under a quarter of their life die outright.
  - Aimed pools (Toxin Alchemist, Pyromancer, Druid, Swarm Queen, Ash Shaman): throw to a spot in range; a burst and a damaging pool.
  - Leaps (Beastmaster, Demon Knight): mark an enemy, leap onto it and slam.
  - Piercing lines (Ranger, Necromancer): aim a line that charges for 2 seconds, then hit every enemy on it.
  - Ranged stuns (Inventor, Sage, Mad Scientist) and freezes (Chronomancer, Ice Archmage); the Inventor's and Mad Scientist's arc to two more enemies.
  - Domes (Guardian, Soul Forger): you and allies inside take half damage; Use is a shockwave that pushes and stuns.
  - Max Heal (Exorcist, Plague Doctor, Cyber Priest): fully heal the most hurt ally in range and clear poison, webs and stuns. 90 second cooldown.
  - Invisibility (Hero Shadow, Shadow Monarch): 5 seconds unseen and unhurt; Use ambushes the nearest enemy for double damage.
  - Roars (Patriot, Blood Reaper): taunt nearby enemies and take 30% less damage; Use slams the ground.
  - Singularities (Gravity Mage, Void Empress): pull every enemy near a spot into it and crush them.
  - Decoys (Illusionist, Mirror Jester): leave a copy; Use swaps you back to it and it bursts.
  - Hooks (Vigilante, Soul Stealer, Deep Siren): drag the first enemy on the line to you and daze it.
  - Grab and throw (Prodigy, Puppeteer): lift the nearest enemy and hurl it where you aim; not bosses or villains.
  - Overdrive (Phantom, Chrono Thief): twice as fast for 6 seconds; Use dashes through enemies, untouchable.
  - Titan form (Cyborg, Mecha Tyrant): twice the size for 8 seconds, 50% more damage, a third less damage taken; Use stomps and stuns.
  - Force rings (Firefighter, Voidwalker, Gravity Weaver): charge a growing ring, then push every enemy in it away and break their attacks.
- Enemies show their level beside their life bar, and bosses show it in the boss bar. It is the stage's recommended level, plus 1 for strong minions and elites, 3 for villains and 4 for bosses. Their life and damage already rise with each stage.

**Notifications**
- Being downed, clearing a stage, the final victory and pause (and their online versions) are game-style cards: a framed plate glowing red, gold or blue, a kicker between rules, a big pixel title that slams in, stat plates (gold lost, skill points, level against the recommended level), and a tinted backdrop.
- In-game banners (stage starts, villains arriving, webs and so on) are ribbon plates with diamond ends that snap open with a shine across the title; warnings use red. Big callouts such as ULTIMATE READY and EXECUTED pop in large in the pixel font.

**Animation**
- Smoother characters for everyone drawn with the pixel rig (heroes, villains, minions, rivals and citizens): an 8-step walk instead of 4 and a 5-step attack with a wind-up and follow-through. On every frame, motion is added between poses: a bob and lean while walking, breathing at rest, a lunge on attacks and a flinch when hit.
- Dodge: an eased roll with a crouch at the start, a ghost trail, dust on take-off and a squash on landing.
- Attacks: a smear behind the fastest frames, and a short hit-stop on heavy hits (abilities, specials) when playing alone.
- Sprint: hold Shift (or drag the touch stick far out) to run 1.5 times as fast with a longer stride, forward lean and dust kicks. It costs 8 mana a second and stops while attacking, shielding or dodging. Shift no longer dodges; Space does.
- With reduced motion turned on, the extra bob, lean, trails and dust are left out.
- Phones: on landscape phones, Ability and Use stand in a column beside the main buttons so the controls stay low; in portrait they sit above them. The two buttons show the character's own move names, the touch stick glows while it sprints, and a hint shows when an armed ability can be dragged to aim. On the character screen, the ability description spans the panel instead of a narrow column.

**Minions**
- Weak and strong minions (Skeleton, Bone Goliath, Voidling, Void Goliath, Toxin Grunt, Toxin Enforcer) use the same pixel rig as the cast, with its walk, attack and hit frames. Strong minions are drawn 1.4 times larger.

**Modes and progression**
- Levels and Agility give Haste: every cooldown is shorter, down to 60% of its base time. The character sheet shows the percentage.
- The Swarm: an endless mode on any stage you have reached, alone or online. Every wave is bigger, a boss joins every fifth wave, and the safehouse only shelters you between waves. Nothing you earn carries back to your saved character; your best wave is kept.
- Achievements for story milestones, combat, teamwork, encounter mechanics, progression, longer-term goals and the Swarm, with a collection menu and unlock notifications.
- Spend gold at the safehouse to upgrade weapons, up to tier 5: melee arcs widen and hit harder (a full melee upgrade hits for 1.5 times its base), ranged attack patterns spread, pistols and bows pierce an extra enemy, shields interrupt ordinary enemy attacks and healing wind-ups, and healing weapons restore a nearby injured ally on a hit, at most once per second. The Necromancer, Void Empress and Toxin Alchemist upgrade their signature moves the same way. Three further safehouse upgrades add power while keeping melee reach and swing coverage in check.

**Characters**
- Every hero and villain projects a passive role aura to nearby allies.
- Every hero and villain has a signature passive of their own (for example the Detective's Keen Eye, 6% more critical chance, or the Mecha Tyrant's Armored Core, 10 extra armor), shown on the character menu. Each is a small bonus on top of the archetype.

**Title screen and interface**
- A title poster before hero selection: the owner's poster art with the DAYRIM letters cut from the title art in the centre, slow drifting embers, and a small stone-lettered Play Game button (Enter also works) that leads to choosing a hero.
- Fullscreen mode with a button and the L key. The cursor is replaced by a crosshair during play, and Esc brings it back.
- A return to menu button on the pause screen.

**Sound and voice**
- Menu music on the character and online screens, which fades out when a game starts. Hero and villain browse sounds play when picking a card or switching tabs (the villain sound at twice the hero level).
- Background ambience throughout the game, mixed from the owner's two ambience tracks and kept soft.
- Footsteps that change with the ground: grass, sandy paths, stone, water and wood, using the owner's step recordings.
- Announcer lines from the owner's recordings: start game, the combo tiers, boss fight, boss defeated, enemy hero or villain down, you down, a friend down, all friends down and all down.
- Boss music: an entrance theme, then a more urgent track if the boss is still alive after a minute. It replaces the ambience during the fight.
- Melee swing and heal sounds from the owner's recordings.
- The title song plays on the title poster, fading in to 70% volume, and hands over to the menu music on Play Game.
- First blood: the owner's line plays on a kill, at most once every 10 minutes.
- Co-op sounds for going down, starting and finishing a revive, and linked ultimates: the link window opening, and Duo, Trio and Full Party, each with a spoken call.
- A sound for each of the ten reactions (Inferno, Shatter, Overload, Freeze, Rot, Collapse, Purge, Eclipse, Cauterise, Frostbite) and for Resonance.
- Enemy voices: weak minions squeak and strong minions growl when they spot you, attack, get hurt and die, and creatures such as Stalkers and Lurkers hiss and snarl. Brutes, guards and elites use the strong voice. Each sound has three versions, and crowds are rate-limited so the mix stays clear.
- Boss sounds: an entrance roar, a call before every telegraphed attack, a groan when staggered, a roar at each phase change and a death roar.
- All of these are made from scratch by `tools/make_audio.py` (tones, noise and a small vocal synthesizer, no samples), so they need no outside license. See `docs/licenses/generated-audio.md`.

**Co-op and combat**
- Downed players can crawl and be revived by allies. Medics revive faster and from farther away; Scouts can drag allies. Solo players get one Second Wind per stage.
- Online parties share Hope. When Hope is empty and nobody is standing, the next bleed-out restarts the party at the latest checkpoint.
- Combat roles: use G for Taunt, Break, Mark, Mend Link or Rescue Dash. Mark, Mend Link and Rescue Dash show their current target. Brute dodges and interrupts create openings, and healers can be interrupted.
- Ultimates link. Fire one in a party and a three second window opens: allies are told to press V, and each one who does upgrades it. Duo gives both ultimates +40% and clears every enemy shot, Trio gives +70% and makes the party invulnerable for the ultimate, and Full Party doubles the damage, heals everyone and staggers the boss for five seconds.
- Kills feed a party chain: one counter for everyone, a six second window and four bonus tiers (5 kills: 5% move speed, 12: 10% damage, 20: double mana regeneration, 30: cooldowns 20% faster). A kill also hands allies within 500 units 35% of the rage it gave the killer.
- Elements for all 40 characters. Ten pairs react (Inferno, Shatter, Overload, Freeze, Rot, Collapse, Purge, Eclipse, Cauterise, Frostbite); every other pair resonates for a small damage bonus, and both players who build a reaction earn rage. Solo players trigger half-strength Resonance with a second hit on an active status.
- A heavy attack can follow an ally's Break, and boss-gate checkpoints offer a dodge boon.
- Enemies show who they are coming for: a red marker above an enemy means it is after you, a pale marker with a party number means an ally. Role labels cover shooters, casters and guards; casters leave a damaging zone at your feet, and guards only block from the front, so flanking works.

**Feedback and visuals**
- A gold coin indicator in the in-game HUD shows your current gold.
- Your own character shows a small name and level tag (for example "Detective LVL 3") that stays above them and glows when you level up. Each upgrade (a skill rank, a weapon or signature tier, gym training or a checkpoint boon) shows a note above the tag for 10 seconds.
- Combat bleeds: every hit sprays blood that scales with the damage, heavy hits and criticals throw chunks, kills leave a pool, badly wounded enemies drip as they run, and players bleed when hit. Toxin and void minions bleed green and violet.
- Party and combat feedback shows difficulty, Hope spent, retry location, revive target and range, chain time and bonuses, enemy status and Taunt duration, and citizen fear. The Skills menu explains reactions.
- Optional Three.js ambient effects, with an off switch and an offline fallback.
- A red edge at low life, arrows for off-screen enemies about to hit you, and a mark showing where a hit came from.
- Brighter attacks: swing crescents and tip flares, glowing bullets and muzzle flashes, hit sparks with bigger bursts on critical hits, a flash on kills, and pulsing enemy wind-ups.

### Changed

**Minions**
- Strong minions have twice the life, damage and move speed they had.
- Minions keep up with the party: their level is the stage's recommended level, or the party's average level when that is higher, and their life and damage follow that level.

**Casters**
- Characters whose own weapon is a spell (book, orb, staff, candle, cards or flask) regain mana twice as fast, since every basic attack costs mana: Sage, Phantom, Pyromancer, Chronomancer, Voidwalker, Gravity Mage, Illusionist, Soul Stealer, Puppeteer, Gravity Weaver, Swarm Queen and Ice Archmage. The three asset villains attack without mana and are unchanged.

**Skills**
- Every skill now trains to rank 100 instead of 10 or 15, and each rank keeps its bonus. Critical chance stops at 60% so Precision cannot make every hit a critical.

**Loading**
- The game page is about 390 KB instead of 10 MB. Pictures, sounds and the 3D effects library are separate files in `game/assets`, named by content hash, that load as needed and stay cached; the character menu appears straight away even on slow connections. Sounds load a few at a time, title and menu music first. The server sends these files with long-term caching, the Docker image includes them, and CI checks they are committed and current. `tools/build.py --inline` still makes a single self-contained file.

**Characters and art**
- The Necromancer, Toxin Alchemist and Void Empress use the same pixel figures as the other villains. Their own attacks stay, shown as a coloured sweep or aura, and the page no longer carries their large art sheets.
- Every playable character has a themed ultimate name, emblem and animated effects, visible to nearby online players.
- Weapon projectiles gain brighter trails and distinctive ornaments as they are upgraded, visible in solo and online play.

**Title screen**
- The whole title poster fits on screen, with a blurred fill around it. Play Game grows and brightens 20% on hover.

**Sound and voice**
- The announcer voice lines are remade with a free public-domain voice (`tools/make_free_voice.py`), replacing the macOS voice that could not be used commercially.
- Combo announcer lines moved up one clip: kill 1 is First blood and Double Kill is kill 2. Legendary, which has no clip of its own yet, uses its announcer voice line.

**Enemies and combat**
- Magic Pills double damage for 20 seconds, and the mobile button is labeled “2× damage”.
- Enemies build threat from the damage and healing they take and go for the player who earned the most attention, instead of always walking at the nearest one. Taunt still overrides it.
- Party size scales enemy life, rival and boss damage, enemy count and the boss gate quota. Living enemies adjust when players join or leave. These values are provisional pending playtests.
- Enemy health is set in hits instead of a number that grew away from the player: a weak minion takes about two hits at the stage's recommended level on every stage, and brutes keep their place at five times that.
- Ultimate hits deal the designed 4% of boss life divided by party size before link bonuses, even for high-damage builds.
- Enemies are smarter. Only two press one player at a time while the rest circle, aim follows you until late in a wind-up, attacks can chain, and healing or reviving draws a rush.
- Shooters lead and strafe, guards turn slowly, packs alert each other, and enemies wait outside the safehouse instead of forgetting you.
- Bosses can chain attacks and react to healing. Every attack keeps its warning.
- Enemy hits are stronger on early stages: a weak hit now takes about 10, 8 and 7 hits to down you on Stages 1, 2 and 3, down from over 20.
- Stage 2 beacons now take 5 seconds to light. Starting one draws a wave, and hits on the lighter set the beacon back.
- A target can react once every 2 seconds, so fast weapons no longer earn ultimates and boss stagger from every second hit.

**Mobile**
- Mobile combat controls group attack, shield, potion and fast controls together: Fast, Heal, Team and Revive sit above the damage pill, Potion, Ult and Dodge, with Spell, Attack and Shield on the bottom row. Ultimate charge shows on its button, each orientation has a compact HUD, and less frequent actions are in an expandable panel.
- Mobile combat controls and HUD use a dark fantasy style, with Shield beside Attack.
- Portrait phones use a compact HUD with a smaller minimap, a boss bar below player status, and a shorter touch-control grid. Sound, fullscreen and 3D effects are in the Settings menu.
- Touch buttons show ability cooldowns, ultimate charge and common reasons an item or ability is unavailable.
- Touch controls fit short landscape screens, show held actions and a movement stick, and keep utility buttons clear of the action grid.

**Interface**
- The game fills the browser window. The in-game menu has a weapons tab with distinct weapon icons.
- HUD and on-screen buttons grow on taller screens, so they stay readable at Full HD and above.
- Skills are grouped by purpose and show rank progress and current and next bonuses; descriptions clarify which attacks and healing they affect.
- Weapon upgrade cards show tier progress, current and next effects, and why an upgrade is unavailable. Upgraded attacks show a short tier-colored pulse, and piercing, shield interrupts and ally heals have distinct combat cues.

**Housekeeping**
- Removed the hidden, obsolete Phaser roadmap and its unused page styles.

### Fixed

**Objectives and the wounded scout**
- Split objectives no longer lock a small party out: a step that needs two plates or three shrines at once falls back to a timed version (one zone at a time, held for eight seconds) when there are too few players, so solo stages 6 and 9 can be finished.
- Simultaneous hold steps really need their full hold time; standing on every plate used to complete the step on contact.
- The wounded scout no longer crashes the renderer when it comes on screen.
- The wounded scout can be revived reliably: night thinning no longer deletes it, hits and shots can no longer hurt or push it before it is revived, enemies ignore it, and the hold-F reach is 80. A revive button appears near it for mouse players, and the objective instructions mention the touch control.
- A replacement wounded scout appears if the objective scout is lost, and killing the scout after it is revived no longer closes an online room.
- Hold objectives can no longer get stuck: after a party wipe, when a party shrinks mid-step, or when someone joins or leaves during a hold. A zone that is already lit stays lit.
- Carrying an objective item now prevents signature moves and ultimates, and a downed carrier drops the item where they fell.
- Carry canisters no longer spawn inside the drop zone, where picking one up delivered it at once.
- Objective props such as plates, beacons, canisters, the drop zone, pillars and the escort boat now draw in single-player.
- The objective pointer now works online, including for targets far off screen, and the zone ring online fills to the real hold time.

**Encounters and the Swarm**
- Defeated Lurkers always release their victims, including when damage over time kills them.
- Defeating the Banshee releases lantern carriers and possession. Travel and checkpoint retries clear encounter statuses.
- New Swarm runs clear leftover loot, temporary effects, cooldowns and party bonuses. Wave rewards no longer remove potions above five.
- Signature moves can hit crystal pillars without closing the room.

**Co-op**
- Linked ultimates now increase damage already dealt when an ally joins late, and online linked-ultimate feedback shows its damage bonus.
- Full Party healing no longer gives life to downed or respawning players without reviving them.
- Healing generates enemy attention only for life actually restored, credited to the healer.
- Revive progress resets when switching allies, expired statuses no longer resonate, and healing threat follows the healer.
- Citizens now fear the player responsible for a civilian death, rather than every party member.
- The party chain HUD reads its bonuses from the rules, so the two can't disagree.

**Online**
- Online enemy target markers now receive the awareness state they need to appear.
- The online Skills menu updates when the server confirms training or a checkpoint choice.
- The online Weapons menu updates when the server confirms a purchase or changes safehouse access.
- The difficulty notice no longer draws over the retry line.

**Title screen**
- The title poster no longer flashes a broken image while the page loads; it fades in once its pictures are ready.

**Mobile**
- The mobile party panel no longer overlaps the player status bars, and the linked-ultimate prompt names the touch control.
- Touch movement and held actions clear when interrupted, including when a menu opens or the game loses focus.

**Deployment**
- Docker builds include the game assets the page links to, so the dev and main sites can update again.
- A deploy that fails to start now rolls back to the previous image, and an interrupted deploy leaves a hold instead of looking current.

## [0.1.0] - 2026-11-05

First commit. Everything built so far.

### Game
- 40 playable characters, 20 heroes and 20 villains, each with their own stats and starting weapon.
- 10 stages on procedural maps with vegetation, a day and night cycle, and a monster boss on each stage.
- Six ways to fight: unarmed, weapon melee, shooting, spells, shield and heal.
- Training, skills, shop, potions, Fast Pill and Magic Pill.
- Weak and strong minions come first, then 2 villains arrive every minute.
- Necromancer, Void Empress and Toxin Alchemist animate from the supplied movement videos.
- NPCs with situational dialogue, who can be killed, with full gore.
- Styled weapon and spell projectiles.
- Rage gauge with fullscreen ultimates, kill combo counter with tier names, and announcer voice lines.

### Multiplayer
- Node server that serves the game and runs the rules for every room.
- Co-op rooms for up to 4 players, public or private by code, with the host choosing when to change stage.
- Enemy life and numbers scale with party size.
- Server-side saves per player and character, with only a hash of each player's token on disk.
- Automatic reconnect, and host handover when the host leaves.
- Protection against forged input, other websites' pages, message floods and oversized messages.
- Docker, Compose, systemd, Caddy and nginx setup, with an env example.

### Known gaps
- Equipment and weapon drops are switched off on purpose.
- Walking, dodge, pill and heal poses for the three asset villains are built from idle frames until video exists for them.
- Co-op balance is untested, and solo balance is uneven.
- Docker and the systemd, Caddy and nginx samples have not been run. See `HANDOFF.md`.
