# Forward / Live records — data model (Phase 9)

The infrastructure for publishing forward-test and live records, built
**before** any such record exists. Until real data lands, every EA detail
page shows the Backtest / Forward / Live tabs with honest empty states:
"No forward data available." / "No live data available." — never a
placeholder number.

## Where the data lives

`tools/forward-live.json`, filled by hand only with records that exist as
verifiable data. Loader/validator: `src/lib/forward-live.mjs`
(`validRecord`, `normalizeForwardLive`), consumed by `build.mjs`, rendered
by `TrackRecordTabs` / `RecordPanel` in `src/components/ea-analytics.mjs`.

```jsonc
{
  "updatedAt": "YYYY-MM-DD",
  "systems": {
    "<slug>": {
      "forward": { /* record */ },
      "live":    { /* record */ }
    }
  }
}
```

## Record shape

```jsonc
{
  "source": "mql5-signal",            // REQUIRED: named source
  "url": "https://…",                 // optional; https only
  "verifiedBy": "MQL5 signal tracking", // what makes it independently checkable
  "period": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }, // REQUIRED
  "monthly": [ { "ym": "YYYY-MM", "pct": 1.2 } ],  // optional series
  "metrics": {                         // optional bag
    "profitFactor": 1.5,
    "maxDrawdownPct": 3.2,
    "drawdownBasis": "equity",         // basis ALWAYS printed next to DD
    "trades": 42,
    "winRate": 88.1,
    "netGainPct": 12.4
  },
  "notes": "…"
}
```

## Validity — the load-bearing rule

A record **counts** (renders on the page and lights its evidence stage)
only when it has all three of:

1. a named `source`,
2. a stated `period` (both dates),
3. at least one number — a non-empty `monthly` series or a non-empty
   `metrics` bag.

Anything less is treated as **absent**: the tab shows the empty state and
the evidence stage stays pending. A half-filled record must never light an
evidence stage. (Verified: a source+period-only record is rejected by
`validRecord` and renders "No live data available.")

## Effect when a record lands

- The Forward or Live tab switches from the empty state to the record:
  source (linked when a URL exists), verification method, period, metrics
  (drawdown always with its basis), monthly table, notes.
- The evidence stage lights: forward +3 / live +3 (see
  `TYO_SCORE_V2_MODEL.md`). Verified end-to-end with a temporary local
  record: evidence 8/20 → 11/20, GALOA V2 75 → 78, then reverted — no test
  data was committed (§70).

## UI

`TrackRecordTabs` reuses the site-wide `data-switch` switcher (main.js §13):
role=tablist, arrow-key navigation, all panels server-rendered. The empty
state explains *why* nothing is shown (only verifiable records are
published) and *what happens* when one lands (it appears and raises the
Evidence Quality score).
