/**
 * ============================================================================
 * EVIDENCE LAYER — how far each system's verification actually goes
 * ============================================================================
 * Six stages, evaluated per system from data that exists in this repository.
 * A stage is ✓ ONLY when its condition is checkable here; everything else is
 * PENDING. No stage is ever granted on the owner's say-so alone.
 *
 *   backtest   ✓ when a parsed tester report with a full deal list exists
 *   oos        PENDING for all systems: the optimisation window is
 *              undocumented, so no held-out period can be proven. The 70/30
 *              split analyses (EXP-0002xx) are stability checks, NOT OOS,
 *              and deliberately do not light this stage.
 *   monteCarlo ✓ when pre-generated simulation results for the system exist
 *              in tools/montecarlo.json (Phase 8: 1,000 seeded resamplings of
 *              the real deal list — shuffle, missed-trade, cost stress).
 *   shadowForward
 *              ✓ when a QUALIFIED shadow-forward aggregate exists (Phase
 *              13.5: real-time future market data, virtual execution, ≥100
 *              closed trades / ≥30 days / valid mapping). Stronger than a
 *              backtest (future data), weaker than real execution — the
 *              points say so.
 *   forward /  ✓ when qualified real-execution data exists (Phase 12
 *   live       pipeline aggregates, or a Phase 9 manual record meeting the
 *              same minimums).
 *   walkForward / oos
 *              PENDING until such results exist as data in this repo.
 *
 * Scoring (docs/TYO_SCORE_V2_MODEL.md):
 *   backtest 5 · oos +3 · walkForward +3 · monteCarlo +3 · forward +3 · live +3
 *   = 0–20 Evidence Quality points.
 * ============================================================================
 */

/* Seven stages since Phase 13.5. The 20-point evidence budget is fixed, so
 * shadow's 2 points come from OOS and walk-forward (3→2 each): both remain
 * historical-data stages, while shadow observes genuinely future data. The
 * ordering backtest(5) > … and shadow(2) < forward(3) = live(3) states the
 * hierarchy: real-time observation beats resampling, real execution beats
 * virtual execution. No currently-published score changes (all systems hold
 * backtest 5 + monteCarlo 3 = 8/20 either way). */
export const EVIDENCE_STAGES = ['backtest', 'oos', 'walkForward', 'monteCarlo', 'shadowForward', 'forward', 'live'];

export const EVIDENCE_POINTS = { backtest: 5, oos: 2, walkForward: 2, monteCarlo: 3, shadowForward: 2, forward: 3, live: 3 };

/**
 * @param {object} model  merged EA model
 * @param {object[]} experiments  all experiments (for the timeline; stages do
 *                                not read them — see header comment)
 */
export function evidenceOf(model, experiments = []) {
  const stages = {
    backtest: !!(model.trades && model.backtest && model.backtest.totalTrades),
    /* Phase 14: derived from validation results — PROSPECTIVE + PASSED +
       qualified only. RETROSPECTIVE validations display but never light
       (the strategy was developed with the period visible; see
       docs/VALIDATION_EVIDENCE_RULES.md). */
    oos: !!model.oosVal,
    walkForward: !!model.wfVal,
    monteCarlo: !!model.mc,
    shadowForward: !!model.shadow,
    forward: !!model.forward,
    live: !!model.live,
  };

  const points = EVIDENCE_STAGES.reduce((sum, s) => sum + (stages[s] ? EVIDENCE_POINTS[s] : 0), 0);

  const related = experiments
    .filter((e) => e.strategyId === model.slug)
    .sort((a, b) => String(a.createdAt || '0000').localeCompare(String(b.createdAt || '0000')));

  return { stages, points, max: 20, related };
}

/* ------------------------------------------------------------------ *
 * TYO SCORE 2.0
 * The five V1 components compress from 20 to 16 points each (same ladders,
 * same inputs, × 0.8) and Evidence Quality takes the freed 20. The V1
 * drawdown caps apply unchanged to the new total — they were set as absolute
 * risk statements, not as fractions of a formula.
 *
 * Every published system currently scores 5/20 on evidence. That is the
 * point: the platform's own scale says its verification depth is shallow,
 * and the number rises only when real OOS / WF / MC / forward data lands.
 * ------------------------------------------------------------------ */

export function scoreV2(model, evidence) {
  const v1 = model.score;
  if (!v1 || v1.total === null) {
    return { total: null, band: 'insufficient-data', parts: null, evidence: evidence.points, missing: v1?.missing || [] };
  }

  const parts = {};
  for (const [k, v] of Object.entries(v1.parts)) parts[k] = Math.round(v * 0.8 * 10) / 10;
  parts.evidenceQuality = evidence.points;

  const raw = Object.values(parts).reduce((a, b) => a + b, 0);
  const cap = v1.cap; // absolute caps carry over: 60%→40, 45%→55, 30%→70
  const total = Math.round(cap === null ? raw : Math.min(raw, cap));
  const band = total >= 80 ? 'high' : total >= 65 ? 'mid' : total >= 45 ? 'low' : 'weak';

  return {
    total,
    band,
    raw: Math.round(raw),
    cap,
    parts,
    v1Total: v1.total,
    reasons: v1.reasons,
    worstMonth: v1.worstMonth,
    missing: [],
  };
}
