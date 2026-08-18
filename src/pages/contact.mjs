import { html, when } from '../lib/html.mjs';
import { LINKS, FORM_ENDPOINT, FEATURES } from '../site.config.mjs';
import { PageHero, SectionHead, Button, Eyebrow } from '../components/sections.mjs';

export default function Contact({ locale, t }) {
  const c = t.contact;
  const action = FORM_ENDPOINT || (LINKS.email ? `mailto:${LINKS.email}` : '');

  return html`
    ${PageHero({ eyebrow: c.eyebrow, h1: c.h1, h2: c.h2, lead: c.lead })}

    <section class="sec" data-reveal-root>
      <div class="wrap contact">
        <!-- MQL5 -->
        <div class="contact__card contact__card--mql5" data-reveal>
          ${Eyebrow('01')}
          <h2 class="contact__title">${c.mql5Title}</h2>
          <p class="prose">${c.mql5Body}</p>
          ${when(
            LINKS.mql5Profile,
            () => html`<div class="contact__actions">
              ${Button({ href: LINKS.mql5Profile, label: t.ui.mql5Profile, external: true, srNote: t.ui.externalLink })}
            </div>`
          )}
        </div>

        <!-- Email -->
        ${when(
          LINKS.email,
          () => html`<div class="contact__card" data-reveal>
            ${Eyebrow('02')}
            <h2 class="contact__title">${c.emailTitle}</h2>
            <a class="contact__email" href="mailto:${LINKS.email}">${LINKS.email}</a>
            <p class="src">${c.formNote}</p>
          </div>`
        )}

        <!-- What we cannot do -->
        <div class="contact__card contact__card--warn" data-reveal>
          ${Eyebrow('03')}
          <h2 class="contact__title">${c.noSupportTitle}</h2>
          <p class="prose">${c.noSupportBody}</p>
        </div>
      </div>
    </section>

    ${when(
      FEATURES.contactForm && action,
      () => html`<section class="sec sec--form" id="form" data-reveal-root>
        <div class="wrap wrap--narrow">
          ${SectionHead({ eyebrow: '04', title: c.formTitle })}
          <form class="form" method="post" action="${action}" data-contact-form>
            <div class="form__row">
              <label class="field">
                <span class="field__label">${c.formName}</span>
                <input class="field__input" type="text" name="name" required autocomplete="name" />
              </label>
              <label class="field">
                <span class="field__label">${c.formEmail}</span>
                <input class="field__input" type="email" name="email" required autocomplete="email" />
              </label>
            </div>
            <label class="field">
              <span class="field__label">${c.formSubject}</span>
              <select class="field__input" name="subject">
                ${c.formSubjects.map((s) => html`<option value="${s}">${s}</option>`)}
              </select>
            </label>
            <label class="field">
              <span class="field__label">${c.formMessage}</span>
              <textarea class="field__input field__input--area" name="message" rows="6" required></textarea>
            </label>
            <p class="form__note">${c.formNote}</p>
            <button class="btn btn--primary form__submit" type="submit">
              <span class="btn__label">${c.formSend}</span>
              <span class="btn__arrow" aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </section>`
    )}
  `;
}
