import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { formatDate } from '../lib/i18n.mjs';
import { Eyebrow, Decor } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { ExpStatus } from '../components/research.mjs';
import { EVIDENCE_STAGES } from '../lib/evidence.mjs';
import { experimentStats } from '../data/experiments.mjs';

/**
 * TYO TERMINAL — the platform's state on one screen.
 *
 * Everything here is a re-projection of data other pages already render:
 * the evidence map reads model.evidence and model.score, the stats strip
 * sums the extracted trade data, the feed lists the same experiments the
 * research log shows. The page makes no claim of its own — that is its
 * design constraint, stated in the hero.
 */

const has = (v) => v !== null && v !== undefined && v !== '';
const num = (n) => (has(n) ? Number(n).toLocaleString('en-US') : '—');

export default function Terminal({ locale, t, ea, experiments }) {
  const T = t.terminal;
  const E = t.evidence;
  const p = (r) => localePath(locale, r);
  const models = ea || [];
  const xstats = experimentStats(experiments);

  const totalTrades = models.reduce((s, m) => s + (m.num.trades || 0), 0);
  const totalMonths = models.reduce((s, m) => s + (m.trades?.monthly?.length || 0), 0);
  /* Random resamplings per system: shuffle (sims) + missed 10%/20% (sims each).
     Cost stress is deterministic and not counted. */
  const mcRuns = models.reduce((s, m) => s + (m.mcMeta ? m.mcMeta.sims * 3 : 0), 0);

  const feed = experiments.slice(0, 6);

  const labs = [
    { href: p(ROUTES.lab()), name: t.nav.lab, desc: T.labBacktest },
    { href: p(ROUTES.aiLab()), name: t.nav.aiLab, desc: T.labAi },
    { href: p(ROUTES.portfolio()), name: t.nav.portfolio, desc: T.labPortfolio },
    { href: p(ROUTES.research()), name: t.nav.research, desc: T.labResearch },
  ];

  return html`
    <!-- HERO -->
    <section class="phero phero--terminal" data-reveal-root>
      <div class="phero__inner">
        ${Eyebrow(T.heroEyebrow)}
        <h1 class="phero__title" data-reveal><span class="phero__l1">${T.heroH1}</span></h1>
        <p class="phero__lead" data-reveal>${T.heroLead}</p>
      </div>
      ${Decor({ hud: true })}
      <canvas class="phero__particles" data-particles="spectrum" aria-hidden="true"></canvas>
    </section>

    <!-- 01 Platform state -->
    <section class="sec sec--tight" id="state" data-reveal-root>
      <div class="wrap">
        <header class="labsec">${Eyebrow(T.statsTitle, '01')}</header>
        <ul class="labstats labstats--inline" data-reveal>
          ${[
            [T.statSystems, num(models.length)],
            [T.statTrades, num(totalTrades)],
            [T.statMonths, num(totalMonths)],
            [T.statExperiments, num(xstats.total)],
            [T.statAccepted, num(xstats.accepted)],
            [T.statMcRuns, num(mcRuns)],
          ].map(([k, v]) => html`<li><span class="labstats__v">${v}</span><span class="labstats__k">${k}</span></li>`)}
        </ul>
      </div>
    </section>

    <!-- 02 Evidence map -->
    <section class="sec sec--quantum" id="evidence-map" data-reveal-root>
      ${Decor()}
      <div class="wrap">
        <header class="labsec">
          ${Eyebrow(T.mapTitle, '02')}
          <p class="labsec__lead" data-reveal>${T.mapLead}</p>
        </header>

        <div class="emap" data-reveal>
          <div class="emap__scroll">
            <table class="emap__table">
              <caption class="sr">${T.mapTitle}</caption>
              <thead>
                <tr>
                  <th scope="col" class="emap__sys">${T.mapSystem}</th>
                  ${EVIDENCE_STAGES.map((k) => html`<th scope="col"><span>${E.stages[k]}</span></th>`)}
                  <th scope="col" class="emap__num">${T.mapPoints}</th>
                  <th scope="col" class="emap__num">${T.mapScore}</th>
                </tr>
              </thead>
              <tbody>
                ${models.map(
                  (m) => html`<tr>
                    <th scope="row" class="emap__sys"><a href="${p(ROUTES.eaDetail(m.slug))}">${m.name}</a></th>
                    ${EVIDENCE_STAGES.map((k) => {
                      const ok = m.evidence.stages[k];
                      return html`<td class="${raw(ok ? 'is-ok' : 'is-pending')}" title="${E.stages[k]}: ${ok ? T.legendOk : T.legendPending}">
                        <i aria-hidden="true">${ok ? '✓' : '·'}</i><span class="sr">${ok ? T.legendOk : T.legendPending}</span>
                      </td>`;
                    })}
                    <td class="emap__num">${m.evidence.points}<i>/${m.evidence.max}</i></td>
                    <td class="emap__num emap__score">${m.score.total === null ? '—' : m.score.total}</td>
                  </tr>`
                )}
              </tbody>
            </table>
          </div>
          <div class="emap__legend">
            <span class="emap__chip is-ok"><i aria-hidden="true">✓</i>${T.legendOk}</span>
            <span class="emap__chip is-pending"><i aria-hidden="true">·</i>${T.legendPending}</span>
          </div>
          <p class="fineline">${E.oosNote}</p>
        </div>
      </div>
    </section>

    <!-- 03 Latest research -->
    <section class="sec" id="feed" data-reveal-root>
      <div class="wrap">
        <header class="labsec">
          ${Eyebrow(T.feedTitle, '03')}
        </header>
        <ol class="xtimeline" data-reveal>
          ${feed.map(
            (x) => html`<li>
              <a href="${p(ROUTES.researchDetail(x.experimentId.toLowerCase()))}">
                <span class="xtimeline__id">${x.experimentId}</span>
                <span class="xtimeline__title">${x.title}</span>
                ${ExpStatus({ status: x.status, t })}
                ${when(x.createdAt, () => html`<span class="xtimeline__date">${formatDate(x.createdAt, locale)}</span>`)}
              </a>
            </li>`
          )}
        </ol>
        <div class="labsec__cta" data-reveal>
          <a class="btn btn--ghost" href="${p(ROUTES.research())}">${T.feedAll}<span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>

    <!-- 04 Labs -->
    <section class="sec sec--tight" id="labs" data-reveal-root>
      <div class="wrap">
        <header class="labsec">${Eyebrow(T.labsTitle, '04')}</header>
        <ul class="tlabs">
          ${labs.map(
            (l, i) => html`<li data-reveal style="--d:${i}">
              <a class="tlabs__card" href="${l.href}">
                <span class="tlabs__name">${l.name}</span>
                <span class="tlabs__desc">${l.desc}</span>
                <span class="tlabs__go" aria-hidden="true">→</span>
              </a>
            </li>`
          )}
        </ul>
      </div>
    </section>

    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${BacktestDisclaimer({ t })}</div>
    </section>
  `;
}
