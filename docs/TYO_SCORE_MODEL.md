# TYO_SCORE_MODEL

A 0–100 summary of how well-evidenced a system is — **not** a prediction, not a
recommendation, and not a ranking of expected profit.

Implemented in `computeScore()` in `src/lib/ea-model.mjs`.

---

## 1. What it is measuring

Every input comes from the system's own MetaTrader tester report. The score
answers one question:

> How strong is the evidence this system behaves the way its backtest says,
> and how much did it cost in drawdown to get there?

It deliberately does **not** try to predict future return. Nothing in a
backtest can.

## 2. Components — five, 20 points each

| Component | Input | Why it is in the score |
|---|---|---|
| **Profitability** | Profit factor | Gross win ÷ gross loss. 1.0 is break-even before costs |
| **Drawdown control** | Max drawdown % | What the result cost in peak-to-trough decline |
| **Consistency** | Share of profitable months × worst-month factor | Whether the result accumulated or arrived in bursts |
| **Sample size** | Closed trade count | Thousands of trades is a different claim from dozens |
| **Robustness** | Years of history covered | A 24-year test has seen regimes a 2-year test has not |

Each maps through a documented piecewise-linear ladder:

```
Profitability      PF   1.0→0   1.3→8   1.8→14  2.5→18  4.0→20
Drawdown control   DD%    5→20   15→16   25→12   40→6   60→2   80→0
Consistency        pos%  40→0    55→8    70→14   85→18  95→20   (then × worst-month factor)
Sample size        n    100→0   500→8  1500→13 5000→17 15000→20
Robustness         yrs    1→0     3→7     6→12   12→17   20→20
```

## 3. Two corrections that change the ranking

### 3.1 Worst-month factor on consistency

Share of positive months, used alone, **rewards exactly the wrong thing here**.
A grid or martingale system wins nearly every month by construction and returns
it in one. Several of these systems post 90 %+ positive months.

So consistency is multiplied by `max(0.5, 1 − |worst month %| / 100)`:
a −10 % month costs 10 %, a −30 % month costs 30 %, −50 % or worse is floored
at half credit.

### 3.2 Drawdown cap on the total

| Max drawdown | Total capped at |
|---|---|
| ≥ 60 % | **40** |
| ≥ 45 % | **55** |
| ≥ 30 % | **70** |

Without this a system can offset a catastrophic drawdown with profit factor and
trade count and still land mid-table — the exact failure this score exists to
prevent. No amount of profitability compensates for halving the account.

The cap is always disclosed: the page shows the uncapped subtotal, the cap, and
why it applied.

## 4. Insufficient data

If **any** component is missing, the result is:

```
TYO SCORE: Insufficient data
```

with the missing components listed. A partial total would look comparable to a
complete one and would not be. There is no partial credit and no imputation.

## 5. Bands

| Total | Band |
|---|---|
| 80–100 | high |
| 65–79 | mid |
| 45–64 | low |
| 0–44 | weak |

## 6. Current results

Computed from the 14 tester reports, ordered by score:

| EA | PF | DD % | Worst month | Years | Raw | Cap | **Score** | Band |
|---|---|---|---|---|---|---|---|---|
| GALOA | 8.07 | 17.8 | −11.1 % | 24 | 84 | — | **84** | high |
| NEXUS | 1.52 | 2.6 | −1.2 % | 9 | 84 | — | **84** | high |
| JOKER | 1.71 | 2.0 | −1.1 % | 11 | 79 | — | **79** | mid |
| COSMOS | 1.80 | 19.8 | 0.0 % | 9 | 79 | — | **79** | mid |
| GRANDSLAM | 2.83 | 21.6 | +1.1 % | 3 | 78 | — | **78** | mid |
| KOKOMO | 2.44 | 25.3 | −20.1 % | 24 | 78 | — | **78** | mid |
| SENA | 2.54 | 22.7 | −9.8 % | 19 | 78 | — | **78** | mid |
| MIRUMO | 2.90 | 36.0 | −17.3 % | 24 | 75 | 70 | **70** | mid |
| GODSPEED | 1.70 | 38.4 | −14.8 % | 24 | 68 | 70 | **68** | mid |
| METRO | 1.95 | 43.4 | −28.9 % | 24 | 67 | 70 | **67** | mid |
| EVERGREEN | 1.78 | 41.0 | −21.5 % | 23 | 67 | 70 | **67** | mid |
| RINA | 3.89 | 56.1 | −5.1 % | 19 | 69 | 55 | **55** | low |
| SUPREMACY | 2.38 | 48.8 | +0.2 % | 7 | 74 | 55 | **55** | low |
| JAYRO | 2.84 | 70.8 | +0.6 % | 2 | 60 | 40 | **40** | weak |

The three capped-down systems are the point of the cap: RINA has the second
highest profit factor in the catalogue and still scores 55, because it drew
down 56 %.

## 7. Known limitations

1. **Drawdown basis is not uniform.** MT5 reports equity drawdown, MT4 only
   balance drawdown. Balance drawdown ignores open losing positions, so the
   nine MT4 systems are being judged on a more forgiving number than the five
   MT5 ones. This is disclosed on every page and is the single biggest thing
   that would change the table if it were fixed.
2. **MT5 Sharpe is excluded on purpose.** It is per-trade, not annualised —
   `nexus 30.58`, `joker 9.25`. Feeding it into a score would be meaningless.
3. **Backtest only.** No forward or live results exist, so nothing measures
   out-of-sample behaviour. Robustness is a proxy from history length, not from
   walk-forward validation.
4. **Costs are as the tester modelled them.** Spread is variable per the tick
   data; commission is not in the report header for any of these runs.
5. The ladders are judgement calls. They are stated here in full so the
   judgement is auditable rather than hidden.

## 8. What the score is not

- Not investment advice.
- Not a prediction of future performance.
- Not comparable to a third-party rating.
- Not a claim that a high-scoring system will be profitable.

Every page carrying a score also carries the backtest disclaimer.
