# BACKTEST_LAB_ARCHITECTURE

The `/​<loc>/lab/` page after Phase 3: the cross-system view over the same
evidence the EA detail pages carry.

---

## 1. Data flow

```
tools/imported-reports.json   header figures per system
tools/extracted-trades.json   deal-level statistics per system
        │
        ▼
src/lib/ea-model.mjs          one frozen model per system (shared with /ea/)
        │
        ▼
src/components/lab-analytics.mjs   aggregation + charts
        │
        ▼
src/pages/lab-index.mjs       section layout (research notes unchanged below)
```

No page-specific data source exists. Every figure on the lab is the same
model object the detail pages read, aggregated at build time. A system missing
an input drops out of that view; nothing is imputed, and a view with fewer
than two systems does not render.

## 2. Sections

| # | id | Component | Notes |
|---|---|---|---|
| 01 | overview | `LabStats` | Sums of report-stated values only |
| 02 | rankings | `Rankings` | 5 metrics; bars scaled per list |
| 03 | risk-return | `RiskReturnMap` | see §3 |
| 04 | matrix | `PerformanceMatrix` | links into `/ea/compare/` |
| 05 | equity | `Switcher` + `EquityCurve` | one panel per system |
| 06 | monthly | `Switcher` + `MonthlyHeatmap` | one panel per system |
| 07 | high-risk | `HighRiskLab` | threshold `HIGH_RISK_DD = 40` (%) |
| 08 | notes | existing article list | URLs unchanged |

Tab switchers are progressive enhancement: **every panel is server-rendered**,
so the full dataset is crawlable and, with scripting off, all panels simply
show in sequence. Tabs implement the ARIA tab pattern (roving tabindex,
arrow keys).

## 3. The risk/return map — decisions that took iteration

**Y axis is CAGR, not simple average.** Total-return-divided-by-years produced
RINA at 179%/yr on a 24-year, 35× account — technically true, guaranteed to be
misread, and two outliers compressed the other twelve systems into an
unreadable band. CAGR puts 13 of 14 inside 1–28%. The caption states the
trade-off: these are fixed-lot systems, so CAGR understates what a compounding
configuration would have produced; it is used because it is the only measure
that compares a 2-year test with a 24-year one honestly.

**Outliers are pinned, not hidden.** When the top CAGR exceeds 2.2× the
runner-up, the axis stops above the runner-up and the outlier is clamped to
the ceiling with a caret and its real figure in its label (JAYRO ▲ +108%).
Rescaled, never removed.

**Basis is visible.** Balance-basis systems (all nine MT4 reports) draw as
hollow dashed rings, because they plot further left than a like-for-like
comparison would place them. Same caveat as the compare page, made graphic.

**Bands mirror the score.** Shaded regions start at 30% and 45% drawdown —
the same thresholds where TYO SCORE caps the total — so the chart and the
score tell one story about where risk becomes decisive.

**Labels place themselves.** A slot-based placer walks points left-to-right
and tries above/below/further positions until it finds one no other label
occupies. Clamped bubbles label downward only (upward would leave the viewBox).

## 4. High Risk Lab

Listing, not hiding: systems whose reported max drawdown is ≥ 40% appear in a
red-bordered card grid with symbol, strategy, drawdown basis, worst streak,
max concurrent positions and score. Currently five systems qualify. If none
qualify the section states that explicitly rather than disappearing.

## 5. Charts

All inline SVG generated at build time. No charting library — four small
graphics do not justify one on a site whose whole argument is that it loads
fast. Wide tables scroll inside their own container (`.heat__scroll`,
`.tablewrap`, `.cmp__scroll`), never the page.
