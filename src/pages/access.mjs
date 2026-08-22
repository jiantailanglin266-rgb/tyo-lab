/**
 * EA ACCESS — the commercial hub (Phase 16 §2–29, §48–50, §76, §100, §115).
 * Evidence first: every EA on this page links back to its evidence; the
 * page sells nothing directly. `?ea=<slug>` is read by main.js to focus the
 * matching row of the strategy matrix (§43).
 */
import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { PLANS, COMPARISON, DATA_REQUIRED } from '../data/commercial/plans.mjs';
import { IB_ACCESS } from '../data/commercial/access.mjs';
import { PRIVATE_PRODUCT } from '../data/commercial/products.mjs';
import { PRIVATE_INQUIRY_FIELDS, OPTIONAL_FIELDS, INQUIRY_SUBJECTS } from '../data/commercial/development.mjs';
import { PageHero, SectionHead, Button, Eyebrow } from '../components/sections.mjs';
import { PlanCards, ComparisonTable, Flow, FAQ, InquiryForm, IBDisclosure, AccessBadges, DataRequired, Price } from '../components/commercial.mjs';

export default function Access({ locale, t, ea }) {
  const A = t.access;
  const C = t.commercial;
  const p = (r) => localePath(locale, r);
  const models = ea.filter((m) => m.slug !== 'ea-template');
  const ibOn = IB_ACCESS.enabled;
  const plans = PLANS.filter((pl) => pl.id !== 'IB' || ibOn);

  return html`
    ${PageHero({ eyebrow: A.eyebrow, h1: A.h1, h2: A.h2, lead: A.lead })}

    <!-- the four models -->
    <section class="sec sec--plans" id="plans" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '01', title: A.modelsTitle, lead: A.modelsLead })}
        ${PlanCards({ plans, t, locale })}
        <p class="fineline" data-reveal>${A.plannedNote}</p>
      </div>
    </section>

    <!-- strategy × plan matrix (§8, §46, §76) -->
    <section class="sec sec--tight" id="strategies" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '02', title: A.matrixTitle, lead: A.matrixLead })}
        <div class="tablewrap" data-reveal>
          <table class="dtable amatrix" data-access-matrix>
            <thead>
              <tr>
                <th scope="col">${A.matrix.ea}</th>
                <th scope="col">${A.matrix.symbol}</th>
                <th scope="col">${A.matrix.timeframe}</th>
                <th scope="col">${A.matrix.score}</th>
                <th scope="col">${A.matrix.evidence}</th>
                <th scope="col">${A.matrix.plans}</th>
                <th scope="col">${A.matrix.status}</th>
              </tr>
            </thead>
            <tbody>
              ${models.map(
                (m) => html`<tr data-ea="${m.slug}" id="ea-${m.slug}">
                  <th scope="row"><a href="${p(ROUTES.eaDetail(m.slug))}">${m.name}</a></th>
                  <td data-label="${A.matrix.symbol}">${m.spec.symbol || '—'}</td>
                  <td data-label="${A.matrix.timeframe}">${m.spec.timeframe || '—'}</td>
                  <td data-label="${A.matrix.score}">${m.score?.total != null ? `${m.score.total}/100` : '—'}</td>
                  <td data-label="${A.matrix.evidence}"><a class="amatrix__ev" href="${p(ROUTES.eaDetail(m.slug))}#evidence">${A.matrix.viewEvidence}</a></td>
                  <td data-label="${A.matrix.plans}">${AccessBadges({ plans: m.commercial.plans, t })}</td>
                  <td data-label="${A.matrix.status}"><span class="cstatus cstatus--${raw(m.commercial.status.toLowerCase())}">${C.status[m.commercial.status]}</span></td>
                </tr>`
              )}
            </tbody>
          </table>
        </div>
        <p class="fineline" data-reveal>${A.matrixNote}</p>
        <div class="afocus" data-access-focus hidden data-reveal>
          <span class="afocus__k">${A.focusLabel}</span>
          <span class="afocus__name" data-access-focus-name></span>
          <span class="afocus__plans" data-access-focus-plans></span>
          <p class="afocus__body" data-access-focus-body data-pending="${A.focusPending}" data-assigned="${A.focusAssigned}"></p>
        </div>
      </div>
    </section>

    <!-- IB ACCESS (§4–8, §50–53) -->
    ${when(
      ibOn,
      () => html`<section class="sec sec--ib" id="ib" data-reveal-root>
        <div class="wrap">
          ${SectionHead({ eyebrow: 'ACCESS 01', title: A.ib.title, lead: A.ib.lead })}
          <div class="cols2">
            <div>
              <p class="prose" data-reveal>${A.ib.body}</p>
              <p class="prose" data-reveal>${A.ib.wording}</p>
              <div class="ckv" data-reveal>
                <div class="ckv__row"><span class="ckv__k">${A.ib.supportedBroker}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
                <div class="ckv__row"><span class="ckv__k">${A.ib.eligibility}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
                <div class="ckv__row"><span class="ckv__k">${A.ib.verification}</span><span class="ckv__v">${A.ib.verificationManual}</span></div>
                <div class="ckv__row"><span class="ckv__k">${A.ib.countries}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
              </div>
              ${IBDisclosure({ t })}
            </div>
            <div>
              <p class="statgrid__title" data-reveal>${A.ib.flowTitle}</p>
              ${Flow({ steps: IB_ACCESS.flow.map((k) => A.ib.flow[k]) })}
              <p class="statgrid__title" data-reveal>${A.ib.statesTitle}</p>
              <div class="xdiffs" data-reveal>
                ${['NOT_CONNECTED', 'PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'SUSPENDED'].map((s) => html`<span class="xdiff">${A.ib.states[s]}</span>`)}
              </div>
              <p class="fineline" data-reveal>${A.ib.verificationNote}</p>
            </div>
          </div>
        </div>
      </section>`
    )}

    <!-- TYO PRO (§9–14) -->
    <section class="sec sec--pro" id="pro" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: 'ACCESS 02', title: A.pro.title, title2: A.pro.price, lead: A.pro.lead })}
        <div class="cols2">
          <div>
            <p class="prose" data-reveal>${A.pro.body}</p>
            <ul class="plan__features plan__features--loose" data-reveal>
              ${PLANS.find((x) => x.id === 'PRO').features.map((f) => html`<li>${C.features[f]}</li>`)}
            </ul>
            <p class="fineline" data-reveal>${A.pro.featuresNote}</p>
          </div>
          <div>
            <div class="ckv" data-reveal>
              <div class="ckv__row"><span class="ckv__k">${A.pro.billing}</span><span class="ckv__v">$10 / ${C.perMonth}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.currency}</span><span class="ckv__v">USD</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.provider}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.cancel}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.refund}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.states}</span><span class="ckv__v xdiffs">${['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'].map((s) => html`<span class="xdiff">${s}</span>`)}</span></div>
            </div>
            <p class="fineline" data-reveal>${A.pro.downloadNote}</p>
            <p class="fineline" data-reveal>${A.pro.notLive}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- TYO PRIVATE (§23–29) -->
    <section class="sec sec--private" id="private" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: 'ACCESS 03', title: A.private.title, title2: '$5,000', lead: A.private.lead })}
        <div class="cols2">
          <div>
            <p class="prose" data-reveal>${A.private.body}</p>
            <div class="pstrategy" data-reveal>
              <span class="pstrategy__tag">PRIVATE STRATEGY</span>
              <p>${A.private.detailsUponInquiry}</p>
            </div>
            <p class="prose" data-reveal>${A.private.priceExplain}</p>
            <p class="warn" data-reveal>${A.private.disclaimer}</p>
            <p class="statgrid__title" data-reveal>${A.private.flowTitle}</p>
            ${Flow({ steps: ['inquiry', 'useCaseReview', 'meeting', 'terms', 'payment', 'delivery'].map((k) => A.private.flow[k]), compact: true })}
            <p class="fineline" data-reveal>${A.private.noCheckout}</p>
          </div>
          <div>
            <p class="statgrid__title" data-reveal>${A.private.formTitle}</p>
            ${InquiryForm({
              kind: 'private',
              subject: INQUIRY_SUBJECTS.private,
              fields: PRIVATE_INQUIRY_FIELDS,
              optional: OPTIONAL_FIELDS,
              t,
              labels: C.form.labels,
            })}
          </div>
        </div>
      </div>
    </section>

    <!-- CUSTOM (§30) — pointer -->
    <section class="sec sec--tight" id="custom" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: 'ACCESS 04', title: A.custom.title, lead: A.custom.lead })}
        <div class="sec__actions" data-reveal>${Button({ href: p(ROUTES.development()), label: A.custom.cta })}</div>
      </div>
    </section>

    <!-- comparison (§48–49) -->
    <section class="sec sec--tight" id="compare" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '03', title: A.compare.title, lead: A.compare.lead })}
        ${ComparisonTable({ rows: COMPARISON, t })}
        <p class="fineline" data-reveal>${A.compare.note}</p>
      </div>
    </section>

    <!-- FAQ (§100) -->
    <section class="sec sec--tight" id="faq" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '04', title: A.faqTitle })}
        ${FAQ({ items: A.faq })}
      </div>
    </section>

    <!-- evidence before sales -->
    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">
        <p class="ebs" data-reveal><span class="ebs__k">EVIDENCE BEFORE SALES.</span> ${A.evidenceLine}</p>
        <div class="sec__actions" data-reveal>
          ${Button({ href: p(ROUTES.ea()), label: A.backToStrategies, variant: 'ghost' })}
          ${Button({ href: p(ROUTES.research()), label: A.backToResearch, variant: 'ghost' })}
        </div>
      </div>
    </section>
  `;
}
