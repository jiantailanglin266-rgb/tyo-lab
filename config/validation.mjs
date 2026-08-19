/**
 * ============================================================================
 * VALIDATION ENGINE — configuration (Phase 14 §142)
 * ============================================================================
 * Every threshold that decides PASSED / FAILED / INCONCLUSIVE lives here
 * (§9: no fixed values scattered through code). Changing a threshold after
 * seeing results is bias — thresholds are part of the plan hash.
 * ============================================================================
 */

export const VALIDATION_CONFIG = {
  /* ---- OOS (§4–5, §9–10) ---------------------------------------------- */
  defaultTrainRatio: 0.7, // time-series split, never random (§4)
  minOOSMonths: 12,
  minOOSTrades: 100,
  oosPassThresholds: {
    minPF: 1.05, // OOS PF must clear this
    minExpectedPayoff: 0, // strictly positive expectancy
    maxDDvsTrainMultiple: 2.0, // OOS relative DD ≤ train relative DD × this
    minPFRetention: 0.65, // OOS PF / train PF
  },

  /* ---- Walk Forward (§12–13, §25) --------------------------------------- */
  wfDefaultMode: 'rolling', // 'rolling' | 'anchored'
  wfTrainMonths: 24,
  wfTestMonths: 6,
  wfStepMonths: 6,
  wfMinWindows: 4,
  wfMinTradesPerWindow: 30, // below → window marked LOW_SAMPLE (kept, never deleted §26)
  wfPassThresholds: {
    minAggregatePF: 1.05,
    minPositiveWindowRate: 0.6,
    minAggregateExpectedPayoff: 0,
  },

  /* ---- parameter stability (§27–33) -------------------------------------- */
  stability: {
    stableCV: 0.15, // coefficient of variation ≤ → STABLE
    mixedCV: 0.35, // ≤ → MIXED, above → UNSTABLE
    boundaryHitShare: 0.5, // ≥ this share of windows at a range edge → BOUNDARY_HIT
  },

  /* ---- warnings (§111–114) ------------------------------------------------ */
  warnings: {
    highDegradationPFRatio: 0.65, // below → HIGH_DEGRADATION
    topWindowProfitShare: 0.5, // one window > 50% of stitched net → WINDOW_CONCENTRATION
    freqShiftLow: 0.5, // OOS trades/month vs train outside [low, high] → shift warning
    freqShiftHigh: 2.0,
    longShortFlipPF: 1.0, // a side ≥1 in train but <1 in OOS (or reverse) → DISTRIBUTION_SHIFT
  },

  /* ---- evidence qualification (§49–50, §87) ------------------------------- *
   * The evidence-map cell lights ONLY for PROSPECTIVE validations. The 14
   * existing systems were developed with the full period visible and no
   * recorded optimisation window, so their validations are RETROSPECTIVE:
   * displayed in full, never scored (consistent with Phase 6's reason for
   * keeping OOS pending).                                                    */
  evidenceRequiresProspective: true,
};
