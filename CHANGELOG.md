# Changelog

Versions follow [Semantic Versioning](https://semver.org). The version lives in `VERSION` and `game/server/package.json`. Keep both the same.

## [Unreleased]

### Added
- A title poster before hero selection: the owner's poster art with the DAYRIM letters cut from the title art in the centre, slow drifting embers, and a small stone-lettered Play Game button (Enter also works) that leads to choosing a hero.
- Footsteps that change with the ground: grass, sandy paths, stone, water and wood, using the owner's step recordings.
- Shallow ponds you can wade through, with wooden bridges where paths cross them. Their colors follow each stage's theme.
- Announcer lines from the owner's recordings: start game, the 9 combo tiers (replacing the temporary computer voice for combos), boss fight, boss defeated, enemy hero or villain down, you down, a friend down, all friends down and all down.
- Boss music: an entrance theme, then a more urgent track if the boss is still alive after a minute. It replaces the ambience during the fight.
- Melee swing and heal sounds from the owner's recordings.
- Background ambience throughout the game, mixed from the owner's two ambience tracks and kept soft. It fades in when play starts, and gives way to the menu music on the character screen.
- Menu music on the character and online screens, which fades out when a game starts. Hero and villain browse sounds play when picking a card or switching tabs. All three are the owner's files from `ASSETS/audio`.
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
