# Shadow Forward Engine — architecture (Phase 13.5)

```
LIVE MARKET DATA (already-connected MT5 terminal, price feed only)
  → Signal Engine (the EA's own logic, verbatim — §5)
  → CShadowExecution (virtual book: entries, SL/TP/trailing, swap, costs)
  → append-only JSONL event log + atomic state file (MQL5/Files/TYO/shadow/)
  → scripts/import-forward.mjs --type SHADOW_FORWARD (ShadowSource)
  → scripts/analyze-forward.mjs (metrics, qualification, degradation)
  → TYO LAB (EA Shadow tab, evidence map, terminal, candidates)
```

## Components

| Layer | File | Notes |
|---|---|---|
| Position book | `mql5/Include/TYO/ShadowPosition.mqh` | virtual position struct, floating P/L, SL/TP touch tests on the correct book side (§17–18) |
| Logger | `mql5/Include/TYO/ShadowLogger.mqh` | JSONL events with daily rotation (§90), atomic state snapshots (§40) |
| Engine | `mql5/Include/TYO/ShadowExecution.mqh` | execution models, rollover swap, feed guard, dedupe, restart recovery, chart banner |
| Template | `mql5/Experts/TYO/TYO_ShadowTemplate.mq5` | integration example with a throwaway demo signal; lets the engine run in the Strategy Tester (§81) |
| PoC | `NEXUS_Shadow.mq5` (owner's NEXUS folder — **not in this public repo**: strategy IP) | NEXUS v1.00 signal layer verbatim; execution layer swapped 1:1 |

## Integration pattern (§4–5, §73–74)

The strategy's signal functions are never forked. Only the execution surface
changes: `m_trade.Buy/Sell` → `g_shadow.Buy/Sell`, real-position iteration →
`g_shadow.GetByIndex/CountByMagic/...`, `PositionModify` → `ModifySLTP`
behind the same broker-stop-distance guards. In NEXUS the swap touched 8
functions; the five DEMON_* entries, five Exit_* signals, trend filter, GMT,
lot sizing and every fixed parameter are byte-identical.

## PoC selection (§72)

NEXUS: highest trade count in the catalogue (19,968 backtest trades → the
fastest shadow-sample accumulation), the smallest MT5 source (41 KB), and
execution calls concentrated in few functions. Both builds compile clean
(0 errors / 0 warnings, MetaEditor CLI).

## Event log (§37–38)

`SESSION_START · SIGNAL(implicit in ENTRY) · ENTRY · MODIFY · PARTIAL_CLOSE ·
EXIT · FEED_GAP · SESSION_END · ERROR`, one JSON object per line, files
`shadow-<strategy>-YYYY-MM-DD.jsonl`. EXIT lines are the closed trades the
importer ingests; everything else is audit detail. Raw logs never enter git
(§92) — only site aggregates ship.

## Restart safety (§39–42, §123–125)

State (`shadow-state-<strategy>.txt`) is written atomically on every
mutation: open positions, next id, recent signal keys, session stats. On
restart, open positions are restored (never force-closed — they stay
`openAtSessionEnd` in the SESSION_END event, §124) and the persisted signal
keys prevent double entries on the same signal.
