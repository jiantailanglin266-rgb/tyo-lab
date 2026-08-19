/**
 * ============================================================================
 * VALIDATION ENGINE — pure functions (Phase 14)
 * ============================================================================
 * Time-series splits, walk-forward window generation, train-vs-test ratios,
 * PASS/FAIL/INCONCLUSIVE decisions, parameter-stability statistics and the
 * warning battery. Everything here is deterministic arithmetic over trade
 * arrays and plan dates — unit-tested by scripts/test-validation.mjs.
 *
 * THE ABSOLUTE RULE (§0) is enforced structurally where code can enforce it:
 *   - splits are calendar-based, never random (§4);
 *   - window generation emits only full, non-overlapping, chronological
 *     windows and rejects malformed plans (§145);
 *   - decisions never mutate plans or manifests — the caller freezes those
 *     before any test metric exists (§3, §19);
 *   - bad windows are returned like good ones; there is no filter (§26).
 * ============================================================================
 */

import { computeMetrics } from './forward-metrics.mjs';

const MS_DAY = 86400000;
const r2 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);

/* ------------------------------------------------------------------ *
 * calendar helpers
 * ------------------------------------------------------------------ */

export function parseYmd(s) {
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Number.isFinite(t) ? t : null;
}

const ymd = (t) => new Date(t).toISOString().slice(0, 10);

export function addMonths(ymdStr, n) {
  const t = parseYmd(ymdStr);
  const d = new Date(t);
  return ymd(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()));
}

export function monthsBetween(from, to) {
  const a = parseYmd(from);
  const b = parseYmd(to);
  if (a === null || b === null || b < a) return null;
  return Math.round(((b - a) / MS_DAY / 30.44) * 10) / 10;
}

/* ------------------------------------------------------------------ *
 * OOS split (§4): chronological, ratio on calendar time
 * ------------------------------------------------------------------ */

export function splitByRatio(from, to, ratio) {
  const a = parseYmd(from);
  const b = parseYmd(to);
  if (a === null || b === null || b <= a) return null;
  if (!(ratio > 0 && ratio < 1)) return null;
  const cut = a + Math.floor((b - a) * ratio);
  return {
    trainStart: ymd(a),
    trainEnd: ymd(cut),
    testStart: ymd(cut + MS_DAY),
    testEnd: ymd(b),
  };
}

/** §145: reject overlapping or reversed train/test definitions. */
export function validateSplit(s) {
  const errs = [];
  const ts = parseYmd(s.trainStart);
  const te = parseYmd(s.trainEnd);
  const os = parseYmd(s.testStart);
  const oe = parseYmd(s.testEnd);
  if ([ts, te, os, oe].some((x) => x === null)) errs.push('invalid date');
  else {
    if (te <= ts) errs.push('train end before train start');
    if (oe <= os) errs.push('test end before test start');
    if (os <= te) errs.push('test overlaps or precedes train');
  }
  return { ok: errs.length === 0, errors: errs };
}

/* ------------------------------------------------------------------ *
 * Walk-forward window generation (§11–13)
 * ------------------------------------------------------------------ */

export function generateWindows({ from, to, mode, trainMonths, testMonths, stepMonths }) {
  if (!['rolling', 'anchored'].includes(mode)) return { ok: false, errors: [`unknown mode ${mode}`], windows: [] };
  if (!(trainMonths > 0 && testMonths > 0 && stepMonths > 0))
    return { ok: false, errors: ['non-positive window lengths'], windows: [] };

  const windows = [];
  let i = 0;
  for (;;) {
    const trainStart = mode === 'anchored' ? from : addMonths(from, i * stepMonths);
    const trainEnd = addMonths(mode === 'anchored' ? addMonths(from, trainMonths) : trainStart, mode === 'anchored' ? i * stepMonths : trainMonths);
    const testStart = trainEnd;
    const testEnd = addMonths(testStart, testMonths);
    if (parseYmd(testEnd) > parseYmd(to)) break; // only FULL test windows ship
    const w = {
      windowId: `W${String(i + 1).padStart(2, '0')}`,
      trainStart,
      trainEnd,
      testStart,
      testEnd,
    };
    const v = validateSplit({ trainStart: w.trainStart, trainEnd: addMonths(w.trainEnd, 0), testStart: w.testStart, testEnd: w.testEnd });
    // trainEnd === testStart is the intended boundary; validateSplit demands
    // strict order, so check the pair explicitly here instead:
    if (parseYmd(w.trainEnd) > parseYmd(w.testStart)) return { ok: false, errors: [`window ${w.windowId} overlap`], windows: [] };
    if (parseYmd(w.trainStart) >= parseYmd(w.trainEnd) || parseYmd(w.testStart) >= parseYmd(w.testEnd))
      return { ok: false, errors: [`window ${w.windowId} reversed dates`], windows: [] };
    void v;
    windows.push(w);
    i++;
    if (i > 500) return { ok: false, errors: ['window explosion (>500)'], windows: [] };
  }
  return { ok: windows.length > 0, errors: windows.length ? [] : ['no full windows fit the period'], windows };
}

/* ------------------------------------------------------------------ *
 * trade slicing + window metrics
 * trades: [{ closeTime(ms), netProfit, profit, swap, commission, fees,
 *            direction, openTime, balanceBefore? }]
 * ------------------------------------------------------------------ */

export function tradesInRange(trades, from, to) {
  const a = parseYmd(from);
  const b = parseYmd(to) + MS_DAY; // inclusive end date
  return trades.filter((t) => t.closeTime >= a && t.closeTime < b);
}

export function windowMetrics(trades, { startBalance = null } = {}) {
  if (!trades.length) return null;
  const m = computeMetrics(trades, { startBalance });
  const first = Math.min(...trades.map((t) => t.closeTime));
  const last = Math.max(...trades.map((t) => t.closeTime));
  const months = Math.max(1 / 30.44, (last - first) / MS_DAY / 30.44);
  return { ...m, tradesPerMonth: r2(trades.length / months) };
}

/* ------------------------------------------------------------------ *
 * degradation ratios (§8) + distribution shifts (§106–108)
 * ------------------------------------------------------------------ */

export function degradationRatios(train, test) {
  const ratio = (a, b) => (a !== null && b !== null && b !== 0 ? r2(a / b) : null);
  return {
    pfRetention: ratio(test.profitFactor, train.profitFactor),
    expectedPayoffRetention: ratio(test.expectedPayoff, train.expectedPayoff),
    tradesPerMonthRatio: ratio(test.tradesPerMonth, train.tradesPerMonth),
    ddRatio: ratio(test.relativeDrawdownPct ?? test.maxDrawdown, train.relativeDrawdownPct ?? train.maxDrawdown),
    longPFShift: { train: train.longPF, test: test.longPF },
    shortPFShift: { train: train.shortPF, test: test.shortPF },
  };
}

/* ------------------------------------------------------------------ *
 * OOS decision (§9–10): every check recorded; INCONCLUSIVE ≠ FAILED
 * ------------------------------------------------------------------ */

export function oosDecision({ train, test, testMonths, config }) {
  const T = config.oosPassThresholds;

  if (!test || test.trades < config.minOOSTrades || testMonths < config.minOOSMonths) {
    return {
      status: 'INCONCLUSIVE',
      reason: `sample below minimums (${test ? test.trades : 0} trades / ${r2(testMonths)} months; need ${config.minOOSTrades} / ${config.minOOSMonths})`,
      checks: [],
    };
  }

  const ratios = degradationRatios(train, test);
  const checks = [
    { rule: 'oosPF', value: test.profitFactor, threshold: T.minPF, ok: test.profitFactor !== null && test.profitFactor >= T.minPF },
    { rule: 'oosExpectedPayoff', value: test.expectedPayoff, threshold: T.minExpectedPayoff, ok: test.expectedPayoff !== null && test.expectedPayoff > T.minExpectedPayoff },
    {
      rule: 'oosDDvsTrain',
      value: ratios.ddRatio,
      threshold: T.maxDDvsTrainMultiple,
      ok: ratios.ddRatio === null ? false : ratios.ddRatio <= T.maxDDvsTrainMultiple,
    },
    { rule: 'pfRetention', value: ratios.pfRetention, threshold: T.minPFRetention, ok: ratios.pfRetention !== null && ratios.pfRetention >= T.minPFRetention },
  ];

  return { status: checks.every((c) => c.ok) ? 'PASSED' : 'FAILED', checks, ratios };
}

/* ------------------------------------------------------------------ *
 * WF aggregation (§21–25): stitched OOS from TEST windows only
 * ------------------------------------------------------------------ */

export function wfAggregate(windowResults, config) {
  const withTrades = windowResults.filter((w) => w.testTrades && w.testTrades.length);
  const stitchedTrades = withTrades.flatMap((w) => w.testTrades).sort((a, b) => a.closeTime - b.closeTime);
  const stitched = stitchedTrades.length ? windowMetrics(stitchedTrades) : null;

  const evaluated = windowResults.filter((w) => w.testMetrics);
  const positive = evaluated.filter((w) => (w.testMetrics.netProfit ?? 0) > 0);
  const pfPass = evaluated.filter((w) => w.testMetrics.profitFactor !== null && w.testMetrics.profitFactor >= 1.1);

  /* concentration (§112–113): share of stitched net carried by the best window */
  let topWindowShare = null;
  if (stitched && stitched.netProfit > 0) {
    const best = Math.max(...evaluated.map((w) => w.testMetrics.netProfit ?? 0));
    topWindowShare = r2(best / stitched.netProfit);
  }

  return {
    windows: windowResults.length,
    evaluatedWindows: evaluated.length,
    positiveWindows: positive.length,
    positiveWindowRate: evaluated.length ? r2(positive.length / evaluated.length) : null,
    pf110Windows: pfPass.length,
    stitched,
    topWindowShare,
  };
}

export function wfDecision({ agg, config }) {
  const T = config.wfPassThresholds;
  if (agg.evaluatedWindows < config.wfMinWindows || !agg.stitched) {
    return {
      status: 'INCONCLUSIVE',
      reason: `${agg.evaluatedWindows} evaluated windows < minimum ${config.wfMinWindows}`,
      checks: [],
    };
  }
  const checks = [
    { rule: 'aggregatePF', value: agg.stitched.profitFactor, threshold: T.minAggregatePF, ok: agg.stitched.profitFactor !== null && agg.stitched.profitFactor >= T.minAggregatePF },
    { rule: 'positiveWindowRate', value: agg.positiveWindowRate, threshold: T.minPositiveWindowRate, ok: agg.positiveWindowRate !== null && agg.positiveWindowRate >= T.minPositiveWindowRate },
    { rule: 'aggregateExpectedPayoff', value: agg.stitched.expectedPayoff, threshold: T.minAggregateExpectedPayoff, ok: agg.stitched.expectedPayoff !== null && agg.stitched.expectedPayoff > T.minAggregateExpectedPayoff },
  ];
  return { status: checks.every((c) => c.ok) ? 'PASSED' : 'FAILED', checks };
}

/**
 * Walk-Forward Efficiency — TYO definition (§23), stated because common
 * definitions differ: mean monthly net profit across TEST windows divided by
 * mean monthly net profit across their TRAIN windows. 1.0 = out-of-sample
 * pace equals in-sample pace; currency cancels out.
 */
export function wfeTYO(windowResults) {
  const rows = windowResults.filter((w) => w.trainMetrics && w.testMetrics);
  if (!rows.length) return null;
  const trainPace = rows.map((w) => (w.trainMetrics.netProfit ?? 0) / Math.max(1, w.trainMonths));
  const testPace = rows.map((w) => (w.testMetrics.netProfit ?? 0) / Math.max(1, w.testMonths));
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const mt = mean(trainPace);
  if (mt === 0) return null;
  return r2(mean(testPace) / mt);
}

/* ------------------------------------------------------------------ *
 * parameter stability (§27–33)
 * series: { paramName: [v per window] }; space: { paramName: {min,max,step} }
 * ------------------------------------------------------------------ */

export function parameterStability(series, space, config) {
  const S = config.stability;
  const out = {};
  for (const [name, values] of Object.entries(series)) {
    if (!values.length) continue;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const sd = values.length > 1 ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)) : 0;
    const cv = mean !== 0 ? Math.abs(sd / mean) : sd > 0 ? Infinity : 0;

    const sp = space?.[name];
    const eps = sp?.step ? sp.step / 2 : 1e-9;
    const boundaryHits = sp
      ? values.filter((v) => Math.abs(v - sp.min) < eps || Math.abs(v - sp.max) < eps).length
      : 0;
    const boundaryHit = sp ? boundaryHits / values.length >= S.boundaryHitShare : false;

    let klass = cv <= S.stableCV ? 'STABLE' : cv <= S.mixedCV ? 'MIXED' : 'UNSTABLE';
    if (boundaryHit) klass = 'BOUNDARY_HIT';

    out[name] = {
      values,
      mean: r2(mean),
      median: r2(median),
      min: r2(sorted[0]),
      max: r2(sorted[sorted.length - 1]),
      stdDev: r2(sd),
      cv: Number.isFinite(cv) ? r2(cv) : null,
      boundaryHits,
      class: klass,
    };
  }
  const classes = Object.values(out).map((p) => p.class);
  const overall = classes.includes('BOUNDARY_HIT') || classes.includes('UNSTABLE')
    ? 'UNSTABLE'
    : classes.includes('MIXED')
      ? 'MIXED'
      : classes.length
        ? 'STABLE'
        : 'NOT_APPLICABLE';
  return { parameters: out, overall };
}

/* ------------------------------------------------------------------ *
 * warning battery (§111–114)
 * ------------------------------------------------------------------ */

export function collectWarnings({ train, test, ratios, agg, stability, config }) {
  const W = config.warnings;
  const warnings = [];
  if (test && test.trades < config.minOOSTrades * 2) warnings.push('LOW_SAMPLE');
  if (ratios?.pfRetention !== null && ratios?.pfRetention !== undefined && ratios.pfRetention < W.highDegradationPFRatio)
    warnings.push('HIGH_DEGRADATION');
  if (ratios?.tradesPerMonthRatio !== null && ratios?.tradesPerMonthRatio !== undefined &&
      (ratios.tradesPerMonthRatio < W.freqShiftLow || ratios.tradesPerMonthRatio > W.freqShiftHigh))
    warnings.push('TRADE_FREQUENCY_SHIFT');
  if (train && test) {
    for (const side of ['longPF', 'shortPF']) {
      const a = train[side];
      const b = test[side];
      if (a !== null && b !== null && ((a >= W.longShortFlipPF && b < W.longShortFlipPF) || (a < W.longShortFlipPF && b >= W.longShortFlipPF)))
        warnings.push('DISTRIBUTION_SHIFT');
    }
  }
  if (agg?.topWindowShare !== null && agg?.topWindowShare !== undefined && agg.topWindowShare > W.topWindowProfitShare)
    warnings.push('WINDOW_CONCENTRATION');
  if (stability && ['UNSTABLE'].includes(stability.overall)) warnings.push('PARAMETER_INSTABILITY');
  if (stability && Object.values(stability.parameters).some((p) => p.class === 'BOUNDARY_HIT')) warnings.push('BOUNDARY_HIT');
  return [...new Set(warnings)];
}
