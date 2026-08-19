# Walk-forward model (Phase 14B)

## Windows (§11–13)

`generateWindows()` supports **rolling** (fixed train length) and
**anchored** (expanding train). Defaults: train 24m / test 6m / step 6m.
Only FULL test windows ship; partial trailing windows are dropped at plan
creation, overlaps and reversed dates are rejected (§145). Bad windows are
preserved forever — no code path deletes or filters a window (§26).

## Parameter modes

- **FIXED_PARAMETERS** (current): the as-shipped set is evaluated on every
  window. This measures persistence of the fixed configuration across
  sequential windows — stated verbatim on the page and in reports; it is
  NOT re-optimisation robustness. Parameter stability is NOT_APPLICABLE by
  construction and reported as such, never fabricated.
- **OPTIMIZED** (future): per-window MT5 optimisation. run-wf.mjs
  --emit-tester-configs generates one tester .ini per train window (§38),
  with the search model staged (coarse OHLC search → real-tick re-check,
  §40–41) and the test window explicitly excluded from optimisation (§45).
  Selection rule and fitness must live in the plan before any run (§15–16);
  the engine stores selected parameters, hashes and the search space per
  window (§17–19) and the stability module (§27–33) takes over.

## Aggregation (§21–25)

Test-window trades are stitched chronologically — train results never enter
the curve. Reported: stitched trades/PF/win rate/net/DD/Sharpe(per-trade),
positive-window rate, PF≥1.1 window count, top-window profit share
(§112–113), and **WFE (TYO definition, §23)**: mean test-window net profit
per month ÷ mean train-window net profit per month (documented because
industry definitions differ).

Pass rule (config): ≥4 evaluated windows, stitched PF ≥ 1.05, positive
window rate ≥ 60%, stitched expected payoff > 0. Below the window minimum →
INCONCLUSIVE.

## Checkpoints & failure (§95–98)

Per-window results stream to data/validation/windows/ as they compute; a
crashed run resumes from artifacts. Missing/failed runs are RUN_ERROR and
never become evidence (§97).

## PoC result (retrospective)

WF-000001 SUPREMACY, rolling 24/6/6, 8/8 windows evaluated and positive
(window PFs 1.96–3.93), stitched: 13,473 trades, PF 2.61, WFE 1.05,
top-window share 0.18 → **PASSED**, provenance RETROSPECTIVE → unscored.
