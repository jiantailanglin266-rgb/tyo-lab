import { html } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { VIDEOS, BRAND } from '../site.config.mjs';
import { PageHero, SectionHead, KeyValueGrid, CTABlock, Eyebrow, GlobalMap, Decor } from '../components/sections.mjs';
import { CinematicSection } from '../components/media.mjs';

export default function About({ locale, t, has, mask }) {
  const a = t.about;
  return html`
    ${PageHero({ eyebrow: a.eyebrow, h1: a.h1, h2: a.h2, lead: a.lead })}

    <section class="sec" id="who" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '01', title: a.whoTitle })}
        <div class="cols2">
          <p class="lead" data-reveal>${a.whoBody}</p>
          <p class="prose" data-reveal>${a.whoNote}</p>
        </div>
      </div>
    </section>

    <!-- Philosophy — the core brand statement -->
    <section class="sec sec--philosophy" id="philosophy" data-reveal-root>
      ${Decor()}
      <div class="wrap">
        ${Eyebrow('02')}
        <h2 class="sr">${a.philosophyTitle}</h2>
        <div class="phil">
          <ul class="phil__no">
            ${a.philosophyNo.map((x, i) => html`<li data-reveal style="--d:${i}">${x}</li>`)}
          </ul>
          <p class="phil__only" data-reveal>${a.philosophyOnly}</p>
          <ul class="phil__yes">
            ${a.philosophyYes.map((x, i) => html`<li data-reveal style="--d:${i}">${x}</li>`)}
          </ul>
        </div>
        <p class="lead lead--center" data-reveal>${a.philosophyBody}</p>
      </div>
      <canvas class="sec__particles" data-particles="spectrum" aria-hidden="true"></canvas>
    </section>

    <section class="sec" id="principles" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '03', title: a.principlesTitle })}
        ${KeyValueGrid(a.principles, { cols: 1, mono: false })}
      </div>
    </section>

    <!-- Global — VIDEO_05 -->
    ${CinematicSection({
      video: VIDEOS.global,
      available: has.global,
      align: 'left',
      label: 'Global',
      children: html`
        <div class="cine__copy">
          ${Eyebrow(t.home.global.eyebrow, '04')}
          <h2 class="big" data-reveal>
            <span class="big__l1">${t.home.global.h1}</span>
            <span class="big__l2">${t.home.global.h2}</span>
          </h2>
          <p class="lead" data-reveal>${t.home.global.body}</p>
        </div>
      `,
    })}
    <section class="sec sec--map" data-reveal-root>
      <div class="wrap">${GlobalMap({ t, mask })}</div>
    </section>

    <!-- Final — VIDEO_06 -->
    ${CinematicSection({
      video: VIDEOS.final,
      available: has.final,
      height: 'band',
      label: 'TYO',
      children: html`
        <div class="cine__copy cine__copy--center">
          <p class="band__brand" data-reveal>${BRAND.name}</p>
          <h2 class="band" data-reveal>${t.home.final.line}</h2>
          <p class="band__sig" data-reveal>${BRAND.signature}</p>
        </div>
      `,
    })}

    ${CTABlock({
      title: a.contactCta,
      body: t.contact.lead,
      primary: { href: localePath(locale, ROUTES.contact()), label: t.nav.contact },
      secondary: { href: localePath(locale, ROUTES.ea()), label: t.ui.exploreEAs },
    })}
  `;
}
