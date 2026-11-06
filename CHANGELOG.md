# Changelog

Versions follow [Semantic Versioning](https://semver.org). The version lives in `VERSION` and `game/server/package.json`. Keep both the same.

## [Unreleased]

### Fixed
- Signature moves can hit crystal pillars without closing the room.
- A replacement wounded scout appears if the objective scout is killed.
- Killing the wounded scout no longer closes an online room.
- Online enemy target markers now receive the awareness state they need to appear.
- Full Party healing no longer gives life to downed or respawning players without reviving them.
- Healing generates enemy attention only for life actually restored, credited to the healer.
- Online linked-ultimate feedback now shows its damage bonus.
- Linked ultimates now increase damage already dealt when an ally joins late.
- Revive progress resets when switching allies, expired statuses no longer resonate, and healing threat follows the healer.
- Citizens now fear the player responsible for a civilian death, rather than every party member.

### Changed
- Ultimate hits deal the designed 4% of boss life divided by party size before link bonuses, even for high-damage builds.
- Every character pair can trigger a reaction: combinations without a named reaction now create resonance, granting both players rage and a small damage bonus.
- Elements now come from the design for all 40 characters. Ten pairs react: Inferno, Shatter, Overload, Freeze, Rot, Collapse, Purge, Eclipse, Cauterise and Frostbite. Two players with the same element resonate for a small damage bonus instead. Other pairs create resonance, and both players who build a reaction earn rage.
- Enemies now build threat from the damage and the healing they take and go for the player who earned the most attention, instead of always walking at the nearest one. Taunt still overrides it, and bosses are unchanged for now.
- The game now fills the browser window. The in-game menu includes a return to main menu button and a weapons tab with distinct weapon icons.
- Party size now scales enemy life, rival and boss damage, enemy count and the boss gate quota. Living enemies adjust when players join or leave, and ultimates share their boss damage across the party. These values are provisional pending playtests.

### Added
- Fully upgraded pistols and bows can pierce one additional enemy per shot.
- The Weapons menu compares current and next upgrade effects, and upgraded attacks show a short tier-colored pulse.
- Necromancer, Void Empress and Toxin Alchemist can upgrade their signature moves twice at the safehouse, with stronger damage and a visual pulse.
- Mark, Mend Link and Rescue Dash show their current target beside the team ability.
- Party and combat feedback now shows difficulty, Hope spent, retry location, revive target and range, chain time and bonuses, enemy status and Taunt duration, and citizen fear. The Skills menu explains reactions.
- Solo players can trigger half-strength Resonance with a second hit on an active status.
- A title poster before hero selection: the owner's poster art with the DAYRIM letters cut from the title art in the centre, slow drifting embers, and a small stone-lettered Play Game button (Enter also works) that leads to choosing a hero.
- Footsteps that change with the ground: grass, sandy paths, stone, water and wood, using the owner's step recordings.
- Shallow ponds you can wade through, with wooden bridges where paths cross them. Their colors follow each stage's theme.
- Announcer lines from the owner's recordings: start game, the 9 combo tiers (replacing the temporary computer voice for combos), boss fight, boss defeated, enemy hero or villain down, you down, a friend down, all friends down and all down.
- Boss music: an entrance theme, then a more urgent track if the boss is still alive after a minute. It replaces the ambience during the fight.
- Melee swing and heal sounds from the owner's recordings.
- Background ambience throughout the game, mixed from the owner's two ambience tracks and kept soft. It fades in when play starts, and gives way to the menu music on the character screen.
- Menu music on the character and online screens, which fades out when a game starts. Hero and villain browse sounds play when picking a card or switching tabs. All three are the owner's files from `ASSETS/audio`.
- Levels and Agility now give Haste: every cooldown is shorter, down to 60% of its base time. The character sheet shows the percentage.
- The objective now shows where it is: a marker over the thing you need (the wounded scout, a dark beacon, a canister, the drop, the escort boat) and an arrow on the screen edge with the distance when it is out of view. This is how the scout story ends: the scout was also crashing the renderer whenever it came on screen.
- Enemy health is now set in hits instead of a number that grew away from the player. A weak minion takes about two hits at the stage's recommended level on every stage - it used to take 1.4 on stage 1 and 5.4 on stage 10 - and brutes keep their place in the family at five times that. A stage 10 weak minion has 196 life instead of 1026.
- Melee upgrades now add damage. They used to buy only reach and arc, so a blade got no stronger while a gun got 50% more damage across its extra shots. A fully upgraded melee swing hits for 1.5 times its base, in the same steps a ranged upgrade uses.
- Split objectives no longer lock a small party out. A step that needs two plates or three shrines at once falls back to the design's timed version when there are too few players: one zone at a time, held for eight seconds, and it stays down once lit. Solo stage 6 and stage 9 were unfinishable before this.
- Simultaneous hold steps now really need their full hold time. Standing on every plate used to complete the step on contact, because the progress count was read as success; the plate ring also fills to the right length now instead of a fixed 2.5 seconds.
- Ultimates now link. Fire one in a party and a three second window opens: allies are told to press V, and each one who does upgrades it — Duo gives both ultimates +40% and clears every enemy shot, Trio gives +70% and makes the party invulnerable for the ultimate, Full Party doubles the damage, heals everyone and staggers the boss for five seconds. Boss damage is 4% of its life divided by party size, and the link multiplies that once.
- Kills now feed a party chain. One counter for everyone, the same six second window, and the design's four bonus tiers: five kills give the whole party 5% move speed, twelve give 10% damage, twenty double mana regeneration, and thirty make every cooldown 20% faster. Your own combo and personal best are still yours. A kill also hands allies within 500 units 35% of the rage it gave the killer.
- Stage 1's boss has its own fight now: a Skitter Rush that charges along a marked line, a Shard Spray cone of crystals, and at half life it burrows and erupts under whoever it resents most while raising two crystal pillars. The pillars heal it until they break, and breaking one is a timing test: two players must hit it within two seconds, or one player must land a charged move.
- Bosses now share one framework: a guard bar that fills when you Break them or set off a reaction, a stagger that makes them take more damage and stop acting, a marked area on every big attack that fills up before it lands, an enrage timer that makes their attacks faster, a breather when they change phase that clears their incoming fire, and arena doors that keep the party in the fight until the boss dies.
- Objectives now come in five kinds: clear a kill quota, revive a wounded scout, light or hold marked zones (some need several held at the same time), carry items to a marked drop while unable to attack, or escort a lantern boat that only moves while somebody stays close. A wipe restarts the step in progress instead of the whole stage.
- Stage 1 now has a real objective: clear the villain quota, then find the wounded scout and hold F to revive them. The boss gate only opens when the whole objective is done, and the stage line shows the current step and its progress.
- Enemies now show who they are coming for: a red marker above an enemy means it is after you, and a pale marker with a party number means it is after an ally. Role labels now cover shooters, casters and guards; casters leave a damaging zone at your feet, and guards only block from the front, so flanking works.
- Combat bleeds now. Every hit sprays blood that scales with the damage, heavy hits and criticals throw chunks, kills leave a pool, badly wounded enemies drip as they run, and players bleed when they are hit. Toxin and void minions bleed green and violet. Ground blood lasts much longer before the oldest marks are cleared.
- Prototype combat roles: use G for Taunt, Break, Mark, Mend Link or Rescue Dash. Brute dodges and interrupts create openings, and healers can be interrupted.
- Soak and Shock trigger Overload; a heavy attack can follow an ally’s Break. Boss-gate checkpoints offer a dodge boon.
- Optional Three.js r187 ambient effects, with an off switch and an offline fallback.
- Every hero and villain now projects a passive role aura to nearby allies.
- Spend gold at the safehouse to upgrade weapons twice, widening melee arcs and ranged attack patterns.
- Online parties share Hope. When Hope is empty and nobody is standing, the next bleed-out restarts the party at the latest checkpoint.
- Downed players can crawl and be revived by allies. Medics revive faster and from farther away; Scouts can drag allies. Solo players get one Second Wind per stage.
- Return to menu button on the pause screen.
- Fullscreen mode with a button and the L key. The cursor is replaced by a crosshair during play, and Esc brings it back.
- HUD and on-screen buttons grow on taller screens, so they stay readable at Full HD and above.

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
