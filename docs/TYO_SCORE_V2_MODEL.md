# TYO SCORE 2.0

TYO SCORE measures **how well-evidenced a system's record is** — it has never
been a prediction of future returns, and V2 makes that explicit by scoring
the *depth of verification* alongside the backtest statistics.

Implementation: `src/lib/evidence.mjs` (`evidenceOf`, `scoreV2`).
V1 components: `src/lib/ea-model.mjs` (`computeScore`), documented in
`TYO_SCORE_MODEL.md`.

## Composition (0–100)

| Component | V1 | V2 | Input |
|---|---|---|---|
| Profitability | 20 | **16** | profit factor (report header) |
| Drawdown control | 20 | **16** | max drawdown, worst basis stated |
| Consistency | 20 | **16** | positive-month share × worst-month factor |
| Sample size | 20 | **16** | closed trades |
| Robustness | 20 | **16** | months of record |
| **Evidence quality** | — | **20** | verification stages (below) |

The five V1 components keep their exact ladders and inputs, scaled × 0.8.
Nothing about how a component is judged changed — only its weight.

## Evidence quality (0–20)

| Stage | Points | Granted when |
|---|---|---|
| Backtest | 5 | a parsed tester report with a full deal list exists in this repo |
| Out of sample | +2 | a provably held-out period exists as data |
| Walk forward | +2 | walk-forward results exist as data |
| Monte Carlo | +3 | pre-generated simulation results exist in tools/montecarlo.json (Phase 8: 1,000 seeded resamplings per family — see MONTE_CARLO_MODEL.md) |
| Shadow forward | +2 | a QUALIFIED shadow-forward aggregate exists (Phase 13.5: real-time future data, virtual execution, ≥100 trades / ≥30 days — see SHADOW_EVIDENCE_RULES.md) |
| Forward test | +3 | qualified real-execution forward data exists (Phase 12) |
| Live | +3 | qualified live records exist (Phase 12) |

Seven stages since Phase 13.5; OOS and walk-forward went 3→2 to fund the
shadow stage inside the fixed 20-point budget (both are historical-data
stages, while shadow observes genuinely future data). No published score
changed: every system holds backtest 5 + Monte Carlo 3 = 8/20 under both
tables.

A stage is granted **only when its underlying data exists in this
repository** — never on the owner's say-so. Since Phase 8 every published
system scores **8/20**: backtest (5) + Monte Carlo (3). OOS, walk-forward,
forward and live remain pending; the number rises only when that data lands.

**Why the split analyses don't light OOS:** the optimisation window of the
historical builds is undocumented, so no period can be *proven* held-out.
The EXP-0002xx split-stability entries are stability checks, not OOS
validation, and deliberately do not grant the stage. This is stated on every
EA page (`t.evidence.oosNote`).

## Caps carry over unchanged

The V1 drawdown caps are absolute risk statements, not fractions of a
formula, so they bind the V2 total identically:

- max drawdown ≥ 60% → total capped at 40
- ≥ 45% → capped at 55
- ≥ 30% → capped at 70

A system missing any component input still reports "Insufficient data" rather
than a total that looks comparable to a complete one.

## Effect on the catalogue

Phase 6 baseline (evidence 5/20) and Phase 8 (Monte Carlo lands, 8/20):

| Example | V1 | V2 @5/20 | V2 @8/20 | Note |
|---|---|---|---|---|
| GALOA | 84 | 72 | 75 | 66.9 perf + evidence |
| NEXUS | 84 | 72 | 75 | |
| RINA | 55 | 55 | 55 | cap 55 binds throughout |
| SUPREMACY | 55 | 55 | 55 | cap 55 binds |
| JAYRO | 40 | 40 | 40 | cap 40 binds |

Uncapped systems: `V2 ≈ V1 × 0.8 + evidence`. Capped systems are unchanged —
their cap already said everything.

## Displaying

- `ScoreCard` renders six bars, each against **its own maximum** (16 or 20),
  so a full bar always means "maxed".
- The evidence checklist (`EvidenceChecklist`) appears on every EA detail
  page (full, block 15) and in the sticky sidebar (compact), with each stage
  marked ✓ Verified / — Pending.
- The "BACKTEST VERIFIED" hero badge appears only when the backtest stage is
  granted, i.e. the deal-list data is in this repo.
