/**
 * ============================================================================
 * PRODUCT COMMERCIAL MANIFEST (SaaS §21–§23, §114)
 * ============================================================================
 * One entry per strategy slug from src/data/ea.mjs. This is the COMMERCIAL
 * status only — completely separate from the research status on the EA model
 * (§22): a strategy can be research VALIDATED and commercially RESEARCH_ONLY.
 *
 * DEFAULT: every strategy is RESEARCH_ONLY. TYO has not decided which
 * strategies go into FREE / PRO / PARTNER (DATA_REQUIRED, SaaS §119), and
 * nothing here is invented. The public site therefore shows research and
 * evidence for every strategy and offers no download from this repo.
 *
 * When the DB exists (Phase 2+) this file is generated from `ea_products`
 * by tools/sync-commercial.mjs so the static build never needs a database.
 * ============================================================================
 */
import { DATA_REQUIRED, PLAN_OF_STATUS, CTA_OF_STATUS } from './plans.mjs';

const entry = (slug, o = {}) => ({
  strategyId: slug, // links to research: src/data/ea.mjs slug
  commercialStatus: o.commercialStatus || 'RESEARCH_ONLY', // §22 enum
  latestVersion: o.latestVersion || '',
  downloadArtifact: '', // never a public URL; resolved by the download API (§24, §26)
  checksum: '', // SHA-256 of the released artifact (§25)
  releasedAt: o.releasedAt || '',
  updatePolicy: { FREE: 'standard', PRO: 'priority', PARTNER: 'standard', PRIVATE: 'private' }, // labels, not promises
  sourceIncluded: { FREE: false, PRO: false, PARTNER: false, PRIVATE: DATA_REQUIRED },
  bundle: ['ex5', 'set', 'manual', 'riskGuide', 'changelog'], // §29 bundle shape, not files
  countryAvailability: null, // §56 — null = DATA_REQUIRED
  note: o.note || '',
});

export const PRODUCTS = [
  entry('joker'),
  entry('jayro'),
  entry('grandslam'),
  entry('godspeed'),
  entry('galoa'),
  entry('cosmos'),
  entry('kokomo'),
  entry('metro'),
  entry('mirumo'),
  entry('sena'),
  entry('rina'),
  entry('nexus'),
  entry('evergreen'),
  entry('supremacy'),
];

export function productOf(slug) {
  return PRODUCTS.find((p) => p.strategyId === slug) || null;
}

/** Plan a strategy requires, or null when it is not distributed here. */
export function planOf(product) {
  return product ? PLAN_OF_STATUS[product.commercialStatus] ?? null : null;
}

/** CTA variant for the EA detail page (§23). */
export function ctaOf(product) {
  return product ? CTA_OF_STATUS[product.commercialStatus] || 'NONE' : 'NONE';
}

/**
 * The PRIVATE tier is described by existence only (SaaS §120): no strategy
 * name, logic, file or result is published. Details upon inquiry.
 */
export const PRIVATE_PRODUCT = {
  id: 'PRIVATE_STRATEGY',
  detailsPublished: false,
  sourceIncluded: DATA_REQUIRED,
  licenseLimits: { maxMt5Accounts: DATA_REQUIRED, maxDevices: DATA_REQUIRED }, // §138
};
