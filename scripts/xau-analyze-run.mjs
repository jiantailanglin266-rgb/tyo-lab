/**
 * ============================================================================
 * XAU_PYRAMID run analyzer (Phase 15.1 §6–10, §19–20)
 * ============================================================================
 *   node scripts/xau-analyze-run.mjs <report.htm> --run BASELINE-0001
 *        [--from 2016-02-01 --to 2023-12-31] [--server-gmt 3]
 *
 * Parses the MT5 tester report's FULL deal list (entries AND exits, with
 * comments), reconstructs baskets per direction, and reports:
 *   §6 headline metrics · annualized trades · §7 pyramid-level counts and
 *   FIFO profit attribution (approximate where closes interleave — stated)
 *   · §8 session PF (server hours shifted to GMT) · §9 hour table ·
 *   §10 long/short · §19 losing-side-add violation check (must be zero).
 *
 * Output: reports/xau-pyramid/<runId>.json + .md. Console prints the
 * decision-relevant summary. Never touches validation or evidence stores.
 * ============================================================================
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decode } from '../tools/extract-trades.mjs';
import { computeMetrics } from '../src/lib/forward-metrics.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
/* one report, or several segment reports (merged in time order — each
 * segment restarts at the tester deposit, so balance is rebuilt from the
 * cumulative profit stream) */
const reportPaths = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const reportPath = reportPaths[0];
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const runId = flag('run', 'RUN-UNNAMED');
const gmtShift = Number(flag('server-gmt', 3)); // IC Markets ≈ GMT+3 (EET DST)

if (!reportPath) { console.error('usage: node scripts/xau-analyze-run.mjs <report.htm> --run ID'); process.exit(1); }

const htmls = [];
for (const rp of reportPaths) htmls.push(decode(await readFile(rp)));
const html = htmls.join('\n');

/* ---- full deal parse (13-col MT5 dialect, comments kept) --------------- */
const ROW = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
const CELL = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
const cells = (r) => { CELL.lastIndex = 0; const o = []; let m; while ((m = CELL.exec(r))) o.push(m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ').trim()); return o; };
const num = (v) => { const t = String(v ?? '').replace(/[\s ,]/g, ''); return /^-?\d*\.?\d+$/.test(t) ? Number(t) : null; };
const ptime = (v) => { const m = String(v).match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)) : null; };

const deals = [];
let m;
while ((m = ROW.exec(html))) {
  const c = cells(m[1]);
  if (c.length !== 13 || !/^\d{4}\.\d{2}\.\d{2}/.test(c[0])) continue;
  const dirCol = c[4];
  if (dirCol !== 'in' && dirCol !== 'out') continue;
  deals.push({
    t: ptime(c[0]),
    type: c[3], // buy/sell
    io: dirCol,
    lots: num(c[5]),
    price: num(c[6]),
    profit: num(c[10]),
    balance: num(c[11]),
    comment: c[12] || '',
  });
}
if (!deals.length) { console.error('✗ no deals parsed — is this an MT5 tester report?'); process.exit(1); }
deals.sort((a, b) => a.t - b.t);
if (reportPaths.length > 1) {
  // continuous equity across segments: rebuild balance from the profit stream
  let bal = 10000;
  for (const d of deals) if (d.io === 'out') { bal += d.profit || 0; d.balance = bal; }
}

/* ---- basket reconstruction + FIFO level attribution (§7, §19) ----------- */
const stacks = { long: [], short: [] };
const closed = []; // {t, profit, direction, level, entryPrice}
let violations = 0; // §19: adds against the basket direction at worse prices
const levelStats = {}; // level -> {entries, profit}

for (const d of deals) {
  const dir = d.io === 'in' ? (d.type === 'buy' ? 'long' : 'short') : d.type === 'buy' ? 'short' : 'long';
  if (d.io === 'in') {
    const lvMatch = d.comment.match(/XP L(\d+)/);
    const level = lvMatch ? Number(lvMatch[1]) : stacks[dir].length + 1;
    const stack = stacks[dir];
    if (stack.length) {
      const last = stack[stack.length - 1];
      // §19 check: every add must be at a BETTER price in the profit direction
      if ((dir === 'long' && d.price <= last.price) || (dir === 'short' && d.price >= last.price)) violations++;
    }
    stack.push({ price: d.price, level, t: d.t });
    levelStats[level] = levelStats[level] || { entries: 0, profit: 0 };
    levelStats[level].entries++;
  } else {
    const entry = stacks[dir].shift() || { level: 1, price: null }; // FIFO
    closed.push({ closeTime: d.t, netProfit: d.profit, profit: d.profit, swap: 0, commission: 0, fees: 0, direction: dir, balance: d.balance, level: entry.level });
    levelStats[entry.level] = levelStats[entry.level] || { entries: 0, profit: 0 };
    levelStats[entry.level].profit += d.profit;
  }
}

/* ---- headline metrics (§6) --------------------------------------------- */
const startBalance = closed.length ? closed[0].balance - closed[0].netProfit : null;
const metrics = computeMetrics(closed, { startBalance });
const from = flag('from') ? Date.parse(flag('from')) : Math.min(...closed.map((x) => x.closeTime));
const to = flag('to') ? Date.parse(flag('to')) : Math.max(...closed.map((x) => x.closeTime));
const years = Math.max(1 / 12, (to - from) / 86400000 / 365.25);
const annualTrades = Math.round(closed.length / years);

/* ---- sessions & hours (§8–9): GMT hours from server time ---------------- */
const gmtHour = (t) => ((new Date(t).getUTCHours() - gmtShift) % 24 + 24) % 24;
const SESS = { ASIA: [0, 7], LONDON: [7, 12], OVERLAP: [12, 16], NEW_YORK: [16, 21], OFF: [21, 24] };
const bucket = (list) => {
  if (!list.length) return null;
  const mm = computeMetrics(list);
  return { trades: mm.trades, profitFactor: mm.profitFactor, netProfit: mm.netProfit, expectedPayoff: mm.expectedPayoff };
};
const sessions = {};
for (const [name, [a, b]] of Object.entries(SESS)) sessions[name] = bucket(closed.filter((x) => { const h = gmtHour(x.closeTime); return h >= a && h < b; }));
const hours = {};
for (let h = 0; h < 24; h++) { const list = closed.filter((x) => gmtHour(x.closeTime) === h); if (list.length) hours[h] = bucket(list); }

/* ---- pyramid summary (§7) ------------------------------------------------ */
const levels = Object.keys(levelStats).map(Number).sort((a, b) => a - b);
const totalEntries = levels.reduce((s, l) => s + levelStats[l].entries, 0);
const avgLevel = levels.reduce((s, l) => s + l * levelStats[l].entries, 0) / Math.max(1, totalEntries);

const result = {
  runId,
  report: reportPaths.map((r) => r.replace(/\\/g, '/').split('/').pop()).join(' + '),
  segments: reportPaths.length,
  period: { from: new Date(from).toISOString().slice(0, 10), to: new Date(to).toISOString().slice(0, 10) },
  serverGmtShift: gmtShift,
  metrics,
  annualTrades,
  pyramid: {
    avgLevel: Math.round(avgLevel * 100) / 100,
    maxLevel: levels.length ? levels[levels.length - 1] : 0,
    byLevel: Object.fromEntries(levels.map((l) => [l, { entries: levelStats[l].entries, profit: Math.round(levelStats[l].profit * 100) / 100 }])),
    losingSideAddViolations: violations, // MUST be 0 (§19)
    attributionNote: 'FIFO in→out matching per direction; exact for full-basket closes, approximate when SL closes interleave.',
  },
  sessions,
  hours,
  longShort: { longPF: metrics.longPF, shortPF: metrics.shortPF, longTrades: metrics.longTrades, shortTrades: metrics.shortTrades },
};

const dir = join(ROOT, 'reports', 'xau-pyramid');
await mkdir(dir, { recursive: true });
await writeFile(join(dir, `${runId}.json`), JSON.stringify(result, null, 1), 'utf8');

console.log(`\n  ${runId} — ${result.period.from} → ${result.period.to}`);
console.log(`  trades ${metrics.trades} (${annualTrades}/yr)  PF ${metrics.profitFactor}  net ${metrics.netProfit}  relDD ${metrics.relativeDrawdownPct}%  win ${metrics.winRate}%  payoff ${metrics.payoffRatio}`);
console.log(`  long PF ${metrics.longPF} (${metrics.longTrades})  short PF ${metrics.shortPF} (${metrics.shortTrades})`);
console.log(`  pyramid: avg L${result.pyramid.avgLevel} max L${result.pyramid.maxLevel}  violations ${violations}${violations ? '  ← §19 FAILURE' : ' ✓'}`);
for (const l of levels) console.log(`    L${l}: ${levelStats[l].entries} entries, profit ${Math.round(levelStats[l].profit)}`);
for (const [name, s] of Object.entries(sessions)) if (s) console.log(`  ${name.padEnd(8)} ${String(s.trades).padStart(5)} trades  PF ${s.profitFactor ?? '—'}  net ${s.netProfit}`);
console.log(`  → reports/xau-pyramid/${runId}.json\n`);
