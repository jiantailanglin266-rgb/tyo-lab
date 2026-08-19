import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { Eyebrow, Decor, CTABlock } from '../components/sections.mjs';
import { StatusBadge } from '../components/ea-analytics.mjs';

/**
 * AI × MCP LAB
 *
 * The page that most needs discipline on this site. Its entire credibility
 * rests on one rule: everything carries a status, and only things TYO does
 * daily are marked Live. The analytics on this site were produced by AI
 * reading full tester reports — that claim is checkable against the repo, so
 * it may be stated as Live. MCP integration is exploration and says so.
 *
 * Diagrams are plain markup styled by CSS. A pipeline of eight labelled steps
 * does not need SVG, and as list items the flow reads correctly in a screen
 * reader and in a search snippet.
 */

/** Vertical pipeline: label + description per stage, arrows drawn by CSS. */
function Flow({ steps, id }) {
  return html`
    <ol class="flow" id="${id}">
      ${steps.map(
        (s, i) => html`<li class="flow__step" data-reveal style="--d:${i % 4}">
          <span class="flow__node" aria-hidden="true"><i></i></span>
          <span class="flow__body">
            <span class="flow__k">${s.k}</span>
            <span class="flow__v">${s.v}</span>
          </span>
        </li>`
      )}
    </ol>
  `;
}

/** Capability list where every row carries its research status. */
function StatusList({ items, t }) {
  return html`
    <ul class="caps">
      ${items.map(
        (it, i) => html`<li class="caps__item" data-reveal style="--d:${i % 3}">
          <div class="caps__head">
            <span class="caps__k">${it.k}</span>
            ${StatusBadge({ status: it.status, t })}
          </div>
          <p class="caps__v">${it.v}</p>
        </li>`
      )}
    </ul>
  `;
}

export default function AILab({ locale, t, experiments = [] }) {
  const A = t.aiLab;
  const p = (r) => localePath(locale, r);
  const statuses = ['live', 'experimental', 'research'];

  /* Real research-log output, by source. These are the same entries the log
     itself renders — checkable, so this section may be stated as Live. */
  const bySource = (s) => experiments.filter((e) => e.source === s).length;
  const aiAssisted = experiments.filter((e) => e.source === 'hybrid' || e.source === 'ai');
  const allReviewed = aiAssisted.every((e) => e.ai && e.ai.humanReviewed === true);

  return html`
    <!-- HERO -->
    <section class="phero phero--ailab" data-reveal-root>
      <div class="phero__inner">
        ${Eyebrow(A.hero.eyebrow)}
        <h1 class="phero__title" data-reveal>
          <span class="ailab__formula">
            ${A.hero.h1.split('×').map((part, i, arr) => html`<span class="ailab__term">${part.trim()}</span>${when(i < arr.length - 1, () => html`<span class="ailab__x" aria-hidden="true">×</span>`)}`)}
          </span>
        </h1>
        <p class="phero__lead" data-reveal>${A.hero.lead}</p>

        <!-- Status legend: the honesty contract for the whole page -->
        <div class="legend" data-reveal>
          <p class="legend__title">${A.statusLegend}</p>
          <div class="legend__row">
            ${statuses.map((s) => StatusBadge({ status: s, t }))}
          </div>
          <p class="legend__lead">${A.statusLegendLead}</p>
        </div>
      </div>
      ${Decor({ hud: true })}
      <canvas class="phero__particles" data-particles="spectrum" aria-hidden="true"></canvas>
    </section>

    <!-- 01 Architecture -->
    <section class="sec" id="architecture" data-reveal-root>
      <div class="wrap">
        <header class="labsec">
          ${Eyebrow(A.arch.title, '01')}
          <p class="labsec__lead" data-reveal>${A.arch.lead}</p>
        </header>
        ${Flow({ steps: A.arch.steps, id: 'arch-flow' })}
      </div>
    </section>

    <!-- 02 Development loop -->
    <section class="sec sec--quantum" id="loop" data-reveal-root>
      ${Decor()}
      <div class="wrap">
        <header class="labsec">
          ${Eyebrow(A.loop.title, '02')}
          <p class="labsec__lead" data-reveal>${A.loop.lead}</p>
        </header>
        ${Flow({ steps: A.loop.steps, id: 'loop-flow' })}
      </div>
    </section>

    <!-- 03 What AI actually does -->
    <section class="sec" id="roles" data-reveal-root>
      <div class="wrap">
        <header class="labsec">
          ${Eyebrow(A.roles.title, '03')}
          <p class="labsec__lead" data-reveal>${A.roles.lead}</p>
        </header>
        ${StatusList({ items: A.roles.items, t })}
        <p class="warn" data-reveal>${t.home.ai.note}</p>
      </div>
    </section>

    <!-- 04 MCP -->
    <section class="sec sec--tech" id="mcp" data-reveal-root>
      ${Decor({ hud: true })}
      <div class="wrap">
        <header class="labsec">
          ${Eyebrow(A.mcp.title, '04')}
          <p class="labsec__lead" data-reveal>${A.mcp.lead}</p>
        </header>

        <!-- Agent ↕ MCP ↕ MT5 -->
        <figure class="bridge" data-reveal>
          <div class="bridge__stack" role="img" aria-label="${A.mcp.diagram.join(' — ')}">
            ${A.mcp.diagram.map(
              (label, i) => html`
                ${when(i > 0, () => html`<span class="bridge__link" aria-hidden="true"><i></i><i></i></span>`)}
                <span class="bridge__box${raw(i === 1 ? ' bridge__box--mcp' : '')}">${label}</span>
              `
            )}
          </div>
          <figcaption>${A.mcp.diagramNote}</figcaption>
        </figure>

        ${StatusList({ items: A.mcp.items, t })}
        <p class="warn" data-reveal>${A.mcp.honesty}</p>
      </div>
    </section>

    <!-- 05 Research output — the pipeline's measurable, checkable product -->
    ${when(
      experiments.length,
      () => html`
        <section class="sec" id="research-output" data-reveal-root>
          <div class="wrap">
            <header class="labsec">
              ${Eyebrow(A.researchOut.title, '05')}
              <p class="labsec__lead" data-reveal>${A.researchOut.lead}</p>
            </header>

            <ul class="labstats labstats--inline" data-reveal>
              ${[
                [A.researchOut.statTotal, experiments.length],
                [A.researchOut.statHybrid, bySource('hybrid')],
                [A.researchOut.statHuman, bySource('human')],
                [A.researchOut.statAI, bySource('ai')],
              ].map(([k, v]) => html`<li><span class="labstats__v">${v}</span><span class="labstats__k">${k}</span></li>`)}
            </ul>

            ${when(allReviewed, () => html`<p class="warn" data-reveal>${A.researchOut.reviewNote}</p>`)}

            <div class="labsec__cta" data-reveal>
              <a class="btn btn--ghost" href="${p(ROUTES.research())}">${A.researchOut.cta}<span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
      `
    )}

    ${CTABlock({
      title: t.home.ea.h,
      body: t.home.ea.body,
      primary: { href: p(ROUTES.ea()), label: A.cta.ea },
      secondary: { href: p(ROUTES.lab()), label: A.cta.lab },
    })}
  `;
}
