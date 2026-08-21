# XAU_PYRAMID Research A–F plan (pre-registered before any experiment ran)

Written 2026-08-22 05:35 JST, after BASELINE-0002 and before EXP-XAU-001.
HOLD-XAU-001 stays SEALED; 2024 internal layer and 2025 untouched.

## Screening window (fixed for every experiment)

**2020-01-01 → 2023-12-31** (4 calendar segments, development layer only).
Reason, decided up front: it holds 2,087 of the baseline's 2,286 trades
(91%), includes the worst year (2020, −$5,427) and the three
high-activity years, and costs ≈12 min per experiment versus ≈25 min for
the full 2016–2023 span given the kill/abort environment. Any candidate
that passes screening is re-run on the full development span
(2016-02 → 2023-12, with the documented 2017 gap) before the shortlist.
The window is not changed after seeing results.

## Comparison rule

Every experiment = the frozen baseline snapshot + **one** input change,
run through `xau-segmented-run.mjs --type experiment` (one budget entry
each). The comparison metric set is §6 (PF, trades/yr, payoff, relative
DD, long/short PF, level attribution). "Better" means PF improves
materially with trade frequency not collapsing; no experiment is judged on
net profit alone.

## Hypotheses (one change each)

| ID | Group | Change vs baseline | What it tests |
|---|---|---|---|
| EXP-XAU-001 | A entries | `InpUseBreakout=false` (pullback only) | is the breakout engine the loser? |
| EXP-XAU-002 | A entries | `InpUsePullback=false` (breakout only) | is the pullback engine the loser? |
| EXP-XAU-003 | B pyramid | `InpMaxPyramidLevels=1` (no adds) | do adds destroy value (L2–L4 net −5,940)? |
| EXP-XAU-004 | F trend | `InpTrendDiff1=20 InpTrendDiff2=15` | looser DEMON → more trades, worse quality? |
| EXP-XAU-005 | F trend | `InpTrendDiff1=80 InpTrendDiff2=60` | stricter DEMON → fewer, better trades? |
| EXP-XAU-006 | C exit | `InpTrail_ATR=2.5` | is the 1.5-ATR trail cutting winners? |
| EXP-XAU-007 | C exit | `InpTrail_ATR=1.0` | or too loose? |
| EXP-XAU-008 | E sessions | `InpSessionLondon=false InpSessionNY=false` (overlap only) | overlap was the least-bad session |
| EXP-XAU-009 | E sessions | `InpSessionAsia=true` | Asia looked positive in DIAG-0005 (1 month) |
| EXP-XAU-010 | D regime | `InpRelATRMin=1.0` | trade only above-normal volatility |
| EXP-XAU-011 | B pyramid | `InpPyramidATR=2.0` | wider ladder |
| EXP-XAU-012 | A entries | `InpUsePullback=false InpUseBreakout=false InpUseMomentum=true` | momentum engine solo |

Order is fixed; later IDs may be skipped (and said so) if earlier results make
them moot, but no experiment is added on the basis of a result without being
written here first, with its number, before it runs.

Budget: 12 experiments of 30; 0 of 12 logic variants; 0 of 10 optimization
runs. Any combination run (two changes) counts as a new numbered experiment.

## Round 2 — combinations (pre-registered 2026-08-22 06:45 JST, after EXP-001..012)

Single changes with a positive ΔPF on the screening window: 003 (no adds
+0.11), 005 (DEMON 80/60 +0.11), 008 (overlap only +0.17), 010 (relATR ≥ 1.0
+0.08), 006 (trail 2.5 +0.05), 011 (step 2.0 +0.04), 009 (Asia +0.03).
None ≥ 1.0. Three combination experiments, fixed before running:

| ID | Change vs baseline | What it tests |
|---|---|---|
| EXP-XAU-013 | `InpMaxPyramidLevels=1 InpSessionLondon=false InpSessionNY=false` | the two largest positive deltas, both frequency-preserving |
| EXP-XAU-014 | `InpMaxPyramidLevels=1 InpTrendDiff1=80 InpTrendDiff2=60 InpSessionLondon=false InpSessionNY=false InpRelATRMin=1.0 InpTrail_ATR=2.5` | every positive delta stacked — the upper bound of this family on this window |
| EXP-XAU-015 | `InpMaxPyramidLevels=1 InpTrendDiff1=80 InpTrendDiff2=60` | quality-only stack without session/regime filters |

Stop rule (written now): if EXP-014 — the most favourable stack — is below PF
1.0, the family's core entry/exit has negative expectancy on development
data and no optimization round is run (optimizing a negative-edge core is
curve fitting). The outcome is then reported as TARGETS NOT MET with no
candidate frozen.
