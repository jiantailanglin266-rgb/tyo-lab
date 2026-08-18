import { html, when } from '../lib/html.mjs';
import { localePath, ROUTES, asset } from '../lib/url.mjs';
import { entryI18n, formatDate } from '../lib/i18n.mjs';
import { Eyebrow, PlaceholderNotice } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { VideoEmbed } from '../components/media.mjs';
import { EAMetrics } from '../components/ea.mjs';

/** Renders the block-based article body defined in src/data/lab.mjs. */
function Body(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks.map((b) => {
    if (b.p) return html`<p class="prose" data-reveal>${b.p}</p>`;
    if (b.h) return html`<h2 class="artbody__h" data-reveal>${b.h}</h2>`;
    if (b.list)
      return html`<ul class="artbody__list" data-reveal>${b.list.map((i) => html`<li>${i}</li>`)}</ul>`;
    if (b.note) return html`<p class="artbody__note" data-reveal>${b.note}</p>`;
    if (b.table)
      return html`<div class="tablewrap" data-reveal>
        <table class="dtable">
          <thead>
            <tr>${b.table.head.map((h) => html`<th scope="col">${h}</th>`)}</tr>
          </thead>
          <tbody>
            ${b.table.rows.map((r) => html`<tr>${r.map((cell) => html`<td>${cell}</td>`)}</tr>`)}
          </tbody>
        </table>
      </div>`;
    if (b.image)
      return html`<figure class="artbody__fig" data-reveal>
        <img src="${asset(b.image.src)}" alt="${b.image.alt || ''}" loading="lazy" decoding="async" />
        ${when(b.image.caption, () => html`<figcaption>${b.image.caption}</figcaption>`)}
      </figure>`;
    return '';
  });
}

export default function LabArticle({ locale, t, article, ea, prev, next }) {
  const c = entryI18n(article, locale);
  const L = t.lab.labels;

  const summaryRows = [
    [L.date, formatDate(article.date, locale)],
    [L.type, t.lab.types[article.type] || article.type],
    [L.ea, ea ? ea.name : null],
    [L.market, article.market],
    [L.period, article.period],
  ].filter(([, v]) => v);

  const findings = [
    [L.hypothesis, c.hypothesis],
    [L.method, c.method],
    [L.result, c.result],
    [L.conclusion, c.conclusion],
  ].filter(([, v]) => v);

  return html`
    <article class="lab">
      <header class="labhero" data-reveal-root>
        <div class="wrap wrap--narrow">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="${localePath(locale, ROUTES.lab())}">${t.nav.lab}</a>
            <span aria-hidden="true">/</span>
            <span>${t.lab.types[article.type] || article.type}</span>
          </nav>
          ${Eyebrow(t.lab.eyebrow)}
          <h1 class="labhero__title" data-reveal>${c.title}</h1>
          ${when(c.summary, () => html`<p class="labhero__summary" data-reveal>${c.summary}</p>`)}
          <dl class="labhero__meta" data-reveal>
            ${summaryRows.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}
          </dl>
          ${when(article.placeholder, () => PlaceholderNotice({ locale }))}
        </div>
      </header>

      <div class="wrap wrap--narrow">
        ${when(
          findings.length,
          () => html`<section class="findings" data-reveal-root>
            ${findings.map(
              ([k, v], i) => html`<div class="findings__item" data-reveal style="--d:${i}">
                <p class="findings__k">${k}</p>
                <p class="findings__v">${v}</p>
              </div>`
            )}
          </section>`
        )}

        ${when(
          article.video && article.video.type,
          () => html`<section class="block" data-reveal-root>
            <div class="block__body">${VideoEmbed({ video: article.video, t, title: c.title })}</div>
          </section>`
        )}

        ${when(article.metrics, () => html`<section class="block" data-reveal-root>
          <h2 class="block__title" data-reveal><span class="block__bar" aria-hidden="true"></span>${t.ea.metrics.title}</h2>
          <div class="block__body">${EAMetrics({ bt: article.metrics, t, locale })}</div>
        </section>`)}

        <section class="artbody">${Body(c.body)}</section>

        ${when(
          ea,
          () => html`<aside class="relea" data-reveal>
            <p class="relea__label">${L.ea}</p>
            <a class="relea__link" href="${localePath(locale, ROUTES.eaDetail(ea.slug))}">
              <span class="relea__n">${ea.number}</span><span class="relea__name">${ea.name}</span>
              <span aria-hidden="true">→</span>
            </a>
          </aside>`
        )}

        <div class="labdisc">${BacktestDisclaimer({ t })}</div>
      </div>

      <nav class="eanext" aria-label="${t.lab.backToList}">
        <div class="wrap eanext__inner">
          <a class="eanext__back" href="${localePath(locale, ROUTES.lab())}"><span aria-hidden="true">←</span>${t.lab.backToList}</a>
          ${when(
            next,
            () => html`<a class="eanext__next" href="${localePath(locale, ROUTES.labArticle(next.slug))}">
              <span class="eanext__label">${t.ui.readMore}</span>
              <span class="eanext__name">${entryI18n(next, locale).title}<span aria-hidden="true">→</span></span>
            </a>`
          )}
        </div>
      </nav>
    </article>
  `;
}
