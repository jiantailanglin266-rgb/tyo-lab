# Validation lab architecture (Phase 14D)

## Data flow

```
config/validation.mjs                thresholds (part of every plan hash)
scripts/create-validation-plan.mjs → tools/validation-plans.json (DRAFT)
scripts/approve-validation-plan.mjs  human-run → APPROVED + planHash
scripts/run-oos.mjs / run-wf.mjs   → data/validation/{manifests,windows}   (gitignored working data)
                                   → tools/validation-results.json          (public aggregate, committed)
                                   → reports/validation/<slug>/<id>.md      (scientific report, committed)
build.mjs                          → model.validations / oosVal / wfVal
                                   → evidence map, TYO SCORE, EA pages, Terminal
```

## Surfaces

- **EA detail block 16 "Validation"** (§56–62): OOS card (train/test table,
  degradation-ratio chips, pass checks with values and thresholds,
  provenance banner) and WF card (mode, window table — every window,
  low-sample flagged — stitched OOS metrics, positive-window rate, WFE,
  top-window share, stability verdict, warnings). Renders nothing until a
  validation exists; video/disclaimer blocks renumber to 17/18.
- **Terminal**: validation summary strip under the evidence map — OOS
  qualified, WF qualified, passed, failed, retrospective (unscored) — shown
  only when records exist (§64). The evidence matrix itself stays the
  Phase 13.5 seven stages (§65).
- **MCP** (read-only, §72–75): validation_status, validation_results,
  wf_windows, parameter_stability. No tool can create, approve, run or
  redefine a validation.
- **No separate lab page** (§127 "if needed"): the Terminal strip + per-EA
  sections cover §128's counters without spawning thin pages (§126); the
  full window matrices live only on EA pages (§122–124 build performance).

## Testing (§147–149)

scripts/test-validation.mjs: 20 tests — unit (splits, window generation
both modes, ratios, PASS/FAIL/INCONCLUSIVE, WFE, stability classes incl.
BOUNDARY_HIT, distribution-shift and concentration warnings) + integration
through the real CLIs in an isolated store (DRAFT→approve→run→results,
tamper refusal, re-run refusal, WF end-to-end, evidence gating both
directions) + the failure battery. Forward (28), MCP (9 incl. the new
validation tools) and site build regressions all green.
