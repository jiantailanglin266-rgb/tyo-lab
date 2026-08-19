import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES, asset } from '../lib/url.mjs';
import { entryI18n, formatDate } from '../lib/i18n.mjs';
import { Button, Eyebrow } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { VideoEmbed } from '../components/media.mjs';
import { EASpecs, EAParameters, EAVersions, EATimeline, EAEnvironment } from '../components/ea.mjs';
import {
  ScoreCard,
  PerformanceSnapshot,
  EquityCurve,
  DrawdownAnalysis,
  MonthlyHeatmap,
  YearlyTable,
  TradeStatistics,
  RiskProfile,
  ResearchTransparency,
  StatusBadge,
} from '../components/ea-analytics.mjs';

/**
 * EA DETAIL 2.0
 *
 * A fixed running order, numbered so the page reads as documentation rather
 * than a brochure. Sections render only when their data exists — a section
 * with nothing to show is omitted entirely rather than filled with a
 * placeholder, so the page length is an honest signal of how much is known.
 *
 * Order is documented in docs/EA_DATA_SCHEMA.md and must stay stable: the
 * numbers appear in the on-page index and in external links.
 */

/** One numbered block. Returns '' when `body` is empty, which removes it. */
function Block({ n, id, title, body, lead = null }) {
  if (!body) return '';
  return html`
    <section class="block" id="${id}" data-reveal-root>
      <h2 class="block__title" data-reveal>
        <span class="block__n">${n}</span>
        <span class="block__bar" aria-hidden="true"></span>
        ${title}
      </h2>
      ${when(lead, () => html`<p class="block__lead" data-reveal>${lead}</p>`)}
      <div class="block__body">${body}</div>
    </section>
  `;
}

export default function EADetail({ locale, t, ea: model, next, stages }) {
  const c = entryI18n(model, locale);
  const d = t.ea.detail;
  const S = t.ea.sections;
  const p = (r) => localePath(locale, r);

  /* Sections are built first so the on-page index can list only the ones that
     actually rendered. */
  const blocks = [
    {
      n: '01',
      id: 'overview',
      title: S.overview,
      body: c.overview ? html`<p class="lead">${c.overview}</p>${when(c.concept, () => html`<p class="prose">${c.concept}</p>`)}` : null,
    },
    {
      n: '02',
      id: 'architecture',
      title: S.architecture,
      body: c.strategy || c.logic
        ? html`${when(c.strategy, () => html`<p class="prose">${c.strategy}</p>`)}
            ${when(c.logic, () => html`<p class="prose">${c.logic}</p>`)}`
        : null,
    },
    {
      n: '03',
      id: 'performance',
      title: S.performance,
      body: PerformanceSnapshot({ model, t }),
    },
    { n: '04', id: 'equity', title: S.equity, body: EquityCurve({ model, t }) },
    { n: '05', id: 'drawdown', title: S.drawdown, body: DrawdownAnalysis({ model, t }) },
    { n: '06', id: 'monthly', title: S.monthly, body: MonthlyHeatmap({ model, t }) },
    { n: '07', id: 'yearly', title: S.yearly, body: YearlyTable({ model, t }) },
    { n: '08', id: 'trade-stats', title: S.tradeStats, body: TradeStatistics({ model, t }) },
    {
      n: '09',
      id: 'risk',
      title: S.riskProfile,
      body: html`${RiskProfile({ model, t })}${when(c.riskManagement, () => html`<p class="prose">${c.riskManagement}</p>`)}`,
    },
    {
      n: '10',
      id: 'parameters',
      title: S.parameters,
      body: EAParameters({ ea: model, t, params: c.params }),
    },
    {
      n: '11',
      id: 'environment',
      title: d.environment,
      body: EAEnvironment({ ea: model, t, text: c.environment }),
    },
    {
      n: '12',
      id: 'story',
      title: S.story,
      body: EATimeline({ ea: model, t, stages, notes: c.timelineNotes }),
    },
    {
      n: '13',
      id: 'versions',
      title: S.versions,
      body: EAVersions({ ea: model, t, locale, notes: c.versionNotes }),
    },
    {
      n: '14',
      id: 'transparency',
      title: S.transparency,
      body: ResearchTransparency({ model, t }),
    },
  ].filter((b) => b.body && String(b.body).trim());

  const hasVideo = model.media.video && model.media.video.type;

  return html`
    <article class="ea">
      <!-- HERO -->
      <header class="eahero${model.media.cover ? ' eahero--art' : ''}" data-reveal-root>
        ${when(
          model.media.cover,
          () => html`<div class="eahero__art" aria-hidden="true">
            <img src="${asset(model.media.cover)}" alt="" loading="eager" fetchpriority="high" decoding="async" width="1200" height="1200" />
          </div>`
        )}
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="${p(ROUTES.ea())}">${t.nav.ea}</a>
            <span aria-hidden="true">/</span>
            <span>${model.name}</span>
          </nav>

          <div class="eahero__grid">
            <div class="eahero__main">
              ${Eyebrow(`EA ${model.number}`)}
              <h1 class="eahero__name" data-reveal>${model.name}</h1>
              ${when(c.tagline, () => html`<p class="eahero__tagline" data-reveal>${c.tagline}</p>`)}

              <ul class="eafacts" data-reveal>
                ${[
                  [t.ea.labels.symbol, model.spec.symbol],
                  [t.ea.labels.timeframe, model.spec.timeframe],
                  [t.ea.labels.strategy, model.spec.strategy],
                  [
                    t.ea.labels.risk,
                    model.spec.risk ? t.ea.risk[model.spec.risk] : null,
                    model.spec.riskDerived ? t.ea.riskDerivedNote : null,
                  ],
                ]
                  .filter(([, v]) => v)
                  .map(
                    ([k, v, note]) => html`<li>
                      <span class="eafacts__k">${k}</span>
                      <span class="eafacts__v">${v}</span>
                      ${when(note, () => html`<span class="eafacts__note" title="${note}">*</span>`)}
                    </li>`
                  )}
              </ul>

              <div class="eahero__meta" data-reveal>
                ${StatusBadge({ status: model.researchStatus, t })}
                ${when(model.spec.price === 'free', () => html`<span class="badge is-free">${t.ui.free}</span>`)}
                ${when(model.spec.price === 'paid', () => html`<span class="badge is-paid">${t.ui.paid}</span>`)}
                ${when(hasVideo, () => html`<span class="badge is-video">${d.video}</span>`)}
                ${when(model.spec.version, () => html`<span class="meta">${t.ui.version} ${model.spec.version}</span>`)}
              </div>

              <div class="eahero__actions" data-reveal>
                ${when(blocks.some((b) => b.id === 'performance'), () => Button({ href: '#performance', label: S.performance }))}
                ${when(
                  model.mql5Url,
                  () => Button({ href: model.mql5Url, label: t.ui.viewOnMql5, variant: 'ghost', external: true, srNote: t.ui.externalLink })
                )}
              </div>
            </div>

            <div class="eahero__score" data-reveal>${ScoreCard({ model, t })}</div>
          </div>
        </div>
        <canvas class="eahero__particles" data-particles="spectrum" aria-hidden="true"></canvas>
      </header>

      <!-- On-page index: only the sections that rendered -->
      ${when(
        blocks.length > 3,
        () => html`<nav class="eaindex" aria-label="${model.name}">
          <div class="wrap eaindex__inner">
            ${blocks.map((b) => html`<a href="#${b.id}"><span>${b.n}</span>${b.title}</a>`)}
          </div>
        </nav>`
      )}

      <div class="wrap ea__grid">
        <div class="ea__main">
          ${blocks.map((b) => Block(b))}

          ${when(
            hasVideo,
            () => html`<section class="block" id="video" data-reveal-root>
              <h2 class="block__title" data-reveal>
                <span class="block__n">15</span><span class="block__bar" aria-hidden="true"></span>${d.video}
              </h2>
              <div class="block__body">${VideoEmbed({ video: model.media.video, t, title: `${model.name} — ${d.video}` })}</div>
            </section>`
          )}

          <section class="block" id="disclaimer" data-reveal-root>
            <h2 class="block__title" data-reveal>
              <span class="block__n">${hasVideo ? '16' : '15'}</span><span class="block__bar" aria-hidden="true"></span>${S.disclaimer}
            </h2>
            <div class="block__body">
              ${BacktestDisclaimer({ t })}
              <div class="fineprint">${t.footer.disclaimer.map((x) => html`<p>${x}</p>`)}</div>
            </div>
          </section>
        </div>

        <!-- Sticky spec rail -->
        <aside class="ea__side">
          <div class="ea__sticky">
            ${ScoreCard({ model, t, compact: true })}
            ${EASpecs({ ea: model, locale, t })}
            ${when(
              model.mql5Url,
              () => html`<a class="ea__side-cta" href="${model.mql5Url}" target="_blank" rel="noopener noreferrer">
                ${t.ui.downloadEA}<span aria-hidden="true">↗</span>
              </a>`
            )}
          </div>
        </aside>
      </div>

      <!-- CTA -->
      <nav class="eanext" aria-label="${d.nextEa}">
        <div class="wrap eanext__inner">
          <a class="eanext__back" href="${p(ROUTES.ea())}"><span aria-hidden="true">←</span>${d.backToList}</a>
          ${when(
            next,
            () => html`<a class="eanext__next" href="${p(ROUTES.eaDetail(next.slug))}">
              <span class="eanext__label">${d.nextEa}</span>
              <span class="eanext__name">${next.name}<span aria-hidden="true">→</span></span>
            </a>`
          )}
        </div>
      </nav>
    </article>
  `;
}
