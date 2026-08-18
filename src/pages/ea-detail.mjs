import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES, asset } from '../lib/url.mjs';
import { entryI18n, formatDate } from '../lib/i18n.mjs';
import { Button, Eyebrow, PlaceholderNotice } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { VideoEmbed } from '../components/media.mjs';
import { EASpecs, EAMetrics, EAParameters, EAVersions, EATimeline, EAEnvironment } from '../components/ea.mjs';

/** One section of the detail page. Rendered only when it has content. */
const Block = (id, title, body) =>
  body
    ? html`<section class="block" id="${id}" data-reveal-root>
        <h2 class="block__title" data-reveal><span class="block__bar" aria-hidden="true"></span>${title}</h2>
        <div class="block__body">${body}</div>
      </section>`
    : '';

export default function EADetail({ locale, t, ea, next, stages }) {
  const c = entryI18n(ea, locale);
  const d = t.ea.detail;
  const hasBacktest = (ea.backtests || []).length > 0;

  return html`
    <article class="ea">
      <!-- Hero -->
      <header class="eahero${ea.image ? ' eahero--art' : ''}" data-reveal-root>
        ${when(
          ea.image,
          () => html`<div class="eahero__art" aria-hidden="true">
            <img src="${asset(ea.image)}" alt="" loading="eager" fetchpriority="high" decoding="async" width="1024" height="1024" />
          </div>`
        )}
        <div class="wrap">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="${localePath(locale, ROUTES.ea())}">${t.nav.ea}</a>
            <span aria-hidden="true">/</span>
            <span>${ea.name}</span>
          </nav>
          ${Eyebrow(`EA ${ea.number}`)}
          <h1 class="eahero__name" data-reveal>${ea.name}</h1>
          ${when(c.tagline, () => html`<p class="eahero__tagline" data-reveal>${c.tagline}</p>`)}
          <div class="eahero__meta" data-reveal>
            ${when(ea.spec.price === 'free', () => html`<span class="badge is-free">${t.ui.free}</span>`)}
            ${when(ea.spec.price === 'paid', () => html`<span class="badge is-paid">${t.ui.paid}</span>`)}
            ${when(ea.spec.version, () => html`<span class="meta">${t.ui.version} ${ea.spec.version}</span>`)}
            ${when(
              ea.spec.releaseDate,
              () => html`<span class="meta">${t.ui.published} ${formatDate(ea.spec.releaseDate, locale)}</span>`
            )}
          </div>
          <div class="eahero__actions" data-reveal>
            ${when(
              ea.mql5Url,
              () => Button({ href: ea.mql5Url, label: t.ui.viewOnMql5, external: true, srNote: t.ui.externalLink })
            )}
            ${when(hasBacktest, () => Button({ href: '#backtest', label: d.backtest, variant: 'ghost' }))}
          </div>
          ${when(ea.placeholder, () => PlaceholderNotice({ locale }))}
        </div>
        <canvas class="eahero__particles" data-particles="spectrum" aria-hidden="true"></canvas>
      </header>

      <div class="wrap ea__grid">
        <div class="ea__main">
          ${Block('overview', d.overview, c.overview ? html`<p class="lead">${c.overview}</p>` : null)}
          ${Block('concept', d.concept, c.concept ? html`<p class="prose">${c.concept}</p>` : null)}
          ${Block('strategy', d.strategy, c.strategy ? html`<p class="prose">${c.strategy}</p>` : null)}
          ${Block('logic', d.logic, c.logic ? html`<p class="prose">${c.logic}</p>` : null)}
          ${Block('risk', d.riskManagement, c.riskManagement ? html`<p class="prose">${c.riskManagement}</p>` : null)}

          ${when(
            hasBacktest,
            () => html`
              <section class="block" id="backtest" data-reveal-root>
                <h2 class="block__title" data-reveal><span class="block__bar" aria-hidden="true"></span>${d.backtest}</h2>
                <div class="block__body">
                  ${ea.backtests.map((bt) => EAMetrics({ bt, t, locale }))}
                  ${BacktestDisclaimer({ t, compact: true })}
                </div>
              </section>
            `
          )}

          ${when(
            ea.video && ea.video.type,
            () =>
              html`<section class="block" id="video" data-reveal-root>
                <h2 class="block__title" data-reveal><span class="block__bar" aria-hidden="true"></span>${d.video}</h2>
                <div class="block__body">${VideoEmbed({ video: ea.video, t, title: `${ea.name} — ${d.video}` })}</div>
              </section>`
          )}

          ${Block('parameters', d.parameters, EAParameters({ ea, t, params: c.params }))}
          ${Block('environment', d.environment, EAEnvironment({ ea, t, text: c.environment }))}
          ${Block('history', d.history, EATimeline({ ea, t, stages, notes: c.timelineNotes }))}
          ${Block('versions', d.versions, EAVersions({ ea, t, locale, notes: c.versionNotes }))}

          <section class="block" id="download" data-reveal-root>
            <h2 class="block__title" data-reveal><span class="block__bar" aria-hidden="true"></span>${d.download}</h2>
            <div class="block__body">
              <p class="prose">${d.downloadBody}</p>
              ${when(
                ea.mql5Url,
                () => html`<div class="block__actions">
                  ${Button({ href: ea.mql5Url, label: t.ui.viewOnMql5, external: true, srNote: t.ui.externalLink })}
                </div>`
              )}
            </div>
          </section>

          <section class="block" id="disclaimer" data-reveal-root>
            <h2 class="block__title" data-reveal><span class="block__bar" aria-hidden="true"></span>${d.disclaimer}</h2>
            <div class="block__body">
              <div class="fineprint">${t.footer.disclaimer.map((x) => html`<p>${x}</p>`)}</div>
            </div>
          </section>
        </div>

        <!-- Sticky spec rail -->
        <aside class="ea__side">
          <div class="ea__sticky">
            <p class="ea__side-title">${t.ea.labels.status}</p>
            ${EASpecs({ ea, locale, t })}
            ${when(
              ea.mql5Url,
              () => html`<a class="ea__side-cta" href="${ea.mql5Url}" target="_blank" rel="noopener noreferrer">
                ${t.ui.downloadEA}<span aria-hidden="true">↗</span>
              </a>`
            )}
          </div>
        </aside>
      </div>

      <nav class="eanext" aria-label="${t.ea.detail.nextEa}">
        <div class="wrap eanext__inner">
          <a class="eanext__back" href="${localePath(locale, ROUTES.ea())}"><span aria-hidden="true">←</span>${d.backToList}</a>
          ${when(
            next,
            () => html`<a class="eanext__next" href="${localePath(locale, ROUTES.eaDetail(next.slug))}">
              <span class="eanext__label">${d.nextEa}</span>
              <span class="eanext__name">${next.name}<span aria-hidden="true">→</span></span>
            </a>`
          )}
        </div>
      </nav>
    </article>
  `;
}
