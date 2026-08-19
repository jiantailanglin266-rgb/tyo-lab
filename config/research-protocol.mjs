/**
 * ============================================================================
 * EVIDENCE-BY-DESIGN RESEARCH PROTOCOL — configuration (Phase 15)
 * ============================================================================
 * Governs every NEW strategy developed under the protocol: data layering,
 * holdout sealing, research budgets, candidate freezing, one-shot
 * prospective validation. Thresholds are pre-committed here and copied into
 * manifests at creation — changing them after seeing results cannot alter a
 * sealed record.
 * ============================================================================
 */

export const PROTOCOL_CONFIG = {
  /* ---- prospective quality levels (§11–13, §104) ----------------------- */
  qualityLevels: ['STRICT_PROSPECTIVE', 'PROCESS_PROSPECTIVE', 'RETROSPECTIVE'],
  /* Honest ceiling for a solo developer whose terminal holds full history:
   * MT5 itself can always reach every bar (§103), so isolation is
   * process-level (guarded configs + sealed manifests + audit log), not
   * cryptographic. The site says exactly that. */
  defaultQuality: 'PROCESS_PROSPECTIVE',

  /* ---- holdout lifecycle (§19) ------------------------------------------ */
  holdoutStates: ['DRAFT', 'SEALED', 'UNLOCK_APPROVED', 'UNLOCKED', 'CONSUMED', 'INVALIDATED'],

  /* ---- unlock gate (§69): every box must be checked before approval ----- */
  unlockRequires: ['candidateFrozen', 'budgetRecorded', 'internalValidationComplete', 'monteCarloComplete', 'humanApproval'],

  /* ---- research budget defaults (§26–28) --------------------------------- */
  defaultBudget: {
    maxLogicVariants: 12,
    maxExperiments: 30,
    maxOptimizationRuns: 10,
    maxParameterSets: 5000, // total candidates across all optimisation rounds
  },

  /* ---- audit ---------------------------------------------------------------- */
  auditLog: 'data/research/audit-log.jsonl', // gitignored working log; public
  // aggregates derive from the committed manifests
};
