/**
 * ============================================================================
 * ACCESS PLANS — FREE / PRO / PARTNER / PRIVATE (SaaS §8–§12, §142)
 * ============================================================================
 * Phase 1 of the SaaS expansion. Prices come from site.config PRICING
 * (env-driven, SaaS §10) — never written as literals in a page. Nothing here
 * is a live offer: auth, billing, entitlement and download are Phase 2–5
 * (docs/SAAS_ARCHITECTURE.md).
 *
 * `availability`: 'PLANNED' until the backend a plan depends on exists.
 * The UI labels PLANNED honestly and never shows a feature it cannot deliver.
 *
 * CUSTOM DEVELOPMENT is a SERVICE, not a plan (SaaS §13) — see development.mjs.
 * ============================================================================
 */
import { PRICING } from '../../site.config.mjs';

export const DATA_REQUIRED = 'DATA_REQUIRED';

export const PLANS = [
  {
    id: 'FREE',
    level: 1,
    price: { amount: 0, currency: PRICING.currency, unit: 'free' },
    billing: 'none',
    availability: 'PLANNED', // needs the account layer (Phase 2–4)
    features: ['freeLibrary', 'basicBacktest', 'basicForward', 'tyoAccount', 'researchAccess'],
    requires: ['account'],
    cancel: null,
  },
  {
    id: 'PRO',
    level: 2,
    price: { amount: PRICING.proMonthly, currency: PRICING.currency, unit: 'month' },
    billing: 'subscription',
    availability: 'PLANNED', // needs auth + payment provider (Phase 5)
    features: ['proLibrary', 'advancedStrategies', 'eaUpdates', 'advancedAnalytics', 'portfolio', 'enhancedSupport'],
    requires: ['account', 'paymentProvider'],
    cancel: DATA_REQUIRED, // "Cancel anytime" only once the provider guarantees it
  },
  {
    id: 'PARTNER',
    level: 3,
    price: { amount: 0, currency: PRICING.currency, unit: 'brokerLinked' },
    billing: 'brokerLinked',
    availability: 'PLANNED', // needs broker agreement + verification (Phase 8)
    features: ['partnerAccess', 'standardUpdates', 'standardSupport', 'setupGuide'],
    requires: ['supportedBroker', 'partnerRegistration', 'manualApproval'],
    cancel: null,
  },
  {
    id: 'PRIVATE',
    level: 4,
    price: { amount: PRICING.privateOneTime, currency: PRICING.currency, unit: 'oneTime' },
    billing: 'inquiry', // never direct checkout (SaaS §12, §144)
    availability: 'PLANNED',
    features: ['privateStrategy', 'privateUpdates', 'directSupport', 'licenseScope', 'customization'],
    requires: ['inquiry', 'screening', 'agreement'],
    cancel: null,
  },
];

/** Comparison rows (SaaS §143) — only what is actually planned. Values are i18n keys. */
export const COMPARISON = [
  { key: 'cost', FREE: 'free0', PRO: 'perMonthPro', PARTNER: 'brokerLinked', PRIVATE: 'oneTimePrivate' },
  { key: 'access', FREE: 'freeLibrary', PRO: 'proLibrary', PARTNER: 'partnerLibrary', PRIVATE: 'privateStrategy' },
  { key: 'updates', FREE: 'standard', PRO: 'priority', PARTNER: 'standard', PRIVATE: 'private' },
  { key: 'support', FREE: 'community', PRO: 'enhanced', PARTNER: 'standard', PRIVATE: 'direct' },
  { key: 'purchase', FREE: 'signup', PRO: 'subscription', PARTNER: 'brokerLinked', PRIVATE: 'inquiry' },
];

/* ---- state machines mirrored by the DB (docs/DATABASE_SCHEMA.md) --------- */
export const SUBSCRIPTION_STATES = ['TRIAL', 'ACTIVE', 'GRACE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'];
export const PARTNER_STATES = ['NONE', 'PENDING', 'ACTIVE', 'EXPIRED']; // SaaS §53
export const COMMERCIAL_STATUSES = ['DRAFT', 'FREE', 'PRO', 'PARTNER', 'PRIVATE', 'PAUSED', 'RETIRED', 'RESEARCH_ONLY']; // §22
export const LICENSE_STATES = ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED']; // §34

/** Plans a commercial status maps to (null = nothing downloadable). */
export const PLAN_OF_STATUS = {
  FREE: 'FREE',
  PRO: 'PRO',
  PARTNER: 'PARTNER',
  PRIVATE: 'PRIVATE',
  DRAFT: null,
  PAUSED: null,
  RETIRED: null,
  RESEARCH_ONLY: null,
};

/** CTA variant per commercial status (SaaS §23). */
export const CTA_OF_STATUS = {
  FREE: 'FREE',
  PRO: 'PRO',
  PARTNER: 'PARTNER',
  PRIVATE: 'PRIVATE',
  RESEARCH_ONLY: 'RESEARCH_ONLY',
  DRAFT: 'NONE',
  PAUSED: 'NONE',
  RETIRED: 'NONE',
};
