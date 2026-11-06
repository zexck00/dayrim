# Changelog

Versions follow [Semantic Versioning](https://semver.org). The version lives in `VERSION` and `game/server/package.json`. Keep both the same.

## [Unreleased]

### Fixed
- Citizens now fear the player responsible for a civilian death, rather than every party member.

### Changed
- Enemies now build threat from the damage and the healing they take and go for the player who earned the most attention, instead of always walking at the nearest one. Taunt still overrides it, and bosses are unchanged for now.
- The game now fills the browser window. The in-game menu includes a return to main menu button and a weapons tab with distinct weapon icons.
- Party size now scales enemy life, rival and boss damage, enemy count and the boss gate quota. Living enemies adjust when players join or leave, and ultimates share their boss damage across the party. These values are provisional pending playtests.

### Added
- Levels and Agility now give Haste: every cooldown is shorter, down to 60% of its base time. The character sheet shows the percentage.
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
