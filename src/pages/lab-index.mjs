import { html, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { entryI18n, formatDate } from '../lib/i18n.mjs';
import { VIDEOS } from '../site.config.mjs';
import { PageHero, CTABlock, Button, Decor } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { CinematicSection } from '../components/media.mjs';
import { EquityCurve, MonthlyHeatmap } from '../components/ea-analytics.mjs';
import {
  LabStats,
  Rankings,
  RiskReturnMap,
  PerformanceMatrix,
  Switcher,
  HighRiskLab,
  HIGH_RISK_DD,
} from '../components/lab-analytics.mjs';

/**
 * BACKTEST LAB 2.0
 *
 * The lab was a list of research notes. It is now the cross-system view: the
 * same evidence the detail pages carry, aggregated so systems can be read
 * against each other. The notes stay at the bottom — the URL and their own
 * pages are unchanged.
 *
 * Section order is deliberate: totals, then rankings, then the risk/return
 * placement, then per-system detail, then the systems that need a warning,
 * then the written research.
 */

/** One numbered section. Empty body removes it entirely. */
function Sec({ n, id, title, lead, body, tone = '' }) {
  if (!body || !String(body).trim()) return '';
  return html`
    <section class="sec ${tone}" id="${id}" data-reveal-root>
      <div class="wrap">
        <header class="labsec">
          <p class="eyebrow" data-reveal><span class="eyebrow__n">${n}</span><span>${title}</span></p>
          ${when(lead, () => html`<p class="labsec__lead" data-reveal>${lead}</p>`)}
        </header>
        ${body}
      </div>
    </section>
  `;
}

export default function LabIndex({ locale, t, articles, has, ea }) {
  const d = t.lab.dash;
  const p = (r) => localePath(locale, r);
  const models = ea || [];

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

    ${Sec({ n: '01', id: 'overview', title: d.eyebrow, lead: d.lead, body: LabStats({ models, t }) })}

    ${Sec({
      n: '02',
      id: 'rankings',
      title: d.rankings,
      lead: d.rankingsLead,
      body: Rankings({ models, t, locale }),
    })}

    ${Sec({
      n: '03',
      id: 'risk-return',
      title: d.riskReturn,
      lead: d.riskReturnLead,
      body: RiskReturnMap({ models, t, locale }),
      tone: 'sec--quantum',
    })}

    ${Sec({
      n: '04',
      id: 'matrix',
      title: d.matrix,
      lead: d.matrixLead,
      body: html`${PerformanceMatrix({ models, t, locale })}
        <div class="sec__actions" data-reveal>
          ${Button({ href: p(ROUTES.eaCompare()), label: d.matrixFull, variant: 'ghost' })}
        </div>`,
    })}

    ${Sec({
      n: '05',
      id: 'equity',
      title: d.equity,
      lead: d.equityLead,
      body: Switcher({ id: 'eq', label: d.pick, models, t, panel: (m) => EquityCurve({ model: m, t }) }),
    })}

    ${Sec({
      n: '06',
      id: 'monthly',
      title: d.monthly,
      lead: d.monthlyLead,
      body: Switcher({ id: 'mo', label: d.pick, models, t, panel: (m) => MonthlyHeatmap({ model: m, t }) }),
    })}

    ${Sec({
      n: '07',
      id: 'high-risk',
      title: d.highRisk,
      lead: d.highRiskLead,
      body: HighRiskLab({ models, t, locale }),
      tone: 'sec--failure',
    })}

    ${Sec({
      n: '08',
      id: 'notes',
      title: d.notes,
      body: articles.length
        ? html`<ul class="artlist">
            ${articles.map((a, i) => {
              const c = entryI18n(a, locale);
              return html`<li class="art" data-reveal style="--d:${i % 3}">
                <a class="art__link" href="${p(ROUTES.labArticle(a.slug))}">
                  <div class="art__meta">
                    <time datetime="${a.date}">${formatDate(a.date, locale)}</time>
                    <span class="art__type">${t.lab.types[a.type] || a.type}</span>
                  </div>
                  <h3 class="art__title">${c.title}</h3>
                  ${when(c.summary, () => html`<p class="art__summary">${c.summary}</p>`)}
                  <span class="art__cta"><span>${t.ui.readMore}</span><span aria-hidden="true">→</span></span>
                </a>
              </li>`;
            })}
          </ul>`
        : html`<p class="empty">${t.lab.empty}</p>`,
    })}

    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${BacktestDisclaimer({ t })}</div>
    </section>

    ${CTABlock({
      title: t.home.ea.h,
      body: t.home.ea.body,
      primary: { href: p(ROUTES.ea()), label: t.ui.exploreEAs },
      secondary: { href: p(ROUTES.eaCompare()), label: t.ea.compare.viewAll },
    })}
  `;
}
