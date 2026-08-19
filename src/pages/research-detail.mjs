import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { formatDate } from '../lib/i18n.mjs';
import { Eyebrow } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { ExpStatus, SourceTag, DiffChips, MetricsTable } from '../components/research.mjs';

const has = (v) => v !== null && v !== undefined && v !== '';

/**
 * EXPERIMENT DETAIL — one entry of the research log.
 *
 * Reconstructed entries open with the metadata-unavailable banner, because
 * their credibility rests on the absence being the first thing a reader
 * sees. Non-comparable pairs additionally carry the not-a-controlled-
 * comparison warning above their numbers.
 */
function Block({ id, title, body }) {
  if (!body || !String(body).trim()) return '';
  return html`
    <section class="block" id="${id}" data-reveal-root>
      <h2 class="block__title" data-reveal><span class="block__bar" aria-hidden="true"></span>${title}</h2>
      <div class="block__body">${body}</div>
    </section>
  `;
}

export default function ResearchDetail({ locale, t, exp, eaNames, prev, next }) {
  const R = t.research;
  const D = R.detail;
  const p = (r) => localePath(locale, r);
  const eaName = exp.strategyId ? eaNames[exp.strategyId] || exp.strategyId.toUpperCase() : null;

  return html`
    <article class="xdetail">
      <header class="labhero" data-reveal-root>
        <div class="wrap wrap--narrow">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="${p(ROUTES.research())}">${t.nav.research}</a>
            <span aria-hidden="true">/</span>
            <span>${exp.experimentId}</span>
          </nav>
          ${Eyebrow(exp.experimentId)}
          <h1 class="labhero__title" data-reveal>${exp.title}</h1>

          <div class="xdetail__meta" data-reveal>
            ${ExpStatus({ status: exp.status, t })}
            <span class="xcard__cat">${R.categories[exp.category] || exp.category}</span>
            ${SourceTag({ source: exp.source, t })}
            <span class="xcard__date">${exp.createdAt ? formatDate(exp.createdAt, locale) : R.list.undated}</span>
          </div>

          <dl class="labhero__meta" data-reveal>
            ${when(
              eaName,
              () => html`<div>
                <dt>${D.strategy}</dt>
                <dd><a class="xdetail__ealink" href="${p(ROUTES.eaDetail(exp.strategyId))}">${eaName}</a></dd>
              </div>`
            )}
            ${when(!exp.strategyId, () => html`<div><dt>${D.strategy}</dt><dd>${D.platformScope}</dd></div>`)}
            ${when(has(exp.gitCommit) && exp.gitCommit !== 'phase-6', () => html`<div><dt>${D.commit}</dt><dd><code>${exp.gitCommit}</code></dd></div>`)}
            ${when(
              exp.files?.length,
              () => html`<div><dt>${D.files}</dt><dd>${exp.files.join(' · ')}</dd></div>`
            )}
          </dl>

          ${when(
            exp.metadataAvailable === false,
            () => html`<p class="warn" data-reveal>${D.metaUnavailable}</p>`
          )}
        </div>
      </header>

      <div class="wrap wrap--narrow xdetail__body">
        ${Block({
          id: 'hypothesis',
          title: D.hypothesis,
          body: html`<p class="prose ${raw(has(exp.hypothesis) ? '' : 'is-na')}">${has(exp.hypothesis) ? exp.hypothesis : R.list.notAvailable}</p>`,
        })}

        ${Block({
          id: 'change',
          title: D.change,
          body: has(exp.changeSummary) ? html`<p class="prose">${exp.changeSummary}</p>` : null,
        })}

        ${Block({
          id: 'dataset',
          title: D.dataset,
          body: has(exp.dataset) ? html`<p class="prose">${exp.dataset}</p>` : null,
        })}

        ${when(
          exp.comparable === false && (exp.metricsBefore || exp.metricsAfter),
          () => html`<p class="warn warn--sm" data-reveal>${D.notComparable}</p>`
        )}

        ${when(
          exp.metricsBefore || exp.metricsAfter,
          () => html`<section class="block" id="results" data-reveal-root>
            <h2 class="block__title" data-reveal><span class="block__bar" aria-hidden="true"></span>${D.before} / ${D.after}</h2>
            <div class="block__body xcompare">
              <div class="xcompare__col">
                <p class="statgrid__title">${D.before}</p>
                ${MetricsTable({ metrics: exp.metricsBefore, t })}
              </div>
              <div class="xcompare__col">
                <p class="statgrid__title">${D.after}</p>
                ${MetricsTable({ metrics: exp.metricsAfter, t })}
              </div>
            </div>
            ${when(exp.diff, () => html`<div class="block__body"><p class="statgrid__title">${D.diff}</p>${DiffChips({ diff: exp.diff, t })}</div>`)}
          </section>`
        )}

        ${Block({
          id: 'validation',
          title: D.validation,
          body: html`<p class="prose">${D.validationNote}</p>`,
        })}

        ${Block({
          id: 'decision',
          title: D.decision,
          body: html`
            <div class="xdecision xdecision--${raw(exp.status.toLowerCase())}" data-reveal>
              ${ExpStatus({ status: exp.status, t })}
              <p class="xdecision__why ${raw(has(exp.reason) ? '' : 'is-na')}">
                ${has(exp.reason) ? exp.reason : R.list.notAvailable}
              </p>
            </div>
          `,
        })}

        ${Block({
          id: 'notes',
          title: D.notes,
          body: has(exp.notes) ? html`<p class="prose">${exp.notes}</p>` : null,
        })}

        <p class="warn warn--sm" data-reveal>${R.overfitting}</p>

        <div class="labdisc">${BacktestDisclaimer({ t, compact: true })}</div>
      </div>

      <nav class="eanext" aria-label="${D.backToLog}">
        <div class="wrap eanext__inner">
          <a class="eanext__back" href="${p(ROUTES.research())}"><span aria-hidden="true">←</span>${D.backToLog}</a>
          ${when(
            next,
            () => html`<a class="eanext__next" href="${p(ROUTES.researchDetail(next.experimentId.toLowerCase()))}">
              <span class="eanext__label">${next.experimentId}</span>
              <span class="eanext__name">${next.title.slice(0, 44)}<span aria-hidden="true">→</span></span>
            </a>`
          )}
        </div>
      </nav>
    </article>
  `;
}
