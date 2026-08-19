import { html } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { Button, Decor } from '../components/sections.mjs';

export default function NotFound({ locale, t }) {
  return html`
    <section class="nf" data-reveal-root>
      ${Decor({ hud: true })}
      <div class="wrap">
        <p class="nf__code" data-reveal>404</p>
        <h1 class="nf__title" data-reveal>Signal not found.</h1>
        <p class="nf__body" data-reveal>${t.meta.defaultDesc}</p>
        <div class="nf__actions" data-reveal>
          ${Button({ href: localePath(locale, ROUTES.home()), label: t.nav.home })}
          ${Button({ href: localePath(locale, ROUTES.ea()), label: t.ui.exploreEAs, variant: 'ghost' })}
        </div>
      </div>
      <canvas class="sec__particles" data-particles="spectrum" aria-hidden="true"></canvas>
    </section>
  `;
}
