# Experiment data model

One shape for every entry in the Research Log, whatever its class. Consumed
by `src/pages/research-index.mjs`, `src/pages/research-detail.mjs` and the
evidence layer (`src/lib/evidence.mjs`). Produced by `src/data/experiments.mjs`
(curated) and `tools/run-experiments.mjs` (reconstructed + generated).

## The record

```js
{
  experimentId: 'EXP-000001',   // unique, EXP- + 6 digits. Ranges:
                                //   000001–000099 curated (hand-written)
                                //   000101–000199 reconstructed (report pairs)
                                //   000201–000299 generated (split-stability)
  strategyId: 'galoa' | null,   // EA slug, or null = platform/methodology-wide
  title: '…',                   // one line, plain language
  category: 'methodology' | 'data-integrity' | 'scoring'
          | 'stability' | 'version' | 'dataset' | 'platform',
  status: 'IDEA' | 'RESEARCHING' | 'BACKTESTING' | 'VALIDATING'
        | 'ACCEPTED' | 'REJECTED' | 'INCONCLUSIVE' | 'ARCHIVED',
  source: 'human' | 'hybrid' | 'ai',   // who did the research
  metadataAvailable: true | false,     // false → reconstructed banner, noindex
  createdAt: '2026-08-19' | null,      // ISO date; null renders "Date not recorded"

  hypothesis: '…' | null,       // null renders "Not recorded" (italic, muted)
  changeSummary: '…' | null,
  dataset: '…' | null,

  metricsBefore: <metrics> | null,
  metricsAfter:  <metrics> | null,
  diff: {                       // computed ONLY when comparable && same DD basis
    profitFactor, maxDrawdownPct, trades, winRate,
    positiveShare, meanMonthly, worstMonth   // any subset; signed numbers
  } | null,
  comparable: true | false,     // false → "not a controlled comparison" warning

  ai: {                         // present on AI-touched entries (Phase 10)
    model: 'Claude (Anthropic)',
    role: '…',                  // what AI did on THIS entry, concretely
    humanReviewed: true,        // publish gate: AI-sourced entries without
  } | null,                     // this flag are withheld from the build

  decision: <status> | null,    // mirrors status for finished entries
  reason: '…' | null,           // the "why"; null renders "Not recorded"
  gitCommit: '5fb90db' | 'phase-6' | null,  // 'phase-6' placeholder is not rendered
  files: ['report.htm', …] | undefined,     // surviving source reports
  notes: '…' | null,
}
```

### `<metrics>` — two accepted forms

**Metric bag** (reconstructed / generated). All fields optional; missing keys
are simply not rendered (never zero-filled):

```js
{ period, from, to, symbol, months, profitFactor,
  maxDrawdownPct, drawdownBasis,        // basis is ALWAYS printed next to DD
  trades, winRate, positiveShare, meanMonthly, worstMonth }
```

**Note/value pair** (curated) — for research whose "metrics" are a single
checkable fact:

```js
{ note: 'SUPREMACY drawdown on equity basis, same report', value: '48.82%' }
```

## Invariants

1. **Null is null.** A missing value renders as "Not recorded" / is omitted.
   It is never estimated, interpolated or defaulted.
2. **No fabricated narrative.** `metadataAvailable: false` means hypothesis,
   decision and reason are `null` and the page opens with the
   "Historical experiment metadata unavailable" banner.
3. **Diffs only between like measurements.** `diff` exists only when
   `comparable: true` and both runs state the same drawdown basis.
4. **Every number is checkable** against this repository: a git commit, a
   tester report in `tools/alt-reports.json`, or `tools/experiments-generated.json`.
5. **Ids never change.** They appear in URLs (`/research/exp-000001/`) and in
   external links.
6. **Statuses render as icon + text**, never colour alone:
   ◇ idea · ◐ researching · ▶ backtesting · ◈ validating · ✓ accepted ·
   ✕ rejected · ≈ inconclusive · ▤ archived.

## Loading

`loadExperiments()` (src/data/experiments.mjs) merges curated entries with
`tools/experiments-generated.json`, gives generated entries the `'phase-6'`
commit placeholder, and sorts newest-first with undated entries last.
`experimentStats()` returns `{ total, accepted, rejected, inconclusive,
archived, strategies }` for the index hero.
