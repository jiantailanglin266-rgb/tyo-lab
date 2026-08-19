/**
 * ============================================================================
 * PORTFOLIO MATH — correlation and exposure over the extracted monthly series
 * ============================================================================
 * Everything here is arithmetic over `model.trades.monthly`, which came from
 * the tester deal lists. Two honesty rules govern it:
 *
 *   1. A pair is only correlated over months BOTH systems actually traded,
 *      and only when that overlap is at least MIN_OVERLAP months. A
 *      correlation from a handful of shared months is noise wearing a number,
 *      so it renders as "—" instead.
 *
 *   2. Nothing here forecasts. Correlation of backtest months describes how
 *      two test records moved together historically — the page says exactly
 *      that and no more.
 * ============================================================================
 */

/** Fewer shared months than this → no correlation is reported. */
export const MIN_OVERLAP = 24;

/** model → Map(ym → pct), skipping null months. */
function seriesOf(model) {
  const map = new Map();
  for (const m of model.trades?.monthly || []) {
    if (m.pct !== null && m.pct !== undefined) map.set(m.ym, m.pct);
  }
  return map;
}

/** Pearson correlation over the shared months of two series. */
function pearson(a, b) {
  const keys = [...a.keys()].filter((k) => b.has(k));
  const n = keys.length;
  if (n < MIN_OVERLAP) return { r: null, n };

  let sa = 0;
  let sb = 0;
  for (const k of keys) {
    sa += a.get(k);
    sb += b.get(k);
  }
  const ma = sa / n;
  const mb = sb / n;

  let cov = 0;
  let va = 0;
  let vb = 0;
  for (const k of keys) {
    const da = a.get(k) - ma;
    const db = b.get(k) - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  if (va === 0 || vb === 0) return { r: null, n };
  return { r: cov / Math.sqrt(va * vb), n };
}

/**
 * Full pairwise matrix for the given models.
 * @returns {{ slugs: string[], names: string[], cells: Array<Array<{r:number|null,n:number}>> }}
 */
export function correlationMatrix(models) {
  const usable = models.filter((m) => (m.trades?.monthly?.length || 0) >= MIN_OVERLAP);
  const series = usable.map(seriesOf);
  const cells = usable.map((_, i) =>
    usable.map((_, j) => {
      if (i === j) return { r: 1, n: series[i].size };
      return pearson(series[i], series[j]);
    })
  );
  return { slugs: usable.map((m) => m.slug), names: usable.map((m) => m.name), cells };
}

/**
 * Compact per-system monthly data for the client-side builder:
 * { slug: { name, m: [[ym, pct], ...] } } — only what the browser needs.
 */
export function builderData(models) {
  const out = {};
  for (const m of models) {
    const rows = (m.trades?.monthly || []).filter((x) => x.pct !== null && x.pct !== undefined);
    if (rows.length < MIN_OVERLAP) continue;
    out[m.slug] = {
      name: m.name,
      symbol: m.spec.symbol,
      m: rows.map((x) => [x.ym, x.pct]),
    };
  }
  return out;
}

/** Share of models per bucket, for the exposure bars. */
export function exposure(models, pick) {
  const counts = new Map();
  for (const m of models) {
    for (const key of pick(m)) counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = models.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => ({ key, n, pct: Math.round((n / total) * 1000) / 10 }));
}
