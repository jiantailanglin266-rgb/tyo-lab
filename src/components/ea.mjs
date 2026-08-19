import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES, asset } from '../lib/url.mjs';
import { entryI18n, formatDate } from '../lib/i18n.mjs';

/** Free / Paid + status badges. */
function badges(ea, t) {
  const out = [];
  if (ea.spec.price === 'free') out.push({ cls: 'is-free', label: t.ui.free });
  else if (ea.spec.price === 'paid') out.push({ cls: 'is-paid', label: t.ui.paid });
  if (ea.status === 'upcoming') out.push({ cls: 'is-soon', label: t.ui.comingSoon });
  if (ea.video?.type) out.push({ cls: 'is-video', label: t.ea.detail.video });
  return out;
}

/**
 * Three headline figures from the system's own tester report, shown on the
 * card so the index is browsable on evidence rather than artwork alone.
 * Unit-free metrics only — nothing here depends on knowing the account
 * currency, so every card can carry them.
 */
function EACardStats({ ea, t }) {
  /* Works with both shapes: the raw catalogue entry (backtests[]) and the
     merged model (backtest). Index and home render from the model. */
  const bt = ea.backtest || (ea.backtests || [])[0];
  if (!bt) return '';
  const m = t.ea.metrics;
  const cells = [
    [m.profitFactor, bt.profitFactor],
    [m.maxDrawdown, bt.maxDrawdown && /%/.test(bt.maxDrawdown) ? bt.maxDrawdown.split(' ')[0] : null],
    [m.totalTrades, bt.totalTrades],
  ].filter(([, v]) => v);
  if (!cells.length) return '';
  return html`
    <ul class="eacard__stats">
      ${cells.map(([k, v]) => html`<li><span class="eacard__stat-v">${v}</span><span class="eacard__stat-k">${k}</span></li>`)}
    </ul>
  `;
}

/** Card used on the EA index and on the home page. */
export function EACard({ ea, locale, t, index = 0 }) {
  const c = entryI18n(ea, locale);
  const href = localePath(locale, ROUTES.eaDetail(ea.slug));
  const rows = [
    [t.ea.labels.market, ea.spec.market],
    [t.ea.labels.symbol, ea.spec.symbol],
    [t.ea.labels.timeframe, ea.spec.timeframe],
    [t.ea.labels.strategy, ea.spec.strategy],
    [t.ea.labels.risk, ea.spec.risk ? t.ea.risk[ea.spec.risk] : null],
    [t.ea.labels.version, ea.spec.version],
    [t.ea.labels.releaseDate, ea.spec.releaseDate ? formatDate(ea.spec.releaseDate, locale) : null],
  ].filter(([, v]) => v);

  return html`
    <article class="eacard${raw((ea.media?.cover ?? ea.image) ? ' eacard--art' : '')}" data-reveal style="--d:${index % 3}">
      <a class="eacard__link" href="${href}" aria-label="${ea.name}">
        ${when(
          (ea.media?.cover ?? ea.image),
          () => html`<figure class="eacard__cover">
            <img src="${asset((ea.media?.cover ?? ea.image))}" alt="${ea.name}" loading="lazy" decoding="async" width="1024" height="1024" />
            <span class="eacard__cover-fade" aria-hidden="true"></span>
          </figure>`
        )}
        <div class="eacard__head">
          <span class="eacard__n">${ea.number}</span>
          <div class="eacard__badges">
            ${badges(ea, t).map((b) => html`<span class="badge ${raw(b.cls)}">${b.label}</span>`)}
          </div>
        </div>
        <h3 class="eacard__name">${ea.name}</h3>
        ${when(c.tagline, () => html`<p class="eacard__tagline">${c.tagline}</p>`)}
        <dl class="eacard__specs">
          ${rows.map(
            ([k, v]) => html`<div class="eacard__row"><dt>${k}</dt><dd>${v}</dd></div>`
          )}
        </dl>
        ${EACardStats({ ea, t })}
        <span class="eacard__cta"><span>${t.ui.viewDetail}</span><span aria-hidden="true">→</span></span>
      </a>
    </article>
  `;
}

/** Full spec table on the detail page. */
export function EASpecs({ ea, locale, t }) {
  const rows = [
    [t.ea.labels.market, ea.spec.market],
    [t.ea.labels.symbol, ea.spec.symbol],
    [t.ea.labels.timeframe, ea.spec.timeframe],
    [t.ea.labels.strategy, ea.spec.strategy],
    [t.ea.labels.risk, ea.spec.risk ? t.ea.risk[ea.spec.risk] : null],
    [t.ea.labels.platform, ea.spec.platform],
    [t.ea.labels.version, ea.spec.version],
    [t.ea.labels.releaseDate, ea.spec.releaseDate ? formatDate(ea.spec.releaseDate, locale) : null],
    [t.ea.labels.price, ea.spec.price === 'free' ? t.ui.free : ea.spec.price === 'paid' ? t.ui.paid : null],
  ].filter(([, v]) => v);

  return html`
    <dl class="specs">
      ${rows.map(([k, v], i) => html`<div class="specs__row" data-reveal style="--d:${i % 4}"><dt>${k}</dt><dd>${v}</dd></div>`)}
    </dl>
  `;
}

/** Recommended environment block. */
export function EAEnvironment({ ea, t, text }) {
  // Platform is deliberately absent: it already sits in the spec rail, and a
  // section whose only row repeats the rail reads as padding.
  const rows = [
    [t.ea.labels.minDeposit, ea.spec.minDeposit],
    [t.ea.labels.accountType, ea.spec.accountType],
    [t.ea.labels.leverage, ea.spec.leverage],
    [t.ea.labels.vps, ea.spec.vps],
  ].filter(([, v]) => v);
  if (!rows.length && !text) return '';
  return html`
    ${when(text, () => html`<p class="prose">${text}</p>`)}
    ${when(rows.length, () => html`<dl class="specs specs--tight">
      ${rows.map(([k, v]) => html`<div class="specs__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
    </dl>`)}
  `;
}

/**
 * Backtest metrics. Any metric left null is not rendered. If nothing at all is
 * populated the block degrades to an explicit "data pending" state rather than
 * inventing a placeholder number.
 */
export function EAMetrics({ bt, t, locale }) {
  if (!bt) return '';
  const m = t.ea.metrics;
  const primary = [
    [m.period, bt.period],
    [m.initialDeposit, bt.initialDeposit],
    [m.netProfit, bt.netProfit],
    [m.maxDrawdown, bt.maxDrawdown],
    [m.profitFactor, bt.profitFactor],
    [m.totalTrades, bt.totalTrades],
    [m.winRate, bt.winRate],
    [m.recoveryFactor, bt.recoveryFactor],
    [m.expectedPayoff, bt.expectedPayoff],
    [m.sharpe, bt.sharpe],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');

  const cond = bt.conditions || {};
  const basis = cond.drawdownBasis ? m[`ddBasis_${cond.drawdownBasis}`] || null : null;
  const conditions = [
    [m.broker, cond.broker],
    [m.spread, cond.spread],
    [m.commission, cond.commission],
    [m.modeling, cond.modeling],
    [m.dataSource, cond.dataSource],
    [m.quality, cond.quality],
    [m.ddBasis, basis],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');

  if (!primary.length && !conditions.length) {
    return html`
      <div class="pending" data-reveal>
        <p class="pending__title">${t.ui.dataPending}</p>
        <p class="pending__body">${t.ui.dataPendingNote}</p>
      </div>
    `;
  }

  return html`
    <div class="metrics" data-reveal>
      ${when(bt.label, () => html`<p class="metrics__label">${bt.label}</p>`)}
      ${when(
        bt.curve,
        () => html`<figure class="curve">
          <img src="${asset(bt.curve)}" alt="${t.ea.metrics.curveAlt}" loading="lazy" decoding="async" />
          <figcaption>${t.ea.metrics.curveCaption}</figcaption>
        </figure>`
      )}
      ${when(
        primary.length,
        () => html`<ul class="metrics__grid">
          ${primary.map(
            ([k, v], i) => html`<li data-reveal style="--d:${i % 4}"><span class="metrics__k">${k}</span><span class="metrics__v">${v}</span></li>`
          )}
        </ul>`
      )}
      ${when(
        conditions.length,
        () => html`<div class="metrics__cond">
          <p class="metrics__cond-title">${t.ea.metrics.conditions}</p>
          <dl>
            ${conditions.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}
          </dl>
        </div>`
      )}
      ${when(bt.report, () => html`<a class="metrics__report" href="${bt.report}" target="_blank" rel="noopener noreferrer">${t.ui.readMore} ↗</a>`)}
    </div>
  `;
}

/** Parameter table. */
export function EAParameters({ ea, t, params }) {
  if (!ea.parameters?.length) return '';
  return html`
    <div class="tablewrap" data-reveal>
      <table class="dtable">
        <thead>
          <tr>
            <th scope="col">${t.ea.detail.paramName}</th>
            <th scope="col">${t.ea.detail.paramDefault}</th>
            <th scope="col">${t.ea.detail.paramDesc}</th>
          </tr>
        </thead>
        <tbody>
          ${ea.parameters.map(
            (p) => html`<tr>
              <td><code>${p.name}</code></td>
              <td class="dtable__num">${p.default}</td>
              <td>${(params || {})[p.descKey] || ''}</td>
            </tr>`
          )}
        </tbody>
      </table>
    </div>
  `;
}

/** Version history table. */
export function EAVersions({ ea, t, locale, notes }) {
  if (!ea.versions?.length) return '';
  return html`
    <div class="tablewrap" data-reveal>
      <table class="dtable">
        <thead>
          <tr>
            <th scope="col">${t.ea.detail.versionCol}</th>
            <th scope="col">${t.ea.detail.dateCol}</th>
            <th scope="col">${t.ea.detail.changeCol}</th>
          </tr>
        </thead>
        <tbody>
          ${ea.versions.map(
            (v) => html`<tr>
              <td class="dtable__num">${v.version}</td>
              <td>${formatDate(v.date, locale)}</td>
              <td>${(notes || {})[v.changeKey] || ''}</td>
            </tr>`
          )}
        </tbody>
      </table>
    </div>
  `;
}

/** Per-EA development notes rendered as a compact timeline. */
export function EATimeline({ ea, t, stages, notes }) {
  if (!ea.timeline?.length) return '';
  const byId = Object.fromEntries(stages.map((s) => [s.id, s]));
  return html`
    <ol class="tl tl--compact">
      ${ea.timeline.map((step, i) => {
        const s = byId[step.stage];
        const text = (notes || {})[step.key];
        if (!text) return '';
        return html`<li class="tl__item" data-reveal style="--d:${i % 4}">
          <div class="tl__rail" aria-hidden="true"><span class="tl__node"></span></div>
          <div class="tl__body">
            <p class="tl__meta"><span class="tl__key">${s ? s.key : step.stage}</span></p>
            <p class="tl__text">${text}</p>
          </div>
        </li>`;
      })}
    </ol>
  `;
}
