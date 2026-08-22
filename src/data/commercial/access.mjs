/**
 * ============================================================================
 * IB / BROKER ACCESS CONFIGURATION (Phase 16 §1, §5–7, §50–54)
 * ============================================================================
 * Everything broker-related is owner data. Until it is entered, the site
 * shows DATA_REQUIRED and keeps broker names, URLs and conditions hidden.
 * `enabled` is the master switch so IB wording can be turned off per
 * platform / regional rule without touching templates (§1).
 * ============================================================================
 */
import { DATA_REQUIRED } from './plans.mjs';

export const IB_ACCESS = {
  enabled: true, // render the IB model on /access/ (all wording stays conditional)
  brokersPublished: false, // /supported-brokers/ stays unpublished until a real contract exists (§51)
  verificationMethod: 'MANUAL', // MANUAL: user submits → admin verifies → access granted (§82–83) | API
  brokers: [
    // { id, name, referralUrl, eligibility, countries: [] } — none entered yet (§128: never invented)
  ],
  disclosure: true, // referral-compensation disclosure always rendered with the IB model (§52–53)
  flow: ['lab', 'brokerAccount', 'ibRegistration', 'verification', 'eaAccess'],
  verificationFields: ['broker', 'accountOrReferralId', 'email', 'tyoUserId'], // field names only, never values (§6)
  dataRequired: {
    supportedBroker: DATA_REQUIRED,
    ibUrls: DATA_REQUIRED,
    ibEligibility: DATA_REQUIRED,
    countriesSupported: DATA_REQUIRED,
  },
};

/** Country availability is modelled, not populated (§54): null = DATA_REQUIRED, [] = no restriction, ['JP', …] = allow-list. */
export const COUNTRY_AVAILABILITY = {
  IB: null,
  PRO: null,
  PRIVATE: null,
  CUSTOM: null,
};
