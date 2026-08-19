# Research budget model (Phase 15 §26–29, §96)

## Why (§27)

Every additional configuration tried raises the odds that one looks good by
chance. A validation that ignores how much searching happened overstates
its own meaning — so the search count is capped in advance and PUBLISHED as
evidence (research-log protocol card: "Experiments 0/30" etc.).

## Mechanics

- Budget fixed in the research manifest at creation (XAU_PYRAMID: logic
  variants ≤12, major experiments ≤30, optimization rounds ≤10, total
  parameter sets ≤5,000).
- Every run is logged through `log-research-run.mjs --type
  variant|experiment|optimization [--parameter-sets N]`; exceeding any cap
  refuses with `RESEARCH BUDGET EXCEEDED` (test-verified).
- Counters are copied into every frozen candidate (`budgetAtFreeze`), so a
  candidate permanently carries how much searching preceded it (§91 of
  Phase 14: totalCandidatesTested equivalence).
- `research-budget-status.mjs` prints consumption; the MCP `research_budget`
  tool exposes it read-only.
- Extending a budget is possible only as an explicit, visible manifest
  revision — never silently (§124: reaching the budget is a STOP signal,
  not an inconvenience).
