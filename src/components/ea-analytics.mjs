/**
 * ============================================================================
 * EA ANALYTICS — evidence-driven sections of the detail page
 * ============================================================================
 * Every component here renders from `model.trades`, which is derived from the
 * tester deal list. If the branch it needs is missing, the component returns
 * an empty string and the section disappears — no placeholder, no zero, no
 * estimate.
 *
 * Charts are hand-built inline SVG. The performance brief rules out adding a
 * charting library for four small graphics, and SVG scales, prints, and reads
 * to assistive tech without a canvas fallback.
 * ============================================================================
 */

import { html, raw, when } from '../lib/html.mjs';

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

const DASH = '—';
const has = (v) => v !== null && v !== undefined && v !== '';
const show = (v) => (has(v) ? v : DASH);

/** Signed percentage, e.g. 3.4 → "+3.4%" */
const sPct = (n, digits = 1) =>
  !has(n) ? DASH : `${n > 0 ? '+' : ''}${Number(n).toFixed(digits)}%`;

const num = (n) => (!has(n) ? DASH : Number(n).toLocaleString('en-US'));

/**
 * Colour ramp for gains and losses.
 * Green and red are read by ~8% of men as the same hue, so magnitude is
 * carried by opacity as well and every cell states its own value in the
 * title attribute.
 */
function heatColor(pct, scale) {
  if (!has(pct)) return 'transparent';
  const t = Math.min(1, Math.abs(pct) / scale);
  const a = (0.1 + t * 0.8).toFixed(3);
  return pct >= 0 ? `rgba(50,215,75,${a})` : `rgba(255,59,48,${a})`;
}

/* ------------------------------------------------------------------ *
 * TYO SCORE
 * ------------------------------------------------------------------ */

export function ScoreCard({ model, t, compact = false }) {
  const s = model.score;
  const L = t.ea.score;

  if (s.total === null) {
    return html`
      <div class="score score--pending${raw(compact ? ' score--compact' : '')}">
        <p class="score__label">${L.title}</p>
        <p class="score__pending">${L.insufficient}</p>
        ${when(
          !compact && s.missing?.length,
          () => html`<p class="score__missing">${s.missing.map((k) => L.parts[k] || k).join(' · ')}</p>`
        )}
      </div>
    `;
  }

  /* V2 layout: the five performance components are worth 16 each and
     Evidence Quality carries the remaining 20 — the bar scale states each
     component's own maximum so a full bar always means "maxed". */
  const parts = [
    ['profitability', s.parts.profitability, 16],
    ['drawdownControl', s.parts.drawdownControl, 16],
    ['consistency', s.parts.consistency, 16],
    ['sampleSize', s.parts.sampleSize, 16],
    ['robustness', s.parts.robustness, 16],
    ...(has(s.parts.evidenceQuality) ? [['evidenceQuality', s.parts.evidenceQuality, 20]] : []),
  ];

  return html`
    <div class="score score--${raw(s.band)}${raw(compact ? ' score--compact' : '')}">
      <div class="score__head">
        <p class="score__label">${L.title}</p>
        <p class="score__value"><span>${s.total}</span><i>/100</i></p>
        <p class="score__band">${L.bands[s.band]}</p>
      </div>
      ${when(
        !compact,
        () => html`
          <ul class="score__parts">
            ${parts.map(
              ([k, v, max]) => html`<li>
                <span class="score__part-k">${L.parts[k]}</span>
                <span class="score__bar" aria-hidden="true"><i style="--v:${(v / max) * 100}%"></i></span>
                <span class="score__part-v">${v}<i>/${max}</i></span>
              </li>`
            )}
          </ul>
          ${when(
            s.cap !== null && s.raw > s.cap,
            () => html`<p class="score__cap">${raw(L.capped.replace('{raw}', s.raw).replace('{cap}', s.cap).replace('{dd}', s.reasons.find((r) => r.key === 'ddCap')?.dd ?? ''))}</p>`
          )}
          <p class="score__note">${L.note}</p>
        `
      )}
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Performance snapshot — the six headline metrics
 * ------------------------------------------------------------------ */

export function PerformanceSnapshot({ model, t }) {
  const b = model.backtest;
  const m = t.ea.metrics;
  const cells = [
    [m.profitFactor, b.profitFactor],
    [m.maxDrawdown, b.maxDrawdown],
    [m.totalTrades, b.totalTrades],
    [m.winRate, b.winRate],
    [m.sharpe, b.sharpe],
    [m.expectedPayoff, b.expectedPayoff],
  ];
  if (!cells.some(([, v]) => has(v))) return '';

  return html`
    <ul class="snap" data-reveal>
      ${cells.map(
        ([k, v], i) => html`<li style="--d:${i % 3}">
          <span class="snap__k">${k}</span>
          <span class="snap__v${raw(has(v) ? '' : ' is-empty')}">${show(v)}</span>
        </li>`
      )}
    </ul>
    ${when(
      has(b.sharpe),
      () => html`<p class="fineline">${t.ea.metrics.sharpeNote}</p>`
    )}
  `;
}

/* ------------------------------------------------------------------ *
 * Equity curve — inline SVG from the balance series
 * ------------------------------------------------------------------ */

export function EquityCurve({ model, t }) {
  const c = model.trades?.curve;
  if (!c || c.length < 8) return '';

  const W = 1000;
  const H = 260;
  const PAD = 6;

  const xs = c.map((p) => p[0]);
  const ys = c.map((p) => p[1]);
  const x0 = xs[0];
  const x1 = xs[xs.length - 1];
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const spanX = x1 - x0 || 1;
  const spanY = yMax - yMin || 1;

  const px = (x) => PAD + ((x - x0) / spanX) * (W - PAD * 2);
  const py = (y) => H - PAD - ((y - yMin) / spanY) * (H - PAD * 2);

  const line = c.map((p, i) => `${i ? 'L' : 'M'}${px(p[0]).toFixed(1)} ${py(p[1]).toFixed(1)}`).join(' ');
  const area = `${line} L${px(x1).toFixed(1)} ${H - PAD} L${px(x0).toFixed(1)} ${H - PAD} Z`;

  /* Running peak, so the drawdown troughs are visible against it. */
  let peak = -Infinity;
  const peakPath = c
    .map((p, i) => {
      peak = Math.max(peak, p[1]);
      return `${i ? 'L' : 'M'}${px(p[0]).toFixed(1)} ${py(peak).toFixed(1)}`;
    })
    .join(' ');

  const yr = (ts) => new Date(ts * 1000).getUTCFullYear();
  const period = `${yr(x0)}–${yr(x1)}`;

  return html`
    <figure class="chart" data-reveal>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img"
           aria-label="${t.ea.charts.equityAria.replace('{period}', period)}">
        <defs>
          <linearGradient id="eqf-${raw(model.slug)}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#40e0d0" stop-opacity=".28" />
            <stop offset="100%" stop-color="#40e0d0" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="eql-${raw(model.slug)}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0a84ff" />
            <stop offset="55%" stop-color="#40e0d0" />
            <stop offset="100%" stop-color="#bf5af2" />
          </linearGradient>
        </defs>
        <path d="${raw(area)}" fill="url(#eqf-${raw(model.slug)})" />
        <path d="${raw(peakPath)}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"
              vector-effect="non-scaling-stroke" stroke-dasharray="3 4" />
        <path d="${raw(line)}" fill="none" stroke="url(#eql-${raw(model.slug)})" stroke-width="1.6"
              vector-effect="non-scaling-stroke" stroke-linejoin="round" />
      </svg>
      <figcaption>
        <span>${t.ea.charts.equityCaption}</span>
        <span class="chart__range">${period}</span>
      </figcaption>
    </figure>
  `;
}

/* ------------------------------------------------------------------ *
 * Drawdown analysis
 * ------------------------------------------------------------------ */

export function DrawdownAnalysis({ model, t }) {
  const d = model.trades?.drawdown;
  const b = model.backtest;
  const L = t.ea.drawdown;
  if (!d && !has(b.maxDrawdown)) return '';

  /* The basis lives on `conditions`, not on the backtest root — reading it
     from the wrong level silently dropped the label and, worse, suppressed
     the balance-basis caveat below. */
  const basis = b.conditions?.drawdownBasis || null;
  const rows = [
    [L.reported, b.maxDrawdown, basis ? t.ea.metrics[`ddBasis_${basis}`] : null],
    [L.closedBasis, has(d?.maxPct) ? `${d.maxPct}%` : null, null],
    [L.worstWindow, d?.worstFrom && d?.worstTo ? `${d.worstFrom} → ${d.worstTo}` : null, null],
    [L.recovered, d?.recovered || null, has(d?.recoveryDays) ? L.days.replace('{n}', d.recoveryDays) : null],
    [L.maxLossStreak, has(model.trades?.streaks?.maxLosses) ? num(model.trades.streaks.maxLosses) : null, null],
  ].filter(([, v]) => has(v));

  if (!rows.length) return '';

  return html`
    <dl class="kvlist" data-reveal>
      ${rows.map(
        ([k, v, note]) => html`<div class="kvlist__row">
          <dt>${k}</dt>
          <dd>${v}${when(note, () => html`<span class="kvlist__note">${note}</span>`)}</dd>
        </div>`
      )}
    </dl>
    ${when(basis === 'balance', () => html`<p class="warn warn--sm">${L.balanceCaveat}</p>`)}
  `;
}

/* ------------------------------------------------------------------ *
 * Monthly heatmap
 * ------------------------------------------------------------------ */

export function MonthlyHeatmap({ model, t }) {
  const monthly = model.trades?.monthly;
  if (!monthly || monthly.length < 6) return '';

  const byYear = new Map();
  for (const m of monthly) {
    const [y, mm] = m.ym.split('-');
    if (!byYear.has(y)) byYear.set(y, new Array(12).fill(null));
    byYear.get(y)[Number(mm) - 1] = m.pct;
  }

  const rated = monthly.filter((m) => has(m.pct)).map((m) => Math.abs(m.pct));
  /* Scale to the 90th percentile so one outlier month does not flatten the
     entire grid into a single shade. */
  rated.sort((a, b) => a - b);
  const scale = Math.max(2, rated[Math.floor(rated.length * 0.9)] || 10);

  const years = [...byYear.keys()].sort();
  const MONTHS = t.ea.charts.months;

  return html`
    <div class="heat" data-reveal>
      <div class="heat__scroll">
        <table class="heat__table">
          <caption class="sr">${t.ea.charts.heatAria}</caption>
          <thead>
            <tr>
              <th scope="col">${t.ea.charts.year}</th>
              ${MONTHS.map((m) => html`<th scope="col">${m}</th>`)}
              <th scope="col" class="heat__sum">${t.ea.charts.yearTotal}</th>
            </tr>
          </thead>
          <tbody>
            ${years.map((y) => {
              const row = byYear.get(y);
              const yearRow = model.trades.yearly.find((v) => v.year === y);
              return html`<tr>
                <th scope="row">${y}</th>
                ${row.map((v, i) =>
                  has(v)
                    ? html`<td style="--c:${heatColor(v, scale)}" title="${y}-${String(i + 1).padStart(2, '0')} ${sPct(v)}">
                        <span>${v.toFixed(0)}</span>
                      </td>`
                    : html`<td class="is-empty"><span aria-hidden="true">·</span><span class="sr">${t.ui.notPublished}</span></td>`
                )}
                <td class="heat__sum">${has(yearRow?.pct) ? sPct(yearRow.pct, 0) : DASH}</td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
      <p class="heat__legend">${t.ea.charts.heatLegend}</p>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Yearly performance
 * ------------------------------------------------------------------ */

export function YearlyTable({ model, t }) {
  const yearly = model.trades?.yearly;
  if (!yearly || yearly.length < 2) return '';
  const L = t.ea.charts;

  return html`
    <div class="tablewrap" data-reveal>
      <table class="dtable">
        <thead>
          <tr>
            <th scope="col">${L.year}</th>
            <th scope="col">${L.return}</th>
            <th scope="col">${t.ea.metrics.totalTrades}</th>
            <th scope="col">${t.ea.metrics.winRate}</th>
          </tr>
        </thead>
        <tbody>
          ${yearly.map(
            (y) => html`<tr>
              <th scope="row" class="dtable__num">${y.year}</th>
              <td class="dtable__num ${raw(has(y.pct) ? (y.pct >= 0 ? 'is-pos' : 'is-neg') : '')}">${has(y.pct) ? sPct(y.pct, 1) : DASH}</td>
              <td class="dtable__num">${num(y.trades)}</td>
              <td class="dtable__num">${has(y.winRate) ? y.winRate + '%' : DASH}</td>
            </tr>`
          )}
        </tbody>
      </table>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Trade statistics
 * ------------------------------------------------------------------ */

export function TradeStatistics({ model, t }) {
  const tr = model.trades;
  if (!tr) return '';
  const L = t.ea.tradeStats;
  const c = tr.counts;
  const a = tr.averages;

  const money = (v) => (has(v) && model.backtest.initialDeposit ? num(v) : has(v) ? num(v) : DASH);

  const groups = [
    {
      title: L.direction,
      rows: [
        [L.longTrades, c.sideKnown ? num(c.longs) : null],
        [L.shortTrades, c.sideKnown ? num(c.shorts) : null],
        [L.closedTrades, num(c.closed)],
      ],
    },
    {
      title: L.outcome,
      rows: [
        [L.winRate, has(tr.rates.winRate) ? tr.rates.winRate + '%' : null],
        [L.lossRate, has(tr.rates.lossRate) ? tr.rates.lossRate + '%' : null],
        [L.maxWinStreak, num(tr.streaks.maxWins)],
        [L.maxLossStreak, num(tr.streaks.maxLosses)],
      ],
    },
    {
      title: L.size,
      rows: [
        [L.avgWin, money(a.avgWin)],
        [L.avgLoss, money(a.avgLoss)],
        [L.largestWin, money(a.largestWin)],
        [L.largestLoss, money(a.largestLoss)],
        [L.payoffRatio, has(a.payoffRatio) ? a.payoffRatio : null],
      ],
    },
  ];

  return html`
    <div class="statgrid" data-reveal>
      ${groups.map(
        (g) => html`<div class="statgrid__col">
          <p class="statgrid__title">${g.title}</p>
          <dl>
            ${g.rows
              .filter(([, v]) => has(v) && v !== DASH)
              .map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}
          </dl>
        </div>`
      )}
    </div>
    ${when(
      !model.backtest.initialDeposit,
      () => html`<p class="fineline">${t.ea.tradeStats.unitNote}</p>`
    )}
  `;
}

/* ------------------------------------------------------------------ *
 * Risk profile — declared vs observed
 * ------------------------------------------------------------------ */

export function RiskProfile({ model, t }) {
  const L = t.ea.risk2;
  const rc = model.riskCharacteristics;
  const ob = model.trades?.observed;
  const dd = model.num.maxDrawdownPct;

  const declared = [
    [L.martingale, rc.martingale],
    [L.grid, rc.grid],
    [L.averaging, rc.averaging],
    [L.positionScaling, rc.positionScaling],
    [L.stopLoss, rc.stopLoss],
    [L.maxPositions, rc.maxPositions],
  ].filter(([, v]) => has(v));

  const observed = ob
    ? [
        [L.obsMaxConcurrent, has(ob.maxConcurrentPositions) ? num(ob.maxConcurrentPositions) : null],
        [L.obsStacked, has(ob.stackedEntries) ? num(ob.stackedEntries) : null],
        [L.obsStopLossShare, has(ob.stopLossShare) ? ob.stopLossShare + '%' : null],
        [L.obsWorstStreak, has(model.trades?.streaks?.maxLosses) ? num(model.trades.streaks.maxLosses) : null],
      ].filter(([, v]) => has(v))
    : [];

  if (!declared.length && !observed.length && !has(dd)) return '';

  const severe = has(dd) && dd >= 40;

  return html`
    ${when(
      severe,
      () => html`<div class="riskwarn" role="note" data-reveal>
        <p class="riskwarn__title">${L.warnTitle}</p>
        <p class="riskwarn__body">${raw(L.warnBody.replace('{dd}', dd + '%'))}</p>
      </div>`
    )}

    ${when(
      observed.length,
      () => html`<div class="riskblock" data-reveal>
        <p class="riskblock__title">${L.observedTitle}</p>
        <p class="riskblock__lead">${L.observedLead}</p>
        <dl class="kvlist">
          ${observed.map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
        </dl>
      </div>`
    )}

    <div class="riskblock" data-reveal>
      <p class="riskblock__title">${L.declaredTitle}</p>
      ${declared.length
        ? html`<dl class="kvlist">
            ${declared.map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
          </dl>`
        : html`<p class="riskblock__pending">${L.declaredPending}</p>`}
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Research transparency (STEP 20)
 * ------------------------------------------------------------------ */

export function ResearchTransparency({ model, t }) {
  const c = model.backtest.conditions || {};
  const m = t.ea.metrics;
  const rows = [
    [m.dataSource, c.dataSource],
    [m.period, model.backtest.period],
    [m.broker, c.broker],
    [m.modeling, c.modeling],
    [m.quality, c.quality],
    [m.spread, c.spread],
    [m.commission, c.commission],
    [m.initialDeposit, model.backtest.initialDeposit],
  ].filter(([, v]) => has(v));
  if (!rows.length) return '';

  return html`
    <dl class="kvlist kvlist--tight" data-reveal>
      ${rows.map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
    </dl>
    <p class="fineline">${t.ea.transparency.note}</p>
  `;
}

/* ------------------------------------------------------------------ *
 * Forward monitoring panel (Phase 12) — renders one strategy × evidence
 * type aggregate produced by scripts/analyze-forward.mjs. Dormant until
 * real trading data is imported; nothing here estimates.
 * ------------------------------------------------------------------ */

const DEG_LABEL = { NORMAL: 'stNormal', WATCH: 'stWatch', DEGRADED: 'stDegraded', SEVERE: 'stSevere', INSUFFICIENT_DATA: 'stInsufficient' };

function money(v, cur) {
  return has(v) ? `${Number(v).toLocaleString('en-US')} ${cur}` : DASH;
}

/** Small inline SVG line chart: points [[x-label, y]|null], y auto-scaled. */
function fwdLineSVG(points, { yZero = false } = {}) {
  const vals = points.map((p) => p[1]).filter((v) => v !== null && Number.isFinite(v));
  if (vals.length < 2) return '';
  const W = 640;
  const H = 200;
  const L = 46;
  const R = 10;
  const T = 10;
  const B = 24;
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (yZero) lo = Math.min(0, lo);
  if (hi === lo) hi = lo + 1;
  const x = (i) => L + (points.length === 1 ? 0 : (i / (points.length - 1)) * (W - L - R));
  const y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);

  let d = '';
  points.forEach((p, i) => {
    if (p[1] === null || !Number.isFinite(p[1])) return;
    d += (d ? ' L' : 'M') + x(i).toFixed(1) + ' ' + y(p[1]).toFixed(1);
  });

  const gridVals = [hi, (hi + lo) / 2, lo];
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
  for (const g of gridVals) {
    s += `<line x1="${L}" y1="${y(g)}" x2="${W - R}" y2="${y(g)}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>` +
      `<text x="${L - 6}" y="${y(g) + 3.5}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.45)">${Math.round(g * 100) / 100}</text>`;
  }
  if (yZero && lo < 0) s += `<line x1="${L}" y1="${y(0)}" x2="${W - R}" y2="${y(0)}" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>`;
  s += `<text x="${L}" y="${H - 8}" font-size="10" fill="rgba(255,255,255,0.45)">${points[0][0]}</text>` +
    `<text x="${W - R}" y="${H - 8}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.45)">${points[points.length - 1][0]}</text>` +
    `<path d="${d}" fill="none" stroke="#40e0d0" stroke-width="1.8" opacity="0.9"/></svg>`;
  return s;
}

export function ForwardPanel({ agg, t }) {
  const F = t.fmon;
  const M = agg.metrics;
  const cur = agg.currency;
  const deg = agg.degradation;

  const bt = agg.backtestBaseline;
  const vsRows = bt
    ? [
        [t.research.metricLabels.profitFactor, bt.profitFactor, M.profitFactor],
        [`${F.trades} / ${F.perMonth.toLowerCase()}`, bt.tradesPerMonth, agg.freq?.perMonth],
        [t.research.metricLabels.winRate, bt.winRate, M.winRate],
      ].filter(([, a, b]) => has(a) && has(b))
    : [];

  const rollingRows = Object.entries(agg.rolling || {})
    .filter(([, r]) => r)
    .map(([k, r]) => [k.startsWith('d') ? `${k.slice(1)}d` : `${k.slice(1)}t`, r]);

  const curvePts = (agg.curve || []).map((p) => [new Date(p[0] * 1000).toISOString().slice(0, 10), p[1]]);
  const rollPts = agg.rolling90Pf || [];

  return html`
    <div class="fwdpanel">
      <div class="fwdpanel__badges">
        <span class="badge ${raw(agg.qualified ? 'is-verified' : 'is-pending2')}">${agg.qualified ? F.qualified : F.notQualified}</span>
        <span class="xstatus xstatus--deg-${raw(deg.state.toLowerCase())}">${F[DEG_LABEL[deg.state]] || deg.state}</span>
        ${when(agg.stale, () => html`<span class="badge is-stale">${F.staleBadge}</span>`)}
      </div>

      <dl class="kvlist kvlist--tight">
        ${[
          [F.account, agg.accountId],
          [F.broker, agg.broker],
          [F.platform, agg.platform ? agg.platform.toUpperCase() : null],
          [F.mode, agg.accountMode],
          [F.currency, cur],
          [F.period, `${agg.period.from} → ${agg.period.to} (${agg.period.days}d)`],
          [F.trades, num(agg.trades)],
          [F.lastTrade, agg.lastTradeAt ? agg.lastTradeAt.slice(0, 10) : null],
        ]
          .filter(([, v]) => has(v))
          .map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
      </dl>

      <h3 class="statgrid__title">${F.perf}</h3>
      <dl class="kvlist kvlist--tight">
        ${[
          [t.research.metricLabels.profitFactor, show(M.profitFactor)],
          [t.research.metricLabels.winRate, has(M.winRate) ? `${M.winRate}%` : DASH],
          [F.net, money(M.netProfit, cur)],
          [F.expPayoff, money(M.expectedPayoff, cur)],
          [`${t.research.metricLabels.maxDrawdownPct} (${M.maxDrawdownBasis})`, money(M.maxDrawdown, cur)],
          ...(has(M.relativeDrawdownPct) ? [[t.research.metricLabels.maxDrawdownPct, `${M.relativeDrawdownPct}%`]] : []),
          [F.recovery, show(M.recoveryFactor)],
          [F.sharpe, show(M.sharpePerTrade)],
          [F.avgHold, show(M.avgHoldingHours)],
        ].map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
      </dl>
      <p class="fineline">${F.ddNote}</p>

      <h3 class="statgrid__title">${F.costs}</h3>
      <dl class="kvlist kvlist--tight">
        ${[
          [F.gross, money(M.grossTradeProfit, cur)],
          [F.swap, money(M.swap, cur)],
          [F.commission, money(M.commission, cur)],
          [F.fees, money(M.fees, cur)],
          [F.net, money(M.netProfit, cur)],
          ...(has(M.swapShareOfGrossPct) ? [[F.swapShare, `${M.swapShareOfGrossPct}%`]] : []),
          ...(has(M.commissionShareOfGrossPct) ? [[F.commShare, `${M.commissionShareOfGrossPct}%`]] : []),
        ].map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
      </dl>

      <h3 class="statgrid__title">${F.freqTitle} · ${F.longShortTitle}</h3>
      <dl class="kvlist kvlist--tight">
        ${[
          [F.perDay, show(agg.freq?.perDay)],
          [F.perMonth, show(agg.freq?.perMonth)],
          [F.perYear, show(agg.freq?.perYear)],
          [`${F.longShortTitle} PF`, `${show(M.longPF)} / ${show(M.shortPF)}`],
          [`${F.longShortTitle} ${F.trades}`, `${show(M.longTrades)} / ${show(M.shortTrades)}`],
        ].map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
      </dl>

      ${when(curvePts.length > 2, () => html`
        <h3 class="statgrid__title">${F.curveTitle}</h3>
        <div class="fwdchart">${raw(fwdLineSVG(curvePts, { yZero: true }))}</div>
      `)}
      ${when(rollPts.filter((p) => p[1] !== null).length > 1, () => html`
        <h3 class="statgrid__title">${F.rollingChartTitle}</h3>
        <div class="fwdchart">${raw(fwdLineSVG(rollPts))}</div>
      `)}

      ${when(rollingRows.length, () => html`
        <h3 class="statgrid__title">${F.rollingTitle}</h3>
        <div class="tablewrap">
          <table class="dtable">
            <thead>
              <tr>
                <th scope="col">${F.window}</th>
                <th scope="col">${F.trades}</th>
                <th scope="col">${t.research.metricLabels.profitFactor}</th>
                <th scope="col">${t.research.metricLabels.winRate}</th>
                <th scope="col">${t.research.metricLabels.maxDrawdownPct}</th>
              </tr>
            </thead>
            <tbody>
              ${rollingRows.map(
                ([w, r]) => html`<tr>
                  <th scope="row">${w}</th>
                  <td class="dtable__num">${show(r.trades)}</td>
                  <td class="dtable__num">${show(r.profitFactor)}</td>
                  <td class="dtable__num">${has(r.winRate) ? `${r.winRate}%` : DASH}</td>
                  <td class="dtable__num">${money(r.maxDrawdown, cur)}</td>
                </tr>`
              )}
            </tbody>
          </table>
        </div>
      `)}

      ${when(vsRows.length, () => html`
        <h3 class="statgrid__title">${F.vsTitle}</h3>
        <div class="tablewrap">
          <table class="dtable">
            <thead>
              <tr>
                <th scope="col">${F.vsMetric}</th>
                <th scope="col">${F.vsBacktest}</th>
                <th scope="col">${F.vsForward}</th>
              </tr>
            </thead>
            <tbody>
              ${vsRows.map(
                ([k, a, b]) => html`<tr>
                  <th scope="row">${k}</th>
                  <td class="dtable__num">${show(a)}</td>
                  <td class="dtable__num">${show(b)}</td>
                </tr>`
              )}
            </tbody>
          </table>
        </div>
        <p class="fineline">${F.vsNote}</p>
      `)}

      <h3 class="statgrid__title">${F.degTitle}</h3>
      <div class="fwddeg fwddeg--${raw(deg.state.toLowerCase())}">
        <p class="fwddeg__state">${F[DEG_LABEL[deg.state]] || deg.state}</p>
        <dl class="kvlist kvlist--tight">
          ${[
            [F.degBaseline, deg.baselinePF !== null && deg.baselinePF !== undefined ? `${deg.baselinePF} (${deg.baselineType || DASH})` : DASH],
            [F.degRolling, show(deg.rollingPF)],
            [F.degRatio, has(deg.pfRatio) ? `${deg.pfRatio > 1 ? '+' : ''}${Math.round((deg.pfRatio - 1) * 100)}%` : DASH],
            [F.degSample, show(deg.sample)],
            [F.degConfidence, show(deg.confidence)],
          ].map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
        </dl>
      </div>

      ${when(agg.breakdowns?.sessions, () => {
        const rows = Object.entries(agg.breakdowns.sessions).filter(([, v]) => v);
        if (!rows.length) return '';
        return html`
          <h3 class="statgrid__title">${F.sessionsTitle}</h3>
          <div class="tablewrap">
            <table class="dtable">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">${F.trades}</th>
                  <th scope="col">${t.research.metricLabels.profitFactor}</th>
                  <th scope="col">${F.net}</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(
                  ([name, v]) => html`<tr>
                    <th scope="row">${name}</th>
                    <td class="dtable__num">${show(v.trades)}</td>
                    <td class="dtable__num">${show(v.profitFactor)}</td>
                    <td class="dtable__num">${money(v.netProfit, cur)}</td>
                  </tr>`
                )}
              </tbody>
            </table>
          </div>
        `;
      })}

      <p class="warn warn--sm">${F.fwdDisclaimer}</p>
      <p class="fineline">${F.brokerNote}</p>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Track-record tabs (Phase 9): Backtest / Forward / Live
 * The backtest tab wraps the existing snapshot. Forward and live render a
 * validated record when one exists in tools/forward-live.json, and an honest
 * empty state otherwise — never a placeholder number. Reuses the site-wide
 * `data-switch` switcher (main.js §13); without JS the first panel shows.
 * ------------------------------------------------------------------ */

/** One validated forward/live record. Dormant until real data lands. */
function RecordPanel({ rec, t }) {
  const F = t.fl;
  const L = { ...t.research.metricLabels, netGainPct: F.netGain, drawdownBasis: null };
  return html`
    <dl class="kvlist kvlist--tight">
      <div class="kvlist__row">
        <dt>${F.source}</dt>
        <dd>${rec.url ? html`<a href="${rec.url}" target="_blank" rel="noopener noreferrer">${rec.source}</a>` : rec.source}</dd>
      </div>
      ${when(rec.verifiedBy, () => html`<div class="kvlist__row"><dt>${F.verifiedBy}</dt><dd>${rec.verifiedBy}</dd></div>`)}
      <div class="kvlist__row"><dt>${F.period}</dt><dd>${rec.period.from} → ${rec.period.to}</dd></div>
      ${when(
        rec.metrics,
        () => Object.entries(rec.metrics)
          .filter(([k, v]) => has(v) && L[k] !== null)
          .map(([k, v]) => {
            const basis = k === 'maxDrawdownPct' && rec.metrics.drawdownBasis ? ` (${rec.metrics.drawdownBasis})` : '';
            return html`<div class="kvlist__row"><dt>${L[k] || k}</dt><dd>${v}${raw(/Pct$|Rate$/.test(k) ? '%' : '')}${basis}</dd></div>`;
          })
      )}
    </dl>
    ${when(
      rec.monthly.length,
      () => html`
        <p class="statgrid__title">${F.monthly}</p>
        <div class="tablewrap">
          <table class="dtable">
            <thead><tr><th scope="col">${t.ea.charts.yearTotal}</th><th scope="col">${t.ea.charts.return}</th></tr></thead>
            <tbody>
              ${rec.monthly.map(
                (m2) => html`<tr><th scope="row">${m2.ym}</th><td class="dtable__num">${has(m2.pct) ? sPct(m2.pct) : DASH}</td></tr>`
              )}
            </tbody>
          </table>
        </div>
      `
    )}
    ${when(rec.notes, () => html`<p class="fineline">${rec.notes}</p>`)}
  `;
}

function EmptyRecord({ headline, t }) {
  const F = t.fl;
  return html`
    <div class="flempty">
      <p class="flempty__head">${headline}</p>
      <p class="flempty__why">${F.why}</p>
      <p class="fineline">${F.when}</p>
    </div>
  `;
}

export function TrackRecordTabs({ model, t }) {
  const F = t.fl;
  const id = `track-${model.slug}`;
  /* Forward/live bodies (§48): a Phase 12 monitoring aggregate wins, a manual
     Phase 9 record renders when that is all there is, and with neither the
     evidence-first empty state shows. Never a number without data. */
  const forwardBody = model.fwd
    ? ForwardPanel({ agg: model.fwd, t })
    : model.forwardRecord
      ? RecordPanel({ rec: model.forwardRecord, t })
      : EmptyRecord({ headline: F.noForward, t });
  const liveBody = model.liveMon
    ? ForwardPanel({ agg: model.liveMon, t })
    : model.liveRecord
      ? RecordPanel({ rec: model.liveRecord, t })
      : EmptyRecord({ headline: F.noLive, t });

  const tabs = [
    { key: 'backtest', label: F.tabBacktest, body: PerformanceSnapshot({ model, t }) },
    {
      key: 'montecarlo',
      label: t.mc.title,
      body: model.mc ? MonteCarloPanel({ model, t }) : EmptyRecord({ headline: t.fmon.mcPending, t }),
    },
    { key: 'forward', label: F.tabForward, body: forwardBody },
    { key: 'live', label: F.tabLive, body: liveBody },
  ];

  return html`
    <div class="switch switch--track" data-switch="${id}">
      <div class="switch__tabs" role="tablist" aria-label="${F.tabsLabel}">
        ${tabs.map(
          (tab, i) => html`<button
            type="button"
            role="tab"
            class="switch__tab${raw(i === 0 ? ' is-on' : '')}"
            data-switch-tab="${tab.key}"
            aria-selected="${i === 0 ? 'true' : 'false'}"
            aria-controls="${id}-${tab.key}"
          >${tab.label}</button>`
        )}
      </div>
      ${tabs.map(
        (tab, i) => html`<div
          class="switch__panel"
          id="${id}-${tab.key}"
          data-switch-panel="${tab.key}"
          role="tabpanel"
          ${raw(i === 0 ? '' : 'hidden')}
        >${tab.body}</div>`
      )}
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Monte Carlo panel (Phase 8)
 * Pre-generated by tools/run-montecarlo.mjs: 1,000 seeded resamplings of the
 * real deal list. Absent data → the whole section disappears, as usual.
 * ------------------------------------------------------------------ */

export function MonteCarloPanel({ model, t }) {
  const mc = model.mc;
  if (!mc) return '';
  const M = t.mc;
  const meta = model.mcMeta || {};
  const simsFmt = Number(meta.sims || 1000).toLocaleString('en-US');
  const sub = (s) => s.replace('{sims}', simsFmt).replace('{seed}', String(meta.seed ?? DASH));
  const dd = mc.shuffle.dd;

  return html`
    <div class="mcpanel">
      <p class="prose">${sub(M.lead)}</p>

      <h3 class="statgrid__title">${M.shuffleTitle}</h3>
      <p class="mcpanel__lead">${M.shuffleLead}</p>
      <dl class="kvlist kvlist--tight">
        ${[
          [M.observed, mc.observed.maxDDPct],
          [sub(M.p50), dd.p50],
          [M.p90, dd.p90],
          [M.p95, dd.p95],
          [M.p99, dd.p99],
          [sub(M.worst), dd.max],
        ].map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${show(v)}%</dd></div>`)}
      </dl>

      <h3 class="statgrid__title">${M.missedTitle}</h3>
      <p class="mcpanel__lead">${M.missedLead}</p>
      <p class="fineline">${M.observed}: ${M.finalReturn} ${sPct(mc.observed.finalPct)} · ${M.maxDD} ${show(mc.observed.maxDDPct)}%</p>
      <div class="tablewrap">
        <table class="dtable">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">${M.finalReturn} ${M.colP5}</th>
              <th scope="col">${M.colMedian}</th>
              <th scope="col">${M.colP95}</th>
              <th scope="col">${M.ddP95}</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(mc.missed).map(
              ([lvl, m2]) => html`<tr>
                <th scope="row">${M.missedLevel.replace('{n}', lvl)}</th>
                <td class="dtable__num">${sPct(m2.final.p5)}</td>
                <td class="dtable__num">${sPct(m2.final.p50)}</td>
                <td class="dtable__num">${sPct(m2.final.p95)}</td>
                <td class="dtable__num">${show(m2.dd.p95)}%</td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>

      <h3 class="statgrid__title">${M.costTitle}</h3>
      <p class="mcpanel__lead">${M.costLead.replace('{m}', String(mc.cost.medianAbsTradePct))}</p>
      <div class="tablewrap">
        <table class="dtable">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">${M.costPerTrade}</th>
              <th scope="col">${M.finalReturn}</th>
              <th scope="col">${M.maxDD}</th>
            </tr>
          </thead>
          <tbody>
            ${mc.cost.levels.map(
              (l) => html`<tr>
                <th scope="row">${M.costLevel.replace('{n}', String(l.share))}</th>
                <td class="dtable__num">${show(l.costPctPerTrade)}%</td>
                <td class="dtable__num">${sPct(l.finalPct)}</td>
                <td class="dtable__num">${show(l.maxDDPct)}%</td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>

      <p class="fineline">${M.configNote}</p>
      <p class="fineline">${M.honesty}</p>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Research status badge
 * ------------------------------------------------------------------ */

export function StatusBadge({ status, t }) {
  const L = t.ea.researchStatus;
  if (!status || !L[status]) return '';
  return html`<span class="rstatus rstatus--${raw(status)}">${L[status]}</span>`;
}
