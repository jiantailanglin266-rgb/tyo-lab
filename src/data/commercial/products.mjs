/**
 * ============================================================================
 * PRODUCT ACCESS MANIFEST (Phase 16 §44–45, §72–75, §122)
 * ============================================================================
 * One entry per strategy slug from src/data/ea.mjs. This is the COMMERCIAL
 * status — completely separate from the research status on the EA model
 * (§74): a strategy can be research VALIDATED and commercially DRAFT.
 *
 *   access.ib / pro / private  — which plans may include it (§45)
 *   directPurchase             — always false: nothing is sold on the site
 *   status                     — DRAFT | AVAILABLE | PAUSED | PRIVATE | RETIRED (§73)
 *   latestVersion / artifact   — filled by the release pipeline (§71–72); never a public path
 *   countryAvailability        — null = DATA_REQUIRED (§54)
 *
 * DEFAULT STATE: every strategy is DRAFT with no plan assigned. The owner
 * decides the plan matrix (§127 "PRO EA list", "IB eligibility"); the UI
 * shows "plan assignment pending" until then. Nothing here is invented.
 * ============================================================================
 */
import { DATA_REQUIRED } from './plans.mjs';

const entry = (slug, o = {}) => ({
  strategyId: slug,
  access: { ib: false, pro: false, private: false, directPurchase: false, ...(o.access || {}) },
  status: o.status || 'DRAFT',
  latestVersion: o.latestVersion || '',
  downloadArtifact: '', // never a public URL; resolved by the download API in 16B (§15, §69)
  checksum: '', // SHA-256 of the released artifact (§60–61)
  releasedAt: o.releasedAt || '',
  updatePolicy: { IB: 'standard', PRO: 'priority', PRIVATE: 'private' }, // §59 — labels, not promises
  sourceIncluded: { IB: false, PRO: false, PRIVATE: DATA_REQUIRED }, // §65–66 — undecided for PRIVATE
  bundle: ['ex5', 'set', 'readme', 'changelog'], // §63–64 — bundle shape, not files
  countryAvailability: null, // §54
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

/** Plans that may carry this strategy, in display order. Empty = not assigned yet. */
export function plansOf(product) {
  if (!product) return [];
  const a = product.access;
  return [a.ib && 'IB', a.pro && 'PRO', a.private && 'PRIVATE'].filter(Boolean);
}

/**
 * The PRIVATE tier is described by existence only (§129–130): no strategy
 * name, logic, file or result is published. Details upon inquiry.
 */
export const PRIVATE_PRODUCT = {
  id: 'PRIVATE_STRATEGY',
  price: { amount: 5000, currency: 'USD', unit: 'oneTime' },
  detailsPublished: false,
  sourceIncluded: DATA_REQUIRED,
  licenseLimits: { maxMt5Accounts: DATA_REQUIRED, maxDevices: DATA_REQUIRED }, // §21
};
