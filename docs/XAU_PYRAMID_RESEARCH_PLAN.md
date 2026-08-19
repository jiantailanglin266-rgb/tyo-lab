# XAU_PYRAMID research plan (RES-XAU-001)

Sealed governance: HOLD-XAU-001 (2026-01-01 → 2026-06-30) SEALED before any
development run. Quality: PROCESS_PROSPECTIVE. Budget: variants ≤12,
experiments ≤30, optimization rounds ≤10. Objectives: **PF ≥ 1.30 with
≥ 2,000 trades/year on the development layer** (stretch 1.40 / 3,000);
priority order expectancy > PF > trade count > robustness > DD > win rate
(§7–8). Robustness beats peak PF at candidate selection (§59, §123).

## Phases (§51–53)

1. **Baseline (no optimization, §51):** DEMON M15(50/40/30/h21) + M5
   pullback+breakout + ATR(14) pyramid step 1.0 / 4 levels + SL 2.0 ATR +
   trail 1.5 ATR, London+NY+overlap sessions, spread ≤ 60 pips and ≤ 0.25
   ATR, relATR 0.6–3.0. Development layer only, via
   `generate-research-config.mjs RES-XAU-001 --layer development`.
2. **Research A–E, one hypothesis per experiment (§53–54):**
   A entry type mix → B pyramid distance (0.5–2.0 ATR, levels 3–6) →
   C exit (trail multiplier vs DEMON-reversal-only vs partial+runner) →
   D session/volatility windows → E risk (sizing modes, basket cap).
   Every run logged with `log-research-run.mjs`; every experiment enters
   the research log as XAU_PYRAMID_Vnnn (§55–56); rejects preserved.
3. **Trade-count lever (§48):** if trades fall short, adjust the M5 trigger
   (breakout lookback, micro-breakout, momentum) — never loosen the DEMON
   trend filter first.
4. **Candidate selection (§57–61):** ≥2 profiles (HIGH_FREQUENCY /
   BALANCED), plateau check around chosen values, then
   `freeze-candidate.mjs`.
5. **Internal validation:** Phase 14 OOS/WF on the 2024 layer; Monte Carlo
   on the frozen candidate; `mark-milestone.mjs` both.
6. **STOP (§124–127, §137):** pre-unlock report to the owner; unlock is the
   owner's explicit act; then the one-shot holdout run.

## §50 pyramid-contribution analysis

Every entry's order comment carries its level (`XP L1…Ln`), so tester deal
lists attribute profit by pyramid level — the adds must earn their place or
research phase B removes them.

## Status

Protocol executed through SEAL. Baseline implementation compiled
(0 errors); baseline METRICS pending the owner's tester run (the terminal
was live during this session — see PHASE15_PROSPECTIVE_AUDIT.md).
