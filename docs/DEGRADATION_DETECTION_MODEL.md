# Degradation detection model (Phase 12C)

Deterministic by design (§27): ratios against a declared baseline, config
thresholds, minimum samples. No ML, no auto-tuning, no auto-action (§58).
Implementation: `degradationOf()` in `src/lib/forward-metrics.mjs`; config:
`config/forward-evidence.mjs`.

## Baseline (§31–32)

Priority: `FULL_FORWARD_HISTORY` (only when the forward record itself has
≥ 200 trades) → `BACKTEST` (header PF + trades/month from the extracted
backtest data). The chosen type is stored and displayed with the verdict, so
"below baseline" always says below WHICH baseline. Backtest DD is a
percentage of a different balance and is therefore never used as a DD
baseline — DD ratios only apply against the forward record's own history.

## Signals

Reference window: rolling 90 days.

| Signal | Rule (defaults) |
|---|---|
| PF ratio | rolling PF / baseline PF < 0.85 → WATCH · < 0.70 → DEGRADED · < 0.50 → SEVERE |
| Frequency | rolling trades/month / baseline < 0.5 → WATCH |
| Drawdown | rolling DD > 1.5 × own-history DD → SEVERE |

The worst signal wins. §28's example (backtest 1.60, 90d 1.25, ratio 0.78)
lands in WATCH, as specified.

## Guards against over-reaction (§29–30)

- `minRollingTrades` (30): below it the verdict is `INSUFFICIENT_DATA`, full
  stop.
- Confidence from sample size: ≥30 LOW · ≥50 MEDIUM · ≥100 HIGH — displayed
  next to every verdict.
- §117: the PF ratio is an internal monitoring signal; the UI presents it
  with baseline, sample and confidence, never as a standalone quality score.

## States (§26)

`NORMAL · WATCH · DEGRADED · SEVERE · INSUFFICIENT_DATA` — rendered as
colour + text chips (never colour alone), on the EA forward tab and the
Terminal monitoring table.

## Freshness (§113–115)

Separate from degradation: no closed trade for 30 days (90 for systems whose
backtest frequency is < 8 trades/month) → `STALE` badge. Freshness describes
the data, not the performance.

## Output path (12E)

WATCH/DEGRADED/SEVERE verdicts generate a research candidate
(`RC-nnnn`, status OPEN) with deterministic suggested areas: worst session
(PF < 70% of overall), long/short imbalance (ratio < 0.6), swap or
commission share of gross > 20%, frequency ratio, DD ratio. Suggestions are
signals for a human to investigate — the analyzer never asserts a cause
(§55) and never promotes a candidate to an experiment (§104). Alerts beyond
the build log (DEGRADATION_DETECTED etc., §59) are a future hook; the states
already exist in the JSON.

## E2E verification (fixture, removed before commit)

A synthetic 150-trade forward set (healthy 7 months, degraded last 90 days)
produced: rolling-90d PF 1.03 vs backtest baseline 1.71 → ratio 0.60 →
DEGRADED, sample 45, confidence LOW, candidate RC-0001 with the observation
string, STALE flagged. The production repo ships with all of this empty.
