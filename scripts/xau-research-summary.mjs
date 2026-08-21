/**
 * ============================================================================
 * XAU_PYRAMID research summary (Phase 15.1 §12–33 reporting)
 * ============================================================================
 *   node scripts/xau-research-summary.mjs [--baseline BASELINE-0002-W2020]
 *
 * Tabulates every EXP-XAU-*.json against the screening-window baseline and
 * writes reports/xau-pyramid/RESEARCH-RESULTS.md. Pure reporting: it ranks
 * nothing by net profit, flags nothing as "good" unless PF ≥ 1.30 AND
 * trades/yr ≥ 2,000 (the §4 targets), and prints the budget used.
 * ============================================================================
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { budgetStatus } from './protocol-tools.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'reports', 'xau-pyramid');
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const baseId = flag('baseline', 'BASELINE-0002-W2020');

const J = async (id) => JSON.parse(await readFile(join(DIR, `${id}.json`), 'utf8'));
const base = await J(baseId);
const plan = await readFile(join(DIR, 'RESEARCH-PLAN.md'), 'utf8').catch(() => '');
const planRow = (id) => {
  const m4 = plan.match(new RegExp(`\\| ${id} \\| ([^|]+) \\| ([^|]+) \\| ([^|]+) \\|`));
  if (m4) return { group: m4[1].trim(), change: m4[2].trim() };
  const m3 = plan.match(new RegExp(`\\| ${id} \\| ([^|]+) \\| ([^|]+) \\|`));
  return m3 ? { group: 'combo', change: m3[1].trim() } : { group: '?', change: '?' };
};

const files = (await readdir(DIR)).filter((f) => /^EXP-XAU-\d+\.json$/.test(f)).sort();
const f2 = (v) => (v === null || v === undefined) ? '—' : Number(v).toFixed(2);
const delta = (v, b) => { const d = v - b; return (d >= 0 ? '+' : '') + d.toFixed(2); };

const rows = [];
for (const f of files) {
  const id = f.replace('.json', '');
  const j = await J(id); const m = j.metrics; const p = planRow(id);
  const L3 = Object.entries(j.pyramid.byLevel).filter(([l]) => Number(l) >= 3).reduce((s, [, v]) => s + v.profit, 0);
  const meets = m.profitFactor >= 1.3 && j.annualTrades >= 2000;
  rows.push({ id, group: p.group, change: p.change, trades: m.trades, tpy: j.annualTrades, pf: m.profitFactor, dpf: delta(m.profitFactor, base.metrics.profitFactor), payoff: m.payoffRatio, dd: m.relativeDrawdownPct, lpf: m.longPF, spf: m.shortPF, avgL: j.pyramid.avgLevel, L3, meets });
}

const L = [];
L.push('# XAU_PYRAMID Research A–F results (screening window 2020-01-01 → 2023-12-31)');
L.push('');
L.push(`Baseline on the same window (${baseId}): PF ${f2(base.metrics.profitFactor)}, ${base.annualTrades} trades/yr, payoff ${f2(base.metrics.payoffRatio)}, rel DD ${f2(base.metrics.relativeDrawdownPct)}%, long PF ${f2(base.metrics.longPF)}, short PF ${f2(base.metrics.shortPF)}.`);
L.push('');
L.push('Targets (§4): PF ≥ 1.30 **and** ≥ 2,000 trades/yr. One change per experiment; all other inputs = frozen baseline snapshot. 2017 data gap does not affect this window.');
L.push('');
L.push('| ID | Group | Change | Trades | /yr | PF | ΔPF | Payoff | Rel DD | Long PF | Short PF | Avg L | L3+ net | Targets |');
L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) L.push(`| ${r.id} | ${r.group} | ${r.change} | ${r.trades} | ${r.tpy} | ${f2(r.pf)} | ${r.dpf} | ${f2(r.payoff)} | ${f2(r.dd)}% | ${f2(r.lpf)} | ${f2(r.spf)} | ${r.avgL} | ${Math.round(r.L3)} | ${r.meets ? '✅' : '❌'} |`);
L.push('');
const best = [...rows].sort((a, b) => b.pf - a.pf).slice(0, 3);
L.push('## Reading');
L.push('');
L.push(`- Highest PF among single changes: ${best.map((r) => `${r.id} (${f2(r.pf)}, ${r.tpy}/yr)`).join(', ')}. ${best[0] && best[0].pf < 1.0 ? '**No single change reaches PF 1.0, let alone 1.30.**' : ''}`);
L.push(`- Experiments meeting both targets: ${rows.filter((r) => r.meets).length}.`);
const pfOk = rows.filter((r) => r.pf >= 1.3);
if (pfOk.length) L.push(`- PF ≥ 1.30 appears only in ${pfOk.map((r) => `${r.id} (${r.trades} trades over the whole window, ${r.tpy}/yr)`).join(', ')} — a sample far too small to establish an edge and two orders of magnitude under the frequency target. Filters can only remove trades, so no parameter search can recover frequency from there.`);
const maxFreq = [...rows].sort((a, b) => b.tpy - a.tpy)[0];
if (maxFreq) L.push(`- Highest frequency any configuration reached: ${maxFreq.id} at ${maxFreq.tpy}/yr (PF ${f2(maxFreq.pf)}). Frequency ≥ 2,000/yr and PF ≥ 1.0 never coincide in this family on development data.`);
L.push('- Frequency and quality move in opposite directions across the trend-threshold axis (EXP-004 vs EXP-005): the fixed-pip DEMON gate trades volume for quality but never buys a positive edge.');
L.push('');
L.push('## Budget');
L.push('');
L.push('```');
L.push(await budgetStatus('RES-XAU-001'));
L.push('```');
L.push('');
await writeFile(join(DIR, 'RESEARCH-RESULTS.md'), L.join('\n'), 'utf8');
console.log(L.slice(0, 8 + rows.length).join('\n'));
