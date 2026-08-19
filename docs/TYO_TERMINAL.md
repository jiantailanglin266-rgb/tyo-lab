# TYO Terminal (Phase 11)

`/terminal/` — the platform's state on one screen, and the hub linking every
lab. Template: `src/pages/terminal.mjs`. Navigation: `headerHidden` (§65),
reachable from the fullscreen menu and the footer. Sitemap priority 0.6.

## Design constraint (stated in the hero)

The Terminal makes **no claim of its own**. Every cell is a re-projection of
data other pages already render:

| Section | Source |
|---|---|
| 01 Platform state | sums over the extracted deal data (`model.num.trades`, `model.trades.monthly`), `experimentStats()`, and the Monte Carlo config (`mcMeta.sims × 3` random resamplings per covered system — cost stress is deterministic and not counted) |
| 02 Evidence map | `model.evidence.stages` / `.points` and `model.score.total` — the same objects the EA detail pages render |
| 03 Latest research | the first six entries of the same list `/research/` renders |
| 04 Labs | static links to the four labs |

## Evidence map

14 systems × 6 stages (Backtest, OOS, Walk forward, Monte Carlo, Forward,
Live). A cell is ✓ only when the stage's data exists in this repository —
the same rule as everywhere (`src/lib/evidence.mjs`). Marks are glyph + sr
text + title attribute, never colour alone. The table scrolls horizontally
inside its own container on narrow screens; the standing OOS note renders
under the map.

Current truthful state: every system shows ✓ Backtest and ✓ Monte Carlo
(8/20 evidence points); OOS, walk-forward, forward and live are pending
platform-wide. As those land (forward/live via `tools/forward-live.json`),
the map updates with no template change.

## Numbers on the page (as of Phase 11)

14 systems · 75,166 closed trades · 2,009 months of record · 26 experiments
(16 accepted) · 42,000 MC resamplings. All derived, none typed in.
