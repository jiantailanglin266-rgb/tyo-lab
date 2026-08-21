/**
 * ============================================================================
 * XAU_PYRAMID segmented run driver (Phase 15.1 §70–71 infrastructure)
 * ============================================================================
 *   node scripts/xau-segmented-run.mjs --run BASELINE-0002 [--type baseline]
 *        [--from 2016-02-01 --to 2023-12-31] [--input K=V ...] [--note "..."]
 *
 * The owner's EA automation kills terminal64.exe by name at unpredictable
 * times, so one long tester run rarely survives. This driver splits the
 * period into calendar-year segments (each ~2–3 min), runs them one at a
 * time through xau-research-run.mjs (which relaunches a killed segment),
 * then merges the segment reports into ONE analysis (<run>.json) with a
 * continuous equity curve.
 *
 * Budget: only the merged run is logged (one experiment = one research
 * question). Segments are passed as --type baseline to the runner so they
 * are never double-counted; the parent logs the single budget entry.
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';

import { logResearchRun } from './protocol-tools.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const inputs = [];
for (let i = 0; i < argv.length; i++) if (argv[i] === '--input') inputs.push('--input', argv[i + 1]);

const runId = flag('run');
const from = flag('from', '2016-02-01');
const to = flag('to', '2023-12-31');
const type = flag('type', 'experiment');
const note = flag('note', '');
const model = flag('model', '1');
if (!runId) { console.error('usage: node scripts/xau-segmented-run.mjs --run ID [...]'); process.exit(1); }

/* ---- §30: one budget entry for the whole run (before any compute) ------- */
const ledgerDir = join(ROOT, 'reports', 'xau-pyramid', '_ledger');
const ledgerMark = join(ledgerDir, `${runId}.logged`);
let alreadyLogged = false;
try { await access(ledgerMark, constants.F_OK); alreadyLogged = true; } catch {}
if (type !== 'baseline' && !alreadyLogged) {
  try {
    console.log('  ' + (await logResearchRun('RES-XAU-001', type === 'optimization' ? 'optimization' : type === 'variant' ? 'variant' : 'experiment', `${runId}: ${note}`)));
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(ledgerDir, { recursive: true });
    await writeFile(ledgerMark, `${new Date().toISOString()} ${type} ${note}
`, 'utf8'); // resume never double-counts
  } catch (e) { console.error(`✗ ${e.message}`); process.exit(1); }
} else if (alreadyLogged) console.log(`  ${runId}: budget entry already recorded — resuming without re-counting`);

/* ---- calendar-year segments ---------------------------------------------- */
const y0 = Number(from.slice(0, 4)), y1 = Number(to.slice(0, 4));
const segments = [];
for (let y = y0; y <= y1; y++) {
  segments.push({ id: `${runId}-Y${y}`, from: y === y0 ? from : `${y}-01-01`, to: y === y1 ? to : `${y}-12-31` });
}

const reports = [];
for (const s of segments) {
  const dest = join(ROOT, 'reports', 'xau-pyramid', `${s.id}.htm`);
  let have = false;
  try { await access(dest, constants.F_OK); have = true; } catch {}
  if (have) { console.log(`  ${s.id}: report already archived — reusing`); reports.push(dest); continue; }

  console.log(`\n▶ ${s.id}  ${s.from} → ${s.to}`);
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'xau-research-run.mjs'),
    '--run', s.id, '--type', 'baseline', '--from', s.from, '--to', s.to, '--model', model,
    '--timeout-min', '20', '--note', `${runId} segment`, ...inputs], { stdio: 'inherit' });
  if (r.status !== 0) { console.error(`✗ segment ${s.id} failed — aborting (rerun resumes from archived segments)`); process.exit(1); }
  reports.push(dest);
}

/* ---- merge --------------------------------------------------------------- */
console.log(`\n▶ merging ${reports.length} segments → ${runId}`);
const a = spawnSync(process.execPath, [join(ROOT, 'scripts', 'xau-analyze-run.mjs'), ...reports,
  '--run', runId, '--from', from, '--to', to, '--server-gmt', '3'], { stdio: 'inherit' });
process.exit(a.status || 0);
