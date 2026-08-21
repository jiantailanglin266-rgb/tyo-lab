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

## Reading

- Highest PF among single changes: EXP-XAU-003 (0.84, 324/yr), EXP-XAU-005 (0.84, 99/yr), EXP-XAU-006 (0.78, 417/yr). **No single change reaches PF 1.0, let alone 1.30.**
- Experiments meeting both targets: 0.
- Frequency and quality move in opposite directions across the trend-threshold axis (EXP-004 vs EXP-005): the fixed-pip DEMON gate trades volume for quality but never buys a positive edge.

## Status of the remaining plan

EXP-XAU-008 (overlap only), 009 (Asia added), 010 (relATR min 1.0), 011
(pyramid step 2.0 ATR) and 012 (momentum only) were **launched and logged
against the budget but not completed**: on 2026-08-22 the machine owner
instructed (via the STELLAR\EA session) that no MT5 may run on this PC,
and the research terminal launcher was disabled. 008 has its 2020 segment
archived. These five resume unchanged — same IDs, same single change, no
re-counting — once a tester is authorized (this PC re-authorized, or the
research terminal migrated). Nothing about their definition changes in the
meantime.

## Budget

```
Logic variants     0 / 12
Experiments        12 / 30
Optimization runs  0 / 10
Parameter sets     0 / 5000
```
