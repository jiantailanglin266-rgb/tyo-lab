import { html, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { PageHero, CTABlock } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { ExperimentCard } from '../components/research.mjs';
import { experimentStats } from '../data/experiments.mjs';

/**
 * RESEARCH LOG — the index of every experiment.
 *
 * Server-rendered in full; the filter toolbar (status / system / category /
 * sort) is progressive enhancement over cards already in the DOM, same
 * pattern as the EA index. The discipline statement and the multiple-testing
 * warning are page furniture, not footnotes — they define what qualifies as
 * an entry here.
 */
export default function ResearchIndex({ locale, t, experiments, ea }) {
  const R = t.research;
  const p = (r) => localePath(locale, r);
  const stats = experimentStats(experiments);
  const eaNames = Object.fromEntries((ea || []).map((m) => [m.slug, m.name]));

  const usedStatuses = [...new Set(experiments.map((e) => e.status))];
  const usedCats = [...new Set(experiments.map((e) => e.category))];
  const usedEAs = [...new Set(experiments.map((e) => e.strategyId).filter(Boolean))].sort();
  const hasPlatform = experiments.some((e) => !e.strategyId);

  return html`
    ${PageHero({
      eyebrow: R.hero.eyebrow,
      h1: R.hero.h1,
      h2: R.hero.h2,
      lead: R.hero.lead,
      children: html`
        <ul class="labstats labstats--inline" data-reveal>
          ${[
            [R.stats.total, stats.total],
            [R.stats.accepted, stats.accepted],
            [R.stats.rejected, stats.rejected],
            [R.stats.inconclusive, stats.inconclusive],
            [R.stats.archived, stats.archived],
            [R.stats.strategies, stats.strategies],
          ].map(([k, v]) => html`<li><span class="labstats__v">${v}</span><span class="labstats__k">${k}</span></li>`)}
        </ul>
      `,
    })}

    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">
        <p class="xrule" data-reveal>${R.discipline}</p>
        <p class="warn" data-reveal>${R.overfitting}</p>
      </div>
    </section>

    <section class="sec" data-reveal-root>
      <div class="wrap">
        <!-- Filter toolbar (JS-enhanced; hidden without scripting) -->
        <div class="browse" data-xbrowse hidden>
          <div class="browse__row browse__row--facets">
            <div class="browse__group" role="group" aria-label="${R.filters.status}">
              <span class="browse__label">${R.filters.status}</span>
              <div class="browse__chips">
                <button type="button" class="chip is-on" data-xfacet="status" data-value="">${R.filters.all}</button>
                ${usedStatuses.map((s) => html`<button type="button" class="chip" data-xfacet="status" data-value="${s}">${R.statuses[s] || s}</button>`)}
              </div>
            </div>
            <div class="browse__group" role="group" aria-label="${R.filters.category}">
              <span class="browse__label">${R.filters.category}</span>
              <div class="browse__chips">
                <button type="button" class="chip is-on" data-xfacet="category" data-value="">${R.filters.all}</button>
                ${usedCats.map((c) => html`<button type="button" class="chip" data-xfacet="category" data-value="${c}">${R.categories[c] || c}</button>`)}
              </div>
            </div>
          </div>
          <div class="browse__row">
            <label class="browse__sort">
              <span class="browse__label">${R.filters.ea}</span>
              <select data-xea>
                <option value="">${R.filters.all}</option>
                ${when(hasPlatform, () => html`<option value="_platform">${R.filters.platform}</option>`)}
                ${usedEAs.map((s) => html`<option value="${s}">${eaNames[s] || s.toUpperCase()}</option>`)}
              </select>
            </label>
            <label class="browse__sort">
              <span class="browse__label">${R.filters.sort}</span>
              <select data-xsort>
                <option value="newest">${R.sorts.newest}</option>
                <option value="oldest">${R.sorts.oldest}</option>
                <option value="accepted">${R.sorts.accepted}</option>
                <option value="rejected">${R.sorts.rejected}</option>
              </select>
            </label>
            <p class="browse__count" data-xcount data-tpl="${R.list.showing}" aria-live="polite"></p>
          </div>
          <p class="browse__none" data-xnone hidden>${R.list.none}</p>
        </div>

        <ol class="xlist" data-xlist>
          ${experiments.map((exp) => ExperimentCard({ exp, t, locale, eaNames }))}
        </ol>
      </div>
    </section>

    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${BacktestDisclaimer({ t })}</div>
    </section>

    ${CTABlock({
      title: t.home.ea.h,
      body: t.home.ea.body,
      primary: { href: p(ROUTES.ea()), label: t.ui.exploreEAs },
      secondary: { href: p(ROUTES.lab()), label: t.nav.lab },
    })}
  `;
}
