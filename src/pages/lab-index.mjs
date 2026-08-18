import { html, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { entryI18n, formatDate } from '../lib/i18n.mjs';
import { VIDEOS } from '../site.config.mjs';
import { PageHero, CTABlock } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { CinematicSection } from '../components/media.mjs';

export default function LabIndex({ locale, t, articles, has }) {
  return html`
    ${PageHero({ eyebrow: t.lab.eyebrow, h1: t.lab.h1, h2: t.lab.h2, lead: t.lab.lead })}

    ${CinematicSection({
      video: VIDEOS.backtest,
      available: has.backtest,
      height: 'band',
      label: 'Backtest',
      children: html`
        <div class="cine__copy cine__copy--center">
          <h2 class="band" data-reveal>${t.home.backtest.lines.join(' ')}</h2>
        </div>
      `,
    })}

    <section class="sec" data-reveal-root>
      <div class="wrap">
        ${articles.length
          ? html`<ul class="artlist">
              ${articles.map((a, i) => {
                const c = entryI18n(a, locale);
                return html`<li class="art" data-reveal style="--d:${i % 3}">
                  <a class="art__link" href="${localePath(locale, ROUTES.labArticle(a.slug))}">
                    <div class="art__meta">
                      <time datetime="${a.date}">${formatDate(a.date, locale)}</time>
                      <span class="art__type">${t.lab.types[a.type] || a.type}</span>
                    </div>
                    <h2 class="art__title">${c.title}</h2>
                    ${when(c.summary, () => html`<p class="art__summary">${c.summary}</p>`)}
                    <span class="art__cta"><span>${t.ui.readMore}</span><span aria-hidden="true">→</span></span>
                  </a>
                </li>`;
              })}
            </ul>`
          : html`<p class="empty" data-reveal>${t.lab.empty}</p>`}
      </div>
    </section>

    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${BacktestDisclaimer({ t })}</div>
    </section>

    ${CTABlock({
      title: t.home.ea.h,
      body: t.home.ea.body,
      primary: { href: localePath(locale, ROUTES.ea()), label: t.ui.exploreEAs },
      secondary: { href: localePath(locale, ROUTES.technology()), label: t.nav.technology },
    })}
  `;
}
