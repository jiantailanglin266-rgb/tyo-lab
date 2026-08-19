# Research Log — architecture

How `/research/` is built, what qualifies as an entry, and where every byte of
its data comes from. Companion documents: `EXPERIMENT_DATA_MODEL.md` (the
record shape) and `TYO_SCORE_V2_MODEL.md` (how evidence feeds the score).

## What the Research Log is

A public record of experiments: hypotheses, controlled changes, results and
decisions — including rejected ones. The discipline statement on the page is
the admission rule:

> Observation → Hypothesis → Controlled change → Backtest → Validation →
> Decision. "Change parameters until it looks better" is not an experiment
> and is not recorded here.

The page also carries a standing multiple-testing warning ("Backtest
improvement does not imply future improvement…") because a log of experiments
is exactly where survivorship and selection effects would otherwise hide.

## Three classes of entry — and why

Fabricating a plausible-looking research history was ruled out (§70 of the
project brief: fictional experiments never ship as production data). The log
therefore contains only three classes, each honest about what it is:

| Class | IDs | Count | What it is |
|---|---|---|---|
| **Curated** | EXP-000001–000006 | 6 | Platform/methodology research performed while building this site, each tied to a real git commit in this repository. Hypothesis, decision and reasoning are first-hand and complete. |
| **Reconstructed** | EXP-000101–000106 | 6 | Pairs of surviving tester reports from the owner's archive (alternate builds, datasets, windows). `metadataAvailable: false`; hypothesis and decision are `null` and render as "Not recorded" behind a banner stating that the metadata is honestly absent. |
| **Generated (split-stability)** | EXP-000201–000214 | 14 | A fresh, reproducible 70/30 chronological split of each system's monthly series, run by `tools/run-experiments.mjs` with the decision rule declared in the script header *before* the runs. Not OOS (see below). |

Reconstructed entries whose two runs differ in period, platform or drawdown
basis carry `comparable: false` and render a "not a controlled comparison"
warning instead of a diff.

**Split-stability is not out-of-sample.** The optimisation window of the
historical builds is undocumented, so no held-out period can be proven. The
split entries measure whether monthly behaviour is stable across the split,
nothing more — and they deliberately do not light the OOS evidence stage.

## Data flow

```
tools/scan-alt-reports.mjs      parses every surviving tester report per EA
  └→ tools/alt-reports.json     (dedup by content key)

tools/run-experiments.mjs       Class B (reconstructed pairs) + Class C (splits)
  └→ tools/experiments-generated.json

src/data/experiments.mjs        Class A (curated, hand-written, git-linked)
  └→ loadExperiments()          merges all three, sorts newest-first
  └→ experimentStats()          totals for the index hero

build.mjs
  ├→ evidenceOf(model, experiments)   six-stage checklist per EA
  ├→ scoreV2(model, evidence)         TYO SCORE 2.0
  ├→ /research/                       index (all entries, filterable)
  └→ /research/exp-XXXXXX/            one page per entry × 7 locales
```

Regenerating: `node tools/scan-alt-reports.mjs && node tools/run-experiments.mjs && npm run release`.

## Rendering rules

- **Server-rendered everything.** All 26 entries are in the index HTML. The
  filter toolbar (status / category / system / sort) is progressive
  enhancement in `public/scripts/main.js` §15 — it only toggles `hidden` and
  reorders existing nodes. No JS → full log, newest first, no dead controls.
- **Status is icon + text + colour**, never colour alone (`ExpStatus` in
  `src/components/research.mjs`).
- **Null renders as "Not recorded"** in italic muted type — absence is
  displayed, never papered over with an invented value.
- **Undated entries sink** in both date sort orders: an unknown date is not
  the newest and not the oldest.
- **Drawdown figures always carry their basis** (`(balance)` / `(equity)`);
  the two are never diffed against each other.

## SEO / indexing

The index (`/research/`) is in the sitemap at priority 0.7. Detail pages are
0.4. Reconstructed entries (`metadataAvailable: false`) are `noindex` and
excluded from the sitemap — they are thin by design (§64: don't mass-index
thin pages) but stay linked and crawlable from the log.

Navigation: `research` is a `headerHidden` nav item (§65) — reachable from
the fullscreen menu and the footer; the header bar stays at capacity.

## Adding a real experiment later

1. Append an object to `EXPERIMENTS` in `src/data/experiments.mjs` following
   `EXPERIMENT_DATA_MODEL.md`. Use the next free `EXP-0000XX` id.
2. Fill hypothesis / change / dataset / decision honestly; link the commit.
3. `npm run release`. The index, stats, EA-detail timeline and sitemap update
   themselves.
