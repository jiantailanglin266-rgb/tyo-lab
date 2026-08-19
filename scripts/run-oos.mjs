/**
 * ============================================================================
 * RUN OOS VALIDATION (Phase 14A §131, §143–144)
 * ============================================================================
 *   node scripts/run-oos.mjs VAL-OOS-000001 [--dry-run]
 *        [--src "C:\...\ゴゴジャン"]
 *
 * Order of operations enforces TRAIN → FREEZE → TEST (§0, §3):
 *   1. plan must be APPROVED by a human and hash-intact (§76, §146)
 *   2. the manifest (periods, hashes, provenance) is WRITTEN before any
 *      test-window metric is computed and never rewritten (§3)
 *   3. train metrics, then test metrics, ratios, decision, warnings
 *   4. results append to the public store; a validationId can only be
 *      written once (re-running requires invalidating the old record §51)
 *
 * No optimisation happens anywhere in this runner (§45): parameters are the
 * strategy's as-shipped fixed set (parameterMode FIXED_PARAMETERS) and the
 * runner contains no code path that searches, scores or selects parameters.
 * ============================================================================
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { VALIDATION_CONFIG as CFG } from '../config/validation.mjs';
import { tradesInRange, windowMetrics, degradationRatios, oosDecision, collectWarnings, monthsBetween } from '../src/lib/validation.mjs';
import { ROOT, VAL_DATA, loadPlans, savePlans, loadResults, saveResults, planHash, loadStrategyTrades, ensureDirs, sha } from './lib-validation-io.mjs';

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
const dryRun = argv.includes('--dry-run');
const srcIdx = argv.indexOf('--src');
const SRC = srcIdx >= 0 ? argv[srcIdx + 1] : 'C:/Users/kenta/OneDrive/デスクトップ/FX/ゴゴジャン';

if (!id) {
  console.error('usage: node scripts/run-oos.mjs <VAL-OOS-nnnnnn> [--dry-run] [--src dir]');
  process.exit(1);
}

/* ---- 1. plan gate ----------------------------------------------------- */

const plans = await loadPlans();
const plan = plans.plans.find((p) => p.validationPlanId === id);
if (!plan) { console.error(`✗ plan ${id} not found`); process.exit(1); }
if (plan.method !== 'OOS') { console.error(`✗ ${id} is not an OOS plan`); process.exit(1); }
if (plan.status !== 'APPROVED' && plan.status !== 'COMPLETE') {
  console.error(`✗ ${id} is ${plan.status} — a human must approve it first (§76)`);
  process.exit(1);
}
if (planHash(plan) !== plan.planHash) {
  console.error(`✗ ${id}: plan content no longer matches its approval hash — plans are immutable after approval (§146). Create a new plan.`);
  process.exit(1);
}

const results = await loadResults();
if (results.validations.some((v) => v.validationId === id && v.status !== 'INVALID')) {
  console.error(`✗ ${id} already has results. Re-running the same OOS is selection bias (§0); mark the old record INVALID (§51) and create a NEW plan/version instead.`);
  process.exit(1);
}

/* ---- 2. load trades + FREEZE the manifest ------------------------------ */

const loaded = await loadStrategyTrades(plan.strategyId, SRC);

/* ea hash from the current MT5 source when present */
let eaHash = null;
try {
  const { FOLDER_TO_SLUG } = await import('../tools/extract-trades.mjs');
  const folder = Object.entries(FOLDER_TO_SLUG).find(([, s]) => s === plan.strategyId)?.[0];
  const { readdir } = await import('node:fs/promises');
  const files = await readdir(join(SRC, folder));
  const mq5 = files.find((f) => f.toLowerCase().endsWith('.mq5'));
  if (mq5) eaHash = sha(await readFile(join(SRC, folder, mq5)));
} catch { /* source optional */ }

const manifest = {
  validationId: id,
  strategyId: plan.strategyId,
  version: plan.version,
  method: 'OOS',
  provenance: plan.provenance,
  previouslyObserved: plan.previouslyObserved,
  trainStart: plan.split.trainStart,
  trainEnd: plan.split.trainEnd,
  testStart: plan.split.testStart,
  testEnd: plan.split.testEnd,
  parameterMode: plan.parameterMode,
  parametersHash: eaHash ? `ea-source:${eaHash.slice(0, 16)}` : 'undocumented (as-shipped fixed set)',
  eaHash,
  reportFile: loaded.reportFile,
  reportHash: loaded.reportHash,
  dialect: loaded.dialect,
  dataMode: 'tester report deal list (historical modelling as produced by the original report)',
  thresholds: plan.thresholds,
  planHash: plan.planHash,
  createdAt: new Date().toISOString(),
};

await ensureDirs();
if (!dryRun) {
  // §3: the manifest exists BEFORE any test metric and is never rewritten
  await writeFile(join(VAL_DATA, 'manifests', `${id}.json`), JSON.stringify(manifest, null, 1), 'utf8');
}

/* ---- 3. TRAIN then TEST -------------------------------------------------- */

const trainTrades = tradesInRange(loaded.trades, manifest.trainStart, manifest.trainEnd);
const testTrades = tradesInRange(loaded.trades, manifest.testStart, manifest.testEnd);

const train = windowMetrics(trainTrades, { startBalance: loaded.startBalance });
/* test window's relative DD uses the balance entering the window */
const lastTrainBalance = trainTrades.length ? trainTrades[trainTrades.length - 1].balance : loaded.startBalance;
const test = windowMetrics(testTrades, { startBalance: lastTrainBalance });

const testMonths = monthsBetween(manifest.testStart, manifest.testEnd);
const decision = oosDecision({ train, test, testMonths, config: CFG });
const ratios = decision.ratios || (train && test ? degradationRatios(train, test) : null);
const warnings = collectWarnings({ train, test, ratios, agg: null, stability: null, config: CFG });

/* ---- 4. publish ----------------------------------------------------------- */

const record = {
  validationId: id,
  type: 'OOS',
  strategyId: plan.strategyId,
  version: plan.version,
  provenance: plan.provenance,
  previouslyObserved: plan.previouslyObserved,
  status: decision.status,
  manifest,
  trainMetrics: train,
  testMetrics: test,
  testMonths,
  ratios,
  checks: decision.checks,
  inconclusiveReason: decision.reason || null,
  warnings,
  completedAt: new Date().toISOString(),
};

console.log(`\n  OOS ${id} — ${plan.strategyId} (${plan.provenance}${plan.previouslyObserved ? ', previously observed data' : ''}) ${dryRun ? '[dry run]' : ''}`);
console.log(`  train ${manifest.trainStart} → ${manifest.trainEnd}: ${train ? train.trades : 0} trades, PF ${train?.profitFactor ?? '—'}, relDD ${train?.relativeDrawdownPct ?? '—'}%`);
console.log(`  test  ${manifest.testStart} → ${manifest.testEnd}: ${test ? test.trades : 0} trades, PF ${test?.profitFactor ?? '—'}, relDD ${test?.relativeDrawdownPct ?? '—'}%`);
if (ratios) console.log(`  ratios: PF ${ratios.pfRetention ?? '—'} · payoff ${ratios.expectedPayoffRetention ?? '—'} · freq ${ratios.tradesPerMonthRatio ?? '—'} · DD ${ratios.ddRatio ?? '—'}`);
for (const c of decision.checks || []) console.log(`    ${c.ok ? '✓' : '✗'} ${c.rule}: ${c.value} vs ${c.threshold}`);
console.log(`  warnings: ${warnings.join(', ') || 'none'}`);
console.log(`  STATUS: ${decision.status}`);

if (!dryRun) {
  results.validations.push(record);
  await saveResults(results);
  plan.status = 'COMPLETE';
  await savePlans(plans);

  /* §115–119: scientific report, no marketing language */
  const rep = [
    `# OOS validation ${id} — ${plan.strategyId.toUpperCase()}`,
    '',
    `**Decision: ${decision.status}** · provenance: **${plan.provenance}**${plan.previouslyObserved ? ' (test period was previously observed during development — this is NOT unseen data in the strict sense)' : ''}`,
    '',
    '## Method',
    `Time-series split, train ratio ${plan.split.trainRatio}. Parameters: ${manifest.parametersHash} — FIXED for the whole run; no optimisation was performed anywhere in this validation (parameter selection history for this strategy is undocumented).`,
    '',
    '## Windows',
    `| | period | trades | PF | win rate | expected payoff | rel. DD |`,
    `|---|---|---|---|---|---|---|`,
    `| Train | ${manifest.trainStart} → ${manifest.trainEnd} | ${train?.trades ?? 0} | ${train?.profitFactor ?? '—'} | ${train?.winRate ?? '—'}% | ${train?.expectedPayoff ?? '—'} | ${train?.relativeDrawdownPct ?? '—'}% |`,
    `| Test | ${manifest.testStart} → ${manifest.testEnd} | ${test?.trades ?? 0} | ${test?.profitFactor ?? '—'} | ${test?.winRate ?? '—'}% | ${test?.expectedPayoff ?? '—'} | ${test?.relativeDrawdownPct ?? '—'}% |`,
    '',
    '## Degradation ratios',
    ratios ? `PF retention ${ratios.pfRetention} · payoff retention ${ratios.expectedPayoffRetention} · trade-frequency ratio ${ratios.tradesPerMonthRatio} · DD ratio ${ratios.ddRatio}` : 'not computable',
    '',
    '## Checks',
    ...(decision.checks || []).map((c) => `- ${c.ok ? 'PASS' : 'FAIL'} — ${c.rule}: ${c.value} (threshold ${c.threshold})`),
    decision.reason ? `- INCONCLUSIVE: ${decision.reason}` : '',
    '',
    `## Warnings`,
    warnings.length ? warnings.map((w) => `- ${w}`).join('\n') : 'none',
    '',
    '## Evidence qualification',
    plan.provenance === 'PROSPECTIVE'
      ? `Eligible for the evidence map when status is PASSED.`
      : `RETROSPECTIVE: displayed for transparency, NEVER lights the evidence map and adds no score points (the strategy was developed with this period visible).`,
    '',
    `Manifest hash chain: plan ${plan.planHash.slice(0, 12)}… · report ${manifest.reportHash.slice(0, 12)}… · ea ${manifest.eaHash ? manifest.eaHash.slice(0, 12) + '…' : 'n/a'}`,
  ].join('\n');
  const { mkdir } = await import('node:fs/promises');
  const repDir = join(ROOT, 'reports', 'validation', plan.strategyId);
  await mkdir(repDir, { recursive: true });
  await writeFile(join(repDir, `${id}.md`), rep, 'utf8');
  console.log(`\n  → tools/validation-results.json + reports/validation/${plan.strategyId}/${id}.md\n`);
} else {
  console.log('\n  dry run complete — nothing written.\n');
}
