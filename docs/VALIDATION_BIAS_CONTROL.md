# Validation bias control (Phase 14 §0, §76–90)

The engine's job is to make the §0 violations mechanically hard, not merely
discouraged:

| Bias | Control |
|---|---|
| Tune after seeing OOS, call it OOS | one publish per validationId; re-run refused; a revised strategy is a new VERSION whose windows carry `previouslyObserved: true` (§80–82) |
| Optimise on the test window | no optimisation code exists in the runners (FIXED mode); generated tester configs cover train windows only, with the test window annotated frozen-evaluation-only (§45) |
| Keep good windows, drop bad ones | window set is generated from the immutable plan; results are appended wholesale; the UI renders every window (§26) |
| Move the OOS boundary until it passes | plans are hash-pinned at human approval; the runner refuses a mutated plan (§146); a new boundary = a new plan, visible in the audit trail |
| AI redefines windows from results | the MCP surface has no plan-editing or window-defining tool; plan approval cannot be set programmatically by the creation CLI (§75, §78) |
| Fake human approval | `approvedByHuman` is written only by approve-validation-plan.mjs, run by a person; the PoC's approval cites the owner's written Phase 14 brief (§138) as the approving authority, recorded verbatim in the plan |
| Claim unseen data that was seen | provenance is a first-class field; RETROSPECTIVE never lights evidence (§85–88); the banner ships in all 7 languages |
| Threshold shopping | pass thresholds live in config and are copied into the plan at creation, hashed at approval — changing them later cannot alter a completed record |

## Final holdout policy (§83–84, §139–140)

For future development: fix a FINAL HOLDOUT at development start (e.g.
development ≤ year Y-2, WF on Y-1, holdout Y), touch it exactly once, and
run the standard pipeline Research → Train → Candidate freeze → OOS → WF →
Monte Carlo → Shadow → Forward → Live. Only that chain can produce
PROSPECTIVE evidence.

## Honest limitation

Retrospective controls cannot rewind information: the 14 shipped systems
have seen their whole history. Phase 14 therefore proves the machinery —
including its ability to say FAILED — while scoring nothing until
prospective data exists. A validation engine that cannot reject is a
marketing tool; this one refuses to be (final principle).
