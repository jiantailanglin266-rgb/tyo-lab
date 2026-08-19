# AI research pipeline — integration and safety states (Phase 10)

How AI-assisted research enters the public record, what every entry must
disclose, and the safety gate that keeps unreviewed AI output off the site.

## What is true (and checkable)

The research in this repository was performed with AI assistance — Claude
(Anthropic) reading tester reports, drafting analysis code, and producing
counter-analyses — with a human deciding what ships. That claim is checkable
against the repository's own commits and against the research log, so it may
be stated as Live on `/ai-lab/`. Nothing beyond that is claimed: AI does not
predict markets, and no entry says otherwise.

## Provenance on every experiment

Every research-log entry carries `source: 'human' | 'hybrid' | 'ai'`, and
AI-touched entries additionally carry:

```js
ai: {
  model: 'Claude (Anthropic)',   // which model
  role: '…',                     // specifically what AI did on THIS entry
  humanReviewed: true,           // the gate flag — see below
}
```

The `role` text is per-entry and concrete ("drafted the worst-month factor;
thresholds approved by a human"), not boilerplate. Rendered on each detail
page as the "AI involvement" block, with the review state shown as
✓ "Reviewed and approved by a human", plus the standing safety note.

Current provenance (rendered live on `/ai-lab/` §05 from the same data the
log renders): 26 experiments — 20 hybrid, 6 human, 0 fully-AI.

## The safety gate (load-bearing)

`loadExperiments()` in `src/data/experiments.mjs` filters the publish list:

> An entry whose research came from AI (`source` 'ai' or 'hybrid') is
> publishable **only** when `ai.humanReviewed === true`. Anything else is
> withheld from the build entirely — it never renders, not even as
> "pending" — and the build logs a warning naming the withheld id.

Two hardening details, both verified by injection test:

1. The split-stability default provenance applies **only** to genuine
   EXP-0002xx / category `stability` entries, so an arbitrary entry added to
   the generated file cannot inherit a reviewed flag and slip past the gate.
2. A test entry (`source: 'ai'`, no review flag) was injected locally: the
   gate withheld it (published count stayed 26, warning emitted), and the
   test data was removed before commit (§70).

## Source filtering

The research log index filters by source (Human / Hybrid / AI chips) in
addition to status, category and system; every card shows its source label.
The filter is the standard progressive enhancement — all entries remain in
the HTML with `data-source` attributes.

## Adding a future AI-driven experiment

1. Author the entry (any class) with `source: 'ai'` or `'hybrid'` and a
   truthful `ai.role`.
2. Leave `ai.humanReviewed` absent or false while it is unreviewed — the
   build withholds it automatically.
3. After human review, set `humanReviewed: true`. It publishes on the next
   build with its provenance displayed.
