# Phase 14 — validation audit (pre-implementation)

## What exists

- **Backtest data**: 14 systems with parsed deal lists (tools/
  extracted-trades.json) and header metrics. Deal lists re-parseable from
  the owner's tester reports (the Phase 8/13.5 loader pattern — reused).
- **Optimization history: NONE.** A full-archive sweep found zero
  optimization reports, zero .set files, zero forward reports. Parameter
  selection for every shipped EA is undocumented — this is why Phase 6 kept
  the OOS evidence stage pending, and Phase 14 keeps that stance (see
  provenance rules below).
- **MT5 Strategy Tester automation** (§37 audit): MetaEditor CLI compiles
  are proven (Phase 13.5). Headless tester runs via terminal64 /config are
  possible on the owner's machine but are not exercised by the engine in
  this phase; instead run-wf.mjs --emit-tester-configs generates per-window
  .ini files for owner-driven optimization runs (§38).
- **Reusable pieces**: computeMetrics (Phase 12) for all window metrics;
  extract-trades parser; evidence derivation chain; Terminal; MCP server.

## PoC selection (§135–136)

**SUPREMACY** — 19,246 trades (2nd-largest sample; statistically ample per
window), 75 months (2020-01 → 2026-03: rolling 24/6/6 yields 8 full test
windows ≥ the 4-window minimum), MT5 dialect with full deal list and equity
DD, MT5 source present. NEXUS scores similarly on the data but §136 forbids
defaulting to it because of Phase 13.5; choosing SUPREMACY also exercises
the engine on a second system. NEXUS remains a valid future candidate.

## Provenance decision (§85–88, §137–138)

Every existing system was developed with its full backtest period visible.
Therefore ALL Phase 14 validations on existing systems are RETROSPECTIVE
(`previouslyObserved: true`), displayed in full, and NEVER light the
evidence map or add score points. PROSPECTIVE validation becomes possible
for future versions developed under the §139–140 policy (holdout fixed at
development start).

## Validation Lab decision (§127–129)

No separate page: the Terminal gains a validation summary strip (OOS/WF
qualified, passed, failed, retrospective-unscored) under the evidence map,
and each EA detail page carries the full validation section. This avoids
thin auto-generated pages (§126) and duplication with the evidence map.
