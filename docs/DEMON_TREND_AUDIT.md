# DEMON trend logic — audit (Phase 15 §5)

## The logic (verified, not guessed)

Read from two shipped sources — `NEXUS.mq5` (TrendCheck, lines ~458–485) and
the gold build `JOKER/joker tyo mt520.mq5` (TrendCheck, lines ~1283–1324).
Structurally identical:

```
per trend-TF bar:
  state = OFF
  if strategy-clock hour < TrendHour:
    ma = SMA(MAPeriod=50) on TrendTF, closed bars
    UP   if (ma[1]-ma[15]) >= Diff1·pip and (ma[1]-ma[50]) >= Diff2·pip
    DOWN if (ma[15]-ma[1]) >= Diff1·pip and (ma[50]-ma[1]) >= Diff2·pip
```

pip = point ×10 on 2/3/5-digit symbols (family PipsToPrice()).

## Shipped defaults

| Build | TrendTF | MA | Diff1 | Diff2 | TrendHour |
|---|---|---|---|---|---|
| NEXUS (BTCUSD) | M15 | 50 | 15 | 75 | 20 |
| JOKER (XAUUSD) | M15 | 50 | 40 | 30 | 21 |

## Reuse (§5)

Extracted 1:1 into `mql5/Include/TYO/DemonTrend.mqh` (`CDemonTrend`), fully
parameterised (TF, period, diffs, hour, GMT shift), bar-gated exactly like
the originals. XAU_PYRAMID initialises it with the gold defaults. No
existing EA was modified; the include is for new strategies (the shadow
template family can adopt it later).
