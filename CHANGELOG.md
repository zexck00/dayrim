# Changelog

Versions follow [Semantic Versioning](https://semver.org). The version lives in `VERSION` and `game/server/package.json`. Keep both the same.

## [Unreleased]

### Added
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
