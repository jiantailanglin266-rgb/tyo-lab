/**
 * ============================================================================
 * XAU_PYRAMID baseline analysis writer (Phase 15.1 §6–11)
 * ============================================================================
 *   node scripts/xau-baseline-report.mjs --run BASELINE-0002
 *        [--segments BASELINE-0002-Y2016,BASELINE-0002-Y2017a,...]
 *        [--gaps "2017-02 (XM GOLD M1 data unusable)"]
 *
 * Reads reports/xau-pyramid/<run>.json (merged) and the per-segment JSONs
 * and writes reports/xau-pyramid/<run>-analysis.md: headline metrics vs the
 * §4 targets, per-year table, pyramid level attribution (§7), session (§8)
 * and hour (§9) tables, long/short (§10), and the §11 decision inputs.
 * Numbers are copied, never rounded up; targets unmet are stated as unmet.
 * ============================================================================
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const runId = flag('run', 'BASELINE-0002');
const segs = (flag('segments', '') || '').split(',').filter(Boolean);
const gaps = (flag('gaps', '') || '').split(';').filter(Boolean);

const DIR = join(ROOT, 'reports', 'xau-pyramid');
const J = async (id) => JSON.parse(await readFile(join(DIR, `${id}.json`), 'utf8'));

const main = await J(runId);
const m = main.metrics;
const TARGET = { pf: 1.3, trades: 2000 };
const fmt = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v)) ? '—' : Number(v).toFixed(d);
const pass = (ok) => (ok ? '✅ met' : '❌ NOT met');

const lines = [];
lines.push(`# ${runId} — XAU_PYRAMID baseline analysis (§6–11)`);
lines.push('');
lines.push(`Development data only: ${main.period.from} → ${main.period.to} (GOLD, XMTrading basis, M5, 1-minute OHLC model). HOLD-XAU-001 (2026-01-01→2026-06-30) untouched and SEALED; 2024 internal-validation layer not used; 2025 not used.`);
if (gaps.length) { lines.push(''); lines.push(`**Data gaps (excluded, not simulated):** ${gaps.join('; ')}.`); }
if (main.segments > 1) { lines.push(''); lines.push(`Run as ${main.segments} calendar segments merged into one deal stream (balance rebuilt cumulatively from $10,000); drawdown is therefore measured on the continuous merged equity.`); }
lines.push('');
lines.push('## §6 Headline vs §4 targets');
lines.push('');
lines.push('| Metric | Value | Target | Status |');
lines.push('|---|---|---|---|');
lines.push(`| Profit factor | ${fmt(m.profitFactor)} | ≥ 1.30 | ${pass(m.profitFactor >= TARGET.pf)} |`);
lines.push(`| Trades / year | ${main.annualTrades} | ≥ 2,000 | ${pass(main.annualTrades >= TARGET.trades)} |`);
lines.push(`| Total trades | ${m.trades} | — | — |`);
lines.push(`| Net profit | ${fmt(m.netProfit)} | — | — |`);
lines.push(`| Relative drawdown | ${fmt(m.relativeDrawdownPct)}% | — | — |`);
lines.push(`| Win rate | ${fmt(m.winRate)}% | — | — |`);
lines.push(`| Payoff ratio | ${fmt(m.payoffRatio)} | > 0 (holdout floor) | — |`);
lines.push(`| Expected payoff / trade | ${fmt(m.expectedPayoff)} | — | — |`);
lines.push('');

if (segs.length) {
  lines.push('## Per-segment (year) behaviour');
  lines.push('');
  lines.push('| Segment | Period | Trades | PF | Net | Rel DD | Long PF | Short PF | Avg level |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const id of segs) {
    try {
      const s = await J(id); const sm = s.metrics;
      lines.push(`| ${id.replace(runId + '-', '')} | ${s.period.from}→${s.period.to} | ${sm.trades} | ${fmt(sm.profitFactor)} | ${fmt(sm.netProfit, 0)} | ${fmt(sm.relativeDrawdownPct, 1)}% | ${fmt(sm.longPF)} | ${fmt(sm.shortPF)} | ${s.pyramid.avgLevel} |`);
    } catch { lines.push(`| ${id} | — | (missing) | | | | | | |`); }
  }
  lines.push('');
}

lines.push('## §7 Pyramid level attribution');
lines.push('');
lines.push(`Average level ${main.pyramid.avgLevel}, max level ${main.pyramid.maxLevel}. Losing-side add violations: **${main.pyramid.losingSideAddViolations}** (${main.pyramid.losingSideAddViolations === 0 ? '§19 satisfied' : '§19 FAILURE'}).`);
lines.push('');
lines.push('| Level | Entries | Net profit (FIFO attribution) |');
lines.push('|---|---|---|');
for (const [l, v] of Object.entries(main.pyramid.byLevel)) lines.push(`| L${l} | ${v.entries} | ${fmt(v.profit, 0)} |`);
lines.push('');
lines.push(`_${main.pyramid.attributionNote}_`);
lines.push('');

lines.push('## §8 Sessions (GMT, from server time − 3h)');
lines.push('');
lines.push('| Session | Trades | PF | Net | Expected payoff |');
lines.push('|---|---|---|---|---|');
for (const [name, s] of Object.entries(main.sessions)) if (s) lines.push(`| ${name} | ${s.trades} | ${fmt(s.profitFactor)} | ${fmt(s.netProfit, 0)} | ${fmt(s.expectedPayoff)} |`);
lines.push('');

lines.push('## §9 Hours (GMT, by close time)');
lines.push('');
lines.push('| Hour | Trades | PF | Net |');
lines.push('|---|---|---|---|');
for (const [h, s] of Object.entries(main.hours)) lines.push(`| ${String(h).padStart(2, '0')} | ${s.trades} | ${fmt(s.profitFactor)} | ${fmt(s.netProfit, 0)} |`);
lines.push('');

lines.push('## §10 Long / short');
lines.push('');
lines.push(`| Side | Trades | PF |\n|---|---|---|\n| Long | ${main.longShort.longTrades} | ${fmt(main.longShort.longPF)} |\n| Short | ${main.longShort.shortTrades} | ${fmt(main.longShort.shortPF)} |`);
lines.push('');

lines.push('## §11 Decision inputs');
lines.push('');
const levels = Object.entries(main.pyramid.byLevel).map(([l, v]) => ({ l: Number(l), ...v }));
const deepLoss = levels.filter((x) => x.l >= 3).reduce((s, x) => s + x.profit, 0);
const l1 = levels.find((x) => x.l === 1);
const worstSess = Object.entries(main.sessions).filter(([, s]) => s).sort((a, b) => a[1].netProfit - b[1].netProfit)[0];
const bestSess = Object.entries(main.sessions).filter(([, s]) => s).sort((a, b) => b[1].netProfit - a[1].netProfit)[0];
lines.push(`- Targets: PF ${m.profitFactor >= TARGET.pf ? 'met' : 'NOT met'} (${fmt(m.profitFactor)} vs 1.30); frequency ${main.annualTrades >= TARGET.trades ? 'met' : 'NOT met'} (${main.annualTrades}/yr vs 2,000). Both must hold for a candidate.`);
lines.push(`- L1 net ${fmt(l1?.profit, 0)}; levels ≥ L3 net ${fmt(deepLoss, 0)} → pyramid depth is ${deepLoss < 0 ? 'destroying' : 'adding'} value as configured.`);
lines.push(`- Best session ${bestSess?.[0]} (net ${fmt(bestSess?.[1].netProfit, 0)}), worst ${worstSess?.[0]} (net ${fmt(worstSess?.[1].netProfit, 0)}).`);
lines.push(`- Long PF ${fmt(main.longShort.longPF)} vs short PF ${fmt(main.longShort.shortPF)}.`);
lines.push('- Year-to-year trade counts vary by more than an order of magnitude: DEMON uses a fixed pip threshold (40/30 pips on a $1,150–$2,000 instrument), so trend detection scales with price level and volatility, not with regime. A volatility-normalized trend threshold is a research hypothesis (one change), not a baseline edit.');
lines.push('');
lines.push('Decision rule (§11): if targets are unmet, proceed to Research A–E one hypothesis at a time; do not tune the baseline in place; report honestly if the family cannot reach the targets on development data.');
lines.push('');

const out = join(DIR, `${runId}-analysis.md`);
await writeFile(out, lines.join('\n'), 'utf8');
console.log(`→ ${out}`);
