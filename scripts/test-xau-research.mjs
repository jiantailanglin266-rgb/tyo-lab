/**
 * Phase 15.1 §81 — research tooling tests (no MT5 needed).
 *   node scripts/test-xau-research.mjs
 */
import { spawnSync } from 'node:child_process';
import { readFile, rm, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'reports', 'xau-pyramid');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };
const run = (args) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });

console.log('\nxau research tooling');

/* 1. runner refuses any period touching HOLD-XAU-001 before launching (dry run) */
let r = run(['scripts/xau-research-run.mjs', '--run', 'TEST-GUARD', '--from', '2025-12-01', '--to', '2026-02-01', '--dry-run']);
ok(r.status === 1 && /FINAL HOLDOUT/.test(r.stderr + r.stdout), 'runner refuses a holdout-intersecting period (2025-12→2026-02)');
r = run(['scripts/xau-research-run.mjs', '--run', 'TEST-GUARD', '--from', '2026-03-01', '--to', '2026-03-31', '--dry-run']);
ok(r.status === 1, 'runner refuses a period inside the holdout even after its end date is not yet reached');
r = run(['scripts/xau-research-run.mjs', '--run', 'TEST-GUARD', '--from', '2021-01-01', '--to', '2021-12-31', '--dry-run']);
ok(r.status === 0 && /Model=1/.test(r.stdout) && /InpGMTShift=3/.test(r.stdout), 'dry run for a development-layer period prints the ini without launching');

/* 2. analyzer merge = sum of segments with a continuous balance */
const a = 'BASELINE-0002-Y2021', b = 'BASELINE-0002-Y2022';
let have = true;
for (const id of [a, b]) { try { await access(join(DIR, `${id}.htm`), constants.F_OK); } catch { have = false; } }
if (have) {
  r = run(['scripts/xau-analyze-run.mjs', join(DIR, `${a}.htm`), join(DIR, `${b}.htm`), '--run', 'TEST-MERGE', '--from', '2021-01-01', '--to', '2022-12-31']);
  const ja = JSON.parse(await readFile(join(DIR, `${a}.json`), 'utf8'));
  const jb = JSON.parse(await readFile(join(DIR, `${b}.json`), 'utf8'));
  const jm = JSON.parse(await readFile(join(DIR, 'TEST-MERGE.json'), 'utf8'));
  ok(jm.metrics.trades === ja.metrics.trades + jb.metrics.trades, `merged trades = ${ja.metrics.trades} + ${jb.metrics.trades}`);
  ok(jm.segments === 2, 'merged report records segment count');
  ok(Math.abs(jm.metrics.netProfit - (ja.metrics.netProfit + jb.metrics.netProfit)) < 0.05, 'merged net profit = sum of segment net profits');
  ok(jm.pyramid.losingSideAddViolations === 0, '§19 losing-side add violations stay 0 across the merge');
  await rm(join(DIR, 'TEST-MERGE.json'), { force: true });
} else {
  console.log('  (merge test skipped — segment reports not present)');
}

/* 3. summary writer runs and reports targets honestly */
r = run(['scripts/xau-research-summary.mjs']);
ok(r.status === 0 && /Experiments meeting both targets: \d+/.test(r.stdout + (await readFile(join(DIR, 'RESEARCH-RESULTS.md'), 'utf8'))), 'research summary lists how many experiments meet BOTH targets');

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
