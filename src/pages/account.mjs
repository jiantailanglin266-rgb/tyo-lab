/**
 * TYO ACCOUNT (Phase 16 §17–19, §78).
 * The account layer (auth, billing, entitlements, signed downloads) is a
 * separate app (Phase 16B). Until COMMERCIAL.accountUrl points at it, this
 * page says so plainly — no fake login, no fake locks (§78).
 */
import { html, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { COMMERCIAL } from '../site.config.mjs';
import { PageHero, SectionHead, Button } from '../components/sections.mjs';
import { DataRequired } from '../components/commercial.mjs';

export default function Account({ locale, t }) {
  const K = t.account;
  const p = (r) => localePath(locale, r);
  const live = !!COMMERCIAL.accountUrl;

  return html`
    ${PageHero({ eyebrow: K.eyebrow, h1: K.h1, h2: K.h2, lead: live ? K.leadLive : K.leadNotLive })}

    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">
        ${when(live, () => html`<div class="sec__actions" data-reveal>${Button({ href: COMMERCIAL.accountUrl, label: K.open, external: true })}</div>`)}
        ${when(
          !live,
          () => html`<div class="notlive" data-reveal>
            ${DataRequired({ t, what: K.notLiveTag })}
            <p>${K.notLiveBody}</p>
          </div>`
        )}

        ${SectionHead({ eyebrow: '01', title: K.willShowTitle, lead: K.willShowLead })}
        <div class="xdiffs" data-reveal>
          ${['accessPlan', 'subscriptionStatus', 'ibStatus', 'availableEAs', 'downloads', 'licenses', 'settings'].map((k) => html`<span class="xdiff">${K.sections[k]}</span>`)}
        </div>

        ${SectionHead({ eyebrow: '02', title: K.loginTitle, lead: K.loginLead })}
        <p class="fineline" data-reveal>${K.loginNote}</p>

        <div class="sec__actions" data-reveal>
          ${Button({ href: p(ROUTES.access()), label: K.backToAccess, variant: 'ghost' })}
        </div>
      </div>
    </section>
  `;
}
