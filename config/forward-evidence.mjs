/**
 * ============================================================================
 * FORWARD EVIDENCE — configuration (Phase 12)
 * ============================================================================
 * Every threshold that decides an evidence ✓, a degradation state or a
 * staleness flag lives here, so the rules are reviewable in one place and
 * changing them is a config edit, not a code hunt.
 * ============================================================================
 */

export const FORWARD_CONFIG = {
  /* ---- evidence qualification (§45–46; Phase 13.5 §48) ---------------- *
   * A dataset lights its evidence stage ONLY when all minimums hold.
   * SHADOW_FORWARD needs more trades: virtual execution is cheap to
   * accumulate and must earn its ✓ with a deeper sample.                  */
  minForwardTrades: 30,
  minForwardDays: 30,
  qualification: {
    FORWARD_DEMO: { minTrades: 30, minDays: 30 },
    LIVE: { minTrades: 30, minDays: 30 }, // + verified LIVE account type
    SHADOW_FORWARD: { minTrades: 100, minDays: 30 },
  },

  /* ---- rolling windows (§24) ----------------------------------------- */
  rollingDayWindows: [30, 60, 90], // calendar days, 90 is the reference
  rollingTradeWindows: [30, 50, 100], // for low-frequency systems

  /* ---- degradation (§26–29) ------------------------------------------ *
   * Deterministic ratio rules: current rolling metric / baseline metric.
   * PF ratios below a threshold set the state; DD and frequency have their
   * own guards. No ML, no auto-tuning.                                    */
  minRollingTrades: 30, // below this → INSUFFICIENT_DATA (§29)
  degradationThresholds: {
    pfRatioWatch: 0.85, // rolling PF / baseline PF below → WATCH
    pfRatioDegraded: 0.7, // below → DEGRADED
    pfRatioSevere: 0.5, // below → SEVERE
    freqRatioWatch: 0.5, // trades/month vs baseline below → contributes WATCH
    ddSevereMultiple: 1.5, // rolling DD > 1.5 × baseline DD → SEVERE signal
  },

  /* ---- confidence by sample size (§30) -------------------------------- */
  confidence: { low: 30, medium: 50, high: 100 }, // trades in the window

  /* ---- baseline (§31–32): first available wins ------------------------ */
  baselinePriority: ['FULL_FORWARD_HISTORY', 'BACKTEST'],
  minBaselineForwardTrades: 200, // full-forward baseline needs this many

  /* ---- freshness (§113–114) ------------------------------------------- */
  staleAfterDays: 30, // no closed trade for this long → STALE
  staleAfterDaysLowFreq: 90, // used when backtest trades/month < lowFreqPerMonth
  lowFreqPerMonth: 8,

  /* ---- sessions (§33), hours in UTC ----------------------------------- */
  sessions: {
    ASIA: [0, 7], // [fromHour, toHourExclusive)
    LONDON: [7, 12],
    OVERLAP: [12, 16],
    NEW_YORK: [16, 21],
    OFF: [21, 24],
  },
};

/** Evidence types (§2; Phase 13.5 §1 adds SHADOW_FORWARD as its own class —
 *  never conflated with FORWARD_DEMO or LIVE). PAPER stays reserved. */
export const EVIDENCE_TYPES = ['BACKTEST', 'OOS', 'WALK_FORWARD', 'MONTE_CARLO', 'SHADOW_FORWARD', 'FORWARD_DEMO', 'LIVE'];
export const RESERVED_EVIDENCE_TYPES = ['PAPER'];

/** Degradation states (§26). */
export const DEGRADATION_STATES = ['NORMAL', 'WATCH', 'DEGRADED', 'SEVERE', 'INSUFFICIENT_DATA'];
