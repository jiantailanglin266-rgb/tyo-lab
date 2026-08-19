# Shadow evidence rules (Phase 13.5 §1–2, §48–51)

## Classification (§1)

`SHADOW_FORWARD` is its own evidence type in the seven-type taxonomy
(BACKTEST, OOS, WALK_FORWARD, MONTE_CARLO, SHADOW_FORWARD, FORWARD_DEMO,
LIVE). It is never displayed as, merged with, or upgraded to FORWARD_DEMO or
LIVE — enforced at import (source/type pairing), in the analyzer (aggregates
keyed by evidence type) and in the UI (its own tab, its own label).

## Public label (§2)

"SHADOW FORWARD" with the definition rendered on every shadow panel:
*Signals generated on future real-time market data without sending actual
market orders* (JA: 実時間の未来相場データ上でシグナルを記録し、実注文を
送信せずに検証したフォワード結果), plus the §95–96 disclaimer.

## Qualification (§48) — config/forward-evidence.mjs + shadow-forward.mjs

A shadow dataset lights its evidence-map cell only when ALL hold:

1. ≥ **100** closed virtual trades (vs 30 for real execution — virtual
   trades are cheap and must earn the ✓; `minTradesHighFreq: 500` is
   available for very high-frequency systems),
2. ≥ 30 calendar days (derived from the data),
3. every trade mapped with a valid source (SHADOW_EA / MAGIC / COMMENT /
   MANUAL),
4. recorded feed gaps ≤ 5% of market-open time in the period (§126–127;
   weekends and the symbol's closed hours are not gaps — §128–129).

Below the bar, the dataset still renders in full with the
"BELOW EVIDENCE MINIMUMS" badge. Cells are never ticked by hand (§44).

## Evidence points (§49–50)

The map is seven stages since Phase 13.5. The 20-point Evidence Quality
budget is fixed, so shadow's points come from the historical-data stages:

| Stage | Points | Rationale |
|---|---|---|
| Backtest | 5 | the foundation record |
| OOS | 2 (was 3) | historical data |
| Walk forward | 2 (was 3) | historical data |
| Monte Carlo | 3 | resampling of the real record |
| **Shadow forward** | **2** | future data, virtual execution |
| Forward | 3 | future data, real execution |
| Live | 3 | real money, real execution |

Ordering states the hierarchy: real-time observation beats resampling of
history; real execution beats virtual execution. No published score changed
(every system holds backtest 5 + Monte Carlo 3 = 8/20 under both tables); a
qualified shadow record adds +2.

## Degradation & candidates (§59–62)

The Phase 12 detector runs on shadow datasets unchanged (rolling 30/60/90d
and trade windows, deterministic thresholds, minimum 30-trade sample,
confidence by sample). Shadow-sourced candidates carry
`evidenceType: SHADOW_FORWARD` and flow into the same human-review chain —
never auto-promoted (§69–70).
