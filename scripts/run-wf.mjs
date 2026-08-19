/**
 * ============================================================================
 * RUN WALK FORWARD (Phase 14B–14C §132–133, §143–144)
 * ============================================================================
 *   node scripts/run-wf.mjs WF-000001 [--dry-run] [--src dir]
 *        [--emit-tester-configs]
 *
 * Same gates as run-oos: human-approved immutable plan, manifest frozen
 * before test metrics, append-once results.
 *
 * PARAMETER MODES
 *   FIXED_PARAMETERS (current): every window evaluates the strategy's
 *     as-shipped fixed parameter set. Train metrics are context, test
 *     windows are the out-of-sample walk. Parameter stability is
 *     NOT_APPLICABLE by construction and reported as such — never faked.
 *   OPTIMIZED (future): needs per-window MT5 optimisation runs. This runner
 *     can EMIT tester configs per window (--emit-tester-configs, §38) for
 *     the owner to execute; it never runs an optimisation itself and never
 *     touches a test window with one (§45).
 *
 * Checkpoints: per-window results stream into data/validation/windows/ so a
 * long run resumes cheaply (§95–96).
 * ============================================================================
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { VALIDATION_CONFIG as CFG } from '../config/validation.mjs';
import {
  generateWindows,
  tradesInRange,
  windowMetrics,
  wfAggregate,
  wfDecision,
  wfeTYO,
  parameterStability,
  collectWarnings,
  monthsBetween,
} from '../src/lib/validation.mjs';
import { ROOT, VAL_DATA, loadPlans, savePlans, loadResults, saveResults, planHash, loadStrategyTrades, ensureDirs } from './lib-validation-io.mjs';

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
const dryRun = argv.includes('--dry-run');
const emitConfigs = argv.includes('--emit-tester-configs');
const srcIdx = argv.indexOf('--src');
const SRC = srcIdx >= 0 ? argv[srcIdx + 1] : 'C:/Users/kenta/OneDrive/デスクトップ/FX/ゴゴジャン';

if (!id) {
  console.error('usage: node scripts/run-wf.mjs <WF-nnnnnn> [--dry-run] [--src dir] [--emit-tester-configs]');
  process.exit(1);
}

const plans = await loadPlans();
const plan = plans.plans.find((p) => p.validationPlanId === id);
if (!plan) { console.error(`✗ plan ${id} not found`); process.exit(1); }
if (plan.method !== 'WF') { console.error(`✗ ${id} is not a WF plan`); process.exit(1); }
if (plan.status !== 'APPROVED' && plan.status !== 'COMPLETE') {
  console.error(`✗ ${id} is ${plan.status} — a human must approve it first (§76)`);
  process.exit(1);
}
if (planHash(plan) !== plan.planHash) {
  console.error(`✗ ${id}: plan mutated after approval — refused (§146)`);
  process.exit(1);
}

const results = await loadResults();
if (results.validations.some((v) => v.validationId === id && v.status !== 'INVALID')) {
  console.error(`✗ ${id} already has results — invalidate first (§51) or create a new plan`);
  process.exit(1);
}

const loaded = await loadStrategyTrades(plan.strategyId, SRC);

const g = generateWindows({ from: plan.dataPeriod.from, to: plan.dataPeriod.to, mode: plan.wf.mode, trainMonths: plan.wf.trainMonths, testMonths: plan.wf.testMonths, stepMonths: plan.wf.stepMonths });
if (!g.ok) { console.error(`✗ ${g.errors.join(', ')}`); process.exit(1); }

await ensureDirs();

/* manifest first (§3) */
const manifest = {
  validationId: id,
  strategyId: plan.strategyId,
  version: plan.version,
  method: 'WF',
  mode: plan.wf.mode,
  provenance: plan.provenance,
  previouslyObserved: plan.previouslyObserved,
  parameterMode: plan.parameterMode,
  windows: g.windows,
  reportFile: loaded.reportFile,
  reportHash: loaded.reportHash,
  planHash: plan.planHash,
  thresholds: plan.thresholds,
  createdAt: new Date().toISOString(),
};
if (!dryRun) await writeFile(join(VAL_DATA, 'manifests', `${id}.json`), JSON.stringify(manifest, null, 1), 'utf8');

/* §38: optional tester-config emission for a future OPTIMIZED mode */
if (emitConfigs) {
  for (const w of g.windows) {
    const ini = [
      '; TYO Phase 14 — per-window optimisation config (owner-run; §38–40)',
      '[Tester]',
      `Expert=${plan.strategyId}`,
      'Symbol=SET_ME',
      'Period=M5',
      `FromDate=${w.trainStart.replace(/-/g, '.')}`,
      `ToDate=${w.trainEnd.replace(/-/g, '.')}`,
      'Model=1 ; 1 minute OHLC for search; re-verify candidates on real ticks (§41)',
      'Optimization=2',
      'ForwardMode=0 ; TEST window is evaluated separately with frozen parameters — never optimised (§45)',
      `; test window (frozen evaluation only): ${w.testStart} → ${w.testEnd}`,
    ].join('\n');
    await writeFile(join(VAL_DATA, 'generated', `${id}-${w.windowId}.ini`), ini, 'utf8');
  }
  console.log(`  → ${g.windows.length} tester configs in data/validation/generated/`);
}

/* per-window evaluation with checkpoints (§96) */
const windowResults = [];
for (const w of g.windows) {
  const trainTrades = tradesInRange(loaded.trades, w.trainStart, w.trainEnd);
  const testTrades = tradesInRange(loaded.trades, w.testStart, w.testEnd);
  const preBalance = trainTrades.length ? trainTrades[trainTrades.length - 1].balance : loaded.startBalance;
  const row = {
    windowId: w.windowId,
    trainStart: w.trainStart,
    trainEnd: w.trainEnd,
    testStart: w.testStart,
    testEnd: w.testEnd,
    trainMonths: monthsBetween(w.trainStart, w.trainEnd),
    testMonths: monthsBetween(w.testStart, w.testEnd),
    selectedParameters: 'FIXED (as-shipped set; no per-window optimisation performed)',
    parameterHash: manifest.reportHash.slice(0, 12),
    trainMetrics: windowMetrics(trainTrades),
    testMetrics: windowMetrics(testTrades, { startBalance: preBalance }),
    testTrades, // used for stitching; stripped before publishing
    lowSample: testTrades.length < CFG.wfMinTradesPerWindow,
    status: testTrades.length ? 'EVALUATED' : 'NO_TRADES',
  };
  windowResults.push(row);
  if (!dryRun)
    await writeFile(
      join(VAL_DATA, 'windows', `${id}-${w.windowId}.json`),
      JSON.stringify({ ...row, testTrades: undefined }, null, 1),
      'utf8'
    );
}

/* aggregate: TEST windows only (§21–22) */
const agg = wfAggregate(windowResults, CFG);
const decision = wfDecision({ agg, config: CFG });
const wfe = wfeTYO(windowResults);
/* FIXED mode → no numeric parameter series exists; never fabricated */
const stability = plan.parameterMode === 'FIXED_PARAMETERS'
  ? { parameters: {}, overall: 'NOT_APPLICABLE', note: 'FIXED_PARAMETERS mode: per-window optimisation was not performed, so there is no parameter series to assess.' }
  : parameterStability({}, {}, CFG);

const stitchedRatios = agg.stitched
  ? {
      pfRetention: null, // per-window train context varies; see window table
      tradesPerMonthRatio: null,
    }
  : null;
const warnings = collectWarnings({ train: null, test: agg.stitched, ratios: stitchedRatios, agg, stability, config: CFG });
if (windowResults.some((w) => w.lowSample)) warnings.push('LOW_SAMPLE_WINDOWS');

const publicWindows = windowResults.map(({ testTrades, ...rest }) => rest);

const record = {
  validationId: id,
  type: 'WF',
  strategyId: plan.strategyId,
  version: plan.version,
  provenance: plan.provenance,
  previouslyObserved: plan.previouslyObserved,
  status: decision.status,
  manifest: { ...manifest, windows: undefined },
  mode: plan.wf.mode,
  wf: plan.wf,
  windows: publicWindows,
  aggregate: {
    windows: agg.windows,
    evaluatedWindows: agg.evaluatedWindows,
    positiveWindows: agg.positiveWindows,
    positiveWindowRate: agg.positiveWindowRate,
    pf110Windows: agg.pf110Windows,
    stitched: agg.stitched,
    topWindowShare: agg.topWindowShare,
    wfeTYO: wfe,
  },
  stability,
  checks: decision.checks,
  inconclusiveReason: decision.reason || null,
  warnings: [...new Set(warnings)],
  completedAt: new Date().toISOString(),
};

console.log(`\n  WF ${id} — ${plan.strategyId} (${plan.wf.mode}, ${plan.provenance}) ${dryRun ? '[dry run]' : ''}`);
for (const w of publicWindows)
  console.log(
    `    ${w.windowId} train ${w.trainStart}→${w.trainEnd}  test ${w.testStart}→${w.testEnd}  ` +
      `trades ${w.testMetrics?.trades ?? 0}  PF ${w.testMetrics?.profitFactor ?? '—'}  net ${w.testMetrics?.netProfit ?? '—'}${w.lowSample ? '  LOW_SAMPLE' : ''}`
  );
console.log(`  stitched: trades ${agg.stitched?.trades ?? 0}  PF ${agg.stitched?.profitFactor ?? '—'}  net ${agg.stitched?.netProfit ?? '—'}  relDD ${agg.stitched?.relativeDrawdownPct ?? '—'}%`);
console.log(`  positive windows ${agg.positiveWindows}/${agg.evaluatedWindows} (${agg.positiveWindowRate})  topWindowShare ${agg.topWindowShare ?? '—'}  WFE(TYO) ${wfe ?? '—'}`);
console.log(`  stability: ${stability.overall}`);
console.log(`  warnings: ${record.warnings.join(', ') || 'none'}`);
console.log(`  STATUS: ${decision.status}`);

if (!dryRun) {
  results.validations.push(record);
  await saveResults(results);
  plan.status = 'COMPLETE';
  await savePlans(plans);

  const rep = [
    `# Walk-forward validation ${id} — ${plan.strategyId.toUpperCase()}`,
    '',
    `**Decision: ${decision.status}** · mode: ${plan.wf.mode} · provenance: **${plan.provenance}**${plan.previouslyObserved ? ' (periods previously observed during development)' : ''}`,
    '',
    '## Method',
    `Train ${plan.wf.trainMonths}m / test ${plan.wf.testMonths}m / step ${plan.wf.stepMonths}m. Parameter mode: FIXED_PARAMETERS — the as-shipped set is evaluated on every window; per-window optimisation was NOT performed (no optimisation tooling or history exists for this strategy), so this measures whether the fixed configuration's edge persists across sequential unseen-by-the-split windows, not re-optimisation robustness.`,
    '',
    '## Windows (all shown — §26)',
    '| window | train | test | trades | PF | net | rel. DD |',
    '|---|---|---|---|---|---|---|',
    ...publicWindows.map((w) =>
      `| ${w.windowId}${w.lowSample ? ' ⚠' : ''} | ${w.trainStart}→${w.trainEnd} | ${w.testStart}→${w.testEnd} | ${w.testMetrics?.trades ?? 0} | ${w.testMetrics?.profitFactor ?? '—'} | ${w.testMetrics?.netProfit ?? '—'} | ${w.testMetrics?.relativeDrawdownPct ?? '—'}% |`),
    '',
    '## Stitched out-of-sample (test windows only — §21)',
    `trades ${agg.stitched?.trades ?? 0} · PF ${agg.stitched?.profitFactor ?? '—'} · net ${agg.stitched?.netProfit ?? '—'} · win rate ${agg.stitched?.winRate ?? '—'}% · rel. DD ${agg.stitched?.relativeDrawdownPct ?? '—'}% · Sharpe(per-trade) ${agg.stitched?.sharpePerTrade ?? '—'}`,
    '',
    `Positive-window rate ${agg.positiveWindowRate} (${agg.positiveWindows}/${agg.evaluatedWindows}) · PF≥1.1 windows ${agg.pf110Windows} · top-window profit share ${agg.topWindowShare ?? '—'} · WFE(TYO: mean test net/month ÷ mean train net/month) ${wfe ?? '—'}`,
    '',
    '## Parameter stability',
    stability.note || stability.overall,
    '',
    '## Checks',
    ...(decision.checks || []).map((c) => `- ${c.ok ? 'PASS' : 'FAIL'} — ${c.rule}: ${c.value} (threshold ${c.threshold})`),
    decision.reason ? `- INCONCLUSIVE: ${decision.reason}` : '',
    '',
    '## Warnings',
    record.warnings.length ? record.warnings.map((w) => `- ${w}`).join('\n') : 'none',
    '',
    '## Evidence qualification',
    plan.provenance === 'PROSPECTIVE'
      ? 'Eligible for the evidence map when status is PASSED.'
      : 'RETROSPECTIVE: displayed for transparency, never lights the evidence map, adds no score points.',
  ].join('\n');
  const repDir = join(ROOT, 'reports', 'validation', plan.strategyId);
  await mkdir(repDir, { recursive: true });
  await writeFile(join(repDir, `${id}.md`), rep, 'utf8');
  console.log(`\n  → tools/validation-results.json + reports/validation/${plan.strategyId}/${id}.md\n`);
} else {
  console.log('\n  dry run complete — nothing written.\n');
}
