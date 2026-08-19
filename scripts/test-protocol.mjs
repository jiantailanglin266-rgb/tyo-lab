/**
 * ============================================================================
 * EVIDENCE-BY-DESIGN PROTOCOL TESTS (Phase 15 §111–113)
 * ============================================================================
 *   node scripts/test-protocol.mjs
 * Unit tests on the holdout guard, integration through the real CLIs in an
 * isolated store, and the failure battery (AI-approval attempt, frozen-
 * candidate mutation, pre-unlock access, second execution, budget overrun).
 * ============================================================================
 */

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { rangesIntersect, checkResearchPeriod, checkProspectiveRun, HOLDOUT_ERROR } from '../src/lib/holdout-guard.mjs';

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

console.log('\nUNIT — holdout guard\n');

test('range intersection incl. boundaries; unparseable dates fail closed (§17)', () => {
  assert.equal(rangesIntersect('2025-01-01', '2025-12-31', '2026-01-01', '2026-06-30'), false);
  assert.equal(rangesIntersect('2025-12-01', '2026-02-15', '2026-01-01', '2026-06-30'), true);
  assert.equal(rangesIntersect('2026-06-30', '2026-12-31', '2026-01-01', '2026-06-30'), true); // touch = block
  assert.equal(rangesIntersect('garbage', '2026-12-31', '2026-01-01', '2026-06-30'), true); // fail closed
});

test('SEALED, UNLOCK_APPROVED, UNLOCKED and CONSUMED all block research (§16)', () => {
  for (const status of ['SEALED', 'UNLOCK_APPROVED', 'UNLOCKED', 'CONSUMED']) {
    const r = checkResearchPeriod([{ holdoutId: 'H', strategyId: 'X', status, start: '2026-01-01', end: '2026-06-30' }], 'X', { from: '2026-03-01', to: '2026-04-01' });
    assert.equal(r.ok, false, status);
    assert.equal(r.error, HOLDOUT_ERROR);
  }
  const draft = checkResearchPeriod([{ holdoutId: 'H', strategyId: 'X', status: 'DRAFT', start: '2026-01-01', end: '2026-06-30' }], 'X', { from: '2026-03-01', to: '2026-04-01' });
  assert.equal(draft.ok, true); // DRAFT not yet binding — sealing is the act
});

test('prospective run must target the exact holdout period, UNLOCKED only', () => {
  const h = { status: 'UNLOCKED', start: '2026-01-01', end: '2026-06-30' };
  assert.equal(checkProspectiveRun(h, { from: '2026-01-01', to: '2026-06-30' }).ok, true);
  assert.equal(checkProspectiveRun(h, { from: '2026-01-01', to: '2026-05-31' }).ok, false);
  assert.equal(checkProspectiveRun({ ...h, status: 'SEALED' }, { from: '2026-01-01', to: '2026-06-30' }).ok, false);
});

/* =================================================================== *
 * INTEGRATION + FAILURE — real CLIs in an isolated store
 * =================================================================== */

console.log('\nINTEGRATION — manifest → seal → budget → freeze → unlock gates\n');

const tmp = mkdtempSync(join(tmpdir(), 'tyo-proto-test-'));
const env = { ...process.env, PROTOCOL_STORE_FILE: join(tmp, 'protocol.json'), PROTOCOL_AUDIT_DIR: join(tmp, 'audit') };
function run(script, args) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', script), ...args], { env, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

test('manifest + DRAFT holdout created; freeze refused before sealing (§135)', () => {
  const c = run('create-research-manifest.mjs', ['XAU_PYRAMID']);
  assert.equal(c.code, 0, c.out);
  const f = run('freeze-candidate.mjs', ['XAU_PYRAMID', '--version', 'V001', '--source', 'mql5/Experts/TYO/TYO_XAU_Pyramid.mq5', '--params', 'mql5/Experts/TYO/TYO_XAU_Pyramid_baseline-params.json']);
  assert.notEqual(f.code, 0);
  assert.match(f.out, /not SEALED/);
});

test('sealing pins the hash; a sealed period cannot be re-sealed or edited (§20)', () => {
  const s = run('seal-holdout.mjs', ['HOLD-XAU-001']);
  assert.equal(s.code, 0, s.out);
  const again = run('seal-holdout.mjs', ['HOLD-XAU-001']);
  assert.notEqual(again.code, 0);
});

test('research config generation refuses a holdout intersection (§17, §112 security)', () => {
  // tamper the store: point the prospective layer INTO the sealed holdout
  const store = JSON.parse(readFileSync(env.PROTOCOL_STORE_FILE, 'utf8'));
  store.research[0].prospectiveOOSPeriod = { from: '2026-02-01', to: '2026-05-31' };
  writeFileSync(env.PROTOCOL_STORE_FILE, JSON.stringify(store, null, 1));
  const g = run('generate-research-config.mjs', ['RES-XAU-001', '--layer', 'prospectiveOOS', '--dry-run']);
  assert.notEqual(g.code, 0);
  assert.match(g.out, /intersects FINAL HOLDOUT/);
  store.research[0].prospectiveOOSPeriod = { from: '2025-01-01', to: '2025-12-31' }; // restore
  writeFileSync(env.PROTOCOL_STORE_FILE, JSON.stringify(store, null, 1));
  const ok = run('generate-research-config.mjs', ['RES-XAU-001', '--layer', 'development', '--dry-run']);
  assert.equal(ok.code, 0, ok.out);
});

test('research budget enforced: overrun refused (§29, failure battery)', () => {
  for (let i = 0; i < 10; i++) {
    const r = run('log-research-run.mjs', ['RES-XAU-001', '--type', 'optimization', '--note', `t${i}`]);
    assert.equal(r.code, 0, r.out);
  }
  const over = run('log-research-run.mjs', ['RES-XAU-001', '--type', 'optimization', '--note', 'overrun']);
  assert.notEqual(over.code, 0);
  assert.match(over.out, /RESEARCH BUDGET EXCEEDED/);
});

test('candidate freeze pins hashes; unlock approval enforces every §69 gate', () => {
  const f = run('freeze-candidate.mjs', ['XAU_PYRAMID', '--version', 'V001', '--source', 'mql5/Experts/TYO/TYO_XAU_Pyramid.mq5', '--params', 'mql5/Experts/TYO/TYO_XAU_Pyramid_baseline-params.json']);
  assert.equal(f.code, 0, f.out);
  assert.match(f.out, /FROZEN CAN-XAU-001/);
  // gates not yet satisfied: milestones missing
  const a1 = run('approve-holdout-unlock.mjs', ['HOLD-XAU-001', '--by', 'test-human']);
  assert.notEqual(a1.code, 0);
  assert.match(a1.out, /internalValidationComplete|monteCarloComplete/);
  run('mark-milestone.mjs', ['RES-XAU-001', '--milestone', 'internalValidation', '--by', 'test-human']);
  run('mark-milestone.mjs', ['RES-XAU-001', '--milestone', 'monteCarlo', '--by', 'test-human']);
  const a2 = run('approve-holdout-unlock.mjs', ['HOLD-XAU-001', '--by', 'test-human']);
  assert.equal(a2.code, 0, a2.out);
});

test('AI-style approval without --by is refused (§22, §78)', () => {
  const store = JSON.parse(readFileSync(env.PROTOCOL_STORE_FILE, 'utf8'));
  store.holdouts[0].status = 'SEALED'; // reset for this check
  writeFileSync(env.PROTOCOL_STORE_FILE, JSON.stringify(store, null, 1));
  const r = run('approve-holdout-unlock.mjs', ['HOLD-XAU-001']);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /human act/);
  store.holdouts[0].status = 'UNLOCK_APPROVED'; // restore approved state
  writeFileSync(env.PROTOCOL_STORE_FILE, JSON.stringify(store, null, 1));
});

test('unlock requires UNLOCK_APPROVED and registers contamination (§83–84)', () => {
  const u = run('unlock-holdout.mjs', ['HOLD-XAU-001']);
  assert.equal(u.code, 0, u.out);
  const store = JSON.parse(readFileSync(env.PROTOCOL_STORE_FILE, 'utf8'));
  assert.equal(store.holdouts[0].status, 'UNLOCKED');
  assert.ok(store.contamination.some((c) => c.holdoutId === 'HOLD-XAU-001' && c.version === 'V001'));
});

test('duplicate candidate version refused; frozen record is immutable (§64)', () => {
  const f = run('freeze-candidate.mjs', ['XAU_PYRAMID', '--version', 'V001', '--source', 'mql5/Experts/TYO/TYO_XAU_Pyramid.mq5', '--params', 'mql5/Experts/TYO/TYO_XAU_Pyramid_baseline-params.json']);
  assert.notEqual(f.code, 0);
  assert.match(f.out, /already exists/);
});

test('unlock before approval is refused (pre-unlock access, failure battery)', () => {
  const c = run('create-research-manifest.mjs', ['XAU_PYRAMID']);
  assert.notEqual(c.code, 0); // one manifest per strategy line — also covered
  const store = JSON.parse(readFileSync(env.PROTOCOL_STORE_FILE, 'utf8'));
  store.holdouts.push({ holdoutId: 'HOLD-XAU-099', strategyId: 'OTHER', start: '2026-01-01', end: '2026-06-30', status: 'SEALED', manifestHash: 'x' });
  writeFileSync(env.PROTOCOL_STORE_FILE, JSON.stringify(store, null, 1));
  const u = run('unlock-holdout.mjs', ['HOLD-XAU-099']);
  assert.notEqual(u.code, 0);
  assert.match(u.out, /human approval/i);
});

await rm(tmp, { recursive: true, force: true });

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
