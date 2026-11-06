# Combat depth review: C-01–C-16

Reviewed on `combat-depth-fixes` after the combat follow-up fixes. This is a follow-up inventory, not a balance sign-off. The latest full server run passed 273 rule checks, 41 networking checks and the script that exercises all 780 distinct-character reaction pairs. These checks do not replace a four-player, touch-device or human balance test. C-07–C-09 are not assigned in the task list.

## Prioritized findings addressed

- **C-16:** The online client derives and displays the link damage bonus from the synchronized participant count.
- **C-12/C-13:** Potions, active self-heals and Mend Link credit threat only for life actually restored; a disconnected Mend Link caster does not transfer their threat to the recipient.
- **C-14:** Solo players can trigger Resonance with a second hit on an active status, at half the party damage bonus, rage and boss guard gain. Named cross-element reactions still require two players with the current one-element character rules.
- **C-16:** Rules tests cover delayed bonuses after target healing or death, caster disconnect, tier upgrades, boss phase changes and burrow. A blocked hit creates no delayed damage; the bonus for an earlier valid hit is still applied during burrow. Full Party heals standing players without giving life to downed or respawning players.
- **C-01:** Boss ultimate base damage is the design's fixed 4% of maximum life per hit divided by party size, including high-damage builds. Hit modifiers and link bonuses still apply.

These fixes have automated rules coverage. Human feedback, reaction and boss balance, the full client presentation, and the quality-of-life ideas below remain open.

## Enhancements and quality of life

| Tasks | Opportunity | Why and how to validate |
|---|---|---|
| C-01–C-03, C-05 | Explain party scaling at join and leave. | D-07 already tracks a difficulty label. Show the multiplier and a short change notice; verify boss health percentage, quota and enemy count for 1–4 players. |
| C-04 | Make citizen fear understandable to the responsible player. | A short local cue or status indicator can explain why citizens flee. Keep witness reactions distinct from the killer's personal reputation; test two nearby players. |
| C-06 | Run repeatable party balance trials. | D-06 remains open. Record stage 1–3 clear time, downs, wipes, hit damage and Hope for 1–4 players across multiple seeds and compositions. Compare with human feedback before proposing a replacement for ×8 damage. |
| C-10 | Improve revive targeting and feedback. | Show the selected ally, range and hold progress, including a clear cancellation when moving away or changing targets. Test overlapping allies, two simultaneous revivers, Scout dragging, Medic range, touch and 200 ms lag. |
| C-11 | Explain Hope and checkpoint consequences. | Show Hope spent and the retry location before a wipe, with a clear respawn timer. Test zero Hope, simultaneous bleed-outs, membership changes and a retry during every objective kind. Boss-phase checkpoints remain future work. |
| C-12 | Make enemy attention readable. | Current threat uses decay, distance and hysteresis; bosses generally target nearest players. A distinct target marker and Taunt duration would help players understand switches. Test marker visibility, downed targets and boss exceptions. |
| C-13 | Clarify target, range and failed casts. | Show which ally Mend Link or Rescue Dash will choose and why Mark cannot fire. Compare the prototype with the role passives and stat scaling in section 4; test walls, overlapping players, solo fallback and mobile input. |
| C-14 | Make status setup and reactions legible. | Show active status and remaining time, give named reactions distinct readable cues, and explain Resonance in the character or skills UI. Measure whether shared rage and boss guard gain from frequent Resonance need tuning. |
| C-15 | Show the chain timer and all active bonuses. | The HUD shows a count and highest-tier label, but a timer and clear list of cumulative bonuses would make the six-second window easier to play around. Show when an ally is in rage-sharing range without excessive effects. |
| C-16 | Make link participation and timing clear. | Make late bonus application visible and test the existing bonus, participant count and countdown. Test linked casts under latency and overlapping effects without obscuring enemy telegraphs. |

## Design and verification notes

- The task table labels these systems prototypes for good reason: threat formulas, role passives, boss targeting, solo reactions, recovery and party scaling differ in places from the target design. Keep proposed changes distinct from Z's balance decisions.
- Same-element and otherwise unmatched cross-player combinations now use Resonance. The coverage script checks that both participants get rage and the status is consumed, but does not establish that the damage, guard gain or visual feedback is balanced.
- The C-16 window currently extends when another participant joins. This permits a chain of casts over more than three seconds from the first cast; confirm whether the design intends a fixed opening window or a refreshed window.
- `npm test` starts a local server. In a sandbox that cannot bind localhost, inspect its output: the networking child can report `EPERM` even if the parent command exits successfully. Run it with permission to bind and confirm the final networking check count.
