/**
 * ============================================================================
 * LAB ANALYTICS — cross-system views for the Backtest Lab
 * ============================================================================
 * Everything here aggregates the per-system models. No new data is introduced:
 * if a system is missing an input it drops out of that view rather than being
 * imputed, and views that would have fewer than two systems do not render.
 *
 * Charts are inline SVG for the same reason as on the detail pages — four
 * small graphics do not justify a charting library on a site whose whole
 * argument is that it loads fast.
 * ============================================================================
 */

import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';

const DASH = '—';
const has = (v) => v !== null && v !== undefined && v !== '';
const int = (n) => (has(n) ? Number(n).toLocaleString('en-US') : DASH);
const sPct = (n, d = 1) => (has(n) ? `${n > 0 ? '+' : ''}${Number(n).toFixed(d)}%` : DASH);

/** Drawdown threshold above which a system is listed in the High Risk Lab. */
export const HIGH_RISK_DD = 40;

/**
 * Annualised return (CAGR) from start balance to end balance over the years
 * the test covers.
 *
 * The obvious alternative — total return divided by years — is unusable here.
 * These systems run for up to 24 years and grow the account 35×, so the simple
 * average produces figures like RINA 179%/yr and KOKOMO 37%/yr that no reader
 * interprets correctly, and on a chart two outliers compress the other twelve
 * systems into an unreadable band. CAGR puts thirteen of fourteen inside
 * 1–28% and is the standard way to compare unequal periods.
 *
 * The trade-off is stated on the page: these are fixed-lot systems, so CAGR
 * understates what a compounding configuration would have produced.
 */
export function annualReturn(m) {
  const p = m.trades?.period;
  const years = m.num.years;
  if (!p || !has(p.startBalance) || !has(p.endBalance) || !has(years) || years <= 0) return null;
  if (p.startBalance <= 0 || p.endBalance <= 0) return null;
  return (Math.pow(p.endBalance / p.startBalance, 1 / years) - 1) * 100;
}

/* ------------------------------------------------------------------ *
 * Aggregate counters
 * ------------------------------------------------------------------ */

export function LabStats({ models, t }) {
  const d = t.lab.dash;
  const withTrades = models.filter((m) => m.trades);

  const trades = withTrades.reduce((n, m) => n + (m.trades.counts.closed || 0), 0);
  const months = withTrades.reduce((n, m) => n + m.trades.monthly.length, 0);
  const markets = new Set(models.map((m) => m.spec.marketKey).filter(Boolean)).size;
  const earliest = withTrades
    .map((m) => m.trades.period.from)
    .filter(Boolean)
    .sort()[0];
  const longest = Math.max(0, ...models.map((m) => m.num.years || 0));

  const cells = [
    [d.systems, String(models.length)],
    [d.trades, int(trades)],
    [d.months, int(months)],
    [d.markets, String(markets)],
    [d.span, earliest ? earliest.slice(0, 4) : null],
    [d.years, longest ? `${longest} ${d.yearsUnit}` : null],
  ].filter(([, v]) => has(v));

  return html`
    <ul class="labstats">
      ${cells.map(
        ([k, v], i) => html`<li data-reveal style="--d:${i % 3}">
          <span class="labstats__v">${v}</span>
          <span class="labstats__k">${k}</span>
        </li>`
      )}
    </ul>
  `;
}

/* ------------------------------------------------------------------ *
 * Rankings
 * ------------------------------------------------------------------ */

const RANK_METRICS = [
  { key: 'score', get: (m) => m.num.score, dir: 'high', fmt: (v) => String(v) },
  { key: 'pf', get: (m) => m.num.profitFactor, dir: 'high', fmt: (v) => v.toFixed(2) },
  { key: 'dd', get: (m) => m.num.maxDrawdownPct, dir: 'low', fmt: (v) => `${v}%` },
  { key: 'trades', get: (m) => m.num.trades, dir: 'high', fmt: (v) => int(v) },
  { key: 'years', get: (m) => m.num.years, dir: 'high', fmt: (v) => String(v) },
];

export function Rankings({ models, t, locale }) {
  const d = t.lab.dash;

  const lists = RANK_METRICS.map((metric) => {
    const rows = models
      .map((m) => ({ m, v: metric.get(m) }))
      .filter((r) => has(r.v) && Number.isFinite(r.v))
      .sort((a, b) => (metric.dir === 'high' ? b.v - a.v : a.v - b.v));
    return { metric, rows };
  }).filter((l) => l.rows.length >= 2);

  if (!lists.length) return '';

  return html`
    <div class="ranks">
      ${lists.map((list) => {
        /* Bars are scaled to the largest magnitude in the list, so a "lower is
           better" list still reads left-to-right as best-first. */
        const max = Math.max(...list.rows.map((r) => Math.abs(r.v))) || 1;
        return html`<section class="rank" data-reveal>
          <h3 class="rank__title">${d.metricNames[list.metric.key]}</h3>
          <ol class="rank__list">
            ${list.rows.map(
              (r, i) => html`<li class="rank__row${raw(i === 0 ? ' is-top' : '')}">
                <span class="rank__pos">${String(i + 1).padStart(2, '0')}</span>
                <a class="rank__name" href="${localePath(locale, ROUTES.eaDetail(r.m.slug))}">${r.m.name}</a>
                <span class="rank__bar" aria-hidden="true"><i style="--v:${((Math.abs(r.v) / max) * 100).toFixed(1)}%"></i></span>
                <span class="rank__v">${list.metric.fmt(r.v)}</span>
              </li>`
            )}
          </ol>
        </section>`;
      })}
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Risk / return scatter
 * ------------------------------------------------------------------ */

export function RiskReturnMap({ models, t, locale }) {
  const d = t.lab.dash;

  const pts = models
    .map((m) => ({ m, x: m.num.maxDrawdownPct, y: annualReturn(m), r: m.num.trades }))
    .filter((p) => has(p.x) && has(p.y));
  if (pts.length < 3) return '';

  const W = 1000;
  const H = 520;
  const PAD = { l: 62, r: 24, t: 24, b: 52 };

  const xMax = Math.ceil(Math.max(...pts.map((p) => p.x)) / 10) * 10 + 5;

  /* One system can be several times the next on return — JAYRO is a 2-year
     test at 108% against a 28% runner-up — and letting it set the axis
     squashes the other thirteen into the bottom quarter. When the top value
     is a clear outlier the axis stops below it and that bubble is pinned to
     the ceiling with a caret; its real figure still shows in the label, so
     nothing is hidden, only rescaled. */
  const sortedY = pts.map((p) => p.y).sort((a, b) => b - a);
  const outlier = sortedY.length > 2 && sortedY[0] > sortedY[1] * 2.2;
  const yCeil = outlier ? sortedY[1] * 1.25 : sortedY[0];
  const yMax = Math.ceil(yCeil / 10) * 10 + 5;
  const yMin = Math.min(0, Math.floor(Math.min(...sortedY) / 10) * 10);

  const px = (x) => PAD.l + (x / xMax) * (W - PAD.l - PAD.r);
  const py = (y) => H - PAD.b - ((y - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const rMax = Math.max(...pts.map((p) => p.r || 0)) || 1;
  const rad = (n) => 6 + Math.sqrt((n || 0) / rMax) * 20;

  const xTicks = [];
  for (let v = 0; v <= xMax; v += xMax > 60 ? 20 : 10) xTicks.push(v);
  const yTicks = [];
  for (let v = yMin; v <= yMax; v += Math.max(10, Math.round((yMax - yMin) / 5 / 10) * 10)) yTicks.push(v);

  /* Bands mirror the score's drawdown caps, so the chart and the score tell
     the same story about where risk becomes decisive. */
  const bands = [
    { from: 30, to: 45, cls: 'is-warn' },
    { from: 45, to: xMax, cls: 'is-danger' },
  ].filter((b) => b.from < xMax);

  return html`
    <figure class="scatter" data-reveal>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${d.riskReturnLead}">
        ${bands.map(
          (b) => html`<rect class="scatter__band ${raw(b.cls)}" x="${px(b.from).toFixed(1)}" y="${PAD.t}"
            width="${(px(Math.min(b.to, xMax)) - px(b.from)).toFixed(1)}" height="${H - PAD.t - PAD.b}" />`
        )}

        ${xTicks.map(
          (v) => html`<g class="scatter__tick">
            <line x1="${px(v).toFixed(1)}" y1="${PAD.t}" x2="${px(v).toFixed(1)}" y2="${H - PAD.b}" />
            <text x="${px(v).toFixed(1)}" y="${H - PAD.b + 20}" text-anchor="middle">${v}%</text>
          </g>`
        )}
        ${yTicks.map(
          (v) => html`<g class="scatter__tick">
            <line x1="${PAD.l}" y1="${py(v).toFixed(1)}" x2="${W - PAD.r}" y2="${py(v).toFixed(1)}" />
            <text x="${PAD.l - 10}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end">${v}%</text>
          </g>`
        )}

        ${(() => {
          /* Labels collide badly around the 17–26% drawdown cluster. Walking
             left to right and flipping the label under the bubble whenever the
             previous one is close costs nothing and keeps every name readable. */
          const taken = [];
          const free = (cx, cy) =>
            !taken.some((b) => Math.abs(b.x - cx) < 74 && Math.abs(b.y - cy) < 15);

          return pts
            .slice()
            .sort((a, b) => px(a.x) - px(b.x))
            .map((p) => {
              /* Hollow ring = balance-basis drawdown, i.e. plotted further
                 left than a like-for-like comparison would put it. */
              const balance = p.m.backtest.conditions?.drawdownBasis === 'balance';
              const clamped = p.y > yMax;
              const r = rad(p.r);
              const cx = px(p.x);
              const cy = clamped ? py(yMax) : py(p.y);

              /* Try above, then below, then further out, and take the first
                 slot no other label already occupies. A clamped bubble sits on
                 the ceiling, so its label has to go underneath or it is cut
                 off by the top of the viewBox. */
              const candidates = clamped
                ? [cy + r + 17, cy + r + 33]
                : [cy - r - 8, cy + r + 17, cy - r - 24, cy + r + 33];
              const ly = candidates.find((y) => free(cx, y)) ?? candidates[0];
              taken.push({ x: cx, y: ly });

              return html`<a href="${localePath(locale, ROUTES.eaDetail(p.m.slug))}" class="scatter__pt${raw(balance ? ' is-balance' : '')}${raw(clamped ? ' is-clamped' : '')}">
                <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" />
                ${when(
                  clamped,
                  () => html`<text class="scatter__caret" x="${cx.toFixed(1)}" y="${Math.max(14, cy - r - 1).toFixed(1)}" text-anchor="middle">▲</text>`
                )}
                <text x="${cx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${p.m.name}${when(clamped, () => ` ${sPct(p.y, 0)}`)}</text>
                <title>${p.m.name} · ${d.riskReturnAxisX} ${p.x}% · ${d.riskReturnAxisY} ${sPct(p.y)} · ${int(p.r)}</title>
              </a>`;
            });
        })()}

        <text class="scatter__axis" x="${(W / 2).toFixed(0)}" y="${H - 8}" text-anchor="middle">${d.riskReturnAxisX}</text>
        <text class="scatter__axis" x="${-(H / 2).toFixed(0)}" y="16" text-anchor="middle" transform="rotate(-90)">${d.riskReturnAxisY}</text>
      </svg>
      <figcaption>${d.riskReturnNote}</figcaption>
    </figure>
  `;
}

/* ------------------------------------------------------------------ *
 * Performance matrix
 * ------------------------------------------------------------------ */

export function PerformanceMatrix({ models, t, locale }) {
  const m = t.ea.metrics;
  const d = t.lab.dash;

  return html`
    <div class="tablewrap" data-reveal>
      <table class="dtable dtable--matrix">
        <thead>
          <tr>
            <th scope="col">${t.ea.index.count}</th>
            <th scope="col">${t.ea.labels.symbol}</th>
            <th scope="col">${t.ea.score.title}</th>
            <th scope="col">${m.profitFactor}</th>
            <th scope="col">${m.maxDrawdown}</th>
            <th scope="col">${m.totalTrades}</th>
            <th scope="col">${d.metricNames.years}</th>
            <th scope="col">${d.riskReturnAxisY}</th>
          </tr>
        </thead>
        <tbody>
          ${models.map((x) => {
            const ar = annualReturn(x);
            return html`<tr>
              <th scope="row"><a href="${localePath(locale, ROUTES.eaDetail(x.slug))}">${x.name}</a></th>
              <td>${x.spec.symbol || DASH}</td>
              <td class="dtable__num">${has(x.num.score) ? x.num.score : DASH}</td>
              <td class="dtable__num">${x.backtest.profitFactor || DASH}</td>
              <td class="dtable__num">${has(x.num.maxDrawdownPct) ? x.num.maxDrawdownPct + '%' : DASH}</td>
              <td class="dtable__num">${x.backtest.totalTrades || DASH}</td>
              <td class="dtable__num">${has(x.num.years) ? x.num.years : DASH}</td>
              <td class="dtable__num ${raw(has(ar) ? (ar >= 0 ? 'is-pos' : 'is-neg') : '')}">${sPct(ar)}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Switcher: one panel visible at a time
 * ------------------------------------------------------------------ */

export function Switcher({ id, label, models, panel, t }) {
  const usable = models.filter((m) => m.trades);
  if (usable.length < 2) return '';

  return html`
    <div class="switch" data-switch="${id}">
      <div class="switch__tabs" role="tablist" aria-label="${label}">
        ${usable.map(
          (m, i) => html`<button
            type="button"
            role="tab"
            class="switch__tab${raw(i === 0 ? ' is-on' : '')}"
            data-switch-tab="${m.slug}"
            aria-selected="${i === 0 ? 'true' : 'false'}"
            aria-controls="${id}-${m.slug}"
          >${m.name}</button>`
        )}
      </div>
      ${usable.map(
        (m, i) => html`<div
          class="switch__panel"
          id="${id}-${m.slug}"
          data-switch-panel="${m.slug}"
          role="tabpanel"
          ${raw(i === 0 ? '' : 'hidden')}
        >${panel(m)}</div>`
      )}
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * High Risk Lab
 * ------------------------------------------------------------------ */

export function HighRiskLab({ models, t, locale }) {
  const d = t.lab.dash;
  const risky = models
    .filter((m) => has(m.num.maxDrawdownPct) && m.num.maxDrawdownPct >= HIGH_RISK_DD)
    .sort((a, b) => b.num.maxDrawdownPct - a.num.maxDrawdownPct);

  if (!risky.length) return html`<p class="prose">${d.highRiskNone}</p>`;

  return html`
    <ul class="hrisk">
      ${risky.map(
        (m, i) => html`<li class="hrisk__item" data-reveal style="--d:${i % 3}">
          <a href="${localePath(locale, ROUTES.eaDetail(m.slug))}">
            <div class="hrisk__head">
              <span class="hrisk__name">${m.name}</span>
              <span class="hrisk__dd">${m.num.maxDrawdownPct}%</span>
            </div>
            <dl class="hrisk__facts">
              ${[
                [t.ea.labels.symbol, m.spec.symbol],
                [t.ea.labels.strategy, m.spec.strategy],
                [t.ea.metrics.ddBasis, m.backtest.conditions?.drawdownBasis ? t.ea.metrics[`ddBasis_${m.backtest.conditions.drawdownBasis}`] : null],
                [t.ea.tradeStats.maxLossStreak, has(m.trades?.streaks?.maxLosses) ? m.trades.streaks.maxLosses : null],
                [t.ea.risk2.obsMaxConcurrent, has(m.trades?.observed?.maxConcurrentPositions) ? m.trades.observed.maxConcurrentPositions : null],
                [t.ea.score.title, has(m.num.score) ? m.num.score : null],
              ]
                .filter(([, v]) => has(v))
                .map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}
            </dl>
          </a>
        </li>`
      )}
    </ul>
  `;
}
