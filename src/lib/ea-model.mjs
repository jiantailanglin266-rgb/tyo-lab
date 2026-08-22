/**
 * ============================================================================
 * EA MODEL — the single source of truth every EA template reads
 * ============================================================================
 * Merges three inputs into one frozen object per system:
 *
 *   src/data/ea.mjs              hand-written, always wins
 *   tools/imported-reports.json  tester report header
 *   tools/extracted-trades.json  tester deal list
 *
 * `null` is a first-class value here. It means "not available", renders as an
 * em dash, and is never quietly turned into 0, "N/A" or an estimate. Templates
 * must not invent fallbacks — if a branch is null the section does not render.
 *
 * See docs/EA_DATA_SCHEMA.md for the full shape.
 * ============================================================================
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { productOf, plansOf } from '../data/commercial/products.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const readJson = async (rel) => {
  try {
    return JSON.parse(await readFile(join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------------ *
 * Strategy tagging
 * Tags drive the index filter and the compare table. They are derived from
 * the strategy string the owner wrote, never guessed from trade behaviour —
 * calling something a martingale is a claim, and claims need a source.
 * ------------------------------------------------------------------ */

const TAG_RULES = [
  [/scalp/i, 'scalping'],
  [/martingale/i, 'martingale'],
  [/grid/i, 'grid'],
  [/trend|continuation/i, 'trend'],
  [/mean.?revers|range/i, 'mean-reversion'],
  [/breakout/i, 'breakout'],
];

function strategyTags(strategy) {
  const s = String(strategy || '');
  const tags = TAG_RULES.filter(([re]) => re.test(s)).map(([, t]) => t);
  return tags.length ? [...new Set(tags)] : [];
}

/* ------------------------------------------------------------------ *
 * Market bucket for the filter
 * ------------------------------------------------------------------ */

function marketOf(spec) {
  const m = String(spec.market || '');
  if (/gold/i.test(m) || /XAU|^GOLD/i.test(spec.symbol || '')) return 'gold';
  if (/crypto/i.test(m) || /BTC|ETH/i.test(spec.symbol || '')) return 'crypto';
  return 'forex';
}

/* ------------------------------------------------------------------ *
 * Risk band
 * Derived from the evidenced drawdown when the owner has not declared one.
 * Flagged with riskDerived so the page can say where it came from — an
 * inferred risk level presented as a declared one would be dishonest.
 * ------------------------------------------------------------------ */

function riskBand(declared, ddPct) {
  if (declared) return { level: declared, derived: false };
  if (ddPct === null || ddPct === undefined) return { level: null, derived: false };
  if (ddPct >= 40) return { level: 'high', derived: true };
  if (ddPct >= 20) return { level: 'medium', derived: true };
  return { level: 'low', derived: true };
}

/** Leading percentage out of "48.82% (6,681.39 USD)" → 48.82 */
export function pctOf(s) {
  const m = String(s ?? '').match(/(-?[\d.]+)\s*%/);
  return m ? Number(m[1]) : null;
}

/** "19,246" → 19246 */
export function intOf(s) {
  const m = String(s ?? '').replace(/[\s,]/g, '').match(/-?\d+/);
  return m ? Number(m[0]) : null;
}

/** "2.38" → 2.38 */
export function floatOf(s) {
  const n = Number(String(s ?? '').replace(/[\s,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------ *
 * TYO SCORE — see docs/TYO_SCORE_MODEL.md
 * Five components, 20 points each. A component whose input is missing scores
 * nothing and is recorded as missing; a system missing any component is
 * reported as "Insufficient data" rather than being given a total that looks
 * comparable to a complete one.
 * ------------------------------------------------------------------ */

/** Map a value onto 0..20 through a piecewise-linear ladder of [input, points]. */
function ladder(value, points) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (value <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (value <= x1) return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0);
  }
  return points[points.length - 1][1];
}

function computeScore(model) {
  const b = model.backtest;
  const t = model.trades;

  const pf = floatOf(b.profitFactor);
  const dd = pctOf(b.maxDrawdown);
  const trades = intOf(b.totalTrades);
  const years = t?.yearly?.length ?? null;
  const monthly = t?.monthly ?? [];

  /* 1. Profitability — profit factor. 1.0 is break-even before costs. */
  const profitability = ladder(pf, [
    [1.0, 0],
    [1.3, 8],
    [1.8, 14],
    [2.5, 18],
    [4.0, 20],
  ]);

  /* 2. Drawdown control — lower is better, so the ladder runs downward. */
  const drawdownControl = ladder(dd, [
    [5, 20],
    [15, 16],
    [25, 12],
    [40, 6],
    [60, 2],
    [80, 0],
  ]);

  /* 3. Consistency — share of months in profit, scaled down by how bad the
        worst month was.

        The share alone is misleading here: a grid or martingale system wins
        almost every month by construction and then gives it all back in one.
        Several of these systems post 90%+ positive months, so rewarding the
        share on its own would rank the riskiest builds highest. Multiplying by
        a worst-month factor is what stops that. */
  let consistency = null;
  let worstMonth = null;
  if (monthly.length >= 12) {
    const rated = monthly.filter((m) => m.pct !== null);
    if (rated.length >= 12) {
      const positive = rated.filter((m) => m.pct > 0).length / rated.length;
      const base = ladder(positive * 100, [
        [40, 0],
        [55, 8],
        [70, 14],
        [85, 18],
        [95, 20],
      ]);
      worstMonth = Math.min(...rated.map((m) => m.pct));
      // −10% month → ×0.9, −30% → ×0.7, −50% or worse → ×0.5
      const factor = Math.max(0.5, 1 - Math.abs(Math.min(0, worstMonth)) / 100);
      consistency = base * factor;
    }
  }

  /* 4. Sample size — trade count. Thousands of trades is a different claim
        from dozens, whatever the equity curve looks like. */
  const sampleSize = ladder(trades, [
    [100, 0],
    [500, 8],
    [1500, 13],
    [5000, 17],
    [15000, 20],
  ]);

  /* 5. Robustness — years of history covered. A 24-year test has seen regimes
        a 2-year test has not. */
  const robustness = ladder(years, [
    [1, 0],
    [3, 7],
    [6, 12],
    [12, 17],
    [20, 20],
  ]);

  const parts = { profitability, drawdownControl, consistency, sampleSize, robustness };
  const missing = Object.entries(parts)
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  if (missing.length) {
    return { total: null, band: 'insufficient-data', parts, missing, reasons: [], cap: null };
  }

  const raw = Object.values(parts).reduce((a, b2) => a + b2, 0);

  /* Drawdown cap.
     Without it a system can offset a catastrophic drawdown with profit factor
     and trade count and still land mid-table — which is exactly the failure
     mode this score exists to prevent. No amount of profitability compensates
     for halving the account, so a hard ceiling is applied on top of the
     weighted sum. The cap is always disclosed on the page. */
  let cap = null;
  if (dd !== null) {
    if (dd >= 60) cap = 40;
    else if (dd >= 45) cap = 55;
    else if (dd >= 30) cap = 70;
  }

  const total = Math.round(cap === null ? raw : Math.min(raw, cap));
  const band = total >= 80 ? 'high' : total >= 65 ? 'mid' : total >= 45 ? 'low' : 'weak';

  const reasons = [];
  if (cap !== null && raw > cap) reasons.push({ key: 'ddCap', dd, cap });
  if (worstMonth !== null && worstMonth <= -20) reasons.push({ key: 'worstMonth', value: worstMonth });
  if (years !== null && years < 3) reasons.push({ key: 'shortHistory', value: years });
  if (trades !== null && trades < 500) reasons.push({ key: 'smallSample', value: trades });

  return {
    total,
    band,
    raw: Math.round(raw),
    cap,
    worstMonth: worstMonth === null ? null : Math.round(worstMonth * 10) / 10,
    parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round(v * 10) / 10])),
    missing: [],
    reasons,
  };
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

/**
 * @param {object[]} entries  published rows from src/data/ea.mjs
 * @returns {Promise<object[]>} frozen models, in catalogue order
 */
export async function buildEAModels(entries) {
  const reports = (await readJson('tools/imported-reports.json')) || {};
  const traded = (await readJson('tools/extracted-trades.json')) || {};

  return entries.map((e) => {
    const rep = reports[e.slug] || null;
    const tr = traded[e.slug] || null;

    /* Hand-written wins; the report only fills gaps. */
    const spec = {
      ...e.spec,
      symbol: e.spec.symbol || rep?.symbol || null,
      timeframe: e.spec.timeframe || rep?.timeframe || null,
    };

    const backtest = e.backtests?.[0]
      ? { ...e.backtests[0] }
      : rep?.backtest
        ? { ...rep.backtest, curve: rep.curve || null }
        : null;

    const ddPct = backtest ? pctOf(backtest.maxDrawdown) : null;
    const risk = riskBand(e.spec.risk, ddPct);

    const model = {
      slug: e.slug,
      name: e.name,
      number: e.number,
      status: e.status,
      researchStatus: e.researchStatus || 'live',
      placeholder: !!e.placeholder,
      mql5Url: e.mql5Url || '',

      /* Phase 16: commercial status lives in its own layer and is never
         blended with researchStatus (§74). `plans` is the display matrix. */
      commercial: (() => {
        const prod = productOf(e.slug);
        return {
          status: prod ? prod.status : 'DRAFT',
          plans: plansOf(prod),
          access: prod ? prod.access : { ib: false, pro: false, private: false, directPurchase: false },
          latestVersion: prod?.latestVersion || '',
          countryAvailability: prod ? prod.countryAvailability : null,
        };
      })(),

      spec: {
        ...spec,
        risk: risk.level,
        riskDerived: risk.derived,
        marketKey: marketOf(spec),
        strategyTags: e.spec.strategyTags?.length ? e.spec.strategyTags : strategyTags(spec.strategy),
      },

      media: {
        cover: e.image || null,
        curveImage: backtest?.curve || null,
        video: e.video && e.video.type ? e.video : null,
      },

      backtest: backtest || {
        period: null,
        initialDeposit: null,
        netProfit: null,
        maxDrawdown: null,
        profitFactor: null,
        totalTrades: null,
        winRate: null,
        recoveryFactor: null,
        expectedPayoff: null,
        sharpe: null,
        conditions: {},
      },

      trades: tr || null,

      parameters: (e.parameters?.length ? e.parameters : rep?.parameters || []).map((p) => ({
        name: p.name,
        default: p.default,
        descKey: p.descKey || null,
        riskImpact: p.riskImpact || null,
      })),

      riskCharacteristics: {
        martingale: null,
        grid: null,
        averaging: null,
        positionScaling: null,
        stopLoss: null,
        maxPositions: null,
        ...(e.riskCharacteristics || {}),
      },

      versions: e.versions || [],
      timeline: e.timeline || [],
      i18n: e.i18n || { en: {} },
    };

    model.score = computeScore(model);

    /* Numeric mirrors so sorting, filtering and comparison never re-parse
       formatted strings in a template. */
    model.num = {
      profitFactor: floatOf(model.backtest.profitFactor),
      maxDrawdownPct: ddPct,
      trades: intOf(model.backtest.totalTrades),
      winRate: pctOf(model.backtest.winRate),
      sharpe: floatOf(model.backtest.sharpe),
      recoveryFactor: floatOf(model.backtest.recoveryFactor),
      years: tr?.yearly?.length ?? null,
      score: model.score.total,
    };

    return Object.freeze(model);
  });
}
