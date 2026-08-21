# Phase 15.1 — XAU_PYRAMID baseline research & candidate freeze: final report

Date: 2026-08-22 · Strategy: TYO_XAU_Pyramid V001 (`XAU_PYRAMID`) · Manifest: RES-XAU-001 · Holdout: HOLD-XAU-001

## 1. Outcome in one line

**Targets NOT met. No candidate frozen. HOLD-XAU-001 remains SEALED.**
On development data (2016-02 → 2023-12, XM GOLD basis) the V001 family never
combines PF ≥ 1.30 with ≥ 2,000 trades/year; the best frequency-preserving
configuration is PF 0.99, and PF above 1.30 appears only at 9 trades/year
(35 trades in four years — not evidence).

## 2. What was executed (§84 order)

| Step | Status | Evidence |
|---|---|---|
| BASELINE on frozen snapshot | done | [BASELINE-0002-analysis.md](BASELINE-0002-analysis.md) — PF 0.73, 289 tr/yr, rel DD 94.9%, net −$9,302 on $10,000 |
| §6–10 analysis (levels / sessions / hours / long-short) | done | same file; §19 losing-side-add violations = 0 |
| §11 decision | done | targets unmet → Research A–F, one change at a time |
| Research A (entries) | done | EXP-001, 002, 012 — no engine alone is positive |
| Research B (pyramid) | done | EXP-003 (no adds, +0.11 PF), EXP-011 (step 2.0, +0.04) — adds destroy value (L2–L4 net −$5,940 in baseline) |
| Research C (exit) | done | EXP-006 (trail 2.5, +0.05), EXP-007 (trail 1.0, −0.13) |
| Research D (regime) | done | EXP-010 (relATR ≥ 1.0, +0.08) |
| Research E (sessions) | done | EXP-008 (overlap only, +0.17), EXP-009 (Asia, +0.03) |
| Research F (trend threshold) | done | EXP-004 (20/15: 1,062 tr/yr, PF 0.67, DD 202%), EXP-005 (80/60: 99 tr/yr, PF 0.84) |
| Combinations (pre-registered) | done | EXP-013 PF 0.99 @117/yr · EXP-014 PF 1.39 @9/yr · EXP-015 PF 0.97 @59/yr |
| Limited optimization (§34 fitness) | **not run — by the pre-written stop rule** | optimizing a core with negative expectancy is curve fitting; 0/10 optimization runs consumed |
| Robustness / internal validation / WF / MC | **not run** | no candidate exists to test; 2024 internal layer untouched |
| Candidate freeze | **not performed** | nothing meets the freeze bar |
| Pre-Unlock report | this document | verdict: NOT READY — no unlock request |

Full table: [RESEARCH-RESULTS.md](RESEARCH-RESULTS.md). Plan as written before
running: [RESEARCH-PLAN.md](RESEARCH-PLAN.md).

## 3. Why the family fails (what the data says, not a guess)

1. **Negative core expectancy.** Even L1-only entries lose (baseline L1 net
   −$3,363; EXP-003 with no adds: PF 0.84). The DEMON-gated pullback/breakout
   entry on M5 gold with a 2-ATR stop and 1.5-ATR trail is net negative in
   every year except 2016 (PF 1.15 on 86 trades).
2. **Pyramiding amplifies the loss.** Levels 2–4 contribute −$5,940 of the
   baseline's −$9,302; removing adds is the single most valuable change and
   still leaves PF < 1.
3. **Frequency and quality are anti-correlated along every axis.** Loosening
   the trend gate (EXP-004) doubles trades and deepens the loss; tightening
   it (EXP-005, 014) improves PF only by deleting almost all trades.
   The fixed-pip DEMON threshold (40/30 pips on a $1,150–$2,000 instrument)
   makes yearly trade counts swing from 17 (2018) to 716 (2020).
4. **No session rescues it.** Overlap-only is the least bad (PF 0.90); London
   and New York are both PF ≈ 0.6.

## 4. Bugs found and fixed on the way (all before the baseline was accepted)

- `CVolatilityFilter::RelativeATR()` compared ATR across timeframes without
  scaling (M5/H4 ≈ 0.14 vs a [0.6, 3.0] band) → every entry blocked for 8
  years (BASELINE-0001 = 0 trades). Fixed with √(bar-time) normalization;
  parameter values unchanged. Details: [DIAGNOSTICS.md](DIAGNOSTICS.md).
- Infrastructure: Docker on :3000 racing the tester's local agent; owner
  automation killing `terminal64.exe` by name; a 2017-02→08 stretch of XM
  GOLD M1 history that makes tick generation explode (declared DATA_GAP,
  never interpolated). All documented in DIAGNOSTICS.md.

## 5. Budget (RES-XAU-001)

Logic variants 0/12 · Experiments 15/30 · Optimization runs 0/10 ·
Parameter sets 0/5000. Every experiment is one numbered, pre-registered
change (or pre-registered combination) against the frozen snapshot.

## 6. Data integrity statements

- Development layer only. The 2024 internal-validation layer was never
  simulated. 2025 was never simulated.
- HOLD-XAU-001 (2026-01-01 → 2026-06-30) was never simulated, never viewed;
  its history files were physically deleted from the research terminal after
  every online session (they re-sync on login).
- 2017-02 → 2017-08 excluded as unusable broker data; stated in every report
  that spans it.
- All runs: GOLD (XMTrading), M5, 1-minute OHLC model, $10,000, 1:500, fixed
  0.1 lot. Segmented runs (calendar years) merged into one continuous equity.

## 7. What a next step could be (human decision — not started)

This is a *logic* problem, not a parameter problem, so the next manifest
revision would be a **logic variant (V002)** — e.g. a volatility-normalized
trend gate (threshold in ATR units, not pips) and an entry core designed for
frequency (the current one cannot reach 2,000/yr at any setting). That is a
new version with its own baseline and counts against logic-variant budget;
it is not a continuation of V001's parameter search.

## 8. Status line

**HOLD-XAU-001 remains SEALED. Human unlock required.** No unlock is
requested because no candidate exists.
