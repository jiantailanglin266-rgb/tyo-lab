/**
 * ============================================================================
 * MAGIC NUMBER → STRATEGY mapping (Phase 12 §9–11)
 * ============================================================================
 * Several EAs can trade one account; the magic number is the identity. This
 * file is the single registry. Rules:
 *
 *   - A magic maps to exactly ONE strategyId. The importer validates this
 *     and fails the import on conflict (§11).
 *   - A trade whose magic is not listed here is quarantined as UNMAPPED —
 *     the importer never guesses an EA (§9).
 *   - Comment-based fallback happens only for trades WITHOUT a magic, only
 *     when the comment matches a pattern below, and is recorded with
 *     mappingSource: 'COMMENT' (§10). Manual assignment via the importer's
 *     --strategy flag is recorded as 'MANUAL'.
 *
 * OWNER TODO: fill in the real magic numbers per EA. Empty = everything
 * needs --strategy (MANUAL) or a comment match.
 * ============================================================================
 */

/** magic number (as integer) → strategyId (EA slug). */
export const MAGIC_MAP = {
  // e.g. 20250101: 'joker',
};

/**
 * Comment fallback patterns: applied ONLY when a trade has no magic number.
 * Each entry: [RegExp, strategyId]. First match wins; no match → UNMAPPED.
 */
export const COMMENT_PATTERNS = [
  // e.g. [/^JOKER/i, 'joker'],
];

/** Validate the registry itself: one strategy per magic (always true for a
 *  plain object) and every target is a known slug. */
export function validateMagicMap(knownSlugs) {
  const bad = Object.entries(MAGIC_MAP).filter(([, slug]) => !knownSlugs.includes(slug));
  return { ok: bad.length === 0, bad };
}
