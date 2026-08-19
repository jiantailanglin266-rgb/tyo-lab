/**
 * ============================================================================
 * CREATE VALIDATION PLAN — always a DRAFT (Phase 14 §76–79, §143)
 * ============================================================================
 *   node scripts/create-validation-plan.mjs <slug> --type OOS [--ratio 0.7]
 *   node scripts/create-validation-plan.mjs <slug> --type WF
 *        [--mode rolling|anchored] [--train 24] [--test 6] [--step 6]
 *   common: [--version V1] [--provenance RETROSPECTIVE|PROSPECTIVE]
 *
 * The plan is written as DRAFT. Nothing runs until a HUMAN approves it via
 * scripts/approve-validation-plan.mjs — this script cannot set approval
 * (§78). Split/window definitions are validated here (§145) and become
 * immutable at approval (§146).
 *
 * Provenance honesty (§85–88): the 14 existing systems were developed with
 * their full backtest period visible and no recorded optimisation window, so
 * the default provenance is RETROSPECTIVE with previouslyObserved: true.
 * PROSPECTIVE must be claimed explicitly and is only legitimate for data the
 * strategy's authorship provably never saw.
 * ============================================================================
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { VALIDATION_CONFIG as CFG } from '../config/validation.mjs';
import { splitByRatio, validateSplit, generateWindows, monthsBetween } from '../src/lib/validation.mjs';
import { ROOT, loadPlans, savePlans } from './lib-validation-io.mjs';

const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith('--'));
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};

const type = flag('type');
if (!slug || !['OOS', 'WF'].includes(type)) {
  console.error('usage: node scripts/create-validation-plan.mjs <slug> --type OOS|WF [options]');
  process.exit(1);
}

const extracted = JSON.parse(await readFile(join(ROOT, 'tools', 'extracted-trades.json'), 'utf8'));
if (!extracted[slug]) {
  console.error(`✗ ${slug}: no extracted trade data — validation needs a parsed deal list`);
  process.exit(1);
}
const period = extracted[slug].period;
const provenance = flag('provenance', 'RETROSPECTIVE');
if (!['RETROSPECTIVE', 'PROSPECTIVE'].includes(provenance)) {
  console.error('✗ --provenance must be RETROSPECTIVE or PROSPECTIVE');
  process.exit(1);
}

const store = await loadPlans();
const seq = 1 + store.plans.filter((p) => p.method === type).length;
const id = type === 'OOS' ? `VAL-OOS-${String(seq).padStart(6, '0')}` : `WF-${String(seq).padStart(6, '0')}`;

const plan = {
  validationPlanId: id,
  strategyId: slug,
  version: flag('version', 'as-shipped'),
  method: type,
  provenance,
  /* §82: a retrospective plan admits the period was already observed */
  previouslyObserved: provenance === 'RETROSPECTIVE',
  parameterMode: 'FIXED_PARAMETERS', // per-window optimisation needs tester runs (§37)
  dataPeriod: period,
  thresholds: type === 'OOS' ? CFG.oosPassThresholds : CFG.wfPassThresholds,
  status: 'DRAFT',
  approvedByHuman: null, // ONLY approve-validation-plan.mjs sets this (§78)
  createdAt: new Date().toISOString(),
};

if (type === 'OOS') {
  const ratio = Number(flag('ratio', CFG.defaultTrainRatio));
  const split = splitByRatio(period.from, period.to, ratio);
  const v = split ? validateSplit(split) : { ok: false, errors: ['split failed'] };
  if (!v.ok) {
    console.error(`✗ invalid split: ${v.errors.join(', ')}`);
    process.exit(1);
  }
  const testMonths = monthsBetween(split.testStart, split.testEnd);
  if (testMonths < CFG.minOOSMonths) {
    console.error(`✗ test window ${testMonths} months < minimum ${CFG.minOOSMonths}`);
    process.exit(1);
  }
  plan.split = { ...split, trainRatio: ratio };
} else {
  const wf = {
    mode: flag('mode', CFG.wfDefaultMode),
    trainMonths: Number(flag('train', CFG.wfTrainMonths)),
    testMonths: Number(flag('test', CFG.wfTestMonths)),
    stepMonths: Number(flag('step', CFG.wfStepMonths)),
  };
  const g = generateWindows({ from: period.from, to: period.to, ...wf });
  if (!g.ok) {
    console.error(`✗ window generation failed: ${g.errors.join(', ')}`);
    process.exit(1);
  }
  if (g.windows.length < CFG.wfMinWindows) {
    console.error(`✗ only ${g.windows.length} full windows fit (< ${CFG.wfMinWindows})`);
    process.exit(1);
  }
  plan.wf = wf;
  plan.windowsPreview = g.windows;
}

store.plans.push(plan);
await savePlans(store);

console.log(`\n  DRAFT plan ${id} for ${slug} (${type}, ${provenance})`);
if (plan.split) console.log(`  train ${plan.split.trainStart} → ${plan.split.trainEnd}   test ${plan.split.testStart} → ${plan.split.testEnd}`);
if (plan.wf) console.log(`  ${plan.wf.mode} · train ${plan.wf.trainMonths}m / test ${plan.wf.testMonths}m / step ${plan.wf.stepMonths}m · ${plan.windowsPreview.length} windows`);
console.log(`  → a HUMAN must approve: node scripts/approve-validation-plan.mjs ${id} --by "name"\n`);
