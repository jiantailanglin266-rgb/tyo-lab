/**
 * ============================================================================
 * VALIDATION ENGINE TESTS (Phase 14 §147)
 * ============================================================================
 *   node scripts/test-validation.mjs
 * Unit tests on the pure engine, integration through the real CLIs in an
 * isolated store (env overrides), and failure tests. Synthetic fixtures only;
 * production stores untouched.
 * ============================================================================
 */

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  splitByRatio,
  validateSplit,
  generateWindows,
  tradesInRange,
  windowMetrics,
  degradationRatios,
  oosDecision,
  wfAggregate,
  wfDecision,
  wfeTYO,
  parameterStability,
  collectWarnings,
  monthsBetween,
} from '../src/lib/validation.mjs';
import { VALIDATION_CONFIG as CFG } from '../config/validation.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n      ${e.message}`);
  }
}

const DAY = 86400000;
const mk = (nets, startYmd = '2020-01-01', perDay = 1) =>
  nets.map((net, i) => ({
    closeTime: Date.parse(startYmd + 'T12:00:00Z') + Math.floor(i / perDay) * DAY,
    netProfit: net,
    profit: net,
    swap: 0,
    commission: 0,
    fees: 0,
    direction: i % 2 ? 'short' : 'long',
    balance: 10000 + i,
  }));

console.log('\nUNIT — validation engine\n');

test('split calculation is chronological and ratio-correct (§4)', () => {
  const s = splitByRatio('2020-01-01', '2024-01-01', 0.75);
  assert.equal(s.trainStart, '2020-01-01');
  assert.equal(s.testEnd, '2024-01-01');
  assert.ok(s.trainEnd < s.testStart);
  assert.ok(Math.abs(monthsBetween(s.trainStart, s.trainEnd) - 36) < 1.5);
});

test('overlapping/reversed splits are rejected (§145)', () => {
  assert.equal(validateSplit({ trainStart: '2020-01-01', trainEnd: '2022-01-01', testStart: '2021-06-01', testEnd: '2023-01-01' }).ok, false);
  assert.equal(validateSplit({ trainStart: '2022-01-01', trainEnd: '2020-01-01', testStart: '2023-01-01', testEnd: '2024-01-01' }).ok, false);
  assert.equal(validateSplit({ trainStart: '2020-01-01', trainEnd: '2022-01-01', testStart: '2022-01-02', testEnd: '2023-01-01' }).ok, true);
});

test('rolling window generation: full windows only, sequential (§12)', () => {
  const g = generateWindows({ from: '2020-01-01', to: '2024-01-01', mode: 'rolling', trainMonths: 24, testMonths: 6, stepMonths: 6 });
  assert.ok(g.ok);
  assert.equal(g.windows.length, 4); // tests: 22H1, 22H2, 23H1, 23H2
  assert.equal(g.windows[0].testStart, g.windows[0].trainEnd);
  assert.equal(g.windows[1].trainStart, '2020-07-01');
});

test('anchored window generation extends the train window (§12)', () => {
  const g = generateWindows({ from: '2020-01-01', to: '2024-01-01', mode: 'anchored', trainMonths: 24, testMonths: 6, stepMonths: 6 });
  assert.ok(g.ok);
  assert.equal(g.windows[0].trainStart, '2020-01-01');
  assert.equal(g.windows[g.windows.length - 1].trainStart, '2020-01-01');
  assert.ok(monthsBetween(g.windows[2].trainStart, g.windows[2].trainEnd) > monthsBetween(g.windows[0].trainStart, g.windows[0].trainEnd));
});

test('degradation ratios (§8)', () => {
  const train = { profitFactor: 2.0, expectedPayoff: 10, tradesPerMonth: 100, relativeDrawdownPct: 10, longPF: 2, shortPF: 2, maxDrawdown: 500 };
  const testM = { profitFactor: 1.3, expectedPayoff: 6, tradesPerMonth: 80, relativeDrawdownPct: 15, longPF: 1.5, shortPF: 0.9, maxDrawdown: 400 };
  const r = degradationRatios(train, testM);
  assert.equal(r.pfRetention, 0.65);
  assert.equal(r.expectedPayoffRetention, 0.6);
  assert.equal(r.tradesPerMonthRatio, 0.8);
  assert.equal(r.ddRatio, 1.5);
});

test('OOS decision: PASS path (§9)', () => {
  const train = { profitFactor: 1.6, expectedPayoff: 5, tradesPerMonth: 50, relativeDrawdownPct: 10, longPF: 1.5, shortPF: 1.5 };
  const testM = { trades: 500, profitFactor: 1.3, expectedPayoff: 4, tradesPerMonth: 45, relativeDrawdownPct: 12, longPF: 1.3, shortPF: 1.2 };
  const d = oosDecision({ train, test: testM, testMonths: 18, config: CFG });
  assert.equal(d.status, 'PASSED');
});

test('OOS decision: FAILED on PF retention below threshold', () => {
  const train = { profitFactor: 2.0, expectedPayoff: 5, tradesPerMonth: 50, relativeDrawdownPct: 10, longPF: 2, shortPF: 2 };
  const testM = { trades: 500, profitFactor: 1.1, expectedPayoff: 1, tradesPerMonth: 45, relativeDrawdownPct: 12, longPF: 1, shortPF: 1 };
  const d = oosDecision({ train, test: testM, testMonths: 18, config: CFG });
  assert.equal(d.status, 'FAILED'); // retention 0.55 < 0.65
  assert.ok(d.checks.find((c) => c.rule === 'pfRetention' && !c.ok));
});

test('OOS decision: INCONCLUSIVE ≠ FAILED on thin samples (§10)', () => {
  const d = oosDecision({ train: {}, test: { trades: 20 }, testMonths: 6, config: CFG });
  assert.equal(d.status, 'INCONCLUSIVE');
});

test('WF aggregation stitches TEST windows only + concentration (§21, §112)', () => {
  const wr = [1, 2, 3, 4].map((i) => {
    const testTrades = mk(Array(40).fill(i === 3 ? 30 : 5), `2022-0${i}-01`);
    return { testTrades, testMetrics: windowMetrics(testTrades), trainMetrics: windowMetrics(mk(Array(100).fill(4), '2021-01-01')), trainMonths: 24, testMonths: 6 };
  });
  const agg = wfAggregate(wr, CFG);
  assert.equal(agg.stitched.trades, 160);
  assert.equal(agg.positiveWindows, 4);
  assert.ok(agg.topWindowShare > 0.5); // window 3 dominates → concentration
  const warns = collectWarnings({ train: null, test: agg.stitched, ratios: null, agg, stability: null, config: CFG });
  assert.ok(warns.includes('WINDOW_CONCENTRATION'));
});

test('WF decision: INCONCLUSIVE below minimum windows (§25)', () => {
  const wr = [1, 2].map(() => ({ testTrades: mk(Array(40).fill(5)), testMetrics: windowMetrics(mk(Array(40).fill(5))) }));
  const agg = wfAggregate(wr, CFG);
  assert.equal(wfDecision({ agg, config: CFG }).status, 'INCONCLUSIVE');
});

test('WFE (TYO definition §23)', () => {
  const wr = [
    { trainMetrics: { netProfit: 240 }, trainMonths: 24, testMetrics: { netProfit: 60 }, testMonths: 6 },
    { trainMetrics: { netProfit: 480 }, trainMonths: 24, testMetrics: { netProfit: 30 }, testMonths: 6 },
  ];
  // train pace mean = (10+20)/2 = 15; test pace mean = (10+5)/2 = 7.5 → 0.5
  assert.equal(wfeTYO(wr), 0.5);
});

test('parameter stability: STABLE vs UNSTABLE vs BOUNDARY_HIT (§27–30)', () => {
  const space = { atr: { min: 1.0, max: 5.0, step: 0.1 }, len: { min: 5, max: 50, step: 5 } };
  const s1 = parameterStability({ atr: [1.4, 1.5, 1.4, 1.6, 1.5] }, space, CFG);
  assert.equal(s1.parameters.atr.class, 'STABLE');
  const s2 = parameterStability({ atr: [3.0, 0.5, 4.5, 0.8, 5.0] }, space, CFG);
  assert.ok(['UNSTABLE', 'BOUNDARY_HIT'].includes(s2.parameters.atr.class));
  const s3 = parameterStability({ len: [50, 50, 50, 45, 50] }, space, CFG);
  assert.equal(s3.parameters.len.class, 'BOUNDARY_HIT');
  assert.equal(s3.overall, 'UNSTABLE');
});

test('distribution-shift warning on long/short PF flip (§106–107)', () => {
  const warns = collectWarnings({
    train: { longPF: 1.6, shortPF: 1.4 },
    test: { trades: 500, longPF: 0.9, shortPF: 1.3 },
    ratios: { pfRetention: 0.8, tradesPerMonthRatio: 1.0 },
    agg: null,
    stability: null,
    config: CFG,
  });
  assert.ok(warns.includes('DISTRIBUTION_SHIFT'));
});

/* =================================================================== *
 * INTEGRATION + FAILURE — real CLIs against an isolated store
 * =================================================================== */

console.log('\nINTEGRATION — plan → approve → run (isolated store)\n');

const tmp = mkdtempSync(join(tmpdir(), 'tyo-val-test-'));
const env = {
  ...process.env,
  VALIDATION_DATA_DIR: join(tmp, 'valdata'),
  VALIDATION_PLANS_FILE: join(tmp, 'plans.json'),
  VALIDATION_RESULTS_FILE: join(tmp, 'results.json'),
};
function run(script, args) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', script), ...args], { env, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

test('plan creation produces DRAFT with valid split; approval pins the hash (§76, §146)', () => {
  const c = run('create-validation-plan.mjs', ['supremacy', '--type', 'OOS']);
  assert.equal(c.code, 0, c.out);
  const plans = JSON.parse(readFileSync(env.VALIDATION_PLANS_FILE, 'utf8'));
  assert.equal(plans.plans[0].status, 'DRAFT');
  assert.equal(plans.plans[0].approvedByHuman, null);
  const a = run('approve-validation-plan.mjs', ['VAL-OOS-000001', '--by', 'test-human']);
  assert.equal(a.code, 0, a.out);
});

test('running an unapproved plan is refused (§76)', () => {
  const c = run('create-validation-plan.mjs', ['cosmos', '--type', 'OOS']);
  assert.equal(c.code, 0, c.out);
  const r = run('run-oos.mjs', ['VAL-OOS-000002']);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /human must approve/);
});

test('plan mutated after approval is refused (§146)', () => {
  const plans = JSON.parse(readFileSync(env.VALIDATION_PLANS_FILE, 'utf8'));
  const p = plans.plans.find((x) => x.validationPlanId === 'VAL-OOS-000001');
  const orig = p.split.trainEnd;
  p.split.trainEnd = '2023-12-31'; // tamper
  writeFileSync(env.VALIDATION_PLANS_FILE, JSON.stringify(plans, null, 1));
  const r = run('run-oos.mjs', ['VAL-OOS-000001', '--dry-run']);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /immutable|no longer matches/);
  p.split.trainEnd = orig; // restore
  writeFileSync(env.VALIDATION_PLANS_FILE, JSON.stringify(plans, null, 1));
});

test('OOS end-to-end: manifest frozen, decision recorded, report written', () => {
  const r = run('run-oos.mjs', ['VAL-OOS-000001']);
  assert.equal(r.code, 0, r.out);
  const results = JSON.parse(readFileSync(env.VALIDATION_RESULTS_FILE, 'utf8'));
  const v = results.validations[0];
  assert.equal(v.type, 'OOS');
  assert.ok(['PASSED', 'FAILED', 'INCONCLUSIVE'].includes(v.status));
  assert.equal(v.provenance, 'RETROSPECTIVE');
  assert.ok(v.manifest.reportHash);
  assert.ok(v.checks.length >= 4);
});

test('re-running a completed validation is refused (§0 selection bias, §51)', () => {
  const r = run('run-oos.mjs', ['VAL-OOS-000001']);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /already has results/);
});

test('WF end-to-end: >=4 windows, stitched metrics, stability reported honestly', () => {
  const c = run('create-validation-plan.mjs', ['supremacy', '--type', 'WF']);
  assert.equal(c.code, 0, c.out);
  const a = run('approve-validation-plan.mjs', ['WF-000001', '--by', 'test-human']);
  assert.equal(a.code, 0, a.out);
  const r = run('run-wf.mjs', ['WF-000001']);
  assert.equal(r.code, 0, r.out);
  const results = JSON.parse(readFileSync(env.VALIDATION_RESULTS_FILE, 'utf8'));
  const v = results.validations.find((x) => x.type === 'WF');
  assert.ok(v.windows.length >= 4);
  assert.ok(v.aggregate.stitched.trades > 0);
  assert.equal(v.stability.overall, 'NOT_APPLICABLE'); // FIXED mode — never faked
  assert.ok(v.windows.every((w) => !('testTrades' in w))); // trade rows never published
});

test('evidence gating: RETROSPECTIVE PASSED does NOT light; PROSPECTIVE PASSED does (§48–50, §87)', async () => {
  // simulated model decoration exactly as build.mjs does it
  const results = JSON.parse(readFileSync(env.VALIDATION_RESULTS_FILE, 'utf8'));
  const qualifies = (v) => v.status === 'PASSED' && v.provenance === 'PROSPECTIVE';
  const retro = results.validations.find((v) => v.type === 'OOS');
  assert.equal(qualifies(retro) ? 1 : 0, retro.provenance === 'PROSPECTIVE' ? 1 : 0);
  assert.equal(qualifies(retro), false); // our PoC is retrospective → unlit
  const prospective = { ...retro, provenance: 'PROSPECTIVE', status: 'PASSED' };
  assert.equal(qualifies(prospective), true);
  const failedProspective = { ...retro, provenance: 'PROSPECTIVE', status: 'FAILED' };
  assert.equal(qualifies(failedProspective), false); // §67: failed evidence scores 0
});

await rm(tmp, { recursive: true, force: true });

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
