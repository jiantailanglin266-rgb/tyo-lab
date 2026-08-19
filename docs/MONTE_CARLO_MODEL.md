# Monte Carlo Lab — computation model (Phase 8)

Pre-generated stress analysis of every published system's real deal list.
Generator: `tools/run-montecarlo.mjs` → `tools/montecarlo.json`, rendered as
block 16 on each EA detail page (`MonteCarloPanel` in
`src/components/ea-analytics.mjs`) and granting the `monteCarlo` evidence
stage (+3 points, see `TYO_SCORE_V2_MODEL.md`).

## Reproducibility

- **Seed recorded**: mulberry32 PRNG, master seed `20260820`, stored in the
  JSON. Each (system × family) stream derives from `seed ^ hash(slug)` so
  adding a system never shifts another's draws. Same seed + same reports →
  byte-identical output.
- **Same source as everything else**: the report is matched by basename to
  `extracted-trades.json`'s `source`, so the MC panel and the performance
  sections describe the same record. Deal-list parsing is shared code
  (`tools/extract-trades.mjs`, now a library with a CLI guard).
- Regenerate: `node tools/run-montecarlo.mjs <ゴゴジャン folder>`.

## Unit of resampling

Per-trade fractional return `rᵢ = profitᵢ / (balanceᵢ − profitᵢ)` — the
profit as a fraction of the balance before that close. Trades without a
usable balance are skipped; a system needs ≥ 100 usable trades to appear.

**Basis caveat (rendered on the page):** drawdowns here are measured on
trade closes. Intra-trade floating declines are invisible, exactly as with
the balance-basis drawdown elsewhere — the equity-basis numbers on MT5
reports remain the deeper risk measure.

## The three families (1,000 simulations each)

### 1. Order shuffle — path risk

Uniform re-orderings (Fisher–Yates). Because compounded return is a product
of `(1+rᵢ)`, the **final return is order-independent** — the page says so —
and the only measured quantity is the max-drawdown distribution: p50 / p90 /
p95 / p99 / worst-of-1,000, next to the observed (actual-order) drawdown.
An observed DD far above the shuffle median means the real record clustered
its losses; far below means the real order was kind.

### 2. Missed trades

Each trade independently skipped with 10% / 20% probability — the
offline-terminal / rejected-entry question. Reported: final-return p5 / p50 /
p95 and drawdown p95 per level, with the observed figures directly above.

### 3. Cost stress (deterministic)

Every trade's return reduced by a fixed cost. The unit is the system's own
median absolute per-trade return, at 10% / 25% / 50% — self-scaling across
systems whose typical trade sizes differ by orders of magnitude. This is a
**parameterised stress, not a calibrated broker model**, and the page states
that. High-frequency systems degrade fastest here by construction; that is
the honest point of the family.

## Honesty rules

1. Every simulation resamples the same historical record under stated rules;
   the standing note says none of these numbers is a forecast.
2. Absent `montecarlo.json` → the block disappears and the evidence stage
   stays pending; nothing is estimated in its place.
3. All parameters (seed, sim count, levels, cost unit) ship in the JSON and
   are printed or referenced on the page.
