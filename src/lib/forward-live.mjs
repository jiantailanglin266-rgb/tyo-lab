/**
 * ============================================================================
 * FORWARD / LIVE RECORDS — data model and validation (Phase 9)
 * ============================================================================
 * Source of truth: tools/forward-live.json, filled by hand ONLY with records
 * that exist as verifiable data (a public signal page, an investor-access
 * statement, a broker report). The site never estimates a forward or live
 * figure; an absent or invalid record renders the honest empty state and the
 * corresponding evidence stage stays pending.
 *
 * Record shape (docs/FORWARD_LIVE_DATA_MODEL.md):
 *   {
 *     source:     'mql5-signal' | 'myfxbook' | 'investor-access' | 'broker-report' | string,
 *     url:        'https://…' | null,          // public link when one exists
 *     verifiedBy: 'MQL5 signal tracking' | …,  // who/what makes it checkable
 *     period:     { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' },
 *     monthly:    [{ ym: 'YYYY-MM', pct: number|null }, …]   // optional
 *     metrics:    { profitFactor, maxDrawdownPct, drawdownBasis,
 *                   trades, winRate, netGainPct, … }         // optional
 *     notes:      string | null,
 *   }
 *
 * VALIDITY = a record counts (renders, and lights its evidence stage) only
 * when it names a source, states a period, and carries at least one number
 * (a monthly series or a metrics bag). Anything less is treated as absent —
 * a half-filled record must not light an evidence stage.
 * ============================================================================
 */

const isYmd = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isYm = (s) => typeof s === 'string' && /^\d{4}-\d{2}$/.test(s);

/** Validate one forward/live record; returns the record or null. */
export function validRecord(rec) {
  if (!rec || typeof rec !== 'object') return null;
  if (typeof rec.source !== 'string' || !rec.source.trim()) return null;
  if (!rec.period || !isYmd(rec.period.from) || !isYmd(rec.period.to)) return null;

  const monthly = Array.isArray(rec.monthly)
    ? rec.monthly.filter((m) => isYm(m?.ym) && (m.pct === null || Number.isFinite(m.pct)))
    : [];
  const metricCount = rec.metrics && typeof rec.metrics === 'object'
    ? Object.values(rec.metrics).filter((v) => v !== null && v !== undefined && v !== '').length
    : 0;

  if (!monthly.length && !metricCount) return null;

  return {
    source: rec.source.trim(),
    url: typeof rec.url === 'string' && /^https:\/\//.test(rec.url) ? rec.url : null,
    verifiedBy: typeof rec.verifiedBy === 'string' && rec.verifiedBy.trim() ? rec.verifiedBy.trim() : null,
    period: { from: rec.period.from, to: rec.period.to },
    monthly,
    metrics: metricCount ? rec.metrics : null,
    notes: typeof rec.notes === 'string' && rec.notes.trim() ? rec.notes.trim() : null,
  };
}

/** Parsed tools/forward-live.json → { slug: { forward, live } } (valid only). */
export function normalizeForwardLive(json) {
  const out = {};
  for (const [slug, rec] of Object.entries(json?.systems || {})) {
    out[slug] = {
      forward: validRecord(rec?.forward),
      live: validRecord(rec?.live),
    };
  }
  return out;
}
