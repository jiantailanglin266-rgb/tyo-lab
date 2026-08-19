/**
 * ============================================================================
 * VALIDATION UI (Phase 14 §56–62)
 * ============================================================================
 * Renders OOS and walk-forward records exactly as the engine produced them:
 * FAILED shows as failed, INCONCLUSIVE as inconclusive, every window appears
 * (§26), and RETROSPECTIVE records carry their honesty banner. Status is
 * never colour alone.
 * ============================================================================
 */

import { html, raw, when } from '../lib/html.mjs';

const DASH = '—';
const has = (v) => v !== null && v !== undefined && v !== '';
const show = (v) => (has(v) ? v : DASH);
const pct = (v) => (has(v) ? `${v}%` : DASH);

const ST_ICON = { PASSED: '✓', FAILED: '✕', INCONCLUSIVE: '≈', INVALID: '▤' };

function StatusChip({ status, t }) {
  return html`<span class="xstatus vstatus--${raw(status.toLowerCase())}">
    <i aria-hidden="true">${ST_ICON[status] || '•'}</i>${t.val[`st${status}`] || status}
  </span>`;
}

function ProvenanceChip({ v, t }) {
  const retro = v.provenance === 'RETROSPECTIVE';
  return html`<span class="badge ${raw(retro ? 'is-retro' : 'is-verified')}">${retro ? t.val.retrospective : t.val.prospective}</span>`;
}

function ChecksList({ checks, t }) {
  if (!checks?.length) return '';
  return html`
    <p class="statgrid__title">${t.val.checks}</p>
    <ul class="vchecks">
      ${checks.map(
        (c) => html`<li class="${raw(c.ok ? 'is-ok' : 'is-bad')}">
          <i aria-hidden="true">${c.ok ? '✓' : '✕'}</i>
          <code>${c.rule}</code> ${show(c.value)} <span class="vchecks__thr">(≥/≤ ${show(c.threshold)})</span>
        </li>`
      )}
    </ul>
  `;
}

function OOSCard({ v, t }) {
  const V = t.val;
  const tr = v.trainMetrics;
  const te = v.testMetrics;
  const L = t.research.metricLabels;
  return html`
    <div class="vcard" data-reveal>
      <div class="vcard__head">
        <span class="xcard__id">${v.validationId}</span>
        ${StatusChip({ status: v.status, t })}
        ${ProvenanceChip({ v, t })}
      </div>
      ${when(v.provenance === 'RETROSPECTIVE', () => html`<p class="warn warn--sm">${V.retroNote}</p>`)}
      <dl class="kvlist kvlist--tight">
        <div class="kvlist__row"><dt>${V.frozen}</dt><dd><code>${v.manifest?.parametersHash || DASH}</code></dd></div>
      </dl>
      <div class="tablewrap">
        <table class="dtable">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">${V.period}</th>
              <th scope="col">${L.trades}</th>
              <th scope="col">${L.profitFactor}</th>
              <th scope="col">${L.winRate}</th>
              <th scope="col">${L.maxDrawdownPct}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">${V.train}</th>
              <td>${v.manifest.trainStart} → ${v.manifest.trainEnd}</td>
              <td class="dtable__num">${show(tr?.trades)}</td>
              <td class="dtable__num">${show(tr?.profitFactor)}</td>
              <td class="dtable__num">${pct(tr?.winRate)}</td>
              <td class="dtable__num">${pct(tr?.relativeDrawdownPct)}</td>
            </tr>
            <tr>
              <th scope="row">${V.test}</th>
              <td>${v.manifest.testStart} → ${v.manifest.testEnd}</td>
              <td class="dtable__num">${show(te?.trades)}</td>
              <td class="dtable__num">${show(te?.profitFactor)}</td>
              <td class="dtable__num">${pct(te?.winRate)}</td>
              <td class="dtable__num">${pct(te?.relativeDrawdownPct)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ${when(v.ratios, () => html`
        <p class="statgrid__title">${V.ratios}</p>
        <div class="xdiffs">
          <span class="xdiff">${V.pfRet} ${show(v.ratios.pfRetention)}</span>
          <span class="xdiff">${V.payoffRet} ${show(v.ratios.expectedPayoffRetention)}</span>
          <span class="xdiff">${V.freqRatio} ${show(v.ratios.tradesPerMonthRatio)}</span>
          <span class="xdiff">${V.ddRatio} ${show(v.ratios.ddRatio)}</span>
        </div>
      `)}
      ${ChecksList({ checks: v.checks, t })}
      ${when(v.inconclusiveReason, () => html`<p class="fineline">${v.inconclusiveReason}</p>`)}
      ${when(v.warnings?.length, () => html`<p class="fineline">${V.warningsTitle}: ${v.warnings.join(' · ')}</p>`)}
    </div>
  `;
}

function WFCard({ v, t }) {
  const V = t.val;
  const L = t.research.metricLabels;
  const a = v.aggregate;
  return html`
    <div class="vcard" data-reveal>
      <div class="vcard__head">
        <span class="xcard__id">${v.validationId}</span>
        ${StatusChip({ status: v.status, t })}
        ${ProvenanceChip({ v, t })}
        <span class="xcard__cat">${V.mode}: ${v.mode}</span>
      </div>
      ${when(v.provenance === 'RETROSPECTIVE', () => html`<p class="warn warn--sm">${V.retroNote}</p>`)}
      <p class="fineline">${V.fixedNote}</p>

      <dl class="kvlist kvlist--tight">
        <div class="kvlist__row"><dt>${V.windowsN}</dt><dd>${a.evaluatedWindows}/${a.windows}</dd></div>
        <div class="kvlist__row"><dt>${V.positiveRate}</dt><dd>${a.positiveWindows}/${a.evaluatedWindows} (${show(a.positiveWindowRate)})</dd></div>
        <div class="kvlist__row"><dt>${V.topShare}</dt><dd>${show(a.topWindowShare)}</dd></div>
        <div class="kvlist__row"><dt>${V.wfe}</dt><dd>${show(a.wfeTYO)}</dd></div>
      </dl>
      <p class="fineline">${V.wfeNote}</p>

      <p class="statgrid__title">${V.stitched}</p>
      <div class="xdiffs">
        <span class="xdiff">${L.trades} ${show(a.stitched?.trades)}</span>
        <span class="xdiff">${L.profitFactor} ${show(a.stitched?.profitFactor)}</span>
        <span class="xdiff">${L.winRate} ${pct(a.stitched?.winRate)}</span>
        <span class="xdiff">${V.net} ${show(a.stitched?.netProfit)}</span>
      </div>

      <div class="tablewrap">
        <table class="dtable">
          <thead>
            <tr>
              <th scope="col">${V.window}</th>
              <th scope="col">${V.train}</th>
              <th scope="col">${V.test}</th>
              <th scope="col">${L.trades}</th>
              <th scope="col">${L.profitFactor}</th>
              <th scope="col">${V.net}</th>
            </tr>
          </thead>
          <tbody>
            ${v.windows.map(
              (w) => html`<tr>
                <th scope="row">${w.windowId}${w.lowSample ? ' ⚠' : ''}</th>
                <td>${w.trainStart}→${w.trainEnd}</td>
                <td>${w.testStart}→${w.testEnd}</td>
                <td class="dtable__num">${show(w.testMetrics?.trades)}</td>
                <td class="dtable__num">${show(w.testMetrics?.profitFactor)}</td>
                <td class="dtable__num">${show(w.testMetrics?.netProfit)}</td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>

      <p class="statgrid__title">${V.stability}</p>
      <p class="fineline">${v.stability?.overall === 'NOT_APPLICABLE' ? V.stabilityNA : v.stability?.overall || DASH}</p>

      ${ChecksList({ checks: v.checks, t })}
      ${when(v.inconclusiveReason, () => html`<p class="fineline">${v.inconclusiveReason}</p>`)}
      ${when(v.warnings?.length, () => html`<p class="fineline">${V.warningsTitle}: ${v.warnings.join(' · ')}</p>`)}
    </div>
  `;
}

export function ValidationPanel({ model, t }) {
  const list = model.validations || [];
  if (!list.length) return '';
  return html`
    <div class="vpanel">
      <p class="mcpanel__lead">${t.val.lead}</p>
      ${list.map((v) => (v.type === 'OOS' ? OOSCard({ v, t }) : WFCard({ v, t })))}
    </div>
  `;
}
