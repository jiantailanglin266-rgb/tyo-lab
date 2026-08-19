# Candidate freeze model (Phase 15 §62–64, §80–82)

## FROZEN means frozen

`freeze-candidate.mjs` pins, per candidate id (CAN-XAU-nnn):

- **sourceHash** — sha256 of the .mq5 at freeze time; the prospective
  validator re-hashes the source and refuses a mismatch,
- **parameterHash** + the full parameter snapshot,
- **gitCommit**, **budgetAtFreeze**, frozenAt.

Preconditions: a research manifest exists and its holdout is SEALED
(freezing before sealing violates §135 and is refused — test-verified).
A version can be frozen exactly once; "fixing" a frozen candidate is a NEW
version with a new candidate id (§64, §82).

## Bias control (§80–82)

Seeing validation results and then editing the same version is the classic
contamination path. Here it is mechanical: the frozen hashes make any edit
detectable, the duplicate-version freeze is refused, and unlocking a
holdout writes every frozen candidate of the strategy into the
contamination register — a later version validated against the same period
carries `previouslyObserved` and reduced evidence quality (§85). Waiting
for genuinely new data (§86) is the only way back to full quality.

## Selection guidance (§57–61)

Candidates are chosen on the development layer only, with robustness ahead
of peak PF: plateau behaviour around the chosen values (§60–61), multiple
candidate profiles kept (HIGH_FREQUENCY / BALANCED / LOW_DD — §58), and the
single-best-PF pick explicitly discouraged (§59). These rules live in the
research plan and the Phase 14 stability tooling scores them.
