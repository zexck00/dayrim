# Dayrim task list

Design details are in [GAME_DESIGN.md](GAME_DESIGN.md). Current code is explained in [HANDOFF.md](../HANDOFF.md).

## Who does what

The split below assumes these strengths. I don't know each person's skills, so swap owners freely if it's wrong.

| Person | Name | Owns |
|---|---|---|
| **Z** | zexcko | Vision, all art and animation for heroes, villains and monsters, sound and music, final decisions, playtests |
| **C** | c4lyp50 | Gameplay: combat rules, co-op mechanics, enemies and minions, day and night, power-ups, stages, bosses, balance |
| **D** | Dvachini | Technology: server, networking, asset loading, sound and music engine, HUD and menus, accounts, deployment, testing tools |

**How we work**
- One owner per task. Others help, but the owner gets it finished.
- Each task is a branch and a pull request, reviewed by another person. C and D review each other. Z approves anything players see or feel.
- Placeholder art is fine. **No code task waits for final art**, and no art task waits for code.
- Follow the rules in [AGENTS.md](../AGENTS.md). Rules go in `game/src/game.js`, and anything a player does online must be checked on the server.
- Sizes are rough effort: **S** is up to a day, **M** is 2 to 4 days, **L** is a week or more. Dates depend on how many hours each person has.

## Progress snapshot — 2026-11-07

**Status meanings:** implemented means code and the stated automated checks exist; **prototype** means usable but incomplete or awaiting balance, UI and Z review; open means the task’s full acceptance criteria have not been met. A prototype does not imply a merged pull request or a completed human playtest. The combat fixes are merged to `dev` (PR #8) but not yet to `main`; human playtest status is not established. See [Combat depth review](COMBAT_DEPTH_REVIEW.md) for follow-ups.

| Work | Current status | Remaining work |
|---|---|---|
| C-01, C-02, C-03, C-05 | Prototype: party scaling table, quota, ultimate adjustment and live enemy rescaling are implemented. | C-06 party balance with D-06; Z review. ×1/×2/×4/×8 are candidates, not final values. |
| C-04 | Implemented: citizen fear is per player, with rule coverage. | Review; witnessed nearby deaths still frighten nearby citizens. |
| C-10 | Prototype: crawl, revive, Medic/Scout bonuses and Second Wind work in rules. | D’s 4-player and phone UI checks; Z review and human playtesting. |
| C-11 | Prototype: Hope, wipe and stage-start/boss-gate retries work online. | Z decides final Hope and wipe rules; C-17/C-18 are needed for boss-phase and objective checkpoints. |
| C-12, C-13 | Prototype: threat from damage and healing with decay and switch hysteresis, a live taunt override, and five G-key role abilities. | Target feedback (markers), threat-driven boss targeting, validation and balance are open. |
| C-14 | Prototype: all 40 characters carry the element from the design, all ten reaction rows are implemented (Inferno, Shatter, Overload, Freeze, Rot, Collapse, Purge, Eclipse, Cauterise, Frostbite), other pairs resonate, and the coverage check exercises all 780 character pairs. | Balance, boss variants and human playtesting remain open. A target can react once every 2 seconds; that value needs Z's review. |
| C-15, C-16 | Prototype: kills by anyone feed one party chain with a six second window and the design's four bonus tiers, each kill gives the killer full rage and allies within 500 units 35% of it, and a party ultimate opens a three second link window with the Duo, Trio and Full Party effects. | Z's final numbers and human playtests are open. |
| C-18 | Prototype: a stage runs ordered objective steps from one data table (kill, revive, hold single or simultaneous, carry and escort), the boss gate opens on the last step, a wipe restarts only the step in progress, and the HUD shows the current step and progress. | Each stage's own props and rules and human playtests remain open. Split steps fall back to the timed single-zone version when the party is too small, so solo stage 6 and stage 9 can be finished. |
| C-19, C-20 | Prototype: all six roles exist and are labelled, shooters keep distance, casters leave zones, guards block only from the front, every aware enemy shows who it targets, Stage 1 fields back-line rushers, telegraphed brutes and interruptible healers for both factions, and its objective (kill quota then revive the wounded scout) runs end to end. | Role balance, the teaching pass and human playtests are open. |
| C-26–C-28, D-26 | Prototype: role auras, weapon upgrades, checkpoint boons and optional Three.js effects are present. | Balance, readability, asset-character coverage and performance work listed below. |
| D-10–D-12, D-17–D-18 | Partial: recovery and prototype combat fields sync, revive/team touch buttons and placeholder party feedback exist. | Four-player, lag, bandwidth, accessibility and real-phone checks remain open. |

**Latest verification:** on the Swarm branch (2026-11-08), the full server suite passed **470 rule checks, 45 networking checks and all 780 reaction pairs**, and headless Chromium showed the Swarm picker and wave HUD. Earlier, on `enemy-ai-overhaul`, which stacked PRs #9, #10 and #11, it passed 415 rule checks, 42 networking checks and all 780 reaction pairs. C played that branch on 2026-11-07 and reported that it feels good; this is one person's first impression, with no recorded stages, party size or numbers. The balance bot predates objective steps and now clears no stages, so the older bot results below are historical; use `game/tools/ai-trial.js` for comparisons. Earlier, on `combat-depth-fixes`, the suite passed 333 rule checks, 42 networking checks and all 780 reaction pairs. Chromium checked a solo boon and G action and an online G action; these are automated checks, not a four-person playtest. One 25-minute solo bot sample cleared ten stages with Firefighter and Detective in about 16 game minutes each; Necromancer cleared three stages with one death. The bot does not use team abilities or checkpoint boons, and single random runs are not a balance verdict. The [party bot samples](playtests/2026-11-06-party-bot-smoke.md) include Stage 1 clears for one, two and four players, but no Stage 3 results; human balance results remain outstanding.

**Milestone 1 (2026-11-08):** Stages 1 to 3 and their three bosses now have prototype rules, objectives and team mechanics. The Swarm is also in (see below). The remaining M1 items are human: a recorded co-op playtest and the first outside playtest (Z-14).

**Next work:** (1) record a human Stage 1 solo/co-op session, including readability of brute warnings, healer interrupts, rescue, reactions and boon discovery; (2) improve and validate the D-06 runner with one to four players; (3) complete the remaining usability checks in [Combat depth review](COMBAT_DEPTH_REVIEW.md) and playtest reactions; (4) get Z’s decisions on Hope, wipes, combat feel and balance. Final music and SFX remain Z-owned, with D responsible for the audio engine.

## Milestones

| Milestone | Goal | Done when |
|---|---|---|
| **M0 Foundations** | The team can work and test together | Game is online on a real server, with automatic tests and an asset plan |
| **M1 Co-op core** | Stages 1 to 3 are fun with friends | Revive, threat, roles, reactions and chain work; 3 boss fights done; first outside playtest |
| **M2 Middle game** | Stages 4 to 7 | Four more stages and bosses; villain side works; first assets in |
| **M3 Final act** | Stages 8 to 10 | Full game can be finished by a party; difficulty tiers |
| **M4 Launch** | Ready for the public | All assets in, accounts, balance pass, licensed audio, launch checklist |

---

## M0 Foundations

C-01, C-02, C-03 and C-05 have a provisional implementation in the scaling slice. C-06 and Z review remain open; D-06 is needed for party measurements. Once opened, a boss gate stays open if party size grows. Quotas round up.

Before this slice, multiplayer used enemy life ×1/×1.7/×2.4/×3.1, unchanged damage, enemy count ×1/×1.35/×1.7/×2.05, and a fixed quota. Existing solo observations in HANDOFF.md are Firefighter clearing 10 stages with no deaths in about 18 game minutes, and Necromancer dying 45 times without clearing in 90 minutes; these are historical observations, not controlled comparisons. A later solo bot run after the Second Wind prototype cleared all 10 stages in 18 game minutes with Firefighter and 17 with Detective, both with zero deaths; Necromancer cleared 7 stages in 25 minutes with zero deaths. These are single random runs, and the bot counts final deaths rather than uses of Second Wind.

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| Z-01 | Z | S | Add C and D to the GitHub repository and protect `main` so changes go through pull requests | Both can open pull requests, and direct pushes to `main` are blocked | |
| Z-02 | Z | S | Answer the questions in GAME_DESIGN section 20 | Answers written in that section | |
| Z-03 | Z | M | Decide the art style and resolution, using the Necromancer as the reference | One approved reference sheet in `ASSETS/` | |
| Z-04 | Z | S | Decide whether the repository stays public, given it holds original art | Decision made and repository set | |
| D-07 | D | S | **Show the difficulty:** the party panel, open-room list and join/leave notice show the multiplier | Prototype implemented; verify four-player and real-phone readability | C-05 |
| D-08 | D | S | **Finish fullscreen** (section 19). Already built: button, L key, hidden cursor with a crosshair, cursor back in menus and after Esc, pause on exit when alone, HUD scaling. Automated browsers refuse real fullscreen, so test it by hand, and fix what breaks. | Tested by hand in Chrome, Firefox and Safari, alone and in a room | |
| D-09 | D | M | **HD drawing** (section 19): smooth scaling for HD art, a Full, Medium or Low graphics setting, and measure whether 4 players with HD art hold 60 FPS on canvas or need WebGL | Test results shared, with a recommendation | D-03 |
| Z-06 | Z | S | Approve the HD art sizes in GAME_DESIGN section 19, before producing art | Sizes confirmed in the Asset specification | |
| Z-50 | Z | S | Plan your sound delivery. Z provides all sound and music, so list what comes first and when, using the Sound specification. | Delivery order shared with D | |
| D-01 | D | M | Deploy to a real server with HTTPS using `game/docker-compose.yml`. This has never been run, so fix what breaks. | A public address where two people on different networks can play | Z-01 |
| D-02 | D | S | GitHub Actions: run `npm test` on every pull request and check `dayrim.html` matches its sources | A failing test blocks a merge | Z-01 |
| D-03 | D | M | **Asset loading.** Inlining everything won't scale: 3 villains already take 2.5 MB, so 40 characters and 10 monsters would make a huge page. Load each character's sheet when needed. Keep solo able to run from the server without logging in. | Page under 2 MB; characters load on demand with a loading state | |
| D-04 | D | S | Set up Git LFS for art and video, before the large assets arrive | New art files go through LFS, documented in AGENTS.md | Z-01 |
| D-05 | D | S | Remove the old plan text from `src/page.html` (currently hidden by the full-window layout), and delete unused sprite folders listed in HANDOFF.md | Public page shows only the game and a short intro | |
| D-06 | D | M | Make a headless party bot for the server, that joins real rooms and plays by itself | Prototype WebSocket runner reports time, downs, wipes, estimated damage and Hope; one four-bot sample cleared Stage 1 in 138.9 seconds. Repeat across seeds and compositions. | |
| C-01 | C | S | Fix the ultimate exploit: divide boss percent damage by party size | 4 ultimates deal the same percent as 1 solo | |
| C-05 | C | M | **Party difficulty** (section 9): heroes, villains and bosses get ×1, ×2, ×4 or ×8 life and damage by party size. Replaces `partyToughen`. All living enemies rescale when someone joins or leaves, and keep their percentage of life. | Unit tests for 1 to 4 players, and for joining and leaving during a boss fight. Solo is unchanged. | C-01 |
| C-06 | C | M | **Check the new difficulty is playable:** run ×2, ×4 and ×8 on stages 1 to 3 and report downs, wipes and clear time | Results shared with Z, with a recommendation on damage. Any change gets Z's approval. | C-05, D-06 |
| C-02 | C | S | Scale the kill quota with party size, using the section 9 table in one place | Unit tests for 1 to 4 players | |
| C-03 | C | M | Turn scaling into one data table (difficulty, minion life, count, quota, Hope) | All scaling reads from the table | C-02, C-05 |
| C-04 | C | S | Make citizen fear per player, so that one player's NPC kill doesn't affect everyone | Test added | |

## M1 Co-op core

A Stage 1 combat-depth prototype adds rusher, brute and interruptible healer behavior, all five G-key role actions, Overload and Break Strike reactions, and a personal boon choice at the boss gate. These are initial mechanics rather than completion of the full C-12–C-19 designs: full threat behavior, reaction balance, later enemy roles and complete checkpoint behavior remain open. Boons persist with the current character run. Balance, readability and multiplayer behavior need human playtests and Z review; final music and SFX remain Z-owned. One solo bot run after this prototype cleared 10 stages with Firefighter and Detective in 16 game minutes each; Necromancer cleared 3 in 25 minutes with one death. The bot does not use team abilities or checkpoint boons, and these single random runs do not establish balance.

C-10 and C-11 are provisional recovery implementations pending Z’s decision and D’s UI review. An online party starts with 3/4/5/6 Hope for 1/2/3/4 players; the one-player room uses 3 as a prototype alongside Second Wind. Membership changes adjust capacity while preserving Hope spent. A bleed-out at zero Hope wipes only if nobody is standing; retry refills Hope and returns to the safehouse or opened boss gate. A boss restarts from full life because boss-phase checkpoints do not exist yet; stage objective steps are implemented and the in-progress step resets. Solo offline keeps its existing death flow.

### Core mechanics

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| C-10 | C | L | **Downed and revive** (section 2): crawl, bleed-out, hold to revive, repeat penalty, Medic and Scout bonuses | Rule tests pass; solo Second Wind works | |
| C-11 | C | M | **Hope** and wipe, with restart at checkpoint | A party can wipe and retry with no stuck state | C-10 |
| C-12 | C | L | **Threat** (section 3): replaces nearest-player targeting in `updateEnemy` | Tests show Taunt pulling an enemy from a closer ally | |
| C-13 | C | L | **Team abilities** on G (section 4): Taunt, Break, Mark, Mend Link, Rescue Dash | Each works solo-safe, online and in tests | C-12 |
| C-14 | C | L | **Status and reactions** (section 5), with a script to check every pair of characters has a reaction available | Prototype: 10 named reactions and resonance cover all 780 distinct-character pairs; online reactions require different players. | Solo Resonance is implemented at half strength; balance and human playtests remain open. |
| C-15 | C | M | **Party chain** and shared rage (section 6) | Prototype: one counter for the party with the design's 5/12/20/30 bonuses, shared rage within 500 units, and the personal combo and best still saved per player. Rules and networking tests cover it; linked ultimates are implemented under C-16. | Z's numbers, human playtests |
| C-16 | C | M | **Linked ultimates**, plus the shorter effect for allies | Prototype: a 3 second window, Duo/Trio/Full Party as designed, damage applied once after the boss share, and allies see the ground nova rather than the fullscreen, so they can still dodge. | Z's numbers, human playtests |
| C-17 | C | M | **Boss framework:** guard bar, stagger, enrage, arena doors, phases, telegraph helper. Used by all 10 bosses. | Prototype: every boss gets a guard bar fed by Break and reactions, a 5s stagger that raises damage taken, a 0.6s minimum telegraph on every big attack, an enrage clock, phase breathers that clear enemy fire, and an arena that holds the party in until the boss dies. Stage 1 boss runs on it. | Per-boss guard tuning, phase tables for stages 2-10 and the stage-1 boss's own mechanics are open. |
| C-18 | C | M | **Objective framework:** progress, checkpoints, carry, hold, escort | Used by stages 1 to 3 | |
| C-19 | C | M | **Enemy targeting markers and roles** (section 11) | Rusher, Brute, Shooter, Caster, Guard and Healer behave as described | C-12 |

### Stages and bosses

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| C-20 | C | M | Stage 1 Sunrise Hollow, with its objective | Prototype: the objective line, marker and edge arrow point players at the wounded scout. Mouse players get a hold-to-revive button nearby; touch players use the revive control. | C-10, C-18 |
| C-21 | C | M | Boss: Crystal Scurrier (Pillar Break) | Prototype: Skitter Rush and Shard Spray at full life, Burrow and two crystal pillars at half life. Pillars heal the boss; solo breaks one with a charged move, a party breaks one with two hits inside 2s. Rules tests cover both, human tests open. | Human playtest, pillar art and the asset animations are open. |
| C-22 | C | M | Stage 2 Noonshade Thicket: thicket, beacons, Stalker | Prototype: seeded thicket hides enemies beyond 120 units for each player, Stalkers ambush from it with a warning and a dodge opening, and each beacon draws a wave and is set back when the lighter is hit. Rule tests pass. | Stalker art (Z-12), balance and human playtests are open. The balance bot does not play objectives, so it cannot clear this stage. |
| C-23 | C | M | Boss: Gloom Eye (Look Away) | Prototype: gaze beam, triple slam, blinding pulse at 60%, reverse sweep at 25%, Look Away with a back eye that only takes guard hits from behind, and the solo dodge-through-beam version. Rule tests pass; bot runs clear it solo and in parties. | Human playtests and boss art |
| C-24 | C | L | Stage 3 Duskwater Fen: rising water, escort boat, Lurker | Prototype: a rising and falling tide slows players off seeded islands, clearings and bridges, with the same rule used for online prediction. Lurkers grab and drag a player until an ally hits them; solo, the player's own hits free them. The escort step already existed. | Human playtests and Lurker art (Z-12) |
| C-25 | C | M | Boss: Banshee Phantasm (Lantern Anchor) | Prototype: wail ring with a gap, untouchable Phase Drift, Possess at 50%, and Lantern Anchor: she only takes damage within 170 units of a lit lantern. A lantern is lit while carried and for 8 s after being set down with F; solo it stays lit. Rule tests pass; bot runs clear it solo and with two players. | Human playtests. Four-player bot parties did not clear it under the ×8 rule. |

### Prototype follow-up

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| C-26 | C | M | Balance the five passive role auras in solo and parties; review stacking, range, recovery and clarity | All 40 characters covered; tests and human balance notes reviewed by Z | D-06 |
| C-27 | C | M | Playtest the two safehouse weapon upgrades, including melee arcs, ranged cones and spell blasts | Prototype: melee, ranged and spell upgrades show current and next effects; signature moves use the same two damage tiers. Tier-2 pistol/bow piercing, non-boss shield interrupts and nearby ally healing are implemented. Rule tests, delayed online purchase confirmation, reduced-motion checks and desktop/phone-viewport checks pass. | Z review and human playtesting of balance, progression and visual clarity | D-06 |
| C-28 | C | M | Review boss-gate boon choices and their run/save lifecycle | Choices are discoverable, meaningful and reset at the agreed end of a run; tested solo and online | C-18 |
| C-29 | C | S | **Haste:** levels and trained Agility shorten every cooldown through one `cdMul`, floored at 60% of base | Rule tests cover the curve, the floor and that dash and team abilities use it; sheet shows Haste | |
| C-30 | C | S | **Gore pass:** damage-scaled blood, chunks on heavy hits and kills, pools, wound trails, per-family blood colour | Works solo and online, decal list capped, tests added; Z review | |
| C-86 | C | L | **Enemy AI overhaul:** attack slots and circling, tracked wind-ups, combos, delayed swings, punishes, leading shots, role behaviour, boss chains and a hits-to-down damage curve | Prototype: tuned from the `AI` table and `WEAK_HITS_TO_DOWN` in `game.js`, with rule tests and `game/tools/ai-trial.js` samples. Changes how solo plays, so it needs Z's approval. | Recorded playtests with several players, kit villain behaviour and Z's review of the ×8 party stack with stronger enemies. C's first play on 2026-11-07 felt good. |
| D-26 | D | M | Measure and polish the optional bundled Three.js r187 effects layer | Offline fallback, context loss, reduced motion and performance tested on target devices | D-09 |

### Minions, day and night, power-ups

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| C-70 | C | L | **Minion squads** (section 15): Swarm, Pack, Siege, Escort, leaders and panic | Squads spawn as groups and behave as described | C-19 |
| C-71 | C | M | **Minion family traits:** Skeleton rises, Voidling blinks, Toxin puddles | Each tested, with a way to counter it | C-70 |
| C-72 | C | S | Villain recruit rule, and speed bonus for minions near a villain | Limit of 6 is enforced | C-70 |
| C-73 | C | M | **Day and night rules** (section 16): four periods, element bonuses, elite odds, shop prices, dusk warning | Rules read from one data table, with tests | |
| C-74 | C | M | **Clock rules:** clock pauses during boss fights, boss arena uses the stage's starting hour, stage 10 stays at midnight | Tests pass | C-17 |
| C-75 | C | M | **Lamps:** breakable by enemies, relight with F, removes the night vision penalty | Works online | C-73, D-51 |
| C-76 | C | M | **Pickups** (section 17): Rage Shard, Iron Skin, Quick Hands, Echo, Mana Surge, Ghost Step | No stacking, timer resets on repeat, tests pass | |
| C-77 | C | M | **Team power-ups:** War Drum, Life Bloom, Revive Flare, Hope Stone | Range and activation work with 4 players | C-10, C-11, C-76 |
| C-78 | C | M | **Give items to allies:** throw a potion, gift a pill | Server checks range and that the item is owned | D-52 |
| D-50 | D | M | **Sync and show power-ups:** icons, timers on the party panel, pickup labels | Readable with several running at once | C-76 |
| D-51 | D | M | **Night vision rendering:** dark edge with light from lamps and players, cheap enough for phones | Passes performance check on a real phone | C-73 |
| D-52 | D | S | **Target an ally** for potion and pill gifts. Settle the key with C, as T opens the menu today. | Works on mouse and touch | |

### Sound engine

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| D-60 | D | L | **Audio engine** (section 18): volume groups, distance and direction, 24-sound limit with priority, random version and pitch | Settings saved, and heavy fights don't crackle | |
| D-61 | D | M | **Sound loading:** load per character and stage, with a fallback to today's synth while files are missing | Page stays under the D-03 limit | D-03 |
| D-62 | D | M | **Sound data table:** one file mapping each game event to its sounds, so that Z can add sounds without touching code | Adding a sound needs no code change | D-60 |
| D-63 | D | M | **Footsteps:** ground type from map tiles, body type per character, synced to walk frames | Each ground type and body type audible | D-62, C-80 |
| D-64 | D | M | **Attack sound layers:** weapon, impact, element, character signature | Each character can sound different, with placeholders | D-62 |
| D-65 | D | L | **Music system:** cross-fade between day, night, calm and combat layers, safehouse, boss phases, and side themes | Changes fade with no gaps or restarts | D-60 |
| D-66 | D | S | **Online sound rules:** other players' sounds are quieter, downed alerts are always heard | Tested with 4 players | D-60 |
| C-80 | C | S | Give each stage tile a ground type, and each character a body type and material | Data used by D-63 | |
| C-81 | C | M | **Fire sound events from rules:** telegraphs, reactions, revive, objectives, power-ups | Every event in section 18 has a name in the data table | D-62 |

### Networking, HUD and menus

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| D-10 | D | M | Sync new fields: downed, threat target, statuses, guard, objectives (`sync.js`) | Bandwidth stays under 25 KB/s per player before compression | C-10 |
| D-11 | D | M | **Party panel:** life, downed timer, status, rage, ultimate ready | Readable at phone size | C-10; simulated four-player mobile layout checked, real-phone playtest open |
| D-12 | D | M | **Revive and ally UI:** ring around downed ally, progress bar, screen-edge arrows | Tested with 4 players | C-10 |
| D-13 | D | M | **Pings and quick phrases** (section 14), with server rate limits | Spam can't flood others | |
| D-14 | D | M | **Lobby:** role of each player, ready check, host starts, difficulty and stage choice | Party can choose before starting | |
| D-15 | D | M | **Rejoin in place:** a reconnecting player returns to the same spot and state, not the safehouse | Disconnect test passes | |
| D-16 | D | S | Boss bar with guard meter and phase marks. Objective tracker. | Matches design | C-17, C-18 |
| D-17 | D | M | Keep own-character prediction in step with new states such as crawl, root and drag | No snapping at 200 ms lag | C-10 |
| D-18 | D | M | Touch controls for G and hold-to-revive are prototyped; a visible movement stick, held-state feedback, cancellation handling and compact landscape layout have browser emulation checks. Add ping and test all controls on real phones. | One full stage played on a phone | C-13 |

### Art and playtest

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| Z-10 | Z | L | **First art batch:** one of each job, 5 heroes (Guardian, Detective, Prodigy, Exorcist, Vigilante) | Delivered to the Asset specification below | Z-03 |
| Z-11 | Z | L | Boss art: Crystal Scurrier, Gloom Eye, Banshee Phantasm | Delivered to spec | Z-03 |
| Z-12 | Z | M | New enemy art: Stalker, Lurker | Delivered to spec | Z-03 |
| Z-13 | Z | M | First sounds: revive, ping, reactions and links (section 18) | Delivered as licensed files | Z-50 |
| Z-14 | Z | M | **Run the first playtest** with 4 outside players, using a simple form: what was fun, confusing or unfair | Results shared in `docs/playtests/` | D-01, C-25 |
| D-19 | D | M | Import tool: turns delivered art into game sheets automatically and reports what's missing | One command imports a character | D-03 |

## The Swarm

An endless wave mode on the stage maps, added on 2026-11-08. It is tuned from the `SWARM` table in `game.js`, and `node game/tools/ai-trial.js --mode swarm` measures it.

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| C-90 | C | M | **Wave director:** wave n sends base + step × n enemies scaled by party size, at most 50 alive, with tougher and harder-hitting enemies from wave 6 and Stalkers, Lurkers and rivals mixed in | Prototype with rule tests | |
| C-91 | C | S | **Boss waves:** every fifth wave rotates the Crystal Scurrier, Gloom Eye and Banshee on any map | Prototype with rule tests | |
| C-92 | C | S | **Runs:** breaks revive, heal and hand out a potion; a wipe or solo death ends the run, keeps the best wave and starts a new run; nothing else reaches the story save | Prototype with rule tests | |
| C-93 | C | S | **Entry:** a Swarm picker in single-player and a Swarm option when creating a room, clamped to the furthest stage reached; the room list shows the wave | Prototype with networking tests | |
| C-94 | C | M | **Balance:** human runs solo and in parties; set the growth curve | Bot samples only. A perfect-dodging bot reached wave 28 alone without falling, so human results decide the curve. | C-90 |

## M2 Middle game

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| C-30B | C | L | Stage 4 Webbed Barrow: webs, egg clusters, Webber | Prototype: four egg clusters hatch enemies until cut; ranged Webbers root players until rescued, with a five-second solo escape. Tests cover attacks, retries and sync. Placeholder art and human balance/playtests remain open. | C-18 |
| C-31 | C | M | Boss: Chitin Horror (Crack the Shell) | Prototype: shell, charge, web spit, egg sacs and molt have solo and party rule coverage. Human playtesting, balance and final art remain open. | C-17 |
| C-32 | C | L | Stage 5 Sporefall Marsh: Toxin meter, canisters, Bloater | Prototype: per-player toxin, three purifier vents and exploding Bloaters work in solo and online rules. Placeholder art, balance and human playtests remain open. | C-18 |
| C-33 | C | M | Boss: Spore Brute (Share the Poison) | Prototype: solo and party Toxic Load, purifier, clean vents, mushrooms and all phases have rule coverage. Balance, readability and final art need human review. | C-17 |
| C-34 | C | L | Stage 6 Ruined Vale: collapse, two-plate gates, Shieldbearer | Prototype: warned collapses, Shieldbearers and the two plates opening the boss gate work in solo and party rules. Balance, readability and final art need human review. | C-18 |
| C-35 | C | L | Boss: Flesh Amalgam (Keep Them Apart). Hardest so far, as it needs two bodies. | Prototype: independent threat, split health, separation healing, defeat windows and rejoining have solo and party rule coverage. Balance, readability and final art need human review. | C-17 |
| C-36 | C | L | Stage 7 Rustleaf Woods: rust, generator, Scrap Golem | Prototype: per-player night rust, a fuel-and-repair generator, and two-player Golem parts with a solo fallback have rule coverage. Balance, readability and final art need human review. | C-18 |
| C-37 | C | M | Boss: Rusted Ghoul (Generator Shock) | Prototype: hook, cleaves, Rust Field, Last Stand and solo/party Generator Shock have rule coverage. Balance, readability and final art need human review. | C-17 |
| C-38 | C | L | **Villain side** (section 7): Hero Recruit minions, NPC Dread, patrols, ending text | Villain party has the same quality of fight | C-19 |
| C-39 | C | M | **Director:** pressure-based spawning (section 11) | Fights come in waves, with breaks | C-19 |
| C-40 | C | M | Balance pass on stages 1 to 7 using D-06 bots and playtests | Solo and party clear rates recorded | D-06 |
| D-20 | D | M | Replace JSON file saves with a database, with a migration | Old saves still load | |
| D-21 | D | M | **Optional accounts:** sign in so that progress isn't tied to a browser. Link existing token saves. | A player can move device | D-20 |
| D-22 | D | S | Quick Join: joins a public room of the right side and stage | Works with no code | D-14 |
| D-23 | D | M | Server dashboard: rooms, players, errors, slow frames | Team can see problems | D-01 |
| D-24 | D | S | Room moderation: host can remove a player; protection from griefing | Tested | D-14 |
| D-25 | D | M | Performance: draw test with 4 players, 50 enemies and all effects on a mid-range phone and laptop | Holds 30 FPS or better, or issues listed for fixing | D-18 |
| Z-20 | Z | L | **Second art batch:** remaining heroes (15) | Delivered to spec | Z-10 |
| Z-21 | Z | L | Boss art: Chitin Horror, Spore Brute, Flesh Amalgam, Rusted Ghoul | Delivered to spec | Z-11 |
| Z-22 | Z | M | Art for Hero Recruit minions, Webber, Bloater, Shieldbearer, Scrap Golem | Delivered to spec | Z-12 |
| Z-23 | Z | M | Stage set pieces and tiles for stages 4 to 7 | Delivered | Z-03 |
| Z-24 | Z | S | Second playtest and decision on level sync | Results and decision recorded | C-40 |

### Sound and music content (Z)

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| Z-51 | Z | M | **Footsteps:** 7 ground types × 5 body types, 3 versions each. Boss steps. | Delivered in the Sound specification format | Z-50 |
| Z-52 | Z | L | **Weapon, impact and element sets** for all weapons, 6 enemy materials and 8 elements | Delivered, with licenses saved | Z-50 |
| Z-53 | Z | L | **Character sets:** 20 heroes: spell, special, ultimate, grunt, hurt, downed | Each hero is recognizable by ear | Z-50 |
| Z-54 | Z | L | **Music for stages 1 to 7:** day and night, calm and combat layers | Loops cleanly, with licenses saved | Z-50 |
| Z-55 | Z | M | Boss themes for bosses 1 to 7 | Delivered, with phase changes marked | Z-50 |
| Z-56 | Z | M | Minion and stage enemy sounds: spot, attack, hurt, die | Delivered | Z-50 |
| C-82 | C | S | Tune sound timing so every boss telegraph can be heard before it hits | Checked in a playtest | C-81 |

## M3 Final act

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| C-50 | C | L | Stage 8 Midnight Warrens: darkness, lanterns, Lightbreaker | Done | C-18 |
| C-51 | C | L | Boss: Cyber Dread (Hack Terminals) | Solo and party versions tested | C-17 |
| C-52 | C | L | Stage 9 Blightmoor: corruption, shrines, Corruptor | Done | C-18 |
| C-53 | C | L | Boss: Void Weaver (Tethered Pairs) | As above | C-17 |
| C-54 | C | L | Stage 10 The Last Night: 3 trials | Done | C-30 to C-52 |
| C-55 | C | L | Boss: Nameless King, 4 phases, boss echoes and Final Toll | Beaten by a real party, and by one solo tester | C-16, C-35 to C-53 |
| C-56 | C | M | **Difficulty tiers** and elite modifiers (section 9) | Veteran and Nightmare work on every stage | C-39 |
| C-57 | C | M | **Team skills** (section 13) and stage scoring (section 8) | Saved and shown at stage end | Existing independent skills are grouped and previewed in the Skills menu; team skills and stage scoring remain open. |
| C-58 | C | L | **Signature passives** for 40 characters. Design with Z. | Each one tested | Z-30 |
| D-30 | D | M | Stage results screen, team scoreboard, and best records per room | Works online and solo | C-57 |
| D-31 | D | M | Darkness and light rendering that works on phones | Passes D-25 test | C-50 |
| D-32 | D | S | Version check: tells players to reload when the server updates | No mismatch errors | |
| D-33 | D | M | Load test with bot parties on the real server | Maximum rooms known and documented | D-06 |
| Z-30 | Z | M | Signature passive ideas for all 40 characters, matching their art | List approved | |
| Z-31 | Z | L | **Third art batch:** remaining villains (17). The Necromancer, Void Empress and Toxin Alchemist need extra poses only. | Delivered to spec | Z-10 |
| Z-32 | Z | L | Boss art: Cyber Dread, Void Weaver, Nameless King | Delivered to spec | Z-11 |
| Z-33 | Z | M | Art for Lightbreaker, Corruptor, and set pieces for stages 8 to 10 | Delivered | Z-12 |

### More systems and audio

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| C-83 | C | M | **Night events:** Blood Moon, Rift, Hunted | One per night, each works solo and in a party | C-73 |
| C-84 | C | S | **Day or night affinity** for 40 characters | Bonus shows in the character sheet | C-73, Z-30 |
| C-85 | C | M | Bosses drop team power-ups at phase changes, and chests in stages | Part of the balance sheet | C-77 |
| Z-60 | Z | L | **Character sets:** 20 villains, same as Z-53 | Delivered | Z-53 |
| Z-61 | Z | L | **Music for stages 8 to 10**, the 3 remaining boss themes and 4 final boss phases | Delivered | Z-54 |
| Z-62 | Z | M | Ambience: each stage by day and night, NPC voices and objectives | Delivered | Z-50 |
| D-67 | D | S | Sound test page, for listening to every sound and setting levels | Z can hear and adjust every sound in one place | D-62 |

## M4 Launch

| ID | Owner | Size | Task | Done when | Needs |
|---|---|---|---|---|---|
| Z-40 | Z | M | **Replace voice lines** with licensed or hired ones. The current macOS voice isn't cleared for commercial use. | New files in `sprites/voice`, with licenses saved | |
| Z-41 | Z | M | Remaining music: title themes, lobby, safehouse and short stings, all licensed | Delivered, with licenses saved | Z-50 |
| Z-45 | Z | M | Final sound mix for all stages, using D-67 | Z approves | D-67 |
| Z-42 | Z | S | Check every asset's license, including anything AI-generated. Decide public or private repository. | Written record in `docs/` | |
| Z-43 | Z | M | Open beta and final balance sign-off | Z approves | C-60 |
| Z-44 | Z | S | Privacy notice and terms | Linked from the game | D-21 |
| C-60 | C | L | Full balance pass: 10 stages × 3 tiers × 1 to 4 players | Targets met: Normal is clearable, Nightmare is hard but fair | D-33 |
| C-61 | C | M | First-time player guide inside stage 1, for each job | New players learn by playing | |
| D-40 | D | M | Security review, backups with a restore test, and error alerts | Restore tested on a real backup | D-20 |
| D-41 | D | S | Accessibility: reduced motion, color-blind telegraph colors, remappable keys | Options saved | |
| D-42 | D | S | Launch checklist and rollback plan | Rollback rehearsed | D-01 |

---

## Asset specification (Z)

Z provides these. C and D use placeholders until they arrive. D-19 imports them.

The three villain videos show only standing, small attack, moderate attack, special attack and defeated. **Everything else below is missing for them as well.**

### Each hero and villain (40)

| Item | Detail |
|---|---|
| Menu card | Full body, same format as the current update sheets |
| Idle | Facing camera; a loop |
| Walk | Up, down, left, right; a loop in each direction |
| Attacks | Small, moderate, special |
| Dodge | At least left and right |
| Guard, heal, taking a pill | One each |
| **New for co-op** | Team ability, ultimate pose, downed and crawling, reviving an ally, being revived, carrying an object |
| Defeated | One sequence |

### Each monster and boss (10)

| Item | Detail |
|---|---|
| Moves | Spawn, idle, walk, each named attack from GAME_DESIGN section 10, stagger, phase change, defeated |
| Telegraph frames | A clear wind-up before every big attack, so that players can read it |
| Extras | Stage 1 pillars; stage 3 lanterns; stage 4 eggs; stage 5 mushrooms; stage 6 second body; stage 7 coil; stage 8 drones and terminals; stage 9 threads; stage 10 crowns |

### Each minion and stage enemy

Idle, walk, attack with wind-up, defeated. Needed for: the 3 existing villain minion families, Hero Recruit weak and strong, and Stalker, Lurker, Webber, Bloater, Shieldbearer, Scrap Golem, Lightbreaker and Corruptor.

### Format

- **Size:** heroes, villains, NPCs, strong minions and stage enemies at least 512 px tall per frame. Weak minions 300 px. Bosses 768 px. Menu cards 600 × 800 px. Map tiles 128 px. See GAME_DESIGN section 19.
- Video at 1080p or higher, on a plain, flat background, or PNG frames with transparency. A flat background makes cut-outs much cleaner than the room backgrounds used so far.
- One action per file, named `character_action_direction`, for example `guardian_walk_left`.
- Same camera angle, distance and character scale across all files.
- Keep originals in `ASSETS/`. Never overwrite one, and add a new version instead.

### Sound specification (Z)

- **Effects:** WAV at 44.1 kHz for originals, mono unless the sound needs width. Name them `group_name_version`, for example `step_grass_heavy_1`.
- **Music:** loop points marked, with layers the same length and tempo, so that they can fade into each other.
- **Levels:** leave some headroom, and don't apply heavy limiting. D-67 sets the final level.
- **Licenses:** keep proof for every file in `docs/licenses/`. Don't use a sound that can't be cleared for commercial release.

---

## Task counts

The former owner and milestone totals predate the current prototypes and follow-up tasks. Recount after the team agrees which acceptance criteria are complete; do not treat prototype rows as closed. C still owns most of the combat work, so D can take objective work once C-17 and C-18 are ready if the team agrees.
