/**
 * ============================================================================
 * ACCESS PLANS — the four ways to use a TYO strategy (Phase 16 §0, §121)
 * ============================================================================
 * Prices are display values in USD (§56). Nothing here is a live offer:
 * billing, entitlement and download are Phase 16B/16C (see
 * docs/SUBSCRIPTION_ARCHITECTURE.md). Copy lives in i18n under `access`.
 *
 * `availability`: 'PLANNED' until the owner turns a plan on; 'AVAILABLE'
 * only once the corresponding backend (IB verification / billing / inquiry
 * screening) actually exists. The UI labels PLANNED honestly.
 * ============================================================================
 */

export const DATA_REQUIRED = 'DATA_REQUIRED';

export const PLANS = [
  {
    id: 'IB',
    level: 1,
    price: { amount: 0, currency: 'USD', unit: 'eaFee' }, // EA access fee 0 — broker trading costs still apply (§4)
    billing: 'brokerLinked',
    availability: 'PLANNED',
    features: ['selectedEA', 'standardUpdates', 'standardSupport', 'setupGuide'],
    requires: ['supportedBroker', 'ibRegistration', 'verification'],
    cancel: null,
  },
  {
    id: 'PRO',
    level: 2,
    price: { amount: 10, currency: 'USD', unit: 'month' },
    billing: 'subscription',
    availability: 'PLANNED',
    features: ['advancedEA', 'premiumParameters', 'priorityUpdates', 'researchPresets', 'portfolioAccess'],
    requires: ['account', 'paymentProvider'],
    cancel: DATA_REQUIRED, // "Cancel anytime" only once the provider guarantees it (§58)
  },
  {
    id: 'PRIVATE',
    level: 3,
    price: { amount: 5000, currency: 'USD', unit: 'oneTime' },
    billing: 'inquiry', // never direct checkout (§26)
    availability: 'PLANNED',
    features: ['privateEA', 'privateUpdates', 'directSupport', 'licenseScope', 'customization'],
    requires: ['inquiry', 'screening', 'agreement'],
    cancel: null,
  },
  {
    id: 'CUSTOM',
    level: 4,
    price: { amount: null, currency: 'USD', unit: 'quote' },
    billing: 'quote',
    availability: 'PLANNED',
    features: ['builtForClient', 'researchDriven', 'validationOptional'],
    requires: ['inquiry', 'consultation', 'specification'],
    cancel: null,
  },
];

/** Feature comparison rows (§49) — only what is actually planned. Values are i18n keys. */
export const COMPARISON = [
  { key: 'cost', IB: 'eaFee0', PRO: 'perMonth10', PRIVATE: 'oneTime5000' },
  { key: 'access', IB: 'selectedEA', PRO: 'advancedEA', PRIVATE: 'privateEA' },
  { key: 'updates', IB: 'standard', PRO: 'priority', PRIVATE: 'private' },
  { key: 'support', IB: 'standard', PRO: 'enhanced', PRIVATE: 'direct' },
  { key: 'purchase', IB: 'brokerLinked', PRO: 'subscription', PRIVATE: 'inquiry' },
];

export const SUBSCRIPTION_STATES = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'];
export const IB_STATES = ['NOT_CONNECTED', 'PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'SUSPENDED'];
export const COMMERCIAL_STATUSES = ['DRAFT', 'AVAILABLE', 'PAUSED', 'PRIVATE', 'RETIRED'];
export const ACCESS_TYPES = ['IB', 'PRO', 'PRIVATE', 'NOT_AVAILABLE'];
