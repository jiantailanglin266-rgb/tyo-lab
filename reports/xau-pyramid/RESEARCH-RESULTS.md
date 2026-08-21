# XAU_PYRAMID Research A–F results (screening window 2020-01-01 → 2023-12-31)

Baseline on the same window (BASELINE-0002-W2020): PF 0.73, 522 trades/yr, payoff 1.49, rel DD 89.63%, long PF 0.69, short PF 0.76.

Targets (§4): PF ≥ 1.30 **and** ≥ 2,000 trades/yr. One change per experiment; all other inputs = frozen baseline snapshot. 2017 data gap does not affect this window.

| ID | Group | Change | Trades | /yr | PF | ΔPF | Payoff | Rel DD | Long PF | Short PF | Avg L | L3+ net | Targets |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EXP-XAU-001 | A entries | `InpUseBreakout=false` (pullback only) | 1635 | 409 | 0.69 | -0.04 | 1.43 | 77.30% | 0.68 | 0.70 | 1.52 | -1648 | ❌ |
| EXP-XAU-002 | A entries | `InpUsePullback=false` (breakout only) | 843 | 211 | 0.72 | -0.01 | 1.55 | 43.92% | 0.73 | 0.72 | 1.57 | -1092 | ❌ |
| EXP-XAU-003 | B pyramid | `InpMaxPyramidLevels=1` (no adds) | 1297 | 324 | 0.84 | +0.11 | 1.51 | 31.52% | 0.75 | 0.93 | 1 | 0 | ❌ |
| EXP-XAU-004 | F trend | `InpTrendDiff1=20 InpTrendDiff2=15` | 4246 | 1062 | 0.67 | -0.06 | 1.45 | 201.69% | 0.63 | 0.71 | 1.51 | -4072 | ❌ |
| EXP-XAU-005 | F trend | `InpTrendDiff1=80 InpTrendDiff2=60` | 396 | 99 | 0.84 | +0.11 | 1.65 | 17.89% | 0.81 | 0.86 | 1.59 | -484 | ❌ |
| EXP-XAU-006 | C exit | `InpTrail_ATR=2.5` | 1667 | 417 | 0.78 | +0.05 | 1.70 | 85.60% | 0.76 | 0.80 | 1.78 | 1287 | ❌ |
| EXP-XAU-007 | C exit | `InpTrail_ATR=1.0` | 2292 | 573 | 0.60 | -0.13 | 1.38 | 108.17% | 0.45 | 0.74 | 1.33 | -1200 | ❌ |
| EXP-XAU-008 | E sessions | `InpSessionLondon=false InpSessionNY=false` (overlap only) | 752 | 188 | 0.90 | +0.17 | 1.66 | 19.83% | 0.86 | 0.92 | 1.54 | -184 | ❌ |
| EXP-XAU-009 | E sessions | `InpSessionAsia=true` | 2427 | 607 | 0.76 | +0.03 | 1.48 | 89.36% | 0.70 | 0.82 | 1.55 | -2161 | ❌ |
| EXP-XAU-010 | D regime | `InpRelATRMin=1.0` | 1523 | 381 | 0.81 | +0.08 | 1.53 | 53.00% | 0.74 | 0.87 | 1.53 | -1029 | ❌ |
| EXP-XAU-011 | B pyramid | `InpPyramidATR=2.0` | 1595 | 399 | 0.77 | +0.04 | 1.50 | 56.86% | 0.72 | 0.82 | 1.22 | -438 | ❌ |
| EXP-XAU-012 | A entries | `InpUsePullback=false InpUseBreakout=false InpUseMomentum=true` | 1227 | 307 | 0.62 | -0.11 | 1.39 | 80.73% | 0.68 | 0.57 | 1.56 | -2042 | ❌ |
| EXP-XAU-013 | combo | `InpMaxPyramidLevels=1 InpSessionLondon=false InpSessionNY=false` | 467 | 117 | 0.99 | +0.26 | 1.58 | 10.08% | 0.88 | 1.08 | 1 | 0 | ❌ |
| EXP-XAU-014 | combo | `InpMaxPyramidLevels=1 InpTrendDiff1=80 InpTrendDiff2=60 InpSessionLondon=false InpSessionNY=false InpRelATRMin=1.0 InpTrail_ATR=2.5` | 35 | 9 | 1.39 | +0.66 | 1.47 | 3.42% | 2.91 | 1.02 | 1 | 0 | ❌ |
| EXP-XAU-015 | combo | `InpMaxPyramidLevels=1 InpTrendDiff1=80 InpTrendDiff2=60` | 237 | 59 | 0.97 | +0.24 | 1.74 | 7.29% | 0.92 | 1.01 | 1 | 0 | ❌ |

## Reading

- Highest PF among single changes: EXP-XAU-014 (1.39, 9/yr), EXP-XAU-013 (0.99, 117/yr), EXP-XAU-015 (0.97, 59/yr). 
- Experiments meeting both targets: 0.
- PF ≥ 1.30 appears only in EXP-XAU-014 (35 trades over the whole window, 9/yr) — a sample far too small to establish an edge and two orders of magnitude under the frequency target. Filters can only remove trades, so no parameter search can recover frequency from there.
- Highest frequency any configuration reached: EXP-XAU-004 at 1062/yr (PF 0.67). Frequency ≥ 2,000/yr and PF ≥ 1.0 never coincide in this family on development data.
- Frequency and quality move in opposite directions across the trend-threshold axis (EXP-004 vs EXP-005): the fixed-pip DEMON gate trades volume for quality but never buys a positive edge.

## Budget

```
Logic variants     0 / 12
Experiments        15 / 30
Optimization runs  0 / 10
Parameter sets     0 / 5000
```
