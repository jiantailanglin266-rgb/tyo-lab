import { html, raw, when, splitChars, splitWords } from '../lib/html.mjs';
import { localePath, ROUTES, asset } from '../lib/url.mjs';
import { VIDEOS, BRAND, LINKS } from '../site.config.mjs';
import { CinematicSection, CinematicVideo } from '../components/media.mjs';
import {
  Eyebrow,
  SectionHead,
  Button,
  KeyValueGrid,
  Steps,
  WordWall,
  Stats,
  GlobalMap,
  Timeline,
  Decor,
} from '../components/sections.mjs';
import { EACard } from '../components/ea.mjs';

/**
 * HOME — the brand film.
 * Video / copy / video / copy, so scrolling the page reads as one continuous
 * cut. Section order is fixed and documented in README.md.
 */
export default function Home({ locale, t, has, mask, ea, stages }) {
  const h = t.home;
  const p = (r) => localePath(locale, r);

  return html`
    <!-- 01 ─ HERO ───────────────────────────────────────────── VIDEO_01 -->
    ${CinematicSection({
      id: 'hero',
      video: VIDEOS.hero,
      available: has.hero,
      priority: true,
      height: 'hero',
      label: 'TYO',
      children: html`
        <div class="hero">
          <p class="hero__eyebrow" data-reveal>${h.hero.eyebrow}</p>
          <h1 class="hero__title">
            <span class="hero__brand" data-reveal>${splitChars(h.hero.brand, 'hero__c')}</span>
            <span class="hero__line" data-reveal>${h.hero.line1}</span>
            <span class="hero__line hero__line--accent" data-reveal>${h.hero.line2}</span>
          </h1>
          <p class="hero__sub" data-reveal>${h.hero.sub}</p>
          <div class="hero__actions" data-reveal>
            ${Button({ href: p(ROUTES.ea()), label: t.ui.exploreEAs })}
            ${Button({ href: p(ROUTES.history()), label: t.ui.ourStory, variant: 'ghost' })}
          </div>
        </div>
      `,
    })}

    <!-- 02 ─ WE BUILD ALGORITHMS, NOT PREDICTIONS ────────────────────── -->
    <section class="sec sec--intro" id="philosophy" data-reveal-root>
      <div class="wrap">
        ${Eyebrow(h.intro.eyebrow, '02')}
        <h2 class="big" data-reveal>
          <span class="big__l1">${h.intro.h1}</span>
          <span class="big__l2">${h.intro.h2}</span>
        </h2>
        <div class="cols2">
          <p class="lead" data-reveal>${h.intro.body1}</p>
          <p class="prose" data-reveal>${h.intro.body2}</p>
        </div>
        ${KeyValueGrid(h.intro.pillars, { cols: 5 })}
      </div>
    </section>

    <!-- ─ DOWNLOAD SOCIAL PROOF ──────────────────────────────────────── -->
    <section class="sec sec--stats" data-reveal-root>
      <div class="wrap">
        <div class="statsblock">
          <div class="statsblock__copy">
            ${Eyebrow(h.stats.eyebrow)}
            <h2 class="mid" data-reveal>${h.stats.h}</h2>
            <p class="prose" data-reveal>${h.stats.body}</p>
            <p class="src" data-reveal>${h.stats.source}</p>
          </div>
          <div class="statsblock__nums">${Stats({ t, locale })}</div>
        </div>
      </div>
    </section>

    <!-- 03 ─ AI ACCELERATED DEVELOPMENT ──────────────────────── VIDEO_02 -->
    ${CinematicSection({
      id: 'ai',
      video: VIDEOS.ai,
      available: has.ai,
      align: 'left',
      label: 'AI',
      children: html`
        <div class="cine__copy">
          ${Eyebrow(h.ai.eyebrow, '03')}
          <h2 class="big" data-reveal>
            <span class="big__l1">${h.ai.h1}</span>
            <span class="big__l2">${h.ai.h2}</span>
          </h2>
          <p class="lead" data-reveal>${h.ai.body}</p>
          <p class="warn" data-reveal>${h.ai.note}</p>
        </div>
      `,
    })}
    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${KeyValueGrid(h.ai.items, { cols: 3 })}</div>
    </section>

    <!-- 04 ─ FROM IDEA TO ALGORITHM ──────────────────────────── VIDEO_03 -->
    ${CinematicSection({
      id: 'algorithm',
      video: VIDEOS.algorithm,
      available: has.algorithm,
      label: 'Algorithm',
      children: html`
        <div class="cine__copy cine__copy--center">
          ${Eyebrow(h.algorithm.eyebrow, '04')}
          <h2 class="big big--center" data-reveal>
            <span class="big__l1">${h.algorithm.h1}</span>
            <span class="big__l2">${h.algorithm.h2}</span>
          </h2>
          <p class="lead lead--center" data-reveal>${h.algorithm.body}</p>
        </div>
      `,
    })}
    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${Steps(h.algorithm.steps)}</div>
    </section>

    <!-- 05 ─ EXPERT ADVISORS ─────────────────────────────────────────── -->
    <section class="sec sec--ea" id="ea" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: h.ea.eyebrow, title: h.ea.h, lead: h.ea.body })}
        ${when(
          ea.length,
          () => html`<div class="eagrid">${ea.slice(0, 6).map((e, i) => EACard({ ea: e, locale, t, index: i }))}</div>`
        )}
        <div class="sec__actions" data-reveal>${Button({ href: p(ROUTES.ea()), label: h.ea.cta })}</div>
      </div>
    </section>

    <!-- 06 ─ TEST. BREAK. IMPROVE. REPEAT. ───────────────────── VIDEO_04 -->
    ${CinematicSection({
      id: 'backtest',
      video: VIDEOS.backtest,
      available: has.backtest,
      label: 'Backtest',
      children: html`
        <div class="cine__copy cine__copy--center">
          ${Eyebrow(h.backtest.eyebrow, '06')}
          <h2 class="stack" data-reveal>
            ${h.backtest.lines.map((l, i) => html`<span class="stack__l" style="--i:${i}">${l}</span>`)}
          </h2>
          <p class="lead lead--center" data-reveal>${h.backtest.body}</p>
          <div class="cine__actions" data-reveal>${Button({ href: p(ROUTES.lab()), label: h.backtest.cta, variant: 'ghost' })}</div>
        </div>
      `,
    })}

    <!-- 07 ─ DEVELOPMENT HISTORY ─────────────────────────────────────── -->
    <section class="sec sec--history" id="history" data-reveal-root>
      <div class="wrap">
        ${Eyebrow(h.history.eyebrow, '07')}
        <h2 class="mid" data-reveal>${h.history.h}</h2>
        <ul class="qlist">
          ${h.history.questions.map((q, i) => html`<li data-reveal style="--d:${i}"><span aria-hidden="true">—</span>${q}</li>`)}
        </ul>
        <p class="thenwe" data-reveal>${h.history.body}</p>
        ${Timeline({ stages: stages.slice(0, 5), locale, t, compact: true })}
        <div class="sec__actions" data-reveal>${Button({ href: p(ROUTES.history()), label: h.history.cta, variant: 'ghost' })}</div>
      </div>
    </section>

    <!-- 07b ─ TOKYO — where TYO is built (editorial photo spread) ─────── -->
    <section class="sec sec--tokyo" id="tokyo" data-reveal-root>
      <div class="wrap tokyo">
        <div class="tokyo__copy">
          ${Eyebrow(h.tokyo.eyebrow, '07')}
          <h2 class="big" data-reveal>
            <span class="big__l1">${h.tokyo.h1}</span>
            <span class="big__l2">${h.tokyo.h2}</span>
          </h2>
          <p class="lead" data-reveal>${h.tokyo.body}</p>
          <p class="tokyo__coords" data-reveal aria-hidden="true">35.6762° N · 139.6503° E</p>
        </div>
        <div class="tokyo__grid">
          ${[
            ['odaiba', 926, 1236],
            ['alley', 1108, 1478],
            ['avenue', 1108, 1478],
            ['tower', 1108, 1478],
            ['skyline', 1108, 1478],
          ].map(
            ([k, w, hh], i) => html`<figure class="tokyo__ph tokyo__ph--${raw(k)}" data-reveal style="--i:${i}">
              <picture>
                <source srcset="${asset(`/assets/images/tokyo/${k}.webp`)}" type="image/webp" />
                <img src="${asset(`/assets/images/tokyo/${k}.jpg`)}" alt="${h.tokyo.captions[i]}" width="${w}" height="${hh}" loading="lazy" decoding="async" />
              </picture>
              <figcaption><span class="tokyo__n">0${i + 1}</span>${h.tokyo.captions[i]}</figcaption>
            </figure>`
          )}
        </div>
      </div>
    </section>

    <!-- 08 ─ BUILT IN JAPAN / GLOBAL ─────────────────────────── VIDEO_05 -->
    ${CinematicSection({
      id: 'global',
      video: VIDEOS.global,
      available: has.global,
      align: 'left',
      label: 'Global',
      children: html`
        <div class="cine__copy">
          ${Eyebrow(h.global.eyebrow, '08')}
          <h2 class="big" data-reveal>
            <span class="big__l1">${h.global.h1}</span>
            <span class="big__l2">${h.global.h2}</span>
          </h2>
          <p class="lead" data-reveal>${h.global.body}</p>
        </div>
      `,
    })}
    <section class="sec sec--map" data-reveal-root>
      <div class="wrap">${GlobalMap({ t, mask })}</div>
    </section>

    <!-- 09 ─ TECHNOLOGY / PROBABILITY ────────────────────────────────── -->
    <section class="sec sec--tech" id="technology" data-reveal-root>
      ${Decor({ hud: true })}
      <div class="wrap">
        ${Eyebrow(h.tech.eyebrow, '09')}
        <h2 class="big" data-reveal>
          <span class="big__l1">${h.tech.h1}</span>
          <span class="big__l2">${h.tech.h2}</span>
        </h2>
        <p class="lead" data-reveal>${h.tech.body}</p>
        ${WordWall(h.tech.words)}
        <div class="sec__actions" data-reveal>${Button({ href: p(ROUTES.technology()), label: h.tech.cta, variant: 'ghost' })}</div>
      </div>
      <canvas class="sec__particles" data-particles="violet" aria-hidden="true"></canvas>
    </section>

    <!-- 10 ─ FINAL ───────────────────────────────────────────── VIDEO_06 -->
    ${CinematicSection({
      id: 'final',
      video: VIDEOS.final,
      available: has.final,
      height: 'hero',
      label: 'TYO',
      children: html`
        <div class="final">
          <p class="final__brand" data-reveal>${splitChars(h.final.brand, 'final__c')}</p>
          <p class="final__line" data-reveal>${h.final.line}</p>
          <p class="final__body" data-reveal>${splitWords(h.final.body, 'final__w')}</p>
          <div class="final__actions" data-reveal>
            ${Button({ href: p(ROUTES.ea()), label: h.final.cta })}
            ${Button({ href: p(ROUTES.access()), label: t.commercial.ctaOptions, variant: 'ghost' })}
            ${Button({ href: p(ROUTES.development()), label: t.nav.development, variant: 'ghost' })}
            ${when(
              LINKS.mql5Profile,
              () => Button({ href: LINKS.mql5Profile, label: t.ui.viewOnMql5, variant: 'ghost', external: true, srNote: t.ui.externalLink })
            )}
          </div>
          <p class="final__sig" data-reveal>${BRAND.signature}</p>
        </div>
      `,
    })}
  `;
}
