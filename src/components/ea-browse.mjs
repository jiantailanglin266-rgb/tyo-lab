/**
 * ============================================================================
 * EA BROWSE — filter / sort / search / compare toolbar
 * ============================================================================
 * Every card is rendered server-side, so the full catalogue is in the HTML for
 * crawlers and for anyone with JavaScript off. The toolbar is progressive
 * enhancement: it hides and reorders cards that are already on the page rather
 * than fetching or re-rendering, which is why it needs no framework and no
 * client-side data fetch.
 *
 * Facets are derived from the models, so a new market or strategy tag appears
 * in the filter automatically.
 * ============================================================================
 */

import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';

/** Distinct facet values present in the catalogue, in a stable order. */
export function facetsOf(models) {
  const markets = [...new Set(models.map((m) => m.spec.marketKey).filter(Boolean))];
  const tags = [...new Set(models.flatMap((m) => m.spec.strategyTags))];
  const risks = ['low', 'medium', 'high', 'variable'].filter((r) => models.some((m) => m.spec.risk === r));
  return { markets, tags, risks };
}

function ChipGroup({ name, label, options, t }) {
  if (!options.length) return '';
  return html`
    <div class="browse__group" role="group" aria-label="${label}">
      <span class="browse__label">${label}</span>
      <div class="browse__chips">
        <button type="button" class="chip is-on" data-facet="${name}" data-value="">${t.ea.browse.all}</button>
        ${options.map(
          (o) => html`<button type="button" class="chip" data-facet="${name}" data-value="${o.value}">${o.label}</button>`
        )}
      </div>
    </div>
  `;
}

export function BrowseToolbar({ models, t, locale }) {
  const f = facetsOf(models);
  const B = t.ea.browse;

  return html`
    <div class="browse" data-browse hidden>
      <div class="browse__row">
        <label class="browse__search">
          <span class="sr">${B.search}</span>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" data-browse-search placeholder="${B.searchPlaceholder}" autocomplete="off" />
        </label>

        <label class="browse__sort">
          <span class="browse__label">${B.sort}</span>
          <select data-browse-sort>
            ${Object.entries(B.sorts).map(([k, v]) => html`<option value="${k}">${v}</option>`)}
          </select>
        </label>

        <button type="button" class="browse__reset" data-browse-reset>${B.reset}</button>
      </div>

      <div class="browse__row browse__row--facets">
        ${ChipGroup({
          name: 'market',
          label: B.market,
          options: f.markets.map((m) => ({ value: m, label: B.markets[m] || m })),
          t,
        })}
        ${ChipGroup({
          name: 'tag',
          label: B.strategy,
          options: f.tags.map((x) => ({ value: x, label: B.tags[x] || x })),
          t,
        })}
        ${ChipGroup({
          name: 'risk',
          label: B.risk,
          options: f.risks.map((r) => ({ value: r, label: t.ea.risk[r] || r })),
          t,
        })}
        ${ChipGroup({
          name: 'access',
          label: t.commercial.filterLabel,
          options: ['FREE', 'PRO', 'PARTNER', 'PRIVATE'].filter((x) => models.some((m) => m.commercial?.status === x)).map((x) => ({ value: x, label: t.commercial.filters[x] })),
          t,
        })}
      </div>

      <!-- The template travels in an attribute: the rendered text already has
           the placeholders substituted, so JS cannot re-use it as a format. -->
      <p class="browse__count" data-browse-count data-tpl="${B.showing}" aria-live="polite">
        ${raw(B.showing.replace('{n}', String(models.length)).replace('{total}', String(models.length)))}
      </p>
      <p class="browse__none" data-browse-none hidden>${B.none}</p>
    </div>
  `;
}

/**
 * Selection tray. Fixed to the bottom once anything is picked; the button
 * carries the selection in the URL so a comparison can be shared or bookmarked.
 */
export function CompareTray({ t, locale, max = 4 }) {
  const C = t.ea.compare;
  return html`
    <div class="tray" data-compare-tray hidden>
      <div class="tray__inner">
        <p class="tray__count"><span data-compare-count>0</span> <span class="tray__max">${raw(C.max.replace('{n}', String(max)))}</span></p>
        <ul class="tray__items" data-compare-items></ul>
        <div class="tray__actions">
          <button type="button" class="tray__clear" data-compare-clear>${C.clear}</button>
          <a class="btn btn--primary tray__go" data-compare-go href="${localePath(locale, ROUTES.eaCompare())}">
            <span class="btn__label">${C.open}</span><span class="btn__arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  `;
}
