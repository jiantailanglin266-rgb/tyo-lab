/**
 * ============================================================================
 * FORWARD PIPELINE TESTS (Phase 12 §84–87)
 * ============================================================================
 *   node scripts/test-forward.mjs
 *
 * Unit tests on the pure metric functions, integration tests that push
 * runtime-generated fixtures through the REAL importer + analyzer (isolated
 * via FORWARD_DATA_DIR / FORWARD_OUT_DIR), and failure tests. Fixtures are
 * synthetic, clearly labelled, generated into a temp dir at run time and
 * never touch the production store or the public site (§87).
 * ============================================================================
 */

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  computeMetrics,
  periodOf,
  frequencyOf,
  rollingByDays,
  rollingByTrades,
  degradationOf,
  qualifiesForward,
} from '../src/lib/forward-metrics.mjs';
import { parseCSV, parseHTML } from '../src/lib/forward-source.mjs';
import { FORWARD_CONFIG as CFG } from '../config/forward-evidence.mjs';

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
const T0 = Date.UTC(2026, 0, 5, 10, 0, 0); // fixed epoch — deterministic

/** n trades, `net` per trade (array cycles), one per `stepDays`. */
function mk(nets, { stepDays = 1, start = T0, symbol = 'EURUSD', dir = 'long' } = {}) {
  return nets.map((net, i) => ({
    netProfit: net,
    profit: net,
    swap: 0,
    commission: 0,
    fees: 0,
    closeTime: start + i * stepDays * DAY,
    openTime: start + i * stepDays * DAY - 3600000,
    direction: i % 2 ? 'short' : dir,
    symbol,
  }));
}

/* =================================================================== *
 * UNIT (§84)
 * =================================================================== */

console.log('\nUNIT — forward-metrics\n');

test('profit factor, win rate, payoff, expected payoff', () => {
  const m = computeMetrics(mk([100, 100, 100, -50, -50, 0]));
  assert.equal(m.trades, 6);
  assert.equal(m.grossProfit, 300);
  assert.equal(m.grossLoss, -100);
  assert.equal(m.profitFactor, 3);
  assert.equal(m.winRate, 60); // 3 wins / 5 decided (break-even excluded)
  assert.equal(m.avgWin, 100);
  assert.equal(m.avgLoss, -50);
  assert.equal(m.payoffRatio, 2);
  assert.equal(m.expectedPayoff, Math.round((200 / 6) * 100) / 100);
});

test('drawdown is balance-based max decline of cumulative net', () => {
  const m = computeMetrics(mk([100, -30, -40, 50, -80]));
  // cum: 100, 70, 30, 80, 0 → peak 100, trough 0 → DD 100
  assert.equal(m.maxDrawdown, 100);
  assert.equal(m.maxDrawdownBasis, 'balance');
  assert.equal(m.relativeDrawdownPct, null); // no start balance given
});

test('relative DD only with a verified starting balance', () => {
  const m = computeMetrics(mk([100, -30, -40, 50, -80]), { startBalance: 900 });
  // peak cum = 100 → balance at peak 1000; DD 100 → 10%
  assert.equal(m.relativeDrawdownPct, 10);
});

test('costs separated: net = gross trade profit + swap + commission', () => {
  const trades = [
    { netProfit: 80, profit: 100, swap: -5, commission: -15, fees: 0, closeTime: T0, direction: 'long' },
    { netProfit: -60, profit: -50, swap: -10, commission: 0, fees: 0, closeTime: T0 + DAY, direction: 'short' },
  ];
  const m = computeMetrics(trades);
  assert.equal(m.netProfit, 20);
  assert.equal(m.grossTradeProfit, 50);
  assert.equal(m.swap, -15);
  assert.equal(m.commission, -15);
});

test('long/short split PF', () => {
  const trades = [
    { netProfit: 100, closeTime: T0, direction: 'long' },
    { netProfit: -50, closeTime: T0 + DAY, direction: 'long' },
    { netProfit: 30, closeTime: T0 + 2 * DAY, direction: 'short' },
    { netProfit: -60, closeTime: T0 + 3 * DAY, direction: 'short' },
  ];
  const m = computeMetrics(trades);
  assert.equal(m.longPF, 2);
  assert.equal(m.shortPF, 0.5);
});

test('trade frequency from real period (§13, §22)', () => {
  const f = frequencyOf(mk(Array(30).fill(10), { stepDays: 1 })); // 30 trades over 30 days
  assert.equal(f.perDay, 1);
  assert.ok(Math.abs(f.perMonth - 30.44) < 0.1);
});

test('rolling windows: by days and by trades', () => {
  const trades = mk(Array(100).fill(5), { stepDays: 1 });
  assert.equal(rollingByDays(trades, 30).length, 30);
  assert.equal(rollingByTrades(trades, 50).length, 50);
});

test('evidence qualification rule (§45)', () => {
  assert.equal(qualifiesForward({ trades: 30, days: 30, mappingOk: true }, CFG), true);
  assert.equal(qualifiesForward({ trades: 29, days: 300, mappingOk: true }, CFG), false);
  assert.equal(qualifiesForward({ trades: 300, days: 29, mappingOk: true }, CFG), false);
  assert.equal(qualifiesForward({ trades: 300, days: 300, mappingOk: false }, CFG), false);
});

test('degradation: INSUFFICIENT_DATA below minimum sample (§29)', () => {
  const d = degradationOf({
    rolling: { trades: 10, profitFactor: 0.5 },
    baseline: { type: 'BACKTEST', profitFactor: 1.6 },
    config: CFG,
  });
  assert.equal(d.state, 'INSUFFICIENT_DATA');
});

test('degradation states by PF ratio (§27–28)', () => {
  const base = { type: 'BACKTEST', profitFactor: 1.6 };
  const at = (pf, n = 90) =>
    degradationOf({ rolling: { trades: n, profitFactor: pf }, baseline: base, config: CFG }).state;
  assert.equal(at(1.55), 'NORMAL');
  assert.equal(at(1.25), 'WATCH'); // ratio 0.78 (§28 example)
  assert.equal(at(1.0), 'DEGRADED'); // 0.625
  assert.equal(at(0.7), 'SEVERE'); // 0.44
});

test('degradation confidence tracks sample size (§30)', () => {
  const base = { type: 'BACKTEST', profitFactor: 1.6 };
  const conf = (n) => degradationOf({ rolling: { trades: n, profitFactor: 1.2 }, baseline: base, config: CFG }).confidence;
  assert.equal(conf(35), 'LOW');
  assert.equal(conf(60), 'MEDIUM');
  assert.equal(conf(150), 'HIGH');
});

/* =================================================================== *
 * PARSERS
 * =================================================================== */

console.log('\nUNIT — sources\n');

const CSV_HEAD = 'Ticket,Open Time,Type,Size,Symbol,Open Price,S/L,T/P,Close Time,Close Price,Commission,Swap,Profit,Magic,Comment\n';
const csvRow = (i, { profit = 10, magic = '', type = 'buy' } = {}) =>
  `${1000 + i},2026.01.${String((i % 27) + 1).padStart(2, '0')} 10:00,${type},0.10,EURUSD,1.1000,,,2026.01.${String((i % 27) + 1).padStart(2, '0')} 12:00,1.1010,-0.20,0,${profit},${magic},TEST-FIXTURE\n`;

test('CSV parser reads trades, costs and magic', () => {
  const { trades, warnings } = parseCSV(CSV_HEAD + csvRow(1, { magic: '777' }) + csvRow(2, { profit: -5, type: 'sell' }));
  assert.equal(trades.length, 2);
  assert.equal(trades[0].magic, 777);
  assert.equal(trades[0].netProfit, 10 - 0.2);
  assert.equal(trades[1].direction, 'short');
  assert.equal(warnings.length, 0);
});

const MT4_STATEMENT = `<html><body><table>
<tr><td>Ticket</td><td>Open Time</td><td>Type</td><td>Size</td><td>Item</td><td>Price</td><td>S / L</td><td>T / P</td><td>Close Time</td><td>Price</td><td>Commission</td><td>Taxes</td><td>Swap</td><td>Profit</td></tr>
<tr><td>501</td><td>2026.02.02 09:00</td><td>buy</td><td>0.10</td><td>usdjpy</td><td>155.00</td><td>0.00</td><td>0.00</td><td>2026.02.02 15:00</td><td>155.50</td><td>-0.30</td><td>0.00</td><td>-0.10</td><td>32.10</td></tr>
<tr><td>502</td><td>2026.02.03 09:00</td><td>sell</td><td>0.10</td><td>usdjpy</td><td>155.40</td><td>0.00</td><td>0.00</td><td>2026.02.04 15:00</td><td>155.90</td><td>-0.30</td><td>0.00</td><td>-0.50</td><td>-32.30</td></tr>
<tr><td colspan="14">Closed P/L: -0.20</td></tr>
</table></body></html>`;

test('HTML parser reads an MT4 statement with cost separation', () => {
  const { trades } = parseHTML(MT4_STATEMENT);
  assert.equal(trades.length, 2);
  assert.equal(trades[0].ticket, '501');
  assert.equal(trades[0].symbol, 'USDJPY');
  assert.equal(trades[0].swap, -0.1);
  assert.equal(Math.round(trades[0].netProfit * 100) / 100, 31.7);
  assert.equal(trades[1].direction, 'short');
});

test('bad HTML yields zero trades, not garbage (§86)', () => {
  const { trades } = parseHTML('<html><body><p>not a report</p></body></html>');
  assert.equal(trades.length, 0);
});

/* =================================================================== *
 * INTEGRATION (§85–86) — real importer + analyzer in an isolated dir
 * =================================================================== */

console.log('\nINTEGRATION — importer + analyzer (isolated temp store)\n');

const tmp = mkdtempSync(join(tmpdir(), 'tyo-fwd-test-'));
const dataDir = join(tmp, 'data');
const outDir = join(tmp, 'out');
const env = { ...process.env, FORWARD_DATA_DIR: dataDir, FORWARD_OUT_DIR: outDir };

function run(script, args) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', script), ...args], { env, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

/* fixture: 60 manual-mapped trades over ~120 days (qualifies) */
let csv = CSV_HEAD;
for (let i = 0; i < 60; i++) {
  const day = 1 + Math.floor(i * 2);
  const ymd = `2026.${String(1 + Math.floor(day / 28)).padStart(2, '0')}.${String((day % 28) + 1).padStart(2, '0')}`;
  const profit = i % 4 === 3 ? -18 : 12;
  csv += `${2000 + i},${ymd} 08:00,buy,0.10,EURUSD,1.1,,,${ymd} 11:00,1.101,-0.1,0,${profit},,TEST-FIXTURE\n`;
}
const fixA = join(tmp, 'fixture-a.csv');
writeFileSync(fixA, csv);

test('CSV import (manual mapping) succeeds', () => {
  const r = run('import-forward.mjs', [fixA, '--account', 'ACC-FWD-001', '--type', 'FORWARD_DEMO', '--currency', 'USD', '--strategy', 'joker', '--platform', 'mt4']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Trades imported: 60/);
  assert.match(r.out, /Unmapped: 0/);
});

test('idempotency: same file twice does not duplicate (§66–67)', () => {
  const r = run('import-forward.mjs', [fixA, '--account', 'ACC-FWD-001', '--type', 'FORWARD_DEMO', '--currency', 'USD', '--strategy', 'joker']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /already imported/);
  const store = JSON.parse(readFileSync(join(dataDir, 'normalized', 'ACC-FWD-001.json'), 'utf8'));
  assert.equal(store.trades.length, 60);
});

test('duplicate ticket inside a file is skipped once (§65)', () => {
  const dup = CSV_HEAD + csvRow(1) + csvRow(1);
  const f = join(tmp, 'dup.csv');
  writeFileSync(f, dup);
  const r = run('import-forward.mjs', [f, '--account', 'ACC-FWD-002', '--type', 'FORWARD_DEMO', '--currency', 'USD', '--strategy', 'joker', '--dry-run']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /duplicate ticket/);
  assert.match(r.out, /Trades imported: 1/);
});

test('unknown magic is quarantined as UNMAPPED, never guessed (§9, §86)', () => {
  const f = join(tmp, 'magic.csv');
  writeFileSync(f, CSV_HEAD + csvRow(1, { magic: '999999' }));
  const r = run('import-forward.mjs', [f, '--account', 'ACC-FWD-003', '--type', 'FORWARD_DEMO', '--currency', 'USD', '--strategy', 'joker', '--dry-run']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Unmapped: 1/);
});

test('currency mismatch on an existing account fails (§64)', () => {
  const f = join(tmp, 'eur.csv');
  writeFileSync(f, CSV_HEAD + csvRow(5));
  const r = run('import-forward.mjs', [f, '--account', 'ACC-FWD-001', '--type', 'FORWARD_DEMO', '--currency', 'EUR']);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /currency mismatch/);
});

test('dry-run writes nothing (§63)', () => {
  const before = readFileSync(join(dataDir, 'normalized', 'ACC-FWD-001.json'), 'utf8');
  const f = join(tmp, 'more.csv');
  writeFileSync(f, CSV_HEAD + csvRow(7, { profit: 99 }));
  const r = run('import-forward.mjs', [f, '--account', 'ACC-FWD-001', '--type', 'FORWARD_DEMO', '--currency', 'USD', '--strategy', 'joker', '--dry-run']);
  assert.equal(r.code, 0);
  assert.equal(readFileSync(join(dataDir, 'normalized', 'ACC-FWD-001.json'), 'utf8'), before);
});

test('empty/corrupt report fails cleanly (§86)', () => {
  const f = join(tmp, 'bad.html');
  writeFileSync(f, '<html><body>nothing here</body></html>');
  const r = run('import-forward.mjs', [f, '--account', 'ACC-FWD-004', '--type', 'FORWARD_DEMO', '--currency', 'USD']);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /no trades parsed|no recognisable/);
});

test('account/type prefix mismatch is rejected (§0, §5)', () => {
  const r = run('import-forward.mjs', [fixA, '--account', 'ACC-FWD-009', '--type', 'LIVE', '--currency', 'USD']);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /disagree/);
});

test('analyzer produces public-safe aggregates + qualification (§45, §70–72)', () => {
  const r = run('analyze-forward.mjs', []);
  assert.equal(r.code, 0, r.out);
  const agg = JSON.parse(readFileSync(join(outDir, 'forward-aggregates.json'), 'utf8'));
  const j = agg.strategies.joker.FORWARD_DEMO;
  assert.equal(j.trades, 60);
  assert.equal(j.qualified, true); // 60 trades over ~120 days, MANUAL mapping
  assert.ok(j.metrics.profitFactor > 1);
  assert.ok(j.rolling.d90);
  assert.ok(j.degradation.state);
  /* privacy: no trade-level fields anywhere in the public output */
  const raw = JSON.stringify(agg);
  assert.ok(!raw.includes('TEST-FIXTURE'), 'comments must not leak');
  assert.ok(!raw.includes('"ticket"'), 'tickets must not leak');
  assert.ok(!raw.includes('tradeId'), 'trade ids must not leak');
});

test('research candidates file is written and never auto-promotes (§53–54)', () => {
  const c = JSON.parse(readFileSync(join(outDir, 'research-candidates.json'), 'utf8'));
  assert.ok(Array.isArray(c.candidates));
  for (const cand of c.candidates) assert.notEqual(cand.status, 'PROMOTED_TO_EXPERIMENT');
});

rmSync(tmp, { recursive: true, force: true });

/* =================================================================== */

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
