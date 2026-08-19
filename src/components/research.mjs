/**
 * ============================================================================
 * RESEARCH components — experiment cards, status marks, metric tables
 * ============================================================================
 * Status is never colour alone: every status renders an icon glyph + text.
 * Null fields render as "Not recorded" — the honesty of the reconstructed
 * class depends on the absence being visible, not papered over.
 * ============================================================================
 */

import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { formatDate } from '../lib/i18n.mjs';

const has = (v) => v !== null && v !== undefined && v !== '';

/** Icon per status — shape carries the meaning alongside colour and text. */
const STATUS_ICON = {
  IDEA: '◇',
  RESEARCHING: '◐',
  BACKTESTING: '▶',
  VALIDATING: '◈',
  ACCEPTED: '✓',
  REJECTED: '✕',
  INCONCLUSIVE: '≈',
  ARCHIVED: '▤',
};

export function ExpStatus({ status, t }) {
  const label = t.research.statuses[status] || status;
  return html`<span class="xstatus xstatus--${raw(status.toLowerCase())}">
    <i aria-hidden="true">${STATUS_ICON[status] || '•'}</i>${label}
  </span>`;
}

export function SourceTag({ source, t }) {
  if (!has(source)) return '';
  return html`<span class="xsource">${t.research.sourceLabel}: ${t.research.sources[source] || source}</span>`;
}

/** Signed diff chip: +0.12 green-ish, −2.4 red-ish, but sign is the signal. */
function diffChip(label, v, unit = '') {
  if (!has(v)) return '';
  const s = v > 0 ? `+${v}` : String(v);
  return html`<span class="xdiff ${raw(v > 0 ? 'is-up' : v < 0 ? 'is-down' : '')}">${label} ${s}${unit}</span>`;
}

export function DiffChips({ diff, t }) {
  if (!diff) return '';
  const L = t.research.metricLabels;
  return html`<div class="xdiffs">
    ${diffChip(L.profitFactor, diff.profitFactor)}
    ${diffChip(L.maxDrawdownPct, diff.maxDrawdownPct, 'pp')}
    ${diffChip(L.trades, diff.trades)}
    ${diffChip(L.winRate, diff.winRate, 'pp')}
    ${diffChip(L.positiveShare, diff.positiveShare, 'pp')}
    ${diffChip(L.meanMonthly, diff.meanMonthly, 'pp')}
    ${diffChip(L.worstMonth, diff.worstMonth, 'pp')}
  </div>`;
}

/** Card on the research index. */
export function ExperimentCard({ exp, t, locale, eaNames }) {
  const R = t.research;
  const href = localePath(locale, ROUTES.researchDetail(exp.experimentId.toLowerCase()));
  const eaName = exp.strategyId ? eaNames[exp.strategyId] || exp.strategyId.toUpperCase() : null;

  return html`
    <li class="xcard" data-reveal
        data-status="${exp.status}"
        data-ea="${exp.strategyId || '_platform'}"
        data-category="${exp.category}"
        data-source="${exp.source || ''}"
        data-date="${exp.createdAt || ''}">
      <a class="xcard__link" href="${href}">
        <div class="xcard__head">
          <span class="xcard__id">${exp.experimentId}</span>
          ${ExpStatus({ status: exp.status, t })}
        </div>
        <h3 class="xcard__title">${exp.title}</h3>
        <div class="xcard__meta">
          ${when(eaName, () => html`<span class="xcard__ea">${eaName}</span>`)}
          <span class="xcard__cat">${R.categories[exp.category] || exp.category}</span>
          ${when(exp.source, () => html`<span class="xcard__src">${R.sources[exp.source] || exp.source}</span>`)}
          <span class="xcard__date">${exp.createdAt ? formatDate(exp.createdAt, locale) : R.list.undated}</span>
        </div>
        <dl class="xcard__body">
          <div>
            <dt>${R.list.hypothesis}</dt>
            <dd class="${raw(has(exp.hypothesis) ? '' : 'is-na')}">${has(exp.hypothesis) ? exp.hypothesis : R.list.notAvailable}</dd>
          </div>
          <div>
            <dt>${R.list.decision}</dt>
            <dd class="${raw(has(exp.reason) ? '' : 'is-na')}">${has(exp.reason) ? exp.reason : R.list.notAvailable}</dd>
          </div>
        </dl>
        ${DiffChips({ diff: exp.diff, t })}
        <span class="xcard__cta"><span>${R.list.readEntry}</span><span aria-hidden="true">→</span></span>
      </a>
    </li>
  `;
}

/** Metrics table for before/after blocks (order-stable, nulls dashed). */
export function MetricsTable({ metrics, t }) {
  if (!metrics) return '';
  const L = t.research.metricLabels;
  const ORDER = [
    ['period', (m) => (m.from && m.to ? `${m.from} → ${m.to}` : m.period)],
    ['symbol', (m) => m.symbol],
    ['months', (m) => m.months],
    ['profitFactor', (m) => m.profitFactor],
    ['maxDrawdownPct', (m) => (has(m.maxDrawdownPct) ? `${m.maxDrawdownPct}% (${m.drawdownBasis || '?'})` : null)],
    ['trades', (m) => (has(m.trades) ? Number(m.trades).toLocaleString('en-US') : null)],
    ['winRate', (m) => (has(m.winRate) ? `${m.winRate}%` : null)],
    ['positiveShare', (m) => (has(m.positiveShare) ? `${m.positiveShare}%` : null)],
    ['meanMonthly', (m) => (has(m.meanMonthly) ? `${m.meanMonthly}%` : null)],
    ['worstMonth', (m) => (has(m.worstMonth) ? `${m.worstMonth}%` : null)],
  ];

  /* Curated experiments use {note, value} instead of a metric bag. */
  if (has(metrics.note)) {
    return html`<dl class="kvlist kvlist--tight">
      <div class="kvlist__row"><dt>${metrics.note}</dt><dd>${metrics.value}</dd></div>
    </dl>`;
  }

  const rows = ORDER.map(([k, get]) => [L[k] || k, get(metrics)]).filter(([, v]) => has(v));
  if (!rows.length) return '';
  return html`<dl class="kvlist kvlist--tight">
    ${rows.map(([k, v]) => html`<div class="kvlist__row"><dt>${k}</dt><dd>${v}</dd></div>`)}
  </dl>`;
}

/* ------------------------------------------------------------------ *
 * Evidence checklist — shared by EA detail and (later) the terminal
 * ------------------------------------------------------------------ */

export function EvidenceChecklist({ evidence, t, compact = false }) {
  const E = t.evidence;
  const stageKeys = Object.keys(E.stages);
  return html`
    <div class="evid${raw(compact ? ' evid--compact' : '')}">
      <div class="evid__head">
        <p class="evid__title">${E.title}</p>
        <p class="evid__score">${evidence.points}<i>/${evidence.max}</i></p>
      </div>
      ${when(!compact, () => html`<p class="evid__lead">${E.lead}</p>`)}
      <ul class="evid__stages">
        ${stageKeys.map((k) => {
          const ok = evidence.stages[k];
          return html`<li class="${raw(ok ? 'is-ok' : '')}">
            <i aria-hidden="true">${ok ? '✓' : '—'}</i>
            <span class="evid__k">${E.stages[k]}</span>
            <span class="evid__v">${ok ? E.verified : E.pending}</span>
          </li>`;
        })}
      </ul>
      ${when(!compact, () => html`<p class="fineline">${E.oosNote}</p>`)}
    </div>
  `;
}
