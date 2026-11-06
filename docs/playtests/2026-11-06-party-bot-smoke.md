# Party bot smoke trials — 2026-11-06

**Invalid for balance:** these early runner versions did not report room closure, and a later diagnostic reproduced a server crash when an ultimate killed the wounded scout. The rooms in the tables below may have closed without the runner noticing. The scout crash and error reporting have since been fixed; repeat the trials before interpreting their results. These are automated local trials, not human playtests or balance approval. Four independent rooms ran concurrently on an isolated local server; the runner used real WebSockets and a 200 ms decision interval. Each party had at most 120 seconds. Damage taken is estimated from snapshot health decreases. Each result uses one randomly generated map; the server records but cannot replay a chosen seed. The bots do not yet navigate every map reliably, and their action choices are incomplete.

| Players | Stage 1 map seed | Result at 120 s | Downs | Wipes | Hope | Estimated damage taken |
|---:|---:|---|---|---:|---:|---|
| 1 | 1373044174 | Wounded scout objective, no clear | 0 | 0 | 3 | 0 |
| 2 | 1054252262 | Objective complete, approaching boss gate; no clear | 0, 0 | 0 | 4 | 7, 32 |
| 3 | 1101612830 | Wounded scout objective, no clear | 0, 0, 0 | 0 | 5 | 0, 30, 0 |
| 4 | 92568923 | Boss active at about 94% life; no clear | 1, 0, 1, 0 | 0 | 6 | 239, 0, 366, 4 |

An earlier, 90-second diagnostic run with a previous pathfinding version cleared Stage 1 with two bots in 42.8 seconds; the one-, three- and four-player runs did not clear. That earlier run used different random seeds and is not a controlled comparison. After a pathfinding change the four-player party reached the boss, but no party cleared Stage 1 in the 120-second sample. No Stage 2 or 3 balance result was obtained from the updated runner.

These observations cannot establish clear rates or support a change to party damage. Improve bot pathfinding, objective priorities and combat behavior, demonstrate four bots completing Stage 1, then run multiple longer trials for each party size and stages 1–3. Review those results with Z alongside outside-player sessions.

A later four-player diagnostic ended after 17.4 seconds when an ultimate killed the wounded scout and the room closed. The server traceback identified an NPC art lookup for `Scout`; the rules now use the NPC art fallback and the runner stops with a nonzero exit when a room closes.

After the scout fix and error-detection change, a fresh four-player, 90-second diagnostic on map seed `368231906` remained connected with no server errors. It did not clear Stage 1: the party was still on the scout objective at timeout. There were no observed downs or wipes, Hope remained 6, and estimated damage taken was 0, 0, 0 and 42. The bots had spread out and were pursuing enemies, so this is a navigation and objective-priority diagnostic, not a balance result.

With objective-priority navigation and the scout replacement fix, a further four-player run on seed `1439030811` stayed connected without server errors for 90 seconds. The party completed the scout objective and was travelling to the boss gate at timeout. It recorded no downs or wipes, Hope 6, and estimated damage taken of 8, 20, 255 and 481. It did not clear Stage 1. This remains a bot-behavior check, not a balance verdict.
