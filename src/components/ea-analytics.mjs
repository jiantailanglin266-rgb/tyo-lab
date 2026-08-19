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
