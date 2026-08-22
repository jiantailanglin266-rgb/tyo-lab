/**
 * EA ACCESS — the commercial hub (SaaS §142–§144, §124).
 * Evidence first: every strategy row links back to its evidence; the page
 * sells nothing directly. `?ea=<slug>` focuses the matching row (main.js).
 */
import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { FLAGS, PRICING } from '../site.config.mjs';
import { PLANS, COMPARISON, PARTNER_STATES, SUBSCRIPTION_STATES } from '../data/commercial/plans.mjs';
import { PARTNER_ACCESS } from '../data/commercial/access.mjs';
import { PRIVATE_INQUIRY_FIELDS, OPTIONAL_FIELDS, INQUIRY_SUBJECTS } from '../data/commercial/development.mjs';
import { PageHero, SectionHead, Button } from '../components/sections.mjs';
import { PlanCards, ComparisonTable, Flow, FAQ, InquiryForm, PartnerDisclosure, AccessBadge, DataRequired, BrandStrip } from '../components/commercial.mjs';

export default function Access({ locale, t, ea }) {
  const A = t.access;
  const C = t.commercial;
  const p = (r) => localePath(locale, r);
  const models = ea.filter((m) => m.slug !== 'ea-template');
  const plans = PLANS.filter((pl) => pl.id !== 'PARTNER' || FLAGS.partner);

  return html`
    ${PageHero({ eyebrow: A.eyebrow, h1: A.h1, h2: A.h2, lead: A.lead })}

    <!-- the four access models -->
    <section class="sec sec--plans" id="plans" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '01', title: A.modelsTitle, lead: A.modelsLead })}
        ${PlanCards({ plans, t, locale })}
        <p class="fineline" data-reveal>${A.plannedNote}</p>
      </div>
    </section>

    <!-- strategy × access matrix (§20, §23) -->
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
                <th scope="col">${A.matrix.plan}</th>
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
                  <td data-label="${A.matrix.plan}">${m.commercial.plan ? C.plans[m.commercial.plan] : '—'}</td>
                  <td data-label="${A.matrix.status}">${AccessBadge({ status: m.commercial.status, t })}</td>
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

    <!-- FREE (§9) -->
    <section class="sec sec--free" id="free" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: 'ACCESS 01', title: A.free.title, title2: '$0', lead: A.free.lead })}
        <div class="cols2">
          <div>
            <p class="prose" data-reveal>${A.free.body}</p>
            <ul class="plan__features plan__features--loose" data-reveal>
              ${PLANS.find((x) => x.id === 'FREE').features.map((f) => html`<li>${C.features[f]}</li>`)}
            </ul>
          </div>
          <div>
            <div class="ckv" data-reveal>
              <div class="ckv__row"><span class="ckv__k">${A.free.cost}</span><span class="ckv__v">$0</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.free.requires}</span><span class="ckv__v">${A.free.requiresValue}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.free.eaList}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
            </div>
            <p class="fineline" data-reveal>${A.free.notLive}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PRO (§10) -->
    <section class="sec sec--pro" id="pro" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: 'ACCESS 02', title: A.pro.title, title2: `$${PRICING.proMonthly} / ${C.perMonth}`, lead: A.pro.lead })}
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
              <div class="ckv__row"><span class="ckv__k">${A.pro.billing}</span><span class="ckv__v">$${PRICING.proMonthly} / ${C.perMonth}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.currency}</span><span class="ckv__v">${PRICING.currency}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.provider}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.cancel}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.refund}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
              <div class="ckv__row"><span class="ckv__k">${A.pro.states}</span><span class="ckv__v xdiffs">${SUBSCRIPTION_STATES.map((s) => html`<span class="xdiff">${s}</span>`)}</span></div>
            </div>
            <p class="fineline" data-reveal>${A.pro.downloadNote}</p>
            <p class="fineline" data-reveal>${A.pro.notLive}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PARTNER (§11, §50–§54) -->
    ${when(
      FLAGS.partner,
      () => html`<section class="sec sec--partner" id="partner" data-reveal-root>
        <div class="wrap">
          ${SectionHead({ eyebrow: 'ACCESS 03', title: A.partner.title, lead: A.partner.lead })}
          <div class="cols2">
            <div>
              <p class="prose" data-reveal>${A.partner.body}</p>
              <p class="prose" data-reveal>${A.partner.wording}</p>
              <div class="ckv" data-reveal>
                <div class="ckv__row"><span class="ckv__k">${A.partner.supportedBroker}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
                <div class="ckv__row"><span class="ckv__k">${A.partner.eligibility}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
                <div class="ckv__row"><span class="ckv__k">${A.partner.approval}</span><span class="ckv__v">${A.partner.approvalManual}</span></div>
                <div class="ckv__row"><span class="ckv__k">${A.partner.countries}</span><span class="ckv__v">${DataRequired({ t })}</span></div>
              </div>
              ${PartnerDisclosure({ t })}
            </div>
            <div>
              <p class="statgrid__title" data-reveal>${A.partner.flowTitle}</p>
              ${Flow({ steps: PARTNER_ACCESS.flow.map((k) => A.partner.flow[k]) })}
              <p class="statgrid__title" data-reveal>${A.partner.statesTitle}</p>
              <div class="xdiffs" data-reveal>
                ${PARTNER_STATES.map((s) => html`<span class="xdiff">${A.partner.states[s]}</span>`)}
              </div>
              <p class="fineline" data-reveal>${A.partner.verificationNote}</p>
            </div>
          </div>
        </div>
      </section>`
    )}

    <!-- PRIVATE (§12, §144) -->
    <section class="sec sec--private" id="private" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: 'ACCESS 04', title: A.private.title, title2: `$${PRICING.privateOneTime.toLocaleString('en-US')}`, lead: A.private.lead })}
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
            ${Flow({ steps: ['inquiry', 'screening', 'agreement', 'payment', 'delivery'].map((k) => A.private.flow[k]), compact: true })}
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

    <!-- CUSTOM DEVELOPMENT — a service, not a plan (§13, §145) -->
    <section class="sec sec--tight" id="custom" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '03', title: A.custom.title, lead: A.custom.lead })}
        <div class="sec__actions" data-reveal>${Button({ href: p(ROUTES.development()), label: A.custom.cta })}</div>
      </div>
    </section>

    <!-- comparison (§143) -->
    <section class="sec sec--tight" id="compare" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '04', title: A.compare.title, lead: A.compare.lead })}
        ${ComparisonTable({ rows: COMPARISON, t })}
        <p class="fineline" data-reveal>${A.compare.note}</p>
      </div>
    </section>

    <!-- FAQ -->
    <section class="sec sec--tight" id="faq" data-reveal-root>
      <div class="wrap">
        ${SectionHead({ eyebrow: '05', title: A.faqTitle })}
        ${FAQ({ items: A.faq })}
      </div>
    </section>

    <!-- evidence before sales (§159) -->
    <section class="sec sec--tight" data-reveal-root>
      <div class="wrap">
        <p class="ebs" data-reveal><span class="ebs__k">EVIDENCE BEFORE SALES.</span> ${A.evidenceLine}</p>
        <div class="sec__actions" data-reveal>
          ${Button({ href: p(ROUTES.ea()), label: A.backToStrategies, variant: 'ghost' })}
          ${Button({ href: p(ROUTES.research()), label: A.backToResearch, variant: 'ghost' })}
        </div>
        ${BrandStrip()}
      </div>
    </section>
  `;
}
