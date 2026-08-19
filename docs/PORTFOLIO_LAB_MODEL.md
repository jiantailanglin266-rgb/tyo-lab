# Portfolio Lab — computation model

What `/portfolio-lab/` computes, where its numbers come from, and the honesty
rules that bound it. Server-side math lives in `src/lib/portfolio.mjs`;
everything interactive is `public/scripts/main.js` §14, computing on monthly
series shipped inline as JSON (no fetches, no external libraries).

## Data source

`model.trades.monthly` — monthly %-returns extracted from the tester deal
lists (see `BACKTEST_LAB_ARCHITECTURE.md`). A system enters the page only
with ≥ `MIN_OVERLAP` (24) recorded months. Every pairwise statistic is
computed **only over months both systems actually traded**.

## Correlation matrix (server-rendered)

Pearson r of monthly returns per pair, over the shared months. Pairs with
fewer than 24 shared months render "—": a correlation from a handful of
months is noise wearing a number. The page states that these are
correlations of backtest months and promise nothing about the future.

## Combination builder (client-side, JS-only)

Select 2–4 systems. All arithmetic runs over the **common window** — the
months every selected system traded — and requires ≥ 12 such months.

### Weighting schemes (Phase 7A)

| Mode | Weights | Notes |
|---|---|---|
| Equal weight | `wᵢ = 1/n` | default; carries no in-sample information |
| Inverse volatility | `wᵢ ∝ 1/σᵢ` | σ = sample std-dev (n−1) of monthly returns over the common window |
| Risk parity | equal risk contribution: `wᵢ·(Σw)ᵢ = const` | damped multiplicative iteration on the sample covariance matrix (exponent 0.35, tolerance 1e-4, ≤ 500 iterations), started from IV weights |

Degradation is explicit, never silent: risk parity that fails to converge
(possible under strong negative correlation) falls back to inverse
volatility **and the page says so** (`rpFallback`); a degenerate
zero-variance series falls back to equal weight. The blend row is labelled
with the weighting actually used, and the per-system table shows each
system's weight.

**In-sample disclosure (always rendered):** IV and RP weights are computed
from the same window they are then applied to. The builder shows how a
weighting scheme shapes a blend — not a result anyone could have obtained in
advance. This note ships as `builder.weightsNote` in all 7 locales.

### Blend construction

`blendᵢ = Σₖ wₖ · rₖᵢ` per month — fixed weights, i.e. rebalanced monthly.
Stated in `builder.assumptions`.

### Metrics (blend and per-system, same window)

| Metric | Definition |
|---|---|
| Positive months | share of months > 0 |
| Mean month | arithmetic mean of monthly returns |
| Worst month | minimum monthly return |
| Volatility (annualised) | sample σ × √12 |
| Max drawdown | on **monthly closing values** of the compounded index — understates intra-month declines, and the page says so |
| Return / max DD | cumulative return ÷ max drawdown; "—" when drawdown < 0.05% (a ratio against ~zero is meaningless) |
| CAGR | `(Π(1+rᵢ/100))^(12/n) − 1`; "—" under 12 months |
| Cumulative return | compounded over the window |
| Average pairwise correlation | mean Pearson r across selected pairs |

## Honesty rules (summary)

1. The not-advice notice sits in the hero, before any number.
2. Correlations need ≥ 24 shared months; the builder needs ≥ 12 common months.
3. Weights are in-sample and the page discloses it.
4. Fallbacks (RP → IV → equal) are announced, never silent.
5. Drawdown basis (monthly closes) and its understatement are stated.
6. Nothing forecasts; every label describes the historical record only.

## Pair analytics (Phase 7B)

Rendered inside the builder for every pair of the selected systems (2–4
systems → 1–6 pairs), over the same common window as the blend.

### Rolling correlation

Trailing-window Pearson r of monthly returns, selectable window of 12 / 24 /
36 months (24 default). Drawn as an inline SVG generated client-side — one
line per pair, distinguished by colour **and** dash pattern (never colour
alone), y-axis fixed to [−1, +1] with a strong zero line. The chart renders
only when the common window yields at least 6 rolling points; otherwise the
page says "not enough shared months for this window" instead of drawing a
2-point line.

The 12-month window ships with a standing caveat (`pair.shortNote`): short
windows swing on a handful of months; 24 months is the reference view. This
keeps faith with the site-wide 24-month correlation floor — the full-window
matrix never reports below 24 shared months, and the shorter rolling view is
explicitly labelled texture, not conclusion.

### Correlation stability

Per pair, on the fixed rolling-24 series: full-window r, rolling mean,
lowest, highest. Requires ≥ 30 common months (24-month window + 6 points);
below that the rolling columns show "—". The accompanying note states the
point of the table: a full-window r is an average over regimes, and a pair
whose rolling r ranges widely is not reliably diversifying.

### Loss & drawdown overlap

Per pair, over the common window:

| Column | Definition |
|---|---|
| Joint loss months | count (and share) of months where **both** systems closed negative |
| If independent | the share expected if losses were independent: `P(A<0) × P(B<0)` |
| Both in drawdown | share of months where both sat below a prior peak of their monthly-close index (peak measured within the common window) |

Observed-vs-independent is the honest framing: it shows whether joint losses
happen more or less often than chance without collapsing that into a single
suggestive score. All flags derive from monthly closes, so intra-month joint
stress is understated — the note under the table says so, and says these are
backtest arithmetic, not a forecast of joint behaviour.
