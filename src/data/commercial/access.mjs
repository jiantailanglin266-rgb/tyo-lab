/**
 * ============================================================================
 * PARTNER / BROKER ACCESS CONFIGURATION (SaaS §11, §50–§56)
 * ============================================================================
 * Everything broker-related is owner data. Until it is entered, the site
 * shows DATA_REQUIRED and keeps broker names, URLs and conditions hidden.
 * `enabled` (FLAGS.partner) is the master switch so partner wording can be
 * turned off per platform / regional rule without touching templates.
 * ============================================================================
 */
import { DATA_REQUIRED } from './plans.mjs';

export const PARTNER_ACCESS = {
  brokersPublished: false, // /supported-brokers/ stays unpublished until a real contract exists
  approval: 'MANUAL', // SaaS §54: admin approves; API automation is §55 (adapter)
  brokers: [
    // { id, name, logo, country, referralUrl, conditions, countries: [] } — none entered (§118: never invented)
  ],
  disclosure: true, // referral-compensation disclosure always rendered with the model (§51)
  flow: ['lab', 'brokerAccount', 'partnerRegistration', 'verification', 'eaAccess'],
  verificationFields: ['broker', 'accountOrReferralId', 'email', 'tyoUserId'], // field names only, never values
  clickLog: 'partner_clicks', // §52 — DB table once the app exists
  dataRequired: {
    supportedBroker: DATA_REQUIRED,
    referralUrls: DATA_REQUIRED,
    eligibility: DATA_REQUIRED,
    countriesSupported: DATA_REQUIRED,
    accessGranted: DATA_REQUIRED, // which EAs a PARTNER may run
  },
};

/** Country availability is modelled, not populated (§56): null = DATA_REQUIRED. */
export const COUNTRY_AVAILABILITY = {
  FREE: null,
  PRO: null,
  PARTNER: null,
  PRIVATE: null,
};

/** Referral sources tracked at signup (§74) — reserved for the app tier. */
export const REFERRAL_SOURCES = ['TikTok', 'YouTube', 'Instagram', 'X', 'MQL5', 'Google', 'Direct', 'Partner', 'Other'];

/** First-party analytics events (§75) — names reserved now, collector in Phase 10. */
export const ANALYTICS_EVENTS = [
  'signup', 'login', 'ea_view', 'ea_download', 'pricing_view', 'checkout_start',
  'subscription_success', 'partner_click', 'license_activate', 'portfolio_view',
  'private_inquiry', 'custom_development_inquiry',
];
