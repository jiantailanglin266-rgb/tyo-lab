# Validation evidence rules (Phase 14 §48–51, §63–68, §87–90)

## Derivation, never assertion (§48)

The OOS and walk-forward cells on the evidence map are computed by
build.mjs from tools/validation-results.json — there is no hand-settable
flag anywhere. `evidenceOf()` reads `model.oosVal` / `model.wfVal`, which
build.mjs sets only when a record satisfies ALL of:

1. status **PASSED** (FAILED scores 0 — §67; INCONCLUSIVE adds nothing — §68),
2. provenance **PROSPECTIVE** (§87 + config `evidenceRequiresProspective`),
3. not INVALID (§51 — invalidating a record auto-clears the cell on the
   next build),
4. produced through the full chain: human-approved immutable plan, frozen
   manifest, recorded checks (§49–50).

## PROSPECTIVE vs RETROSPECTIVE (§85–90)

RETROSPECTIVE (all current systems): the strategy's authorship saw the test
period. These records render everywhere — EA validation section, Terminal
summary (counted as "retrospective, unscored") — with a standing banner in
all 7 languages, and never light the map or add TYO SCORE points. This is
deliberately consistent with Phase 6, which kept OOS pending for exactly
this reason.

PROSPECTIVE: legitimate only when the test window is provably untouched by
the strategy's development (the §139–140 policy for future versions:
holdout fixed at development start, versions bumped whenever an observed
OOS motivates a change, `previouslyObserved` recorded — §80–82).

## Score interaction (§66)

Unchanged point table (7 stages, 20 points): OOS +2, walk-forward +2, only
via the derivation above. The PoC (retrospective PASSED × 2) correctly
changed no score — verified in the build: SUPREMACY remains 8/20.

## Research log relationship (§69–71)

Validation ≠ experiment: an experiment researches a change; a validation
tests a frozen candidate. Validations are their own records keyed by
strategy+version; an experiment that produces a new version links forward
to that version's validations. Validations are not auto-inserted into the
research log.
