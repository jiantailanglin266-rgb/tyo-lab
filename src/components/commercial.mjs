/**
 * ============================================================================
 * COMMERCIAL COMPONENTS (SaaS Phase 1)
 * ============================================================================
 * Access badges, plan cards, comparison, flows, inquiry forms, FAQ, and the
 * per-strategy access panel.
 *
 * Design rule (§123–§125): research-site restraint — mono eyebrows, quiet
 * chips, no urgency. Words: Access / License / Research / Development.
 *
 * Honesty rules enforced here, not in copy:
 *   • a PLANNED plan carries a visible planned state (§146)
 *   • a form without an endpoint renders DATA_REQUIRED and no mailto (§93)
 *   • DATA_REQUIRED values are printed literally (§119)
 *   • a strategy with no commercial assignment shows RESEARCH ONLY (§120)
 * ============================================================================
 */
import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { COMMERCIAL, LINKS, FLAGS, BRAND } from '../site.config.mjs';
import { DATA_REQUIRED } from '../data/commercial/plans.mjs';
import { Button, Eyebrow } from './sections.mjs';

/* ---- badges (§23, §46) ---------------------------------------------------- */
export function AccessBadge({ status, t }) {
  const A = t.commercial;
  const cls = String(status || 'RESEARCH_ONLY').toLowerCase().replace('_', '-');
  return html`<span class="abadge abadge--${raw(cls)}" title="${A.statusTitle}">${A.status[status] || status}</span>`;
}

/* ---- DATA_REQUIRED chip ---------------------------------------------------- */
export function DataRequired({ t, what = '' }) {
  return html`<span class="dreq" title="${t.commercial.dataRequiredTitle}"><i aria-hidden="true">◌</i>${DATA_REQUIRED}${when(what, () => html` · ${what}`)}</span>`;
}

/* ---- price ----------------------------------------------------------------- */
export function Price({ price, t }) {
  const A = t.commercial;
  if (price.unit === 'free') return html`<span class="price"><span class="price__n">$0</span><span class="price__u">${A.forever}</span></span>`;
  if (price.unit === 'brokerLinked') return html`<span class="price"><span class="price__n">$0</span><span class="price__u">${A.brokerLinked}</span></span>`;
  if (price.amount === null) return html`<span class="price price--quote">${A.quote}</span>`;
  const n = `$${price.amount.toLocaleString('en-US')}`;
  return html`<span class="price"><span class="price__n">${n}</span><span class="price__u">${price.unit === 'month' ? A.perMonth : A.oneTime}</span></span>`;
}

/* ---- plan cards (§142) ----------------------------------------------------- */
export function PlanCards({ plans, t, locale }) {
  const A = t.access;
  const C = t.commercial;
  return html`
    <div class="plans">
      ${plans.map((pl, i) => {
        const P = A.plans[pl.id];
        const anchor = { FREE: '#free', PRO: '#pro', PARTNER: '#partner', PRIVATE: '#private' }[pl.id];
        const track = { FREE: 'signup', PRO: 'pricing_view', PARTNER: 'partner_click', PRIVATE: 'private_inquiry' }[pl.id];
        return html`
          <article class="plan plan--${raw(pl.id.toLowerCase())}" data-reveal style="--d:${i}">
            <header class="plan__head">
              <span class="plan__level">ACCESS 0${pl.level}</span>
              <span class="plan__state plan__state--${raw(pl.availability.toLowerCase())}">${C.availability[pl.availability]}</span>
            </header>
            <h3 class="plan__name">${P.name}</h3>
            <p class="plan__price">${Price({ price: pl.price, t })}</p>
            <p class="plan__tag">${P.tagline}</p>
            <ul class="plan__features">
              ${pl.features.map((f) => html`<li>${C.features[f] || f}</li>`)}
            </ul>
            <p class="plan__note">${P.note}</p>
            <a class="btn btn--ghost plan__cta" href="${anchor}" data-track="${track}">
              <span class="btn__label">${P.cta}</span><span class="btn__arrow" aria-hidden="true">→</span>
            </a>
          </article>
        `;
      })}
    </div>
  `;
}

/* ---- comparison table → cards on mobile (§143, §126) ----------------------- */
export function ComparisonTable({ rows, t }) {
  const A = t.access.compare;
  const C = t.commercial;
  const cols = ['FREE', 'PRO', 'PARTNER', 'PRIVATE'];
  return html`
    <div class="tablewrap cmp" data-reveal>
      <table class="dtable cmp__table">
        <thead>
          <tr>
            <th scope="col">${A.heading}</th>
            ${cols.map((c) => html`<th scope="col">${C.plans[c]}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (r) => html`<tr>
              <th scope="row">${A.rows[r.key]}</th>
              ${cols.map((c) => html`<td data-label="${C.plans[c]}">${A.values[r[c]] || r[c]}</td>`)}
            </tr>`
          )}
        </tbody>
      </table>
    </div>
  `;
}

/* ---- vertical flow (§88, §89) ---------------------------------------------- */
export function Flow({ steps, compact = false }) {
  return html`
    <ol class="cflow${raw(compact ? ' cflow--compact' : '')}">
      ${steps.map((s, i) => html`<li class="cflow__step" data-reveal style="--d:${i}"><span class="cflow__n">${String(i + 1).padStart(2, '0')}</span><span class="cflow__t">${s}</span></li>`)}
    </ol>
  `;
}

/* ---- FAQ ------------------------------------------------------------------- */
export function FAQ({ items }) {
  return html`
    <div class="faq">
      ${items.map(
        (q, i) => html`<details class="faq__item" data-reveal style="--d:${i}">
          <summary>${q.q}</summary>
          <div class="faq__a">${q.a}</div>
        </details>`
      )}
    </div>
  `;
}

/* ---- inquiry form (§90–§93) ------------------------------------------------ */
/**
 * A real form whose POST target is COMMERCIAL.inquiryEndpoint. While the
 * endpoint is empty the form stays visible but disabled, labelled
 * DATA_REQUIRED, and the configured e-mail is offered as the interim channel
 * only when the owner has confirmed the mailbox. No mailto action, ever.
 */
export function InquiryForm({ kind, subject, fields, optional, t, labels }) {
  const C = t.commercial.form;
  const endpoint = COMMERCIAL.inquiryEndpoint;
  const live = !!endpoint;
  const emailOk = COMMERCIAL.contactEmailConfirmed && LINKS.email;
  const field = (name) => {
    const label = labels[name] || name;
    const opt = optional.includes(name);
    const req = opt ? '' : 'required';
    const common = `name="${name}" id="f-${kind}-${name}" ${req} ${live ? '' : 'disabled'}`;
    const select = (opts) => html`<select ${raw(common)}>${opts.map((o) => html`<option value="${o}">${o}</option>`)}</select>`;
    let control;
    if (name === 'message' || name === 'desiredFeatures' || name === 'purpose') control = html`<textarea ${raw(common)} rows="5"></textarea>`;
    else if (name === 'email') control = html`<input type="email" ${raw(common)} autocomplete="email" />`;
    else if (name === 'platform') control = select(['MetaTrader 5', 'MetaTrader 4', 'MT4 + MT5', 'Other']);
    else if (name === 'experience') control = select(C.experienceOptions);
    else if (name === 'capitalRange' || name === 'budgetRange') control = select([C.preferNotToSay, ...C.rangeOptions]);
    else if (name === 'strategyType') control = select(C.strategyTypes);
    else if (name === 'existingSource') control = select(C.sourceOptions);
    else control = html`<input type="text" ${raw(common)} autocomplete="off" />`;
    return html`<label class="field${raw(name === 'message' || name === 'desiredFeatures' || name === 'purpose' ? ' field--wide' : '')}" for="f-${kind}-${name}">
      <span class="field__label">${label}${when(opt, () => html` <span class="field__opt">${C.optional}</span>`)}</span>
      ${control}
    </label>`;
  };
  return html`
    <form class="form iform${raw(live ? '' : ' iform--offline')}" method="post" action="${endpoint || '#'}" data-inquiry-form="${kind}" novalidate>
      <input type="hidden" name="subject" value="${subject}" />
      <input type="hidden" name="inquiryType" value="${kind}" />
      <input type="hidden" name="source" value="tyo-lab" />
      <div class="iform__grid">${fields.map(field)}</div>
      ${when(kind === 'private' || kind === 'development', () => html`<label class="field field--check"><input type="checkbox" name="nda" value="requested" ${raw(live ? '' : 'disabled')} /><span>${C.ndaLabel}</span></label>`)}
      <p class="form__note">${C.privacyNote}</p>
      ${live
        ? html`<button class="btn btn--primary form__submit" type="submit" data-track="${kind === 'private' ? 'private_inquiry' : 'custom_development_inquiry'}"><span class="btn__label">${C.send}</span><span class="btn__arrow" aria-hidden="true">→</span></button>`
        : html`<div class="iform__offline">
            ${DataRequired({ t, what: C.endpointMissing })}
            <p>${C.offlineBody}</p>
            ${when(emailOk, () => html`<p class="iform__mail">${C.interimEmail} <a href="mailto:${LINKS.email}?subject=${encodeURIComponent(subject)}">${LINKS.email}</a></p>`)}
          </div>`}
    </form>
  `;
}

/* ---- partner disclosure (§51) ---------------------------------------------- */
export function PartnerDisclosure({ t }) {
  return html`<aside class="disclosure" role="note" data-reveal>
    <span class="disclosure__tag">${t.access.partner.disclosureTag}</span>
    <p>${t.access.partner.disclosure}</p>
  </aside>`;
}

/* ---- brand strip (§6) ------------------------------------------------------ */
export function BrandStrip() {
  return html`<div class="brandstrip" data-reveal aria-hidden="true">
    <span class="brandstrip__sys">${BRAND.systemName}</span>
    <span class="brandstrip__claim">${BRAND.claim}</span>
    <span class="brandstrip__disc">${BRAND.discipline}</span>
  </div>`;
}

/* ---- EA detail access panel (§23, §124) ------------------------------------ */
export function EAAccessPanel({ model, t, locale }) {
  const A = t.commercial;
  const p = (r) => localePath(locale, r);
  const status = model.commercial.status;
  const cta = model.commercial.cta; // FREE | PRO | PARTNER | PRIVATE | RESEARCH_ONLY | NONE
  const accessHref = `${p(ROUTES.access())}?ea=${model.slug}`;
  return html`
    <section class="block" id="access" data-reveal-root>
      <h2 class="block__title" data-reveal><span class="block__n">A</span><span class="block__bar" aria-hidden="true"></span>${A.howToAccess}</h2>
      <div class="block__body">
        <div class="eaaccess" data-reveal>
          <div class="eaaccess__row">
            <span class="eaaccess__k">${A.commercialStatus}</span>
            <span class="eaaccess__v">${AccessBadge({ status, t })}</span>
          </div>
          <div class="eaaccess__row">
            <span class="eaaccess__k">${A.planRequired}</span>
            <span class="eaaccess__v">${model.commercial.plan ? A.plans[model.commercial.plan] : '—'}</span>
          </div>
          <div class="eaaccess__row">
            <span class="eaaccess__k">${A.researchStatus}</span>
            <span class="eaaccess__v eaaccess__v--muted">${A.researchStatusNote}</span>
          </div>
          <p class="eaaccess__note">${A.ctaNote[cta]}</p>
          <div class="eaaccess__cta">
            ${when(
              cta !== 'NONE',
              () => html`<a class="btn btn--primary" href="${cta === 'PRIVATE' ? `${p(ROUTES.access())}#private` : accessHref}" data-track="${cta === 'PRIVATE' ? 'private_inquiry' : 'ea_view'}">
                <span class="btn__label">${A.cta[cta]}</span><span class="btn__arrow" aria-hidden="true">→</span>
              </a>`
            )}
            ${when(
              cta === 'RESEARCH_ONLY' && model.mql5Url,
              () => Button({ href: model.mql5Url, label: t.ui.viewOnMql5, variant: 'ghost', external: true, srNote: t.ui.externalLink })
            )}
            ${Button({ href: p(ROUTES.access()), label: A.ctaOptions, variant: 'ghost' })}
          </div>
          ${when(!FLAGS.download, () => html`<p class="fineline">${A.downloadNotLive}</p>`)}
        </div>
      </div>
    </section>
  `;
}

export { Eyebrow };
