import { html, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { VIDEOS } from '../site.config.mjs';
import { formatDate } from '../lib/i18n.mjs';
import { PageHero, SectionHead, Timeline, CTABlock, Eyebrow } from '../components/sections.mjs';
import { CinematicSection } from '../components/media.mjs';

export default function History({ locale, t, stages, milestones, has }) {
  const h = t.history;
  return html`
    ${PageHero({ eyebrow: h.eyebrow, h1: h.h1, h2: h.h2, lead: h.lead })}

    <!-- Every EA starts with a question -->
    <section class="sec sec--question" data-reveal-root>
      <div class="wrap">
        <h2 class="big big--center" data-reveal><span class="big__l1">${h.quote1}</span></h2>
        <ul class="qlist qlist--center">
          ${h.questions.map((q, i) => html`<li data-reveal style="--d:${i}"><span aria-hidden="true">—</span>${q}</li>`)}
        </ul>
        <p class="thenwe thenwe--center" data-reveal>${h.quote2}</p>
      </div>
    </section>

    <!-- From idea to algorithm — VIDEO_03 reused as a divider -->
    ${CinematicSection({
      video: VIDEOS.algorithm,
      available: has.algorithm,
      height: 'band',
      label: 'Algorithm',
      children: html`
        <div class="cine__copy cine__copy--center">
          <h2 class="band" data-reveal>${t.home.algorithm.h1} ${t.home.algorithm.h2}</h2>
        </div>
      `,
    })}

    <!-- The loop -->
    <section class="sec" id="process" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: 'Process', title: h.processTitle })}
        ${Timeline({ stages, locale, t })}
      </div>
    </section>

    <!-- Failure -->
    <section class="sec sec--failure" data-reveal-root>
      <div class="wrap">
        ${Eyebrow('Record')}
        <h2 class="mid" data-reveal>${h.failureTitle}</h2>
        <p class="lead" data-reveal>${h.failureBody}</p>
      </div>
    </section>

    <!-- Milestones — rendered only when the data file actually has entries -->
    ${when(
      milestones.length,
      () => html`<section class="sec" id="milestones" data-reveal-root>
        <div class="wrap">
          ${SectionHead({ eyebrow: 'Timeline', title: h.milestonesTitle })}
          <ol class="ms">
            ${milestones.map((m, i) => {
              const c = m[locale] || m.en;
              return html`<li class="ms__item" data-reveal style="--d:${i % 4}">
                <p class="ms__date">${formatDate(m.date, locale)}</p>
                <h3 class="ms__title">${c.title}</h3>
                <p class="ms__body">${c.body}</p>
              </li>`;
            })}
          </ol>
        </div>
      </section>`
    )}

    ${CTABlock({
      title: t.home.ea.h,
      body: t.home.ea.body,
      primary: { href: localePath(locale, ROUTES.ea()), label: t.ui.exploreEAs },
      secondary: { href: localePath(locale, ROUTES.lab()), label: t.nav.lab },
    })}
  `;
}
