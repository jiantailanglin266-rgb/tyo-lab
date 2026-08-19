import { html, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { LINKS } from '../site.config.mjs';
import { PageHero, Button, CTABlock } from '../components/sections.mjs';
import { BacktestDisclaimer } from '../components/layout.mjs';
import { EACard } from '../components/ea.mjs';
import { BrowseToolbar, CompareTray } from '../components/ea-browse.mjs';

export default function EAIndex({ locale, t, ea }) {
  const p = (r) => localePath(locale, r);

  return html`
    ${PageHero({
      eyebrow: t.ea.index.eyebrow,
      h1: t.ea.index.h1,
      h2: t.ea.index.h2,
      lead: t.ea.index.lead,
      children: when(
        ea.length,
        () => html`<div class="phero__row" data-reveal>
          <p class="phero__count">
            <span class="phero__count-n">${String(ea.length).padStart(2, '0')}</span>
            <span>${t.ea.index.count}</span>
          </p>
          ${Button({ href: p(ROUTES.eaCompare()), label: t.ea.compare.viewAll, variant: 'ghost' })}
        </div>`
      ),
    })}

    <section class="sec" data-reveal-root>
      <div class="wrap">
        ${when(ea.length, () => BrowseToolbar({ models: ea, t, locale }))}

        ${ea.length
          ? html`<div class="eagrid" data-ea-grid>${ea.map((e, i) => EACard({ ea: e, locale, t, index: i }))}</div>`
          : html`<p class="empty" data-reveal>${t.ea.index.empty}</p>`}
      </div>
    </section>

    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">${BacktestDisclaimer({ t })}</div>
    </section>

    ${CTABlock({
      title: t.contact.mql5Title,
      body: t.contact.mql5Body,
      primary: LINKS.mql5Profile
        ? { href: LINKS.mql5Profile, label: t.ui.viewOnMql5, external: true, srNote: t.ui.externalLink }
        : null,
      secondary: { href: p(ROUTES.contact()), label: t.nav.contact },
    })}

    ${CompareTray({ t, locale })}
  `;
}
