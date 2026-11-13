# Dayrim

A pixel action RPG that runs in the browser. Pick a hero or a villain, fight the other side across procedural day and night maps, train, and take down 10 stage bosses. Play alone, or in co-op rooms of up to 4 players on your own server. On any stage you have reached you can also take on The Swarm: endless waves, a boss every fifth wave, and nothing carried back to your story character.

Version: see [VERSION](VERSION). Changes: see [CHANGELOG.md](CHANGELOG.md).

## Play

**Alone, with no server:** open `game/dayrim.html` in a browser. Progress saves in that browser.

Play Game opens the game modes: **Story** (three chapters with their own maps, dialogue and objectives, for the first five heroes or villains), **Quick Game** (the ten stages, the Swarm and online play) and **Warzone** (not open yet). In Story, press **F** or the Talk button beside a named person or a chest.

**Online, on your computer** (needs Node 20 or newer):

```bash
cd game/server
npm ci
npm start
```

Open http://localhost:8080, choose a character and press **Play online**. To try two players on one computer, use a normal window and a private window. Two tabs in the same window count as the same player.

**Online, on a server:** follow [game/DEPLOY.md](game/DEPLOY.md). It covers Docker Compose, systemd, HTTPS and every setting.

## Controls

| Key | Action |
|---|---|
| WASD or arrows | Move |
| Mouse | Aim |
| Left click | Attack. Hold to charge, let go to fire: casters fire a beam, marksmen fire a charged shot that suits their gun (shotgun, arrow volley, overcharged plasma, gale burst), melee fighters lunge. |
| Hold right click | Shield |
| Q | Spell |
| C | Ready your ability: lock a target, pick an ally, aim a spot or line, grab an enemy, or start a buff. Left click uses it. C again cancels an aimed ability, or fires the finisher of a buff or grab. It hits for ten basic attacks; 60 second cooldown (Max Heal: 90). |
| E | Heal |
| V | Ultimate, when the rage gauge is full |
| Space | Dodge |
| Hold Shift | Sprint: 1.5 times as fast, costs mana, stops while attacking or shielding. On touch, drag the stick far out. |
| Tab or mouse wheel | Change weapon |
| 1, 2, 3 | Potion, Fast Pill, Magic Pill |
| T | Skills and menu |
| R | Shop, gym and travel, at the safehouse |
| M | Sound on or off |
| L | Fullscreen. Esc leaves it. |
| Esc or P | Pause alone, room menu online. Both have Return to menu. |

Touch controls appear on phones and tablets in portrait and landscape. Drag on the game view to move; a temporary stick shows the direction. Aim is automatic. Hold Attack or Shield to keep using it, and hold Revive beside a downed ally or the wounded scout. The combat buttons show cooldowns, ultimate charge and common unavailable states; the nearby Revive button is highlighted. Every character gets an **Ability** button above the others: tap it to ready the ability, then tap it again to use it. While a spot or line is armed, drag with a second finger (or on the right half of the screen) to place it. Tap More for Weapon and Special, or Menu for skills and other options. The **2× damage** button consumes a Magic Pill and doubles damage for 20 seconds. **Spell** uses mana for an attack; the three asset villains use their moderate attack instead.

At the safehouse, open the menu and choose **Weapons** to upgrade an owned weapon. The two upgrades cost 80 and 180 gold; the menu shows tier progress, compares effects before purchase and explains unavailable upgrades. Necromancer, Void Empress and Toxin Alchemist upgrade their signature moves instead. At the final tier, pistols and bows pierce one additional enemy, shields interrupt ordinary enemy wind-ups, and healing weapons can restore a nearby ally on a hit.

## How online play works

The server runs the game rules. Browsers send only what the player presses, and draw what the server reports.

- **Rooms:** up to 4 players on one side. A room can be public, or private with a 5-letter code.
- **Shared:** XP, boss skill points and stage unlocks.
- **Personal:** kills, combos, rage, gold you pick up and items.
- **Enemies:** each extra player adds 70% enemy life and 35% more enemies.
- **Falling:** a downed player wakes at the safehouse after 6 seconds and loses 20% of their gold.
- **Saves:** kept on the server per player and character. A player's identity is a secret token in their browser, so clearing browser data starts them over.

## Repository layout

```
ASSETS/, *.jpeg, *.mp4   Original art and video. Do not edit. The tools read from them.
game/dayrim.html         The built game: one file with all art and sound inside.
game/src/                Page, rules, drawing, online client and menus.
game/src/story*.js       Story mode: the script (story-data.js), the maps (story-map.js) and the engine (story.js).
game/server/             Multiplayer server and its tests.
game/tools/              Build script, art pipeline and balance bot.
game/sprites/            Art produced by the tools.
game/deploy/             systemd, Caddy and nginx samples.
game/docker-compose.yml  Compose setup. Settings go in game/.env (see .env.example).
```

## Develop

After changing anything in `game/src/`, rebuild the page:

```bash
python3 game/tools/build.py
```

Run the tests:

```bash
cd game/server && npm test
```

Working on the game, human or agent? Read [AGENTS.md](AGENTS.md) for the rules and [HANDOFF.md](HANDOFF.md) for how it all fits together. Planned work is in [docs/TASKS.md](docs/TASKS.md) and [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md).

## Before a public or commercial release

- **Voice lines:** they were recorded with the macOS Daniel voice. Replace `game/sprites/voice/` with licensed or hired recordings.
- **Accounts:** there are no logins yet, so players can't recover a lost character.
