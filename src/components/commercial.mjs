/**
 * ============================================================================
 * COMMERCIAL COMPONENTS (Phase 16A)
 * ============================================================================
 * Access badges, plan cards, comparison table, flows, inquiry forms, FAQ.
 * Design rule (§105, §117–119): research-site restraint — mono eyebrows,
 * quiet chips, no urgency. Words: Access / License / Research / Development.
 *
 * Honesty rules enforced here, not in copy:
 *   • a plan marked PLANNED carries a visible "planned" state (§78)
 *   • a form without an endpoint renders DATA_REQUIRED and no mailto (§87)
 *   • DATA_REQUIRED values are printed literally (§1, §127)
 * ============================================================================
 */
import { html, raw, when } from '../lib/html.mjs';
import { localePath, ROUTES } from '../lib/url.mjs';
import { COMMERCIAL, LINKS } from '../site.config.mjs';
import { DATA_REQUIRED } from '../data/commercial/plans.mjs';
import { Button, Eyebrow } from './sections.mjs';

/* ---- badges (§46) --------------------------------------------------------- */
export function AccessBadges({ plans, t, pendingLabel = true }) {
  const A = t.commercial;
  if (!plans.length) return pendingLabel ? html`<span class="abadge abadge--pending" title="${A.pendingTitle}">${A.pending}</span>` : '';
  return html`${plans.map((p) => html`<span class="abadge abadge--${raw(p.toLowerCase())}">${A.plans[p]}</span>`)}`;
}

/* ---- DATA_REQUIRED chip ---------------------------------------------------- */
export function DataRequired({ t, what = '' }) {
  return html`<span class="dreq" title="${t.commercial.dataRequiredTitle}"><i aria-hidden="true">◌</i>${DATA_REQUIRED}${when(what, () => html` · ${what}`)}</span>`;
}

/* ---- price ----------------------------------------------------------------- */
export function Price({ price, t }) {
  const A = t.commercial;
  if (price.amount === null) return html`<span class="price price--quote">${A.quote}</span>`;
  if (price.unit === 'eaFee') return html`<span class="price"><span class="price__n">${A.eaFee}</span><span class="price__u">$0</span></span>`;
  const n = `$${price.amount.toLocaleString('en-US')}`;
  return html`<span class="price"><span class="price__n">${n}</span><span class="price__u">${price.unit === 'month' ? A.perMonth : A.oneTime}</span></span>`;
}

/* ---- plan cards (§4, §9, §23) --------------------------------------------- */
export function PlanCards({ plans, t, locale, selectedSlug = '' }) {
  const A = t.access;
  const C = t.commercial;
  const p = (r) => localePath(locale, r);
  return html`
    <div class="plans">
      ${plans.map((pl, i) => {
        const P = A.plans[pl.id];
        const cta =
          pl.id === 'IB'
            ? { href: '#ib', label: P.cta, variant: 'ghost', track: 'access_ib_click' }
            : pl.id === 'PRO'
              ? { href: '#pro', label: P.cta, variant: 'ghost', track: 'pro_subscribe_click' }
              : pl.id === 'PRIVATE'
                ? { href: '#private', label: P.cta, variant: 'ghost', track: 'private_inquiry_click' }
                : { href: p(ROUTES.development()), label: P.cta, variant: 'primary', track: 'custom_dev_inquiry' };
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
            <a class="btn btn--${raw(cta.variant)} plan__cta" href="${cta.href}" data-track="${cta.track}">
              <span class="btn__label">${cta.label}</span><span class="btn__arrow" aria-hidden="true">→</span>
            </a>
          </article>
        `;
      })}
    </div>
  `;
}

/* ---- comparison table → cards on mobile (§49, §107) ------------------------ */
export function ComparisonTable({ rows, t }) {
  const A = t.access.compare;
  const C = t.commercial;
  const cols = ['IB', 'PRO', 'PRIVATE'];
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

/* ---- vertical flow (§5, §27, §33) ------------------------------------------ */
export function Flow({ steps, compact = false }) {
  return html`
    <ol class="cflow${raw(compact ? ' cflow--compact' : '')}">
      ${steps.map((s, i) => html`<li class="cflow__step" data-reveal style="--d:${i}"><span class="cflow__n">${String(i + 1).padStart(2, '0')}</span><span class="cflow__t">${s}</span></li>`)}
    </ol>
  `;
}

/* ---- FAQ (§99–100) --------------------------------------------------------- */
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

/* ---- inquiry form (§28, §38, §87–88) --------------------------------------- */
/**
 * Renders a real form whose POST target is COMMERCIAL.inquiryEndpoint. While
 * the endpoint is empty the form stays visible but disabled, labelled
 * DATA_REQUIRED, and the configured e-mail is offered as the interim channel
 * (only when the owner has confirmed it). No mailto action, ever.
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
        ? html`<button class="btn btn--primary form__submit" type="submit" data-track="${kind === 'private' ? 'private_inquiry_click' : 'custom_dev_inquiry'}"><span class="btn__label">${C.send}</span><span class="btn__arrow" aria-hidden="true">→</span></button>`
        : html`<div class="iform__offline">
            ${DataRequired({ t, what: C.endpointMissing })}
            <p>${C.offlineBody}</p>
            ${when(emailOk, () => html`<p class="iform__mail">${C.interimEmail} <a href="mailto:${LINKS.email}?subject=${encodeURIComponent(subject)}">${LINKS.email}</a></p>`)}
          </div>`}
    </form>
  `;
}

/* ---- IB disclosure (§52–53) ------------------------------------------------ */
export function IBDisclosure({ t }) {
  return html`<aside class="disclosure" role="note" data-reveal>
    <span class="disclosure__tag">${t.access.ib.disclosureTag}</span>
    <p>${t.access.ib.disclosure}</p>
  </aside>`;
}

/* ---- EA detail access panel (§76–77) --------------------------------------- */
export function EAAccessPanel({ model, t, locale }) {
  const A = t.commercial;
  const p = (r) => localePath(locale, r);
  const plans = model.commercial.plans;
  return html`
    <section class="block" id="access" data-reveal-root>
      <h2 class="block__title" data-reveal><span class="block__n">A</span><span class="block__bar" aria-hidden="true"></span>${A.howToAccess}</h2>
      <div class="block__body">
        <div class="eaaccess" data-reveal>
          <div class="eaaccess__row">
            <span class="eaaccess__k">${A.commercialStatus}</span>
            <span class="eaaccess__v"><span class="cstatus cstatus--${raw(model.commercial.status.toLowerCase())}">${A.status[model.commercial.status]}</span></span>
          </div>
          <div class="eaaccess__row">
            <span class="eaaccess__k">${A.plansLabel}</span>
            <span class="eaaccess__v">${AccessBadges({ plans, t })}</span>
          </div>
          <div class="eaaccess__row">
            <span class="eaaccess__k">${A.researchStatus}</span>
            <span class="eaaccess__v eaaccess__v--muted">${A.researchStatusNote}</span>
          </div>
          <p class="eaaccess__note">${plans.length ? A.lockedNote.replace('{plans}', plans.map((x) => A.plans[x]).join(' / ')) : A.pendingBody}</p>
          <div class="eaaccess__cta">
            ${Button({ href: `${p(ROUTES.access())}?ea=${model.slug}`, label: A.ctaAccess })}
            ${Button({ href: p(ROUTES.access()), label: A.ctaOptions, variant: 'ghost' })}
          </div>
        </div>
      </div>
    </section>
  `;
}

export { Eyebrow };
