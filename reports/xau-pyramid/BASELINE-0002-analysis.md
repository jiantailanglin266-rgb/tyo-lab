# BASELINE-0002 — XAU_PYRAMID baseline analysis (§6–11)

Development data only: 2016-02-01 → 2023-12-31 (GOLD, XMTrading basis, M5, 1-minute OHLC model). HOLD-XAU-001 (2026-01-01→2026-06-30) untouched and SEALED; 2024 internal-validation layer not used; 2025 not used.

**Data gaps (excluded, not simulated):** 2017-02→2017-08 (XM GOLD M1 history unusable: tick generation explodes to >1,000 ticks/bar and the tester aborts;  2017-01/09/10/11/12 simulated, 0 trades).

Run as 12 calendar segments merged into one deal stream (balance rebuilt cumulatively from $10,000); drawdown is therefore measured on the continuous merged equity.

## §6 Headline vs §4 targets

| Metric | Value | Target | Status |
|---|---|---|---|
| Profit factor | 0.73 | ≥ 1.30 | ❌ NOT met |
| Trades / year | 289 | ≥ 2,000 | ❌ NOT met |
| Total trades | 2286 | — | — |
| Net profit | -9301.90 | — | — |
| Relative drawdown | 94.90% | — | — |
| Win rate | 32.75% | — | — |
| Payoff ratio | 1.51 | > 0 (holdout floor) | — |
| Expected payoff / trade | -4.07 | — | — |

## Per-segment (year) behaviour

| Segment | Period | Trades | PF | Net | Rel DD | Long PF | Short PF | Avg level |
|---|---|---|---|---|---|---|---|---|
| Y2016 | 2016-02-01→2016-12-31 | 86 | 1.15 | 190 | 3.4% | 1.10 | 1.24 | 1.55 |
| Y2018 | 2018-01-01→2018-12-31 | 17 | 0.25 | -171 | 1.8% | 0.05 | 0.72 | 1.12 |
| Y2019 | 2019-01-01→2019-12-31 | 96 | 0.52 | -566 | 5.7% | 0.57 | 0.37 | 1.4 |
| Y2020 | 2020-01-01→2020-12-31 | 716 | 0.61 | -5427 | 56.1% | 0.50 | 0.72 | 1.47 |
| Y2021 | 2021-01-01→2021-12-31 | 373 | 0.92 | -447 | 12.3% | 0.33 | 1.26 | 1.54 |
| Y2022 | 2022-01-01→2022-12-31 | 675 | 0.86 | -1207 | 23.0% | 1.23 | 0.60 | 1.58 |
| Y2023 | 2023-01-01→2023-12-31 | 323 | 0.60 | -1674 | 18.4% | 0.78 | 0.40 | 1.56 |

## §7 Pyramid level attribution

Average level 1.52, max level 4. Losing-side add violations: **0** (§19 satisfied).

| Level | Entries | Net profit (FIFO attribution) |
|---|---|---|
| L1 | 1426 | -3363 |
| L2 | 588 | -4097 |
| L3 | 204 | -1320 |
| L4 | 68 | -523 |

_FIFO in→out matching per direction; exact for full-basket closes, approximate when SL closes interleave._

## §8 Sessions (GMT, from server time − 3h)

| Session | Trades | PF | Net | Expected payoff |
|---|---|---|---|---|
| LONDON | 554 | 0.58 | -3424 | -6.18 |
| OVERLAP | 730 | 0.90 | -1358 | -1.86 |
| NEW_YORK | 961 | 0.63 | -4865 | -5.06 |
| OFF | 41 | 1.89 | 345 | 8.40 |

## §9 Hours (GMT, by close time)

| Hour | Trades | PF | Net |
|---|---|---|---|
| 07 | 114 | 0.32 | -1415 |
| 08 | 98 | 0.63 | -548 |
| 09 | 107 | 0.78 | -354 |
| 10 | 124 | 0.98 | -21 |
| 11 | 111 | 0.30 | -1086 |
| 12 | 185 | 0.56 | -1324 |
| 13 | 169 | 0.81 | -569 |
| 14 | 208 | 1.45 | 1770 |
| 15 | 168 | 0.65 | -1235 |
| 16 | 213 | 0.55 | -1454 |
| 17 | 273 | 0.70 | -1089 |
| 18 | 215 | 0.48 | -1634 |
| 19 | 155 | 0.48 | -952 |
| 20 | 105 | 1.23 | 264 |
| 22 | 41 | 1.89 | 345 |

## §10 Long / short

| Side | Trades | PF |
|---|---|---|
| Long | 1122 | 0.70 |
| Short | 1164 | 0.76 |

## §11 Decision inputs

- Targets: PF NOT met (0.73 vs 1.30); frequency NOT met (289/yr vs 2,000). Both must hold for a candidate.
- L1 net -3363; levels ≥ L3 net -1843 → pyramid depth is destroying value as configured.
- Best session OFF (net 345), worst NEW_YORK (net -4865).
- Long PF 0.70 vs short PF 0.76.
- Year-to-year trade counts vary by more than an order of magnitude: DEMON uses a fixed pip threshold (40/30 pips on a $1,150–$2,000 instrument), so trend detection scales with price level and volatility, not with regime. A volatility-normalized trend threshold is a research hypothesis (one change), not a baseline edit.

Decision rule (§11): if targets are unmet, proceed to Research A–E one hypothesis at a time; do not tune the baseline in place; report honestly if the family cannot reach the targets on development data.
