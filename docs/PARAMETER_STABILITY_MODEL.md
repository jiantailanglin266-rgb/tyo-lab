# Parameter stability model (Phase 14C)

`parameterStability()` in src/lib/validation.mjs, exercised by unit tests;
dormant on FIXED_PARAMETERS runs (reported NOT_APPLICABLE, never faked).

## Per parameter (§28)

Over the per-window selected values: mean, median, min, max, stdDev,
coefficient of variation (CV), boundary-hit count against the recorded
search space (§18).

## Classification (§29–33)

| Class | Rule (config/validation.mjs) |
|---|---|
| STABLE | CV ≤ 0.15 |
| MIXED | CV ≤ 0.35 |
| UNSTABLE | CV > 0.35 — §27's `3.0, 0.5, 4.5, 0.8, 5.0` example lands here |
| BOUNDARY_HIT | ≥ 50% of windows select a search-range edge (§29) — overrides the CV class and warns that the optimum may lie outside the range |

Overall: any BOUNDARY_HIT/UNSTABLE → UNSTABLE; any MIXED → MIXED; else
STABLE. UNSTABLE overall raises PARAMETER_INSTABILITY (§30, §111); large
window-to-window jumps suggest regime dependency, which the report notes
without asserting a cause (§110).

## Robust plateau (§31–33)

Neighborhood sensitivity (x−step / x / x+step re-tests) requires per-window
tester runs and is specified for OPTIMIZED mode: classification
NEIGHBORHOOD_STABLE / MIXED / FRAGILE, computed only for the selected
values to avoid combinatorial explosion (§32). Multiple-testing exposure is
tracked via `totalCandidatesTested` per window (§34); deflated metrics and
PBO are future extensions the data model does not obstruct (§35–36).
