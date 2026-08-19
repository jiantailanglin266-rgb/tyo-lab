/**
 * ============================================================================
 * XAU_PYRAMID — research configuration (Phase 15 first target)
 * ============================================================================
 * Data layering decided BEFORE any development run (§9, §134-7) from the
 * audited availability: the owner's XAUUSD tester reports span 2016-02 →
 * 2026-02 (JOKER), so gold history through early 2026 is already observed
 * in other systems' reports; 2026-03 onward appears in no report.
 *
 * Quality: PROCESS_PROSPECTIVE (§13). The developer has lived through the
 * whole period and other TYO systems' reports cover gold into 2026-02 —
 * cross-strategy exposure is recorded in the contamination register. What
 * the protocol guarantees is that THIS strategy's development process has
 * no programmatic access to the sealed layers (guards + manifests + audit),
 * not cryptographic ignorance (§103–104).
 * ============================================================================
 */

export const XAU_PYRAMID_RESEARCH = {
  strategyId: 'XAU_PYRAMID',
  displayName: 'TYO XAU PYRAMID',
  symbolClass: 'XAUUSD (symbol-independent implementation)',

  /* ---- data layers (§9): fixed before development, sealed below ---------- */
  layers: {
    development: { from: '2016-02-01', to: '2023-12-31' }, // ~95 months
    internalValidation: { from: '2024-01-01', to: '2024-12-31' }, // internal OOS/WF
    prospectiveOOS: { from: '2025-01-01', to: '2025-12-31' },
    finalHoldout: { from: '2026-01-01', to: '2026-06-30' }, // fixed end date
  },

  /* Cross-strategy exposure honestly recorded (§10): gold 2026-01→2026-02
   * appears in JOKER/GALOA-family reports; 2026-03→06 appears in no TYO
   * report. The holdout still counts only as PROCESS_PROSPECTIVE. */
  knownExposure: [
    { range: { from: '2026-01-01', to: '2026-02-28' }, via: 'other systems’ tester reports (JOKER XAUUSD et al.)' },
  ],

  /* ---- objectives (§7, §121–122): pre-committed ---------------------------- */
  objectives: {
    minPF: 1.3,
    minAnnualTrades: 2000,
    stretchPF: 1.4,
    stretchAnnualTrades: 3000,
  },

  /* ---- holdout pass thresholds (§75, §77): FROZEN at manifest creation ----- */
  holdoutPass: {
    minPF: 1.1,
    minExpectedPayoff: 0,
    minAnnualizedTrades: 1500,
    maxDDvsInternalMultiple: 2.0,
  },

  /* ---- research budget (§28) ------------------------------------------------ */
  budget: {
    maxLogicVariants: 12,
    maxExperiments: 30,
    maxOptimizationRuns: 10,
    maxParameterSets: 5000,
  },

  /* ---- DEMON trend reuse (§5): parameters audited from the gold build ------- */
  demonTrend: {
    source: 'JOKER joker tyo mt520.mq5 TrendCheck() — identical structure to NEXUS',
    trendTF: 'M15',
    maPeriod: 50,
    maDiff1: 40, // gold pips (PipsToPrice: _Point×10 on 2/3/5-digit symbols)
    maDiff2: 30,
    trendHour: 21,
  },
};
