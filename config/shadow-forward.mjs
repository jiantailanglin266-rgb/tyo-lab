/**
 * ============================================================================
 * SHADOW FORWARD — configuration (Phase 13.5 §98)
 * ============================================================================
 * Site-side thresholds for SHADOW_FORWARD evidence, plus the canonical
 * defaults the MQL5 shadow engine mirrors (mql5/Include/TYO/). Change the
 * rules here and in the EA inputs together — the settings hash recorded per
 * session (§121) makes any divergence visible.
 * ============================================================================
 */

export const SHADOW_CONFIG = {
  /* ---- evidence qualification (§48) ----------------------------------- */
  minTrades: 100, // shadow trades are cheap; the ✓ must be earned
  minDays: 30,
  minTradesHighFreq: 500, // apply when backtest frequency ≥ highFreqPerMonth
  highFreqPerMonth: 300,

  /* ---- freshness ------------------------------------------------------- */
  staleDays: 14, // a live engine should log continuously; stale earlier than file imports

  /* ---- feed-gap penalty (§126–128) -------------------------------------- *
   * Weekends and symbol market-closed hours are NOT gaps. A session whose
   * recorded feed gaps exceed this share of its market-open time is excluded
   * from qualification (it still displays, labelled).                       */
  maxFeedGapShare: 0.05,

  /* ---- execution model defaults (mirrored by the EA inputs, §10–16) ----- */
  execution: {
    entryModel: 'BID_ASK', // buy@ask, sell@bid; exits on the opposite side
    slippageModel: 'FIXED_POINTS', // conservative default; labelled SIMULATED
    fixedSlippagePoints: 2,
    commissionPerLot: 0, // per side, account currency; 0 allowed but stated
    swapModel: 'SYMBOL_INFO', // SymbolInfoDouble SWAP_LONG/SHORT; else SIMULATED
    tripleSwapDay: 'WEDNESDAY', // simplification — documented as SIMULATED
  },

  /* ---- fail-closed guards (§33–34) --------------------------------------- */
  feedStaleSeconds: 120, // no tick this long → FEED_STALE, no new entries
  maxSpreadPoints: 0, // 0 = defer to the EA's own MaxSpread input
};
