# Phase 15 — prospective-validation audit (pre-development)

## Repository state entering 15

Phase 14 validation engine (plans/manifests/evidence derivation), Phase 13.5
shadow engine, Phase 10/13 human-approval chains, research log/experiment
model, MCP server — all reusable. The Phase 14 evidence gate already refuses
non-PROSPECTIVE records, so Phase 15's job is to make PROSPECTIVE possible.

## DEMON audit (§5) → docs/DEMON_TREND_AUDIT.md

TrendCheck() is structurally identical across the family (verified in
NEXUS.mq5 and the gold build "joker tyo mt520.mq5"): SMA(50) on the trend
TF; UP when ma[1]−ma[15] ≥ diff1·pip AND ma[1]−ma[50] ≥ diff2·pip; DOWN
mirrored; OFF otherwise or past the trend hour. Gold defaults: M15, diffs
40/30, hour 21. Extracted 1:1 into `mql5/Include/TYO/DemonTrend.mqh`;
existing EAs untouched.

## XAUUSD data & observed periods (§10)

- Owner's gold tester reports span **2016-02 → 2026-02** (JOKER XAUUSD).
- Optimization/set/forward artifacts: none (Phase 14 audit) — parameter
  history undocumented for all existing systems.
- Therefore gold market data through 2026-02 is OBSERVED (in other systems'
  reports); 2026-03+ appears in no TYO report; the developer has lived
  through all of it.

## Prospective quality decision (§11–13)

**LEVEL B — PROCESS_PROSPECTIVE.** Strict Level A is impossible here: the
developer knows this market and MT5's tester can read every bar (§103). The
protocol guarantees process isolation — sealed manifests, guard-refused
tooling, audit log, one-shot unlock — and the site states exactly that
(§104). Cross-strategy exposure of 2026-01→02 via other systems' reports is
recorded in the research manifest (`knownExposure`).

## Data split (fixed before development, §9)

| Layer | Period |
|---|---|
| Development | 2016-02-01 → 2023-12-31 |
| Internal validation / WF | 2024-01-01 → 2024-12-31 |
| Prospective OOS | 2025-01-01 → 2025-12-31 |
| **FINAL HOLDOUT (HOLD-XAU-001)** | **2026-01-01 → 2026-06-30 — SEALED before any development run** |

## Tester automation status

MT5 was RUNNING during this session (owner's terminal, likely the shadow
engine) — launching tester runs against the live terminal was ruled out.
Research runs therefore execute via guard-generated configs
(`generate-research-config.mjs`) on the owner's schedule; baseline results
are PENDING TESTER RUN.
