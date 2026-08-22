/**
 * CUSTOM EA DEVELOPMENT (Phase 16 §30–41, §89–99).
 * Structure per §89: HERO → WHAT WE BUILD → DEVELOPMENT TYPES → RESEARCH
 * PROCESS → TECH STACK → CASE STUDIES → FAQ → REQUEST FORM.
 * No fixed prices (§94), no invented clients (§41).
 */
import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { DEVELOPMENT, DEVELOPMENT_REQUEST_FIELDS, OPTIONAL_FIELDS, INQUIRY_SUBJECTS } from '../data/commercial/development.mjs';
import { PageHero, SectionHead, Button, KeyValueGrid, WordWall } from '../components/sections.mjs';
import { Flow, FAQ, InquiryForm } from '../components/commercial.mjs';

export default function Development({ locale, t }) {
  const D = t.development;
  const C = t.commercial;
  const p = (r) => localePath(locale, r);

  return html`
    ${PageHero({
      eyebrow: D.eyebrow,
      h1: D.h1,
      h2: D.h2,
      lead: D.lead,
      children: html`<div class="hero__actions" data-reveal>
        ${Button({ href: '#request', label: D.ctaRequest })}
        ${Button({ href: '#modify', label: D.ctaModify, variant: 'ghost' })}
      </div>`,
    })}

    <!-- WHY TYO (§91–92) -->
    <section class="sec sec--intro" data-reveal-root>
      <div class="wrap">
        <h2 class="big" data-reveal>
          <span class="big__l1">${D.why.h1}</span>
          <span class="big__l2">${D.why.h2}</span>
        </h2>
        <div class="cols2">
          <p class="lead" data-reveal>${D.why.body1}</p>
          <p class="prose" data-reveal>${D.why.body2}</p>
        </div>
      </div>
    </section>

    <!-- WHAT WE BUILD (§32) -->
    <section class="sec sec--tight" id="scope" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '01', title: D.scope.title, lead: D.scope.lead })}
        ${KeyValueGrid(DEVELOPMENT.scope.map((k) => ({ k: D.scope.items[k].k, v: D.scope.items[k].v })), { cols: 5 })}
      </div>
    </section>

    <!-- DEVELOPMENT TYPES (§36, §93) -->
    <section class="sec sec--tight" id="types" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '02', title: D.types.title, lead: D.types.lead })}
        <div class="dtypes">
          ${DEVELOPMENT.types.map(
            (k, i) => html`<article class="dtype" data-reveal style="--d:${i}">
              <span class="dtype__n">0${i + 1}</span>
              <h3 class="dtype__name">${D.types.items[k].name}</h3>
              <p class="dtype__body">${D.types.items[k].body}</p>
              <p class="dtype__price">${C.quote}</p>
            </article>`
          )}
        </div>
        <p class="fineline" data-reveal>${D.types.note}</p>
      </div>
    </section>

    <!-- RESEARCH PROCESS (§33–35) -->
    <section class="sec sec--tight" id="process" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '03', title: D.process.title, lead: D.process.lead })}
        <div class="cols2">
          <div>
            <p class="statgrid__title" data-reveal>${D.process.standardTitle}</p>
            ${Flow({ steps: DEVELOPMENT.flow.map((k) => D.process.steps[k]) })}
          </div>
          <div>
            <p class="statgrid__title" data-reveal>${D.process.advancedTitle}</p>
            ${Flow({ steps: DEVELOPMENT.advancedFlow.map((k) => D.process.advanced[k]), compact: true })}
            <p class="fineline" data-reveal>${D.process.advancedNote}</p>
            <div class="sec__actions" data-reveal>
              ${Button({ href: p(ROUTES.research()), label: D.process.seeProtocol, variant: 'ghost' })}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TECH STACK (§90) -->
    <section class="sec sec--tech" id="stack" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '04', title: D.stack.title, lead: D.stack.lead })}
        ${WordWall(DEVELOPMENT.stack)}
      </div>
    </section>

    <!-- EXISTING EA MODIFICATION (§39–40) -->
    <section class="sec sec--tight" id="modify" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '05', title: D.modify.title, lead: D.modify.lead })}
        <ul class="reqlist" data-reveal>
          ${DEVELOPMENT.modificationExamples.map((k) => html`<li><span aria-hidden="true">+</span>${D.modify.examples[k]}</li>`)}
        </ul>
        <div class="sec__actions" data-reveal>${Button({ href: '#request', label: D.modify.cta, variant: 'ghost' })}</div>
      </div>
    </section>

    <!-- CASE STUDIES (§41) — research-log backed only -->
    <section class="sec sec--tight" id="cases" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '06', title: D.cases.title, lead: D.cases.lead })}
        ${when(
          DEVELOPMENT.caseStudies.length === 0,
          () => html`<p class="prose" data-reveal>${D.cases.none}</p>
            <div class="sec__actions" data-reveal>${Button({ href: p(ROUTES.research()), label: D.cases.cta, variant: 'ghost' })}</div>`
        )}
      </div>
    </section>

    <!-- FAQ (§98–99) -->
    <section class="sec sec--tight" id="faq" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '07', title: D.faqTitle })}
        ${FAQ({ items: D.faq })}
      </div>
    </section>

    <!-- REQUEST FORM (§38) -->
    <section class="sec sec--form" id="request" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '08', title: D.form.title, lead: D.form.lead })}
        ${InquiryForm({
          kind: 'development',
          subject: INQUIRY_SUBJECTS.development,
          fields: DEVELOPMENT_REQUEST_FIELDS,
          optional: OPTIONAL_FIELDS,
          t,
          labels: C.form.labels,
        })}
        <p class="fineline" data-reveal>${D.form.uploadNote}</p>
      </div>
    </section>
  `;
}
