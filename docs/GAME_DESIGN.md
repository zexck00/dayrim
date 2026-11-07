# Dayrim co-op game design

Status: target design for Z, C and D to review. Every number is a starting value to tune in playtests. This document describes intended behavior, not an inventory of completed features; current prototype progress and open work are in [TASKS.md](TASKS.md) and [HANDOFF.md](../HANDOFF.md).

## 1. The goal

**Dayrim should be fun alone but only truly beatable, and most exciting, when players rely on each other.** Every system below has to pass one question: does this make me care what my teammate is doing right now?

### Design pillars

1. **Save each other.** Going down is a team emergency, not a 6-second wait.
2. **Different jobs.** Each character has a clear job that others can feel.
3. **Better together.** The biggest damage comes from combining attacks.
4. **Fair but hard.** Every big attack is telegraphed. A wipe should feel like a mistake the party can fix.
5. **Split and reunite.** Stages and bosses regularly force the party to divide jobs.

### What exists today, and what changes

| Today | Problem for co-op | New design |
|---|---|---|
| A downed player wakes alone after 6 seconds | No reason to help | Revive system (section 2) |
| Enemies attack the nearest player | No tanking or protecting | Threat system (section 3) |
| Heal only affects yourself | No support role | Ally heals and shields (section 4) |
| Combo and rage are personal | Players race each other | Party chain and linked ultimates (section 6) |
| Attacks don't interact | No teamwork in damage | Status reactions (section 5) |
| Party size adds only 70% enemy life per player and more enemies | Heroes, villains and bosses barely get harder | They double in difficulty per extra player, and mechanics scale too (section 9) |
| Ultimates deal a fixed 4% of boss life per hit, per player | 4 players deal about 48% per round of ultimates | Boss percent damage divided by party size |
| Stage goal is always "kill X, then open the gate" | Stages feel alike | A different objective per stage (section 8) |
| Kill quota doesn't grow with party size | Large parties clear it too quickly | Quota scales (section 9) |
| Killing one NPC makes citizens flee the whole party | One player can spoil it for everyone | Side rules for NPCs (section 7) |
| Minions only walk up and hit | No priorities in a fight | Minion squads (section 15) |
| Night only adds enemies and small bonuses | Time of day barely changes how you play | Day and night rules (section 16) |
| Potions and pills are personal | No shared decisions | Team power-ups (section 17) |
| Sounds are simple synth beeps, with no music | Little feedback or mood | Full sound and music (section 18) |

## 2. Downed and revive

| Rule | Value |
|---|---|
| At 0 life | Player is **Downed**: can crawl at 25% speed and can't attack |
| Bleed-out timer | 20 seconds. Taking a hit removes 3 seconds. |
| Revive | Ally holds **F** within 60 units for 3 seconds. Taking damage does not interrupt it, but moving away does. |
| Revived with | 35% life and 1.5 seconds of invulnerability |
| Medic | Revives in 1.5 seconds, from 120 units |
| Scout | Can drag a downed ally while reviving, at 50% speed |
| Bleed out | Party loses 1 **Hope**, and the player respawns at the safehouse after 8 seconds |
| Downed again quickly | Each repeat within 60 seconds cuts the bleed-out timer by 5 seconds, down to 8 |
| Gold penalty | The current 20% loss applies only on bleed-out, not when downed |

**Hope** is the party's shared life pool for each stage. It starts at party size + 2. At 0 Hope, the next bleed-out with nobody standing is a **wipe**: the party restarts the current boss phase, or the stage's last checkpoint. Nobody loses levels.

**Key conflict:** F currently also uses a potion. Potion stays on 1, and F becomes the revive and interact key.

**Solo:** one Second Wind per stage, which revives automatically after 3 seconds at 35% life. After that, the current death rule applies.

## 3. Threat

Each enemy keeps a threat score per player and attacks the highest, which replaces "nearest".

| Action | Threat |
|---|---|
| Damage dealt | 1 per point, adjusted by role below |
| Bruiser damage | ×2 |
| Marksman or Scout damage | ×0.8 |
| Healing an ally | 0.5 per point, shared across enemies within 300 units |
| Taunt | Set to highest + 20% for 4 seconds |
| Distance | Under 120 units adds 10% per second |
| Downed | Threat reset to 0 |

Enemies show who they are targeting with a colored marker. Bosses have some attacks that ignore threat on purpose (section 10).

## 4. Roles and co-op abilities

The five existing archetypes become five jobs. Each gains one team ability on a new key (**G**), so no existing control changes.

| Archetype | Job | Team ability (G) | Passive for the team |
|---|---|---|---|
| Bruiser | Holds enemies | **Taunt:** pulls threat in 220 units for 4 s, and reduces damage taken by 30%. 14 s cooldown. | Allies within 90 units take 10% less damage |
| Striker | Burst damage | **Break:** the next hit strips armor and a boss's guard for 5 s. 12 s cooldown. | Hits on broken targets refill 50% more rage |
| Marksman | Focus fire | **Mark:** target takes 25% more damage from everyone for 6 s. 10 s cooldown. | Marked enemies show through walls to the party |
| Medic | Keeps people alive | **Mend Link:** heals the lowest ally in 400 units for 30% over 4 s. 8 s cooldown. | Fast revive |
| Scout | Rescue and objectives | **Rescue Dash:** dashes to an ally within 350 units, giving both a 1 s shield. 12 s cooldown. | Carries objectives at full speed, and can drag downed allies |

Stats keep their current meaning. The ability's strength scales with the matching stat: Taunt with shield, Break with melee, Mark with shooting, Mend Link with healing.

**Party balance rule:** any mix must be able to finish Normal. Parties with no Medic or no Bruiser should find it harder, not impossible.

**Later:** each of the 40 characters gets one signature passive (section 12).

## 5. Status reactions

Attacks apply a status for 4 seconds. When a **different player** hits that target with a status that reacts, the reaction fires and both players gain extra rage. Your own attacks cannot trigger reactions in a party. When alone, a second hit on an active status triggers Resonance at half strength: 5% extra damage and 6 rage, with half the usual boss guard gain. In the prototype, one target can react once every 2 seconds; other hits during that time only refresh the status.

| First status | Second status | Reaction | Effect |
|---|---|---|---|
| Burn | Toxin | **Inferno** | Explosion, 200% damage in 110 units |
| Burn | Chill | **Shatter** | Removes armor for 4 s, 150% damage |
| Shock | Soak | **Overload** | Lightning jumps to 5 nearby enemies |
| Chill | Soak | **Freeze** | Target frozen for 2 s (bosses: slowed 40%) |
| Toxin | Void | **Rot** | 40% of the target's missing life over 5 s (capped on bosses) |
| Void | Shock | **Collapse** | Pulls enemies in 160 units together, then a burst |
| Bleed | Holy | **Purge** | Allies nearby heal 10% |
| Holy | Void | **Eclipse** | Everyone in 200 units is stunned 1.5 s (bosses: guard break) |
| Bleed | Burn | **Cauterise** | 160% hit damage and a nearby burst |
| Bleed | Chill | **Frostbite** | 120% hit damage and 40% slow for 3 s |

Each character's element is in section 12. In the current prototype, pairs without a named reaction create Resonance: 10% extra damage on the triggering hit and rage for both players. Same-element pairs also resonate.

## 6. Party chain and linked ultimates

**Party chain:** kills by anyone extend one shared counter with the same 6-second window and tier names. Personal best combo stays in the side panel. The announcer calls tiers for the whole party.

| Chain | Party bonus |
|---|---|
| 5+ | +5% move speed |
| 12+ | +10% damage |
| 20+ | Mana regeneration ×2 |
| 30+ | All cooldowns 20% faster |

**Rage:** each kill gives the killer full rage and everyone else within 500 units 35%.

**Linked ultimates:** when a player fires an ultimate, a 3-second window opens and allies see **"Link now!"**. The current prototype refreshes the window as each new player joins, and applies tier increases to earlier hits on surviving targets.

| Linked | Effect |
|---|---|
| 2 players | **Duo:** both ultimates +40% damage, and enemy shots are cleared across the area |
| 3 players | **Trio:** +70% damage, and party is invulnerable for the full length |
| 4 players | **Full Party:** +100% damage, full heal for standing players, boss staggered 5 s |

**Ultimates online:** the fullscreen effect plays fully for the caster, and allies see a shorter version so that they can still dodge. Boss damage becomes `4% of max life ÷ party size` per hit, before the link bonus.

## 7. Heroes and villains play differently

Both sides share a stage layout, but they differ in goals, which gives a reason to play both.

| | Hero party | Villain party |
|---|---|---|
| Enemies | Villain minions and villains (exists today) | Hero recruits and heroes. **Recruit minions don't exist yet.** |
| NPCs | **Protect them.** Saving NPCs earns a bonus, and killing one costs the whole party Hope after 3 kills. | **Terrorize them.** Fear fills a Dread meter that gives party damage, but NPCs may call in extra hero patrols. |
| Ultimates | Don't hurt NPCs | Damage NPCs |
| Every minute | 2 villains arrive | 2 heroes arrive |
| Ending | "Dayrim is safe" | "Dayrim is yours" |

Mixed-side rooms stay out of scope. Rooms remain one side only.

## 8. The 10 stages

Each stage keeps its current name, time of day and boss. Maps stay procedural, with one hand-made set piece placed on the path between the start and the boss clearing. Each stage has one rule and one team objective. Any "split" objective checks party size: see section 9 for how a solo player or a party of 2 is handled.

| # | Stage | Starts at | Stage rule | Team objective | Co-op lesson | New enemy |
|---|---|---|---|---|---|---|
| 1 | Sunrise Hollow | 06:00 | None | Defeat the quota, then revive a wounded NPC scout | Reviving and Mark | Basic minions only |
| 2 | Noonshade Thicket | 11:00 | Tall thicket hides enemies until 120 units away | Light 3 beacons while defending the lighter | Calling targets and watching flanks | **Stalker:** ambush from cover |
| 3 | Duskwater Fen | 17:00 | Rising water slows movement. Standing on islands avoids it. | Escort a lantern boat along the channel | Escort and threat | **Lurker:** drags a player away, and an ally must hit it to free them |
| 4 | Webbed Barrow | 21:00 | Webs root players until an ally cuts them free, or after 5 s alone | Cut 4 egg clusters before they hatch | Rescue under pressure | **Webber:** shoots webs from range |
| 5 | Sporefall Marsh | 05:00 | Spores fill a Toxin meter. At full, life drains. | Carry 3 purifier canisters to vents. Carriers can't attack. | Protecting a carrier | **Bloater:** explodes in a spore cloud |
| 6 | Ruined Vale | 10:00 | Parts of the floor collapse after a warning | Two pressure plates must be held at once to open each gate | Splitting and reuniting | **Shieldbearer:** blocks from the front, so flank it |
| 7 | Rustleaf Woods | 18:00 | Night-time rust makes armor weaker over time | Restart a generator: one carries fuel, one defends, one repairs | Clear jobs | **Scrap Golem:** rebuilt unless two players destroy its parts |
| 8 | Midnight Warrens | 23:00 | Darkness. Only light carriers see clearly, in 200 units. | Carry 2 lanterns through the tunnels and hold the exit | Staying together | **Lightbreaker:** targets lantern carriers |
| 9 | Blightmoor | 02:00 | Corruption spreads across the ground over time | Hold 3 shrines at once to burn it back | Taking and holding space | **Corruptor:** heals in corruption, spreads it when killed |
| 10 | The Last Night | 00:00 | Hour never changes. Enemies from all earlier stages appear. | Survive 3 trials that repeat earlier rules, then face the King | All of it together | **Elite mixes** of earlier enemies |

**Checkpoints:** when the objective finishes, and before the boss. A party that wipes returns to the latest one.

**Stage scoring:** S to D on time, Hope left, revives, reactions, and NPCs saved or Dread reached. It adds gold and bragging rights, and never blocks progress.

## 9. Party-size scaling

**Heroes, villains and bosses double in difficulty with each extra player.** This is the owner's rule, including ×8 at 4 players, and it applies to both their life and their damage.

| Players | Heroes, villains and bosses: life and damage | Minion life | Enemy count | Quota | Hope | Boss mechanics |
|---|---|---|---|---|---|---|
| 1 | ×1 | ×1 | ×1 | ×1 | Second Wind | Solo version |
| 2 | **×2** | ×1.6 | ×1.3 | ×1.4 | 4 | Basic pair version |
| 3 | **×4** | ×2.2 | ×1.6 | ×1.8 | 5 | Full version |
| 4 | **×8** | ×2.8 | ×1.9 | ×2.2 | 6 | Full version, plus one extra target |

The rule also scales past 4 players: difficulty is `2 ^ (players - 1)`, so a room limit above 4 would give ×16 and beyond. Minions aren't part of this rule, and they use the milder scale above. Today's solo game doesn't change.

**What ×8 means in practice.** A stage 1 boss slam deals about 43 today. At ×8 that's about 345, while a level 3 player has around 150 life. So at 4 players, any boss hit can down a player at once, which makes dodging, Taunt, revive and shields essential. C-06 checks that this is still fun, using bots and a real playtest.

- **Ultimates:** a boss's percent damage per hit is divided by party size (section 6), so that the ultimates don't skip this rule.
- **Difficulty tiers multiply on top:** Nightmare damage with 4 players would be ×16.
- **When someone joins or leaves mid-stage:** all living enemies rescale at once and keep their percentage of life. Otherwise a party could fight a boss with fewer players and invite friends afterward, or lower its difficulty by having someone leave.
- **Objective helpers:** a party too small for a split objective gets a timed version instead. For example, one plate stays down for 8 seconds.
- **Level gaps:** players below the stage's recommended level are raised to it while in the room, and those above are lowered to +3 levels, for fairness. Rewards still use their real level. C and Z decide this after the first playtest.

### Difficulty tiers

Unlocked per stage by clearing the one below.

| Tier | Enemy damage | Boss life | Hope | Extra rule |
|---|---|---|---|---|
| Normal | ×1 | ×1 | Base | None |
| Veteran | ×1.4 | ×1.3 | Base −1 | Bosses gain their extra phase attack sooner |
| Nightmare | ×2 | ×1.6 | 2 | Bleed-out is 12 s, and elites have 2 modifiers |

**Elite modifiers:** Shielded, Berserk, Linked (two elites share damage, so must be killed together), Vampiric, Explosive, Summoner.

## 10. Boss fights

All bosses share these rules.

- **Telegraph first.** Every big attack shows a marked area for at least 0.6 s (0.4 s on Nightmare).
- **Guard and stagger.** Bosses have a guard bar filled by Break, reactions and special moves. Full bar: boss staggered for 5 s and takes 50% more damage. This is the main reward for teamwork.
- **Enrage.** After a time limit (4 minutes plus 30 s per stage), attacks speed up by 50%.
- **Arena.** Doors close when the fight starts, and players who join later or respawn enter at the arena edge. This replaces today's "boss heals when players are far away".
- **Phase changes** clear enemy shots and give a 2-second breather.
- **Asset moves.** Each boss needs the animations in [TASKS.md](TASKS.md), section "Asset specification". Until then, today's code-drawn boss poses are placeholders.

Life thresholds below are the percent of life left when the phase begins. "Team mechanic" is what the fight tests. Solo versions keep the attacks but give the player a way to complete the mechanic alone.

### Stage 1: Crystal Scurrier (fast insect)

| Phase | Attacks |
|---|---|
| 100% | **Skitter Rush:** charge along a marked line. **Shard Spray:** cone of crystals. |
| 50% | **Burrow:** vanishes, then erupts under the highest-threat player. Adds 2 crystal pillars. |

**Team mechanic: Pillar Break.** While pillars stand, the boss regenerates. Two players must hit a pillar within 2 seconds of each other to break it. Teaches timing. Solo: a pillar breaks on one charged attack.

### Stage 2: Gloom Eye (floating eye with tentacles)

| Phase | Attacks |
|---|---|
| 100% | **Gaze Beam:** a slow sweeping beam. **Tentacle Slam:** 3 marked circles. |
| 60% | **Blinding Pulse:** party vision shrinks for 5 s. Adds small eyes. |
| 25% | Beam gets a second sweep in the opposite direction. |

**Team mechanic: Look Away.** The boss locks gaze on one player, who must face away or be stunned. Its back eye opens for 5 s, and only allies behind it can damage that eye for a large guard hit. Solo: the eye opens after a dodge through the beam.

### Stage 3: Banshee Phantasm (ghost)

| Phase | Attacks |
|---|---|
| 100% | **Wail:** expanding ring with a gap to step through. **Phase Drift:** she becomes untouchable while drifting to a new spot. |
| 50% | **Possess:** a player's controls are slowed for 6 s, and they drift toward her. |

**Team mechanic: Lantern Anchor.** Two lanterns appear. She can only be damaged while standing inside a lit area, so players must carry lanterns to box her in. Solo: the lantern stays lit where placed.

### Stage 4: Chitin Horror (armored insect)

| Phase | Attacks |
|---|---|
| 100% | **Plated Charge:** bounces off walls. **Web Spit:** roots a target. |
| 60% | **Egg Sacs:** hatch into adds in 10 s unless burst. |
| 30% | **Molt:** loses armor, moves 50% faster, and hits harder. |

**Team mechanic: Crack the Shell.** Armor blocks 90% of front damage. One player holds threat in front while others hit the soft back, and a rooted ally must be cut free. Solo: dodging through a charge makes it stumble, exposing its back.

### Stage 5: Spore Brute (huge fungus)

| Phase | Attacks |
|---|---|
| 100% | **Ground Slam:** large ring. **Spore Cloud:** poison zones that stay. |
| 60% | **Fungal Bloom:** grows healing mushrooms. |
| 30% | **Toxic Storm:** arena-wide damage unless standing in a clean zone. |

**Team mechanic: Share the Poison.** The boss marks one player with Toxic Load, which grows. Standing near allies shares it between them. If it reaches the limit on one person, it explodes. Carrying a purifier canister cleans it. Solo: Load grows more slowly and is cleaned at vents.

### Stage 6: Flesh Amalgam (many-bodied horror)

| Phase | Attacks |
|---|---|
| 100% | **Grasp:** pulls a player in. **Bile Lob:** marked pools. |
| 66% | **Split:** becomes 2 bodies with shared life. |
| 33% | Bodies rejoin and it gains all attacks. |

**Team mechanic: Keep Them Apart.** The two bodies must be held more than 300 units apart, or they heal each other fast. They must also die within 10 seconds of each other, or the first revives. Threat decides who pulls each body. Solo: bodies move slower, and the time limit is 20 seconds.

### Stage 7: Rusted Ghoul (undead knight in scrap)

| Phase | Attacks |
|---|---|
| 100% | **Chain Hook:** pulls in the farthest player. **Rust Cleave:** a wide frontal swing. |
| 50% | **Rust Field:** armor drops over time for everyone in the arena. |
| 20% | **Last Stand:** faster combo that can't be staggered until the bar refills. |

**Team mechanic: Generator Shock.** A generator charges a coil. Luring the boss onto the coil while one player powers it deals a big stagger and clears Rust Field. Solo: the coil charges itself over 15 seconds.

### Stage 8: Cyber Dread (machine)

| Phase | Attacks |
|---|---|
| 100% | **Laser Grid:** moving lines. **Missile Lock:** missiles follow one player. |
| 60% | **Shield Drone:** boss is invulnerable until drones are destroyed. |
| 30% | **Overheat:** arena lights fail, and attacks fire faster. |

**Team mechanic: Hack Terminals.** 2 terminals must be held at the same time to take its shield down, while a third player draws the missiles. Solo: one terminal, held for twice as long.

### Stage 9: Void Weaver (spirit of the void)

| Phase | Attacks |
|---|---|
| 100% | **Thread Cut:** long lines appear, then snap. **Void Orb:** slow chasing orbs. |
| 60% | **Tether:** ties players in pairs. Moving too far apart hurts both, and so does getting too close. |
| 25% | **Unmake:** arena shrinks over time. |

**Team mechanic: Tethered Pairs.** Tethered players must keep the right distance while dodging. Tethers can be used to cut Void Threads, which is the only way to make its guard vulnerable. Solo: player is tethered to a fixed anchor.

### Stage 10: Nameless King (final boss, shown as ???)

| Phase | Attacks |
|---|---|
| 100%: The Court | Summons echoes of bosses 1 to 3 in turn. **Royal Decree:** a marked player's attacks are disabled for 5 s. |
| 70%: The Crown | Echoes of bosses 4 to 6. **Throne Slam:** a huge telegraphed ring. |
| 40%: The Night | Echoes of bosses 7 to 9. Arena goes dark, and light only follows linked players. |
| 15%: Nameless | No more adds. **Final Toll:** a 12-second charge that wipes the party. |

**Team mechanic: Final Toll.** It can only be survived by a linked ultimate, or by every living player standing together on one of the marked crowns. Bringing it to stagger with reactions cancels it. Hope doesn't refill, but players revive between phases. Solo: 1 crown, and the charge lasts 18 seconds.

## 11. Enemy roles

Every enemy has one job, so that a party has to prioritize.

| Role | Behaviour | Answer | Used by |
|---|---|---|---|
| Rusher | Runs at the highest threat | Taunt or kite | Weak minions |
| Brute | Slow, heavy, telegraphed hits | Dodge, focus | Strong minions |
| Shooter | Keeps distance | Scout or Marksman | Gun villains and heroes |
| Caster | Slow shots and zones | Interrupt with Break | Spell villains and heroes |
| Guard | Blocks from the front | Flank | Shield users, Shieldbearer |
| Healer | Heals nearby enemies | Kill first, or Mark | Heal users |
| Stage specials | See section 8 | Team action | One per stage |

**Director:** spawns follow a "pressure" score so that fights come in waves with short breaks. It tracks party life, Hope and time since the last hard fight. It replaces the current spawn timer, but the rule of minions first and 2 villains per minute stays.

## 12. Characters

Elements below are a first pass. Z may change any of them to match the final art.

**Heroes**

| Character | Job | Element | Character | Job | Element |
|---|---|---|---|---|---|
| Detective | Marksman | Shock | Phantom | Scout | Void |
| Vigilante | Scout | Bleed | Pyromancer | Marksman | Burn |
| Guardian | Bruiser | Holy | Chronomancer | Marksman | Chill |
| Ranger | Scout | Toxin | Beastmaster | Striker | Bleed |
| Inventor | Marksman | Shock | Voidwalker | Marksman | Void |
| Firefighter | Bruiser | Soak | Exorcist | Medic | Holy |
| Shadow | Striker | Void | Gravity Mage | Marksman | Void |
| Prodigy | Striker | Shock | Druid | Medic | Toxin |
| Sage | Marksman | Holy | Cyborg | Bruiser | Shock |
| Patriot | Striker | Holy | Illusionist | Scout | Chill |

**Villains**

| Character | Job | Element | Character | Job | Element |
|---|---|---|---|---|---|
| Necromancer | Marksman | Void | Demon Knight | Bruiser | Burn |
| Blood Reaper | Bruiser | Bleed | Gravity Weaver | Marksman | Void |
| Toxin Alchemist | Medic | Toxin | Mecha Tyrant | Bruiser | Shock |
| Soul Stealer | Scout | Void | Chrono Thief | Scout | Chill |
| Shadow Monarch | Striker | Bleed | Swarm Queen | Scout | Toxin |
| Puppeteer | Marksman | Shock | Ice Archmage | Marksman | Chill |
| Void Empress | Marksman | Void | Deep Siren | Striker | Soak |
| Plague Doctor | Medic | Toxin | Ash Shaman | Medic | Burn |
| Mad Scientist | Marksman | Shock | Soul Forger | Bruiser | Burn |
| Mirror Jester | Scout | Bleed | Cyber Priest | Medic | Holy |

**Signature passives** come after the core works. Example: Firefighter revives allies standing in fire without harm. Necromancer raises one killed enemy as an ally for 10 s.

## 13. Progression

- **Levels, skills, gym, shop and travel** stay as they are.
- **XP** stays shared in full. **Gold** stays with the player who picks it up, and a new option can send 10% of it to the party.
- **New team skills:** a third skill group gives Faster Revive, Longer Link Window, Stronger Reactions and Share Potion.
- **Stage unlocks:** clearing with a party unlocks that stage for all its members.
- **Equipment and weapon drops stay off**, as the owner decided. Z decides whether they return.
- **Weapon upgrade prototype:** two safehouse tiers cost 80 and 180 gold. At the second tier, pistols and bows pierce one additional enemy; shields interrupt ordinary enemy attack or healing wind-ups; healing weapons restore 2% of the lowest-health nearby standing ally’s maximum life on a successful enemy hit, at most once per second. Boss moves are not interrupted. These values need playtesting.

## 14. Communication

Voice chat is out of scope, and free text waits until there is moderation.

- **Ping (middle mouse or Z):** marks a spot, enemy or item for the party, with a sound.
- **Quick phrases (hold C):** Help, Revive me, Go, Wait, Thanks, On my way.
- **Arrows at the screen edge** point to allies who are off screen, and flash when they are downed.
- **Party panel:** life, status, downed timer, rage and whether their ultimate is ready.

## 15. Minions

Today, minions spawn alone, walk at the nearest player and hit. Weak and strong types exist for 3 villain families, and strong ones become more likely each stage. The rule of minions first, then 2 villains every minute, stays.

**Squads.** Minions spawn in groups led by one strong minion or a villain, with a shared alert.

| Squad | Members | How it plays | Team answer |
|---|---|---|---|
| Swarm | 6 to 8 weak | Surrounds one player | Area attacks, Taunt |
| Pack | 1 strong, 3 weak | Weak ones flank while the strong one blocks | Kill the leader for a panic |
| Siege | 2 strong | Slow, hits hard, breaks cover | Dodge and Mark |
| Escort | 1 villain, 4 weak | Protects the villain, who keeps casting | Rescue Dash in, or split up |

**Minion rules**

| Rule | Value |
|---|---|
| Leader dies | Weak members panic for 3 s: they're slower and take 20% more damage |
| Villain arrives | Nearby minions get +15% speed while it lives |
| Recruit | Each villain calls 2 weak minions every 20 s, up to 6 |
| Strong minion attacks | One clear wind-up, plus a heavy attack with a 0.8 s telegraph |
| Attacking NPCs | They attack NPCs only until they spot a player, as they do today |
| Rage | Unchanged: weak 7, strong 12, before bonuses |

**Family traits**

| Family | Weak | Strong | Trait |
|---|---|---|---|
| Necromancer | Skeleton | Bone Goliath | Skeletons stand back up once after 4 s, unless the bones are hit |
| Void Empress | Voidling | Void Goliath | Voidlings blink a short way toward their target |
| Toxin Alchemist | Toxin Grunt | Toxin Enforcer | They leave a small poison puddle when killed |
| Heroes (new) | Recruit | Veteran | Recruits form a shield line while their Veteran lives |

## 16. Day and night

Today, 24 game hours take 8 minutes. At night, enemies deal 15% more damage, gold drops are worth 25% more, up to 5 more rivals appear, and fewer NPCs are out. The lighting changes smoothly. Stage 10 stays at midnight.

| Period | Hours | Enemies | Players | World |
|---|---|---|---|---|
| Dawn | 05:00 to 08:00 | Night enemies slowly retreat | Safehouse healing +50% | NPCs come out, birds |
| Day | 08:00 to 17:00 | Fewer, more shooters | Full vision. Holy +15% damage. | Most NPCs, shops 10% cheaper |
| Dusk | 17:00 to 20:00 | Numbers grow, warning call at 19:00 | Burn +15% damage | Lamps light up |
| Night | 20:00 to 05:00 | More and stronger. Elites twice as likely. | Vision 70% away from light. Void +15% damage. | Few NPCs. Gold +25%. |

**Characters by time:** each of the 40 gets a day or night affinity with a 10% bonus to damage, so that a mixed party is strong at any hour.

**Night events** (one per night, random):

| Event | What happens | Reward |
|---|---|---|
| Blood Moon | Elites everywhere for 1 minute | Double rage |
| Rift | A portal spawns waves until closed by 2 players | Team power-up |
| Hunted | A villain hunts the player with the lowest life | Big gold if the party kills it |

**Lamps and torches** give safe light. Enemies can break them at night, and players can relight them with F. Being in light removes the night vision penalty.

**Stage timing:** the clock pauses during boss fights, so a boss's difficulty doesn't depend on luck. Each boss arena is set to its stage's starting hour.

## 17. Power-ups

**Today:** Potion heals 45%. Fast Pill gives 40% speed for 20 s. Magic Pill gives 50% damage for 20 s. Up to 9 of each. They come from drops and the shop.

**Keep those**, and add three new kinds.

**Pickups on the ground** work at once and don't stack. They're dropped by elites and hidden in chests.

| Pickup | Effect | Length |
|---|---|---|
| Rage Shard | +25 rage | Instant |
| Iron Skin | 40% less damage | 12 s |
| Quick Hands | Cooldowns 30% faster | 12 s |
| Echo | Attacks hit twice for half damage | 10 s |
| Mana Surge | No mana cost | 10 s |
| Ghost Step | Dodge has no cooldown | 8 s |

**Team power-ups** affect all allies within 300 units, so the party has to stay close to share them.

| Team power-up | Effect | Length |
|---|---|---|
| War Drum | +20% damage | 15 s |
| Life Bloom | Heals 5% per second | 10 s |
| Revive Flare | Revives every downed ally in range at 35% life | Instant |
| Hope Stone | +1 Hope | Instant |

**Items you can give away**

| Rule | Value |
|---|---|
| Throw a potion (T plus click on an ally) | Heals them for 45%, range 300 units. The menu moves from T to Tab-hold or Esc. C and D settle the key. |
| Gift a pill | Same action. Their pill, their timer. |
| Share rule | Pickups go to whoever touches them. Team power-ups have to be activated, so the party can wait for the right moment. |

**Rules:** power-ups never stack with themselves, and a repeat resets the timer. Pickups stay on the ground for 30 s. Bosses drop one team power-up at each phase change. Shops sell only potions and pills, so power-ups stay exciting.

## 18. Sound and music

**Today:** short synth effects, 18 voice lines made with a temporary macOS voice, no music, and no footsteps. Sounds don't get quieter with distance.

**Z provides all sound and music files.** C and D build the systems that play them, using placeholders until the files arrive.

### Sound rules

- **Everything has its own volume:** master, music, effects, voice and interface, saved per player.
- **Distance and direction:** sounds fade with distance and pan left or right. Sounds beyond 900 units are skipped.
- **Variation:** each effect has at least 3 versions, with slight pitch changes, so that repeats don't tire the ear.
- **Priority:** at most 24 sounds at once. Boss telegraphs, revive calls and your own hits always play.
- **Your team stands out:** allies' attacks are 30% quieter than yours. Downed alerts are always loud.
- **Loading:** sounds load with the character and stage that need them, so that the first page stays small.

### Footsteps

| Part | Detail |
|---|---|
| Timing | Plays on the walk animation's foot-down frame |
| Ground | Grass, dirt, stone, mud, water, rust, bone. Stage tiles report their ground type. |
| Body type | Light (Scout), normal, heavy (Bruiser), mechanical (Cyborg, Mecha Tyrant), floating or silent (ghost-like characters) |
| Others | Dodge roll, crawl while downed, and heavy boss steps with a little screen shake |

### Attacks, per weapon and per character

| Layer | Examples | Count |
|---|---|---|
| Weapon | Pistol shot, axe swing, staff hum, card flick, flask smash | One set per weapon |
| Impact | Flesh, armor, bone, crystal, metal, ghost | One set per enemy material |
| Element | Burn, Chill, Shock, Toxin, Void, Holy, Bleed, Soak | Layered over the weapon and impact |
| **Character signature** | Each hero and villain has a unique sound for their spell, special and ultimate, plus a short voice grunt | 40 sets |
| Reactions | Each of the 8 reactions has its own big sound | 8 |

### Other sound sets

| Group | Sounds |
|---|---|
| Co-op | Downed cry, revive start, progress, revive done, ping, link window, Duo, Trio, Full Party |
| Enemies | Each minion family, each stage enemy: spot, attack, hurt, die |
| Bosses | Each of the 10: roar, every attack's warning, stagger, phase change, death |
| Power-ups | Pickup, each power-up start and end, team power-up horn |
| World | Stage ambience by day and by night, NPC voices, lamp, doors, objectives |
| Interface | Menu, ready check, level up, stage clear, wipe |
| Announcer | Combo tiers, ultimate names, stage names, objective calls. Licensed voice only. |

### Music

Music changes with the situation by fading between layers, so it never restarts abruptly.

| Track | Variation |
|---|---|
| Title and menu | One theme for heroes and one for villains |
| Lobby | Calm loop |
| Each of 10 stages | A **day** and a **night** version, each with a calm and a combat layer. Combat fades in when enemies are near. |
| Safehouse | Quiet loop that plays when you're nearby |
| Each boss | Its own theme, with a change at each phase |
| Final boss | One theme per phase, 4 in total |
| Short stings | Stage clear, wipe, Blood Moon, villains arrive, all linked ultimates |

Hero parties and villain parties hear the same stage themes, with a different instrument lead if the budget allows.

**Online:** each player's music depends on what's near them. Sound events come from the existing server event system, and the browser picks the right file.

## 19. Fullscreen and cursor

| Action | What happens |
|---|---|
| **Fullscreen button, or L** | The game fills the screen. The stats side panel is hidden, and those details stay in the HUD and the menu. |
| **While playing in fullscreen** | The system cursor is hidden, and the game draws its own crosshair where you aim. |
| **Menus, pause and overlays** | The cursor comes back, so that buttons can be clicked. |
| **Esc in fullscreen** | Leaves fullscreen and brings the cursor back. |
| **Esc when not in fullscreen** | Same as today: pause when alone, and the room menu online. |
| **After leaving fullscreen with Esc** | Alone, the game pauses so that the player isn't hit while the cursor is out. Online, the game keeps running, because the world can't pause. |
| **Button again** | Leaves fullscreen as well. |

**Browser limit:** browsers keep Esc for leaving fullscreen themselves, and usually don't tell the game about the key press. So the game has to react to the fullscreen change itself instead of the key.

**Phones:** the button only shows if the device supports it, as iPhones don't allow it in a normal browser page. Touch players never see a crosshair.

### Full HD and clarity

**What's already true:** the game draws at the screen's real resolution, so at 1920×1080 the canvas has 1920×1080 pixels, and double that on a high-density screen. Text, the HUD and code-drawn effects are therefore sharp. **The remaining limit is the art.**

| What's on screen | Size at 1080p | Art today | Result |
|---|---|---|---|
| Video villains | About 204 px tall | About 180 to 300 px frames | Enlarged about 1.2×, so slightly soft |
| Heroes, other villains, NPCs | About 150 px tall | Code-drawn pixel frames, 48 px wide | Crisp but blocky, enlarged about 3× |
| Bosses | Up to 345 px tall | About 260 to 300 px cut-outs | Soft on the largest bosses |
| Map tiles and plants | One tile is about 78 px | Code-drawn 40 px pixel tiles | Crisp but blocky |

**Art targets for Z.** Characters are about 104 units tall, and the game draws 1.96× at 1080p. Art this size stays sharp up to 4K:

| Art | Minimum height per frame | Why |
|---|---|---|
| Heroes, villains, NPCs | **512 px** | About 408 px on a 4K screen, plus room for weapons and effects |
| Strong minions, stage enemies | 512 px | Same scale |
| Weak minions | 300 px | They're smaller on screen |
| Bosses | **768 px** | The largest are about 690 px on a 4K screen |
| Map tiles | 128 px per tile, as a set | About 156 px on 4K when enlarged a little |
| Menu cards | 600 × 800 px | Today's are 222 × 296 px |

**Keep source art clean:** video at 1080p or higher, on a flat background, with no heavy compression, as artifacts become visible when the cut-outs are made. A consistent look matters more than any number: mixing detailed art with blocky code-drawn pixels looks worse than either alone.

**Cost:** 40 characters at this size is far too large to put inside one page, so HD depends on loading art when it's needed (D-03).

**Rendering options:**
- **Smooth scaling for HD art,** kept separate from the sharp scaling used on pixel art.
- **A graphics setting:** Full, Medium or Low, to keep weaker laptops and phones smooth.
- **GPU drawing (WebGL)** if many HD sprites slow the canvas down. D-09 measures this first, since it's a larger change.

## 20. Questions for Z

1. Keep the "protect or terrorize NPCs" difference between sides?
2. Keep Hope and wipes, or use something softer?
3. Is level sync acceptable, or should high-level players keep their full power?
4. Which voice or actors replace the macOS voice lines?
5. Does gear return later, or is the game skill-and-training only?
