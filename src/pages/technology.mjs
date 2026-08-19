import { html } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { VIDEOS } from '../site.config.mjs';
import { PageHero, SectionHead, KeyValueGrid, WordWall, CTABlock, Eyebrow, Decor } from '../components/sections.mjs';
import { CinematicSection } from '../components/media.mjs';

export default function Technology({ locale, t, has }) {
  const g = t.technology;
  return html`
    ${PageHero({ eyebrow: g.eyebrow, h1: g.h1, h2: g.h2, lead: g.lead })}

    <!-- AI — VIDEO_02 -->
    ${CinematicSection({
      id: 'ai',
      video: VIDEOS.ai,
      available: has.ai,
      align: 'left',
      label: 'AI',
      children: html`
        <div class="cine__copy">
          ${Eyebrow('01')}
          <h2 class="big" data-reveal><span class="big__l1">${g.aiTitle}</span></h2>
          <p class="lead" data-reveal>${g.aiLead}</p>
          <p class="warn" data-reveal>${g.aiWarning}</p>
        </div>
      `,
    })}
    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${KeyValueGrid(t.home.ai.items, { cols: 3 })}</div>
    </section>

    <!-- Probability, not certainty -->
    <section class="sec sec--quantum" id="probability" data-reveal-root>
      ${Decor({ hud: true })}
      <div class="wrap">
        ${Eyebrow('02')}
        <h2 class="big" data-reveal>
          <span class="big__l1">${t.home.tech.h1}</span>
          <span class="big__l2">${t.home.tech.h2}</span>
        </h2>
        <p class="lead" data-reveal>${g.quantumLead}</p>
        ${KeyValueGrid(g.quantumPoints, { cols: 4 })}
      </div>
      <canvas class="sec__particles sec__particles--dense" data-particles="spectrum" aria-hidden="true"></canvas>
    </section>

    <!-- Computer science -->
    <section class="sec sec--cs" id="computer-science" data-reveal-root>
      <div class="wrap">
        ${Eyebrow('03')}
        <h2 class="big" data-reveal>
          <span class="big__l1">${g.csTitle}</span>
          <span class="big__l2">${g.csTitle2}</span>
        </h2>
        <p class="lead" data-reveal>${g.csLead}</p>
        ${WordWall(t.home.tech.words)}
        ${KeyValueGrid(g.csItems, { cols: 3 })}
      </div>
    </section>

    <!-- Backtest — VIDEO_04 -->
    ${CinematicSection({
      id: 'backtest',
      video: VIDEOS.backtest,
      available: has.backtest,
      label: 'Backtest',
      children: html`
        <div class="cine__copy cine__copy--center">
          <h2 class="stack" data-reveal>
            ${t.home.backtest.lines.map((l, i) => html`<span class="stack__l" style="--i:${i}">${l}</span>`)}
          </h2>
          <p class="lead lead--center" data-reveal>${t.home.backtest.body}</p>
        </div>
      `,
    })}

    <!-- Stack -->
    <section class="sec" id="stack" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '04', title: g.stackTitle })}
        ${KeyValueGrid(g.stack, { cols: 4 })}
      </div>
    </section>

    ${CTABlock({
      title: t.home.ea.h,
      body: t.home.ea.body,
      primary: { href: localePath(locale, ROUTES.ea()), label: t.ui.exploreEAs },
      secondary: { href: localePath(locale, ROUTES.history()), label: t.nav.history },
    })}
  `;
}
