/**
 * ============================================================================
 * XAU_PYRAMID research runner (Phase 15.1 §70–75, §84)
 * ============================================================================
 *   node scripts/xau-research-run.mjs --run EXP-XAU-001 \
 *        [--from 2016-02-01 --to 2023-12-31] [--model 1] \
 *        [--input InpUseBreakout=false --input InpPyramidATR=0.5 ...] \
 *        [--type experiment|optimization|variant|baseline] [--note "..."]
 *
 * One controlled run against the ISOLATED research terminal
 * (C:\TYO-Research\MT5, portable; holdout years physically absent):
 *   1. §74–75: the requested period passes the holdout guard or the run is
 *      refused before anything launches;
 *   2. ini generated with [TesterInputs] overrides (base parameters remain
 *      the frozen baseline snapshot — overrides ARE the one change, §12);
 *   3. terminal launched headless, report awaited, then parsed by
 *      xau-analyze-run.mjs into reports/xau-pyramid/<run>.json;
 *   4. §30: the research budget is incremented (refused if exhausted —
 *      checked BEFORE the run so compute is never spent past the budget).
 * ============================================================================
 */

import { readFile, writeFile, access, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkResearchPeriod, HOLDOUT_ERROR } from '../src/lib/holdout-guard.mjs';
import { loadStore } from './lib-protocol-io.mjs';
import { logResearchRun } from './protocol-tools.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const R = process.env.XAU_RESEARCH_TERMINAL || 'C:/TYO-Research/MT5';

const argv = process.argv.slice(2);
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const inputs = [];
for (let i = 0; i < argv.length; i++) if (argv[i] === '--input') inputs.push(argv[i + 1]);

const runId = flag('run');
const from = flag('from', '2016-02-01');
const to = flag('to', '2023-12-31');
const model = flag('model', '1');
const symbol = flag('symbol', 'GOLD'); // §73: broker symbol, not a fixed name (XM basis = GOLD)
const type = flag('type', 'experiment');
const note = flag('note', '');
const dryRun = argv.includes('--dry-run');

if (!runId) { console.error('usage: node scripts/xau-research-run.mjs --run ID [--input K=V ...]'); process.exit(1); }

/* ---- §74–75: holdout guard BEFORE anything runs ------------------------ */
const store = await loadStore();
const guard = checkResearchPeriod(store.holdouts, 'XAU_PYRAMID', { from, to });
if (!guard.ok) { console.error(`✗ ${HOLDOUT_ERROR} (${guard.holdoutId})`); process.exit(1); }
const h = store.holdouts.find((x) => x.holdoutId === 'HOLD-XAU-001');
if (!h || h.status !== 'SEALED') { console.error(`✗ HOLD-XAU-001 is ${h ? h.status : 'missing'} — research requires SEALED (§3)`); process.exit(1); }

/* ---- §30: budget increment first (refuses when exhausted) --------------- */
if (!dryRun && type !== 'baseline') {
  try {
    console.log('  ' + (await logResearchRun('RES-XAU-001', type === 'optimization' ? 'optimization' : type === 'variant' ? 'variant' : 'experiment', `${runId}: ${note}`)));
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}

/* ---- ini ------------------------------------------------------------------ */
const ini = [
  '[Tester]',
  'Expert=TYO\\TYO_XAU_Pyramid',
  `Symbol=${symbol}`,
  'Period=M5',
  `Model=${model}`,
  'Optimization=0',
  `FromDate=${from.replace(/-/g, '.')}`,
  `ToDate=${to.replace(/-/g, '.')}`,
  'Deposit=10000',
  'Currency=USD',
  'Leverage=1:500',
  `Report=${runId}`,
  'ShutdownTerminal=1',
  '[TesterInputs]',
  'InpGMTShift=3', // IC Markets server ≈ GMT+3: session windows stay in GMT
  ...inputs,
].join('\r\n');

const iniPath = join(R, `${runId}.ini`);
if (dryRun) { console.log(`[dry run] would run ${runId} ${from}→${to} model ${model}\n${ini}`); process.exit(0); }
await writeFile(iniPath, ini, 'ascii');

/* ---- launch + wait -------------------------------------------------------- */
const reportPath = join(R, `${runId}.htm`);
let adopt = false; // a report the terminal finished but a killed runner never archived
try { await access(reportPath, constants.F_OK); adopt = true; } catch {}
if (adopt) {
  const archived = join(ROOT, 'reports', 'xau-pyramid', `${runId}.htm`);
  let isArchived = false;
  try { await access(archived, constants.F_OK); isArchived = true; } catch {}
  if (isArchived) { console.error(`✗ ${runId} already archived — runs are append-only, pick a new id`); process.exit(1); }
  console.log(`  ${runId}: report already present in the research terminal — validating and adopting (no relaunch)`);
}

/* Local tester agents race third-party listeners on 127.0.0.1:3000 (e.g.
 * Docker port-forwards): the dispatcher can connect to the foreign socket
 * before its own agent binds and abort with "tester agent authorization
 * error", leaving an empty report (bars 0, period 1970). That is an
 * infrastructure flake, not a test result — detect and relaunch. */
const MAXMS = Number(flag('timeout-min', 45)) * 60000;
const ATTEMPTS = Number(flag('attempts', 4));
const { unlink } = await import('node:fs/promises');

/* hold 127.0.0.1:3000 so the dispatcher skips the port Docker shadows
 * (idempotent — exits instantly if already held) */
const portGuard = spawn(process.execPath, [join(ROOT, 'scripts', 'xau-port-guard.mjs')], { detached: true, stdio: 'ignore' });
portGuard.unref();
await new Promise((r) => setTimeout(r, 1500));

/* the tester's daily log files cap at ~8MB and a saturated log stalls the
 * agent — clear the research terminal's logs before every launch */
async function clearTesterLogs() {
  const { readdir, rm } = await import('node:fs/promises');
  const dirs = [join(R, 'Tester', 'logs'), join(R, 'logs')];
  try {
    for (const e of await readdir(join(R, 'Tester'), { withFileTypes: true }))
      if (e.isDirectory() && e.name.startsWith('Agent-')) dirs.push(join(R, 'Tester', e.name, 'logs'));
  } catch {}
  for (const d of dirs) {
    try { for (const f of await readdir(d)) if (f.endsWith('.log')) await rm(join(d, f), { force: true }); } catch {}
  }
}

/* §71: the research terminal must not pop a foreground window on the owner's
 * desktop (a stray MT5 window invites a manual close that kills the run).
 * Minimize it as soon as its main window exists; retried for ~20 s. */
function minimizeWindow(pid) {
  const ps = `Add-Type -Name W -Namespace U -MemberDefinition '[DllImport(\"user32.dll\")] public static extern bool ShowWindowAsync(IntPtr h,int c);'; ` +
    `for($i=0;$i -lt 20;$i++){ $p=Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if($p -and $p.MainWindowHandle -ne 0){ [U.W]::ShowWindowAsync($p.MainWindowHandle,6) | Out-Null; break }; Start-Sleep -Seconds 1 }`;
  const w = spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', ps], { detached: true, stdio: 'ignore' });
  w.unref();
}

/* a forced close can still flush a PARTIAL report (full period in the
 * header, a fraction of the bars); a port race leaves an EMPTY one —
 * accept only a plausible report, otherwise discard it for a relaunch */
async function validateReport() {
  const raw = await readFile(reportPath, 'utf16le').catch(() => '');
  const barsM = raw.replace(/<[^>]+>/g, ' ').match(/(?:バー|Bars):\s*([\d\s ,]+)/);
  const bars = barsM ? Number(barsM[1].replace(/[\s ,]/g, '')) : NaN;
  const days = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
  const expectMin = days * (5 / 7) * 288 * 0.5; // ≥50% of the M5 bars a trading-day calendar implies
  if (raw.includes('1970.01.01') || !raw.includes('</html>')) {
    console.error(`  ⚠ empty report (agent race on local port) — discarding and retrying`);
    await unlink(reportPath).catch(() => {});
    await new Promise((r) => setTimeout(r, 10000));
    return false;
  }
  if (Number.isFinite(bars) && bars < expectMin) {
    console.error(`  ⚠ partial report (${bars} bars, expected ≥ ${Math.round(expectMin)} for ${Math.round(days)} days) — terminal was cut short; discarding and retrying`);
    await unlink(reportPath).catch(() => {});
    await new Promise((r) => setTimeout(r, 15000));
    return false;
  }
  return true;
}

let ok = false;
for (let attempt = 1; attempt <= ATTEMPTS && !ok; attempt++) {
  if (adopt && attempt === 1) { ok = await validateReport(); if (ok) break; adopt = false; }
  await clearTesterLogs();
  /* a research agent can outlive its terminal by ~90 s and then hold the
   * port the next launch wants — reap OUR OWN zombies only (path-scoped) */
  spawnSync('powershell.exe', ['-NoProfile', '-Command',
    `Get-Process metatester64,terminal64 -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '${R.replace(/\//g, '\\\\')}*' } | Stop-Process -Force -ErrorAction SilentlyContinue`], { stdio: 'ignore' });
  console.log(`  launching research terminal for ${runId} (${from} → ${to}, model ${model})${attempt > 1 ? ` — attempt ${attempt}/${ATTEMPTS}` : ''}…`);
  const child = spawn(join(R, 'terminal64.exe'), ['/portable', `/config:${iniPath}`], { detached: true, stdio: 'ignore' });
  child.unref();
  minimizeWindow(child.pid); // §71: stay out of the owner's way — no foreground window

  /* The terminal can vanish mid-test without a report: the owner's EA
   * automation (STELLAR\EA\scripts\pyr_*.py, shadow_runner.py) kills
   * terminal64.exe BY NAME (MT5 refuses to run renamed, exit 10001), and
   * the tester itself exits silently when tick generation exhausts memory
   * on a corrupt history stretch (seen on GOLD 2017). Detect the exit
   * immediately and relaunch instead of waiting out the timeout — runs are
   * kept short (segments) for this. */
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
  const started = Date.now();
  let killed = false;
  for (;;) {
    try { await access(reportPath, constants.F_OK); break; } catch {}
    if (!alive(child.pid)) { killed = true; break; }
    if (Date.now() - started > MAXMS) {
      console.error(`✗ RUN_ERROR: no report after ${MAXMS / 60000} min — terminal may be stuck; not counted as evidence (§97 of Phase 14)`);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (killed) {
    await new Promise((r) => setTimeout(r, 3000));
    let gotReport = true;
    try { await access(reportPath, constants.F_OK); } catch { gotReport = false; }
    if (!gotReport) {
      console.error(`  ⚠ research terminal was terminated externally after ${Math.round((Date.now() - started) / 1000)}s (external kill or silent tester abort) — relaunching`);
      await new Promise((r) => setTimeout(r, 15000));
      continue;
    }
  }
  /* give the terminal a beat to finish writing + shut down */
  await new Promise((r) => setTimeout(r, 8000));

  ok = await validateReport();
}
if (!ok) {
  console.error(`✗ RUN_ERROR: ${ATTEMPTS} attempts without a usable report — external kills, agent port conflict, or a tester abort on bad history`);
  process.exit(1);
}

/* ---- archive + analyze ---------------------------------------------------- */
const dest = join(ROOT, 'reports', 'xau-pyramid', `${runId}.htm`);
const { mkdir } = await import('node:fs/promises');
await mkdir(dirname(dest), { recursive: true });
await copyFile(reportPath, dest);

const a = spawnSync(process.execPath, [join(ROOT, 'scripts', 'xau-analyze-run.mjs'), dest, '--run', runId, '--from', from, '--to', to, '--server-gmt', '3'], { encoding: 'utf8' });
process.stdout.write(a.stdout || '');
process.stderr.write(a.stderr || '');
process.exit(a.status || 0);
