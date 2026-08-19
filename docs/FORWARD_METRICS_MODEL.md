# Forward metrics model (Phase 12B)

Implementation: `src/lib/forward-metrics.mjs` (pure functions, unit-tested
by `scripts/test-forward.mjs`). Everything is arithmetic over normalized
trades; anything not computable is null — never estimated.

## Metric bag (§14–15)

Net-basis first: EA evaluation uses `netProfit = profit + swap + commission
+ fees` per trade; gross figures and each cost line are also reported so the
cost impact is visible (swap/commission share of gross profit, §38–40).

| Metric | Definition |
|---|---|
| profitFactor | Σwins / |Σlosses| on net |
| winRate / avgWin / avgLoss / payoffRatio | decided trades (break-even excluded from rates) |
| expectedPayoff | net / trades (account currency) |
| maxDrawdown | max decline of cumulative net by close time — **balance basis**, labelled as such (§17–18); intra-trade floating declines are invisible and the UI says so |
| relativeDrawdownPct | only with a verified `startBalance`; else null |
| recoveryFactor | net / maxDD (currency) |
| sharpePerTrade | mean/sd of per-trade net — labelled "per trade", not annualised |
| longPF / shortPF, long/short counts | §36 |
| avgHoldingHours | where open+close times exist |

Currency discipline (§16): money stays in the account currency; nothing is
converted, and cross-currency amounts are never compared — ratio metrics
(PF, win rate, payoff ratio) carry cross-record comparison.

Slippage (§41): requested vs executed prices are not present in statements
or history exports, so slippage is **not estimated**. If a future source
carries both prices, the normalized model already has openPrice/closePrice
fields to extend.

## Frequency (§22)

trades / day / month (30.44d) / year (365.25d) over the derived period.

## Rolling windows (§24–25)

Calendar: 30/60/90 days (90 is the reference for degradation).
Trade-count: last 30/50/100 trades, for low-frequency systems.
Each window reports trades, PF, win rate, expected payoff, net, DD, long/
short PF. A trade window below `minRollingTrades` renders nothing.

## Backtest vs forward (§19–21)

The EA detail comparison shows only metrics that are meaningful across the
two records: PF, trades/month, win rate. Expected payoff and DD are not
diffed across records because the units (account currency, balance size)
differ; the standing note states that the two columns cover different
periods, brokers and regimes and that a difference describes the records,
not a verdict (§20).

## Breakdowns (§33–37)

Sessions (UTC buckets from config: ASIA/LONDON/OVERLAP/NEW_YORK/OFF), hours
0–23, days of week, symbols, long/short — each as {trades, net, PF, win
rate}, computed only where trades exist. Stored in the public aggregate;
sessions and long/short render on the page, the rest are analyzable data
(§118 trade-distribution comparisons can build on them later).
