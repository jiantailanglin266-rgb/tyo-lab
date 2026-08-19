# Prospective validation model (Phase 15 §65–80, §109, §129–130)

## Evidence order (§68)

Development → internal WF (2024 layer, Phase 14 engine) → CANDIDATE FREEZE →
Monte Carlo (Phase 8 tooling on the candidate) → prospective OOS layer
(2025) → FINAL HOLDOUT (one shot) → Shadow (Phase 13.5) → Forward → Live.

## The one-shot runner

`run-prospective-validation.mjs CAN-xxx --report <tester report>`:

1. candidate FROZEN + source hash intact (§64),
2. holdout UNLOCKED via the human chain (§69) and not CONSUMED,
3. trades sliced to EXACTLY the sealed period (guard-enforced),
4. thresholds read from the research manifest — pre-committed at creation
   (§75, §77: PF ≥ 1.10, expected payoff > 0, annualized trades ≥ 1,500, DD
   ≤ internal × 2) and never writable by the runner,
5. decision PASS / FAIL / INCONCLUSIVE published through the Phase 14
   results store with `provenance: PROSPECTIVE` and
   `qualityLevel: PROCESS_PROSPECTIVE` — the evidence map and TYO SCORE
   derive automatically (§79–80),
6. publishing marks the holdout CONSUMED: no second run for the candidate
   (§71). A technical failure that produced no result does not consume
   (§72); the audit log records the retry.

## Degradation expectation (§76)

Development targets PF ≥ 1.30; the holdout pass bar is deliberately lower
(PF ≥ 1.10) because honest out-of-sample degradation is expected. Demanding
development-grade numbers on unseen data would only reward overfit
thresholds.

## FAIL handling (§81–82, §130)

FAIL publishes exactly like PASS — research log, EA page, terminal. The
version closes; research continues in a new version whose relationship to
the consumed holdout is recorded in the contamination register.
