/**
 * ============================================================================
 * HOLDOUT GUARD (Phase 15 §16–17, §45, §112)
 * ============================================================================
 * The date gate every research-side tool must pass through. A requested
 * period that intersects any SEALED (or UNLOCK_APPROVED) holdout for the
 * strategy is refused with the canonical error. Unlocked/consumed holdouts
 * are only usable by the one-shot prospective validator, never by research
 * runners.
 *
 * Honest scope (§103–104): this is PROCESS-level isolation. MT5 itself can
 * read any bar of history; what the guard guarantees is that no tool in
 * this repository will generate, run or import work that touches a sealed
 * period — with every attempt auditable.
 * ============================================================================
 */

import { parseYmd } from './validation.mjs';

export const HOLDOUT_ERROR = 'ERROR: Requested period intersects FINAL HOLDOUT.';

/** [aFrom,aTo] ∩ [bFrom,bTo] ≠ ∅ (inclusive dates)? */
export function rangesIntersect(aFrom, aTo, bFrom, bTo) {
  const a1 = parseYmd(aFrom);
  const a2 = parseYmd(aTo);
  const b1 = parseYmd(bFrom);
  const b2 = parseYmd(bTo);
  if ([a1, a2, b1, b2].some((x) => x === null)) return true; // unparseable → fail closed
  return a1 <= b2 && b1 <= a2;
}

/** Guard states that block research access. UNLOCKED/CONSUMED stay blocked
 *  for research runners — only the prospective validator may touch them. */
const BLOCKING = ['SEALED', 'UNLOCK_APPROVED', 'UNLOCKED', 'CONSUMED'];

/**
 * @param {object[]} holdouts  holdout manifests
 * @param {string} strategyId
 * @param {{from:string,to:string}} period requested research period
 * @returns {{ok:boolean, error?:string, holdoutId?:string}}
 */
export function checkResearchPeriod(holdouts, strategyId, period) {
  for (const h of holdouts) {
    if (h.strategyId !== strategyId) continue;
    if (!BLOCKING.includes(h.status)) continue;
    if (rangesIntersect(period.from, period.to, h.start, h.end)) {
      return { ok: false, error: HOLDOUT_ERROR, holdoutId: h.holdoutId };
    }
  }
  return { ok: true };
}

/** The prospective validator's inverse gate: the run must target EXACTLY the
 *  holdout period of an UNLOCKED manifest. */
export function checkProspectiveRun(holdout, period) {
  if (!holdout) return { ok: false, error: 'no holdout manifest' };
  if (holdout.status !== 'UNLOCKED') return { ok: false, error: `holdout is ${holdout.status}, not UNLOCKED` };
  if (period.from !== holdout.start || period.to !== holdout.end)
    return { ok: false, error: 'prospective run must cover exactly the sealed holdout period' };
  return { ok: true };
}
