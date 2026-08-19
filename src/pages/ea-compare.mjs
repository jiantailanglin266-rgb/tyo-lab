import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { PageHero, Button } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';

/**
 * COMPARE — the whole catalogue as one matrix.
 *
 * Rendered server-side in full, for two reasons: a 14-system comparison table
 * is genuinely useful content for search, and it means the page works with
 * JavaScript off. A `?ea=slug,slug` parameter narrows it client-side.
 *
 * "Best in row" is only marked where better/worse is unambiguous. Win rate is
 * deliberately not marked — for a grid or martingale system a 95% win rate is
 * a property of the exit logic, not evidence of quality, and highlighting it
 * would rank the riskiest builds top.
 */

const DASH = '—';
const has = (v) => v !== null && v !== undefined && v !== '';

export default function EACompare({ locale, t, ea }) {
  const C = t.ea.compare;
  const R = C.rows;
  const B = t.ea.browse;
  const p = (r) => localePath(locale, r);

  /** direction: 'high' = bigger is better, 'low' = smaller is better, null = no ranking */
  const rows = [
    { key: 'score', label: R.score, dir: 'high', get: (m) => m.num.score, fmt: (m) => (m.score.total === null ? t.ea.score.insufficient : `${m.score.total}`) },
    { key: 'symbol', label: R.symbol, dir: null, fmt: (m) => m.spec.symbol },
    { key: 'market', label: R.market, dir: null, fmt: (m) => B.markets[m.spec.marketKey] || m.spec.marketKey },
    { key: 'timeframe', label: R.timeframe, dir: null, fmt: (m) => m.spec.timeframe },
    { key: 'strategy', label: R.strategy, dir: null, fmt: (m) => m.spec.strategy },
    { key: 'risk', label: R.risk, dir: null, fmt: (m) => (m.spec.risk ? t.ea.risk[m.spec.risk] : null) },
    { key: 'pf', label: R.pf, dir: 'high', get: (m) => m.num.profitFactor, fmt: (m) => m.backtest.profitFactor },
    { key: 'dd', label: R.dd, dir: 'low', get: (m) => m.num.maxDrawdownPct, fmt: (m) => (has(m.num.maxDrawdownPct) ? `${m.num.maxDrawdownPct}%` : null) },
    { key: 'ddBasis', label: R.ddBasis, dir: null, fmt: (m) => (m.backtest.conditions?.drawdownBasis ? t.ea.metrics[`ddBasis_${m.backtest.conditions.drawdownBasis}`] : null) },
    { key: 'trades', label: R.trades, dir: 'high', get: (m) => m.num.trades, fmt: (m) => m.backtest.totalTrades },
    { key: 'win', label: R.win, dir: null, fmt: (m) => m.backtest.winRate },
    { key: 'years', label: R.years, dir: 'high', get: (m) => m.num.years, fmt: (m) => (has(m.num.years) ? String(m.num.years) : null) },
    { key: 'period', label: R.period, dir: null, fmt: (m) => m.backtest.period },
    { key: 'worstMonth', label: R.worstMonth, dir: 'high', get: (m) => m.score.worstMonth, fmt: (m) => (has(m.score.worstMonth) ? `${m.score.worstMonth}%` : null) },
    { key: 'lossStreak', label: R.lossStreak, dir: 'low', get: (m) => m.trades?.streaks?.maxLosses ?? null, fmt: (m) => (has(m.trades?.streaks?.maxLosses) ? String(m.trades.streaks.maxLosses) : null) },
    { key: 'concurrent', label: R.concurrent, dir: 'low', get: (m) => m.trades?.observed?.maxConcurrentPositions ?? null, fmt: (m) => (has(m.trades?.observed?.maxConcurrentPositions) ? String(m.trades.observed.maxConcurrentPositions) : null) },
    { key: 'recovery', label: R.recovery, dir: 'high', get: (m) => m.num.recoveryFactor, fmt: (m) => m.backtest.recoveryFactor },
    { key: 'sharpe', label: R.sharpe, dir: null, fmt: (m) => m.backtest.sharpe },
  ];

  /* Which cell wins each ranked row. Ties mark every tied cell. */
  const bestBySlug = {};
  for (const row of rows) {
    if (!row.dir || !row.get) continue;
    const vals = ea.map((m) => row.get(m)).filter((v) => has(v) && Number.isFinite(v));
    if (vals.length < 2) continue;
    const target = row.dir === 'high' ? Math.max(...vals) : Math.min(...vals);
    bestBySlug[row.key] = new Set(ea.filter((m) => row.get(m) === target).map((m) => m.slug));
  }

  return html`
    ${PageHero({ eyebrow: C.title, h1: C.h1, h2: C.h2, lead: C.lead })}

    <section class="sec" data-reveal-root>
      <div class="wrap">
        <p class="cmp__status" data-compare-status hidden data-tpl="${C.filteredTo}" data-all="${C.showAll}"></p>

        <div class="cmp" data-compare-table>
          <div class="cmp__scroll">
            <table class="cmp__table">
              <caption class="sr">${C.lead}</caption>
              <thead>
                <tr>
                  <th scope="col" class="cmp__corner">${t.ea.index.count}</th>
                  ${ea.map(
                    (m) => html`<th scope="col" data-slug="${m.slug}">
                      <a href="${p(ROUTES.eaDetail(m.slug))}">
                        <span class="cmp__n">${m.number}</span>
                        <span class="cmp__name">${m.name}</span>
                      </a>
                    </th>`
                  )}
                </tr>
              </thead>
              <tbody>
                ${rows.map(
                  (row) => html`<tr data-dir="${row.dir || ''}">
                    <th scope="row">${row.label}</th>
                    ${ea.map((m) => {
                      const v = row.fmt(m);
                      const best = bestBySlug[row.key]?.has(m.slug);
                      const nv = row.get ? row.get(m) : null;
                      return html`<td data-slug="${m.slug}" data-v="${nv === null || nv === undefined ? '' : nv}" class="${raw(best ? 'is-best' : '')}${raw(has(v) ? '' : ' is-empty')}"
                        ${raw(best ? `title="${C.best}"` : '')}>${has(v) ? v : DASH}</td>`;
                    })}
                  </tr>`
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p class="fineline">${C.note}</p>

        <div class="sec__actions">
          ${Button({ href: p(ROUTES.ea()), label: C.backToIndex, variant: 'ghost' })}
        </div>
      </div>
    </section>

    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${BacktestDisclaimer({ t })}</div>
    </section>
  `;
}
