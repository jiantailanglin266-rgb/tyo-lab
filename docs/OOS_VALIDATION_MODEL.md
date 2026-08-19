# OOS validation model (Phase 14A)

Engine: `src/lib/validation.mjs` · CLIs: create-validation-plan / approve-
validation-plan / run-oos · config: `config/validation.mjs`.

## TRAIN → FREEZE → TEST (§0, §3)

1. **Plan** (DRAFT): time-series split only (§4), default 70/30 on calendar
   time; random splits do not exist in the code. Malformed splits are
   rejected at creation (§145).
2. **Human approval** pins the plan hash; the plan is immutable afterwards
   (§146) — the runner refuses any mutation.
3. **Manifest** (§3): written to data/validation/manifests/ BEFORE any test
   metric is computed — validationId, periods, provenance, parametersHash
   (EA source hash; the historical selection process is undocumented),
   report hash, thresholds, plan hash. Never rewritten.
4. **Metrics**: train window first, then test. Test-window relative DD uses
   the balance entering the window.

## Minimums (§5) and decision (§9–10)

INCONCLUSIVE (≠ FAILED) below `minOOSMonths` (12) or `minOOSTrades` (100).
Otherwise every check is recorded with its value and threshold:

- OOS PF ≥ 1.05 · OOS expected payoff > 0 ·
  OOS relative DD ≤ train relative DD × 2 · PF retention ≥ 0.65.

Degradation ratios (§8): PF / expected-payoff / trades-per-month / DD, plus
long-short PF shift (§106–107) and frequency shift (§108) feeding the
warning battery (§111).

## Re-run prohibition (§0, §51)

A validationId publishes once. Re-running requires marking the old record
INVALID and creating a NEW plan — re-testing the same window until it
passes is selection bias and the runner refuses it. A strategy revised
after seeing its OOS becomes a new VERSION whose OOS window is recorded as
previously observed (§80–82).

## PoC result (retrospective)

VAL-OOS-000001 SUPREMACY: train 2020-01→2024-05 (12,912 trades, PF 2.14,
relDD 9.54%), test 2024-05→2026-03 (6,334 trades, PF 3.30, relDD 0.89%),
retention 1.54, all checks PASS → **PASSED**, provenance RETROSPECTIVE →
evidence map unchanged by design.
