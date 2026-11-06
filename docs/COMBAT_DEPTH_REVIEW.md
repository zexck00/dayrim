# Combat depth review: C-01–C-16

Reviewed on `combat-depth-fixes` after the combat follow-up fixes. This is a follow-up inventory, not a balance sign-off. The latest full server run passed 283 rule checks, 42 networking checks and the script that exercises all 780 distinct-character reaction pairs. The [bot trial notes](playtests/2026-11-06-party-bot-smoke.md) distinguish invalid early runs from a later error-free but incomplete four-player trial. These checks do not replace a four-player, touch-device or human balance test. C-07–C-09 are not assigned in the task list.

## Prioritized findings addressed

- **C-16:** The online client derives and displays the link damage bonus from the synchronized participant count.
- **C-12/C-13:** Potions, active self-heals and Mend Link credit threat only for life actually restored; a disconnected Mend Link caster does not transfer their threat to the recipient.
- **C-14:** Solo players can trigger Resonance with a second hit on an active status, at half the party damage bonus, rage and boss guard gain. Named cross-element reactions still require two players with the current one-element character rules.
- **C-16:** Rules tests cover delayed bonuses after target healing or death, caster disconnect, tier upgrades, boss phase changes and burrow. A blocked hit creates no delayed damage; the bonus for an earlier valid hit is still applied during burrow. Full Party heals standing players without giving life to downed or respawning players.
- **C-01:** Boss ultimate base damage is the design's fixed 4% of maximum life per hit divided by party size, including high-damage builds. Hit modifiers and link bonuses still apply.

A bot trial also exposed a crash when the wounded scout died and an objective dead end afterward; the NPC now uses fallback art and the objective replaces a killed scout. These fixes have automated rules coverage. Human feedback, reaction and boss balance, the full client presentation, and the quality-of-life ideas below remain open.

## Enhancements and quality of life

The party HUD now shows difficulty, Hope spent and retry location, with a difficulty-change notice. Open rooms list their current difficulty. Revive feedback identifies a selected ally and progress or gives the hold key and range. Enemy target markers receive awareness over the network, and combat labels show active status and Taunt time. The HUD shows the local citizen-fear timer, party chain time and cumulative bonuses. The Skills menu explains elements and Resonance; Mark, Mend Link and Rescue Dash preview their target; failed Marks give a reason, support abilities name their target, and a late link bonus is labeled on affected enemies. Narrow and desktop viewport captures were inspected in Chromium; real phones and human readability remain untested.

`game/tools/party-bot.js` joins an isolated server with one to four real WebSocket clients, drives combat and objectives, and reports stage, map seed, clear time, downs, wipes, Hope and estimated damage taken. Start an isolated server with a separate data directory before running it; do not use a live playtest server. It records map seeds but cannot force them, and snapshot-based damage is an estimate. The bots are prototypes: one-, two- and four-bot runs cleared Stage 1; the three-bot run timed out and none reached Stage 3. C-06 requires repeated Stage 1–3 trials and a recommendation reviewed by Z.

Still open: real-phone and four-player UI checks; revive cancellation and overlapping-player usability, including 200 ms lag; rage-share range feedback; sound and visual distinction for individual reactions; end-to-end wipe tests for every objective checkpoint (hold, carry and escort reset paths have rule coverage); party balance and human playtests; and a decision on fixed versus refreshed link windows. Boss-phase checkpoints, final role passives and final stat scaling remain separate design work.

## Design and verification notes

- The task table labels these systems prototypes for good reason: threat formulas, role passives, boss targeting, solo reactions, recovery and party scaling differ in places from the target design. Keep proposed changes distinct from Z's balance decisions.
- Same-element and otherwise unmatched cross-player combinations now use Resonance. The coverage script checks that both participants get rage and the status is consumed, but does not establish that the damage, guard gain or visual feedback is balanced.
- The C-16 window currently extends when another participant joins. This permits a chain of casts over more than three seconds from the first cast; confirm whether the design intends a fixed opening window or a refreshed window.
- `npm test` starts a local server. In a sandbox that cannot bind localhost, the test now fails explicitly if its server exits before listening; rerun with permission to bind and confirm the networking check count.
