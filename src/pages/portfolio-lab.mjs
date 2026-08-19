import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { Eyebrow, Decor, CTABlock } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { StatusBadge } from '../components/ea-analytics.mjs';
import { correlationMatrix, builderData, exposure, MIN_OVERLAP } from '../lib/portfolio.mjs';

/**
 * EA PORTFOLIO LAB — a research tool, and it says so everywhere.
 *
 * Three honesty guards, in order of importance:
 *   1. The not-advice notice sits in the hero, before any number.
 *   2. Correlations only render over ≥ MIN_OVERLAP shared months; thin pairs
 *      show "—" rather than a number that is really noise.
 *   3. The builder states its assumptions (equal weight, monthly rebalance,
 *      common window, monthly-close drawdown) directly under its results.
 *
 * The matrix and exposure bars are server-rendered; the builder needs
 * arithmetic on the visitor's selection, so its monthly data ships as one
 * inline JSON block (~34 KB) and a small runtime section computes on it.
 * With scripting off the builder simply does not appear — everything above
 * it is complete.
 */

function ExposureBars({ rows, label, t, nameOf }) {
  if (!rows.length) return '';
  const max = Math.max(...rows.map((r) => r.n));
  return html`
    <div class="expo" data-reveal>
      <p class="expo__title">${label}</p>
      <ul class="expo__rows">
        ${rows.map(
          (r) => html`<li>
            <span class="expo__k">${nameOf(r.key)}</span>
            <span class="expo__bar" aria-hidden="true"><i style="--v:${((r.n / max) * 100).toFixed(1)}%"></i></span>
            <span class="expo__v">${r.n} <i>· ${r.pct}%</i></span>
          </li>`
        )}
      </ul>
    </div>
  `;
}

/** r → cell colour. Blue = negative, dark = zero, orange/red = positive. */
function corrColor(r) {
  if (r === null) return 'transparent';
  const t2 = Math.min(1, Math.abs(r));
  const a = (0.08 + t2 * 0.72).toFixed(3);
  return r < 0 ? `rgba(10,132,255,${a})` : `rgba(255,159,10,${a})`;
}

export default function PortfolioLab({ locale, t, ea }) {
  const P = t.portfolio;
  const p = (r) => localePath(locale, r);
  const models = ea || [];

  const cm = correlationMatrix(models);
  const data = builderData(models);

  const marketRows = exposure(models, (m) => [m.spec.marketKey]);
  const tagRows = exposure(models, (m) => m.spec.strategyTags);
  const riskRows = exposure(
    models.filter((m) => m.spec.risk),
    (m) => [m.spec.risk]
  );

  return html`
    <!-- HERO -->
    <section class="phero" data-reveal-root>
      <div class="phero__inner">
        <div class="phero__row" style="margin-top:0">
          ${Eyebrow(P.hero.eyebrow)}
        </div>
        <h1 class="phero__title" data-reveal>
          <span class="phero__l1">${P.hero.h1}</span>
          <span class="phero__l2">${P.hero.h2}</span>
        </h1>
        <p class="phero__lead" data-reveal>${P.hero.lead}</p>
        <div class="phero__row" data-reveal>${StatusBadge({ status: 'research', t })}</div>
        <p class="warn" data-reveal>${P.advice}</p>
      </div>
      ${Decor({ hud: true })}
      <canvas class="phero__particles" data-particles="spectrum" aria-hidden="true"></canvas>
    </section>

    <!-- 01 Exposure -->
    <section class="sec" id="exposure" data-reveal-root>
      <div class="wrap">
        <header class="labsec">
          ${Eyebrow(P.exposure.title, '01')}
          <p class="labsec__lead" data-reveal>${P.exposure.lead}</p>
        </header>
        <div class="expo__grid">
          ${ExposureBars({ rows: marketRows, label: P.exposure.market, t, nameOf: (k) => t.ea.browse.markets[k] || k })}
          ${ExposureBars({ rows: tagRows, label: P.exposure.strategy, t, nameOf: (k) => t.ea.browse.tags[k] || k })}
          ${ExposureBars({ rows: riskRows, label: P.exposure.risk, t, nameOf: (k) => t.ea.risk[k] || k })}
        </div>
      </div>
    </section>

    <!-- 02 Correlation matrix -->
    <section class="sec sec--quantum" id="correlation" data-reveal-root>
      ${Decor()}
      <div class="wrap">
        <header class="labsec">
          ${Eyebrow(P.corr.title, '02')}
          <p class="labsec__lead" data-reveal>${raw(P.corr.lead.replace('{n}', String(MIN_OVERLAP)))}</p>
        </header>

        <div class="corr" data-reveal>
          <div class="corr__scroll">
            <table class="corr__table">
              <caption class="sr">${P.corr.title}</caption>
              <thead>
                <tr>
                  <th></th>
                  ${cm.names.map((n2, j) => html`<th scope="col"><span>${n2}</span></th>`)}
                </tr>
              </thead>
              <tbody>
                ${cm.cells.map(
                  (row, i) => html`<tr>
                    <th scope="row">${cm.names[i]}</th>
                    ${row.map((c, j) => {
                      if (i === j) return html`<td class="corr__self" aria-hidden="true"></td>`;
                      const title = P.corr.hover
                        .replace('{a}', cm.names[i])
                        .replace('{b}', cm.names[j])
                        .replace('{r}', c.r === null ? '—' : c.r.toFixed(2))
                        .replace('{n}', String(c.n));
                      return html`<td style="--c:${corrColor(c.r)}" title="${title}">
                        <span>${c.r === null ? '—' : c.r.toFixed(2).replace('0.', '.')}</span>
                      </td>`;
                    })}
                  </tr>`
                )}
              </tbody>
            </table>
          </div>
          <div class="corr__legend">
            <span class="corr__chip corr__chip--neg">${P.corr.legendNeg}</span>
            <span class="corr__chip corr__chip--zero">${P.corr.legendZero}</span>
            <span class="corr__chip corr__chip--pos">${P.corr.legendPos}</span>
          </div>
          <p class="fineline">${P.corr.note}</p>
        </div>
      </div>
    </section>

    <!-- 03 Builder (JS-only; hidden without scripting) -->
    <section class="sec" id="builder" data-reveal-root>
      <div class="wrap">
        <header class="labsec">
          ${Eyebrow(P.builder.title, '03')}
          <p class="labsec__lead" data-reveal>${P.builder.lead}</p>
        </header>

        <div class="pbuild" data-portfolio hidden>
          <div class="pbuild__pick" role="group" aria-label="${P.builder.pick}">
            ${Object.entries(data).map(
              ([slug, d]) => html`<label class="pbuild__sys">
                <input type="checkbox" data-portfolio-pick value="${slug}" />
                <span class="pbuild__name">${d.name}</span>
                <span class="pbuild__sym">${d.symbol || ''}</span>
              </label>`
            )}
          </div>

          <!-- Weighting scheme: equal is the default and the only mode whose
               weights carry no in-sample information (see weightsNote). -->
          <div class="pbuild__modes" role="radiogroup" aria-label="${P.builder.weighting}">
            <span class="browse__label">${P.builder.weighting}</span>
            ${[
              ['equal', P.builder.wEqual],
              ['iv', P.builder.wIV],
              ['rp', P.builder.wRP],
            ].map(
              ([mode, label], i) => html`<label class="pbuild__mode">
                <input type="radio" name="pf-mode" data-portfolio-mode value="${mode}"${raw(i === 0 ? ' checked' : '')} />
                <span>${label}</span>
              </label>`
            )}
          </div>

          <p class="pbuild__hint" data-portfolio-hint>${P.builder.needTwo}</p>
          <p class="pbuild__hint" data-portfolio-thin hidden>${P.builder.insufficient}</p>

          <div class="pbuild__out" data-portfolio-out hidden>
            <ul class="snap pbuild__snap">
              ${[
                ['window', P.builder.window],
                ['months', P.builder.months],
                ['corr', P.builder.avgCorr],
                ['positive', P.builder.positive],
                ['mean', P.builder.mean],
                ['worst', P.builder.worst],
                ['vol', P.builder.vol],
                ['dd', P.builder.maxDD],
                ['retdd', P.builder.retDD],
                ['cagr', P.builder.cagr],
                ['total', P.builder.total],
              ].map(([k, label]) => html`<li><span class="snap__k">${label}</span><span class="snap__v" data-pf="${k}">—</span></li>`)}
            </ul>

            <p class="warn warn--sm" data-portfolio-rpfallback hidden>${P.builder.rpFallback}</p>

            <p class="statgrid__title" style="margin-top:26px">${P.builder.perSystem}</p>
            <div class="tablewrap">
              <table class="dtable">
                <thead>
                  <tr>
                    <th scope="col">${P.builder.pick}</th>
                    <th scope="col">${P.builder.weight}</th>
                    <th scope="col">${P.builder.positive}</th>
                    <th scope="col">${P.builder.worst}</th>
                    <th scope="col">${P.builder.maxDD}</th>
                    <th scope="col">${P.builder.total}</th>
                  </tr>
                </thead>
                <tbody data-portfolio-rows></tbody>
              </table>
            </div>

            <p class="fineline">${P.builder.assumptions}</p>
            <p class="fineline">${P.builder.weightsNote}</p>
          </div>
        </div>

        <script type="application/json" data-portfolio-data>${raw(
          JSON.stringify({
            blendLabels: { equal: P.builder.blendEqual, iv: P.builder.blendIV, rp: P.builder.blendRP },
            d: data,
          })
        )}</script>
      </div>
    </section>

    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${BacktestDisclaimer({ t })}</div>
    </section>

    ${CTABlock({
      title: t.home.ea.h,
      body: t.home.ea.body,
      primary: { href: p(ROUTES.eaCompare()), label: P.cta.compare },
      secondary: { href: p(ROUTES.lab()), label: P.cta.lab },
    })}
  `;
}
