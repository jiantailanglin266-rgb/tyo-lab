/**
 * ============================================================================
 * FORWARD ANALYZER — normalized trades → public aggregates (Phase 12B–12E)
 * ============================================================================
 *   node scripts/analyze-forward.mjs [--dry-run]
 *
 * Reads every account under data/forward/normalized/, groups trades by
 * strategy × evidence type, and writes ONLY public-safe aggregates:
 *
 *   tools/forward-aggregates.json     metrics, rolling windows, degradation
 *   tools/research-candidates.json    monitoring candidates (never auto-
 *                                     promoted to experiments — §53, §104)
 *
 * Privacy: no tickets, no comments, no per-trade rows, no balances beyond
 * what the owner marked publishable leave this script (§70–72).
 *
 * With no normalized data the outputs are empty shells and the site keeps
 * its honest NO DATA states (§99).
 * ============================================================================
 */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  computeMetrics,
  periodOf,
  frequencyOf,
  rollingByDays,
  rollingByTrades,
  sessionBreakdown,
  hourBreakdown,
  dayOfWeekBreakdown,
  symbolBreakdown,
  degradationOf,
  qualifiesForward,
} from '../src/lib/forward-metrics.mjs';
import { FORWARD_CONFIG } from '../config/forward-evidence.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = process.env.FORWARD_DATA_DIR || join(ROOT, 'data', 'forward');
const OUT = process.env.FORWARD_OUT_DIR || join(ROOT, 'tools');
const NORM = join(DATA, 'normalized');
const dryRun = process.argv.includes('--dry-run');
const CFG = FORWARD_CONFIG;
const MS_DAY = 86400000;

/* ---- load normalized stores ------------------------------------------ */

let files = [];
try {
  files = (await readdir(NORM)).filter((f) => f.endsWith('.json'));
} catch {
  /* no data yet */
}

const stores = [];
for (const f of files) stores.push(JSON.parse(await readFile(join(NORM, f), 'utf8')));

/* ---- backtest baselines (for §19–20 comparison and §31 default) ------- */

let backtest = {};
try {
  const rep = JSON.parse(await readFile(join(ROOT, 'tools', 'imported-reports.json'), 'utf8'));
  const ext = JSON.parse(await readFile(join(ROOT, 'tools', 'extracted-trades.json'), 'utf8'));
  for (const [slug, r] of Object.entries(rep)) {
    const months = ext[slug]?.monthly?.length || null;
    const closed = ext[slug]?.counts?.closed || null;
    backtest[slug] = {
      type: 'BACKTEST',
      profitFactor: r.backtest?.profitFactor ? Number(String(r.backtest.profitFactor).replace(/[^\d.]/g, '')) : null,
      winRate: ext[slug]?.rates?.winRate ?? null,
      tradesPerMonth: months && closed ? Math.round((closed / months) * 100) / 100 : null,
      expectedPayoffNote: 'currency differs from forward — compare ratios only',
      maxDrawdown: null, // backtest DD is % of a different balance: never diffed against forward currency DD
    };
  }
} catch {
  /* no backtest data — baselines limited to forward history */
}

/* ---- previous candidates (preserve human-set statuses §54) ------------ */

let prevCandidates = [];
try {
  prevCandidates = JSON.parse(await readFile(join(OUT, 'research-candidates.json'), 'utf8')).candidates || [];
} catch {
  /* none yet */
}

/* ---- aggregate per strategy × evidence type ---------------------------- */

const strategies = {};
const accounts = [];
let totalTrades = 0;
let unmappedTotal = 0;

for (const store of stores) {
  const acc = store.account;
  accounts.push({
    accountId: acc.accountId,
    evidenceType: acc.evidenceType,
    platform: acc.platform,
    broker: acc.broker,
    currency: acc.currency,
    accountMode: acc.accountMode,
    status: acc.status,
    source: acc.source,
  });

  const byStrategy = new Map();
  for (const t of store.trades) {
    totalTrades++;
    if (t.strategyId === 'UNMAPPED') {
      unmappedTotal++;
      continue;
    }
    if (!byStrategy.has(t.strategyId)) byStrategy.set(t.strategyId, []);
    byStrategy.get(t.strategyId).push(t);
  }

  for (const [slug, trades] of byStrategy) {
    const period = periodOf(trades);
    const metrics = computeMetrics(trades, { startBalance: acc.startBalance });
    const freq = frequencyOf(trades);
    const lastTradeAt = Math.max(...trades.map((t) => t.closeTime));

    /* rolling windows (§24–25) — reference is 90d */
    const rolling = {};
    for (const d of CFG.rollingDayWindows) {
      const w = rollingByDays(trades, d);
      const m = w.length ? computeMetrics(w) : null;
      rolling[`d${d}`] = m
        ? { ...pickRolling(m), perMonth: Math.round((w.length / (d / 30.44)) * 100) / 100 }
        : null;
    }
    for (const c of CFG.rollingTradeWindows) {
      const w = rollingByTrades(trades, c);
      rolling[`t${c}`] = w.length >= Math.min(c, CFG.minRollingTrades) ? pickRolling(computeMetrics(w)) : null;
    }

    /* baseline (§31–32): full forward history if deep enough, else backtest */
    let baseline = null;
    if (trades.length >= CFG.minBaselineForwardTrades) {
      baseline = {
        type: 'FULL_FORWARD_HISTORY',
        profitFactor: metrics.profitFactor,
        tradesPerMonth: freq.perMonth,
        maxDrawdown: metrics.maxDrawdown,
      };
    } else if (backtest[slug]?.profitFactor) {
      baseline = backtest[slug];
    }

    const ref = rolling.d90 ? { ...rolling.d90 } : null;
    const degradation = degradationOf({ rolling: ref, baseline, config: CFG });

    /* qualification (§45–46) */
    const mappingOk = trades.every((t) => ['MAGIC', 'COMMENT', 'MANUAL'].includes(t.mappingSource));
    const qualified = qualifiesForward({ trades: trades.length, days: period.days, mappingOk }, CFG);

    /* freshness (§113–114) */
    const lowFreq = (backtest[slug]?.tradesPerMonth ?? 99) < CFG.lowFreqPerMonth;
    const staleDays = lowFreq ? CFG.staleAfterDaysLowFreq : CFG.staleAfterDays;
    const stale = Date.now() - lastTradeAt > staleDays * MS_DAY;

    if (!strategies[slug]) strategies[slug] = {};
    strategies[slug][acc.evidenceType] = {
      accountId: acc.accountId,
      currency: acc.currency,
      broker: acc.broker,
      platform: acc.platform,
      accountMode: acc.accountMode,
      period,
      trades: trades.length,
      mapping: {
        sources: [...new Set(trades.map((t) => t.mappingSource))],
        ok: mappingOk,
      },
      metrics,
      freq,
      breakdowns: {
        longShort: { longPF: metrics.longPF, shortPF: metrics.shortPF, longTrades: metrics.longTrades, shortTrades: metrics.shortTrades },
        sessions: sessionBreakdown(trades, CFG.sessions),
        hours: hourBreakdown(trades),
        daysOfWeek: dayOfWeekBreakdown(trades),
        symbols: symbolBreakdown(trades),
      },
      rolling,
      curve: curveOf(trades),
      rolling90Pf: rolling90Series(trades),
      degradation,
      backtestBaseline: backtest[slug] || null,
      qualified,
      lastTradeAt: new Date(lastTradeAt).toISOString(),
      stale,
    };
  }
}

/** Downsampled cumulative-net curve (balance-based, ~120 pts) for §50. */
function curveOf(trades) {
  const sorted = [...trades].sort((a, b) => a.closeTime - b.closeTime);
  const pts = [];
  let cum = 0;
  for (const t of sorted) {
    cum += t.netProfit;
    pts.push([Math.round(t.closeTime / 1000), Math.round(cum * 100) / 100]);
  }
  const step = Math.max(1, Math.floor(pts.length / 120));
  const out = pts.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
  return out;
}

/** Trailing-90d PF sampled at each month end (§51); null where sample thin. */
function rolling90Series(trades) {
  const sorted = [...trades].sort((a, b) => a.closeTime - b.closeTime);
  const first = sorted[0].closeTime;
  const last = sorted[sorted.length - 1].closeTime;
  const out = [];
  const d = new Date(first + 90 * MS_DAY);
  let cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59);
  while (cursor <= last + 31 * MS_DAY) {
    const asOf = Math.min(cursor, last);
    const w = rollingByDays(sorted, 90, asOf);
    const ym = new Date(asOf).toISOString().slice(0, 7);
    if (!out.some((r) => r[0] === ym)) {
      const m = w.length >= CFG.minRollingTrades ? computeMetrics(w) : null;
      out.push([ym, m ? m.profitFactor : null]);
    }
    if (cursor >= last) break;
    const nd = new Date(cursor + MS_DAY);
    cursor = Date.UTC(nd.getUTCFullYear(), nd.getUTCMonth() + 1, 0, 23, 59, 59);
  }
  return out;
}

function pickRolling(m) {
  return {
    trades: m.trades,
    profitFactor: m.profitFactor,
    winRate: m.winRate,
    expectedPayoff: m.expectedPayoff,
    netProfit: m.netProfit,
    maxDrawdown: m.maxDrawdown,
    longPF: m.longPF,
    shortPF: m.shortPF,
  };
}

/* ---- research candidates (§53–56, 12E) --------------------------------- */

const candidates = [...prevCandidates];
let nextRc = 1 + prevCandidates.reduce((mx, c) => Math.max(mx, Number(c.candidateId.replace('RC-', '')) || 0), 0);

for (const [slug, byType] of Object.entries(strategies)) {
  for (const [etype, agg] of Object.entries(byType)) {
    const deg = agg.degradation;
    if (!['WATCH', 'DEGRADED', 'SEVERE'].includes(deg.state)) continue;

    /* one OPEN candidate per strategy × evidence type × state */
    const dupe = candidates.find(
      (c) => c.strategyId === slug && c.evidenceType === etype && c.severity === deg.state && c.status === 'OPEN'
    );
    if (dupe) continue;

    /* deterministic suggested areas (§55) — signals, not verdicts */
    const areas = [];
    const s = agg.breakdowns.sessions;
    const worstSession = Object.entries(s)
      .filter(([, v]) => v && v.profitFactor !== null && v.trades >= 10)
      .sort((a, b) => a[1].profitFactor - b[1].profitFactor)[0];
    if (worstSession && agg.metrics.profitFactor && worstSession[1].profitFactor < agg.metrics.profitFactor * 0.7)
      areas.push(`SESSION:${worstSession[0]}`);
    if (agg.metrics.longPF && agg.metrics.shortPF) {
      const r = Math.min(agg.metrics.longPF, agg.metrics.shortPF) / Math.max(agg.metrics.longPF, agg.metrics.shortPF);
      if (r < 0.6) areas.push('LONG_SHORT');
    }
    if ((agg.metrics.swapShareOfGrossPct ?? 0) > 20) areas.push('SWAP');
    if ((agg.metrics.commissionShareOfGrossPct ?? 0) > 20) areas.push('SPREAD');
    if (deg.freqRatio !== null && deg.freqRatio < CFG.degradationThresholds.freqRatioWatch) areas.push('TRADE_FREQUENCY');
    if (deg.ddRatio !== null && deg.ddRatio > CFG.degradationThresholds.ddSevereMultiple) areas.push('DRAWDOWN');

    candidates.push({
      candidateId: `RC-${String(nextRc++).padStart(4, '0')}`,
      strategyId: slug,
      evidenceType: etype,
      detectedAt: new Date().toISOString().slice(0, 10),
      observation: `90-day PF ${deg.rollingPF ?? '—'} vs ${deg.baselineType} baseline ${deg.baselinePF ?? '—'} (ratio ${deg.pfRatio ?? '—'}) over ${deg.sample} trades.`,
      metrics: {
        rollingPF: deg.rollingPF,
        baselinePF: deg.baselinePF,
        pfRatio: deg.pfRatio,
        freqRatio: deg.freqRatio,
        ddRatio: deg.ddRatio,
        sample: deg.sample,
      },
      severity: deg.state,
      confidence: deg.confidence,
      suggestedResearchAreas: areas.length ? areas : ['GENERAL'],
      status: 'OPEN',
    });
  }
}

/* ---- write ------------------------------------------------------------- */

const aggregatesOut = {
  generatedAt: new Date().toISOString(),
  config: {
    minForwardTrades: CFG.minForwardTrades,
    minForwardDays: CFG.minForwardDays,
    minRollingTrades: CFG.minRollingTrades,
    rollingDayWindows: CFG.rollingDayWindows,
    degradationThresholds: CFG.degradationThresholds,
  },
  accounts,
  strategies,
};
const candidatesOut = { generatedAt: new Date().toISOString(), candidates };

console.log(`\n  FORWARD ANALYZE ${dryRun ? '(dry run)' : ''}`);
console.log(`  Accounts:   ${accounts.length}`);
console.log(`  Trades:     ${totalTrades} (${unmappedTotal} UNMAPPED quarantined)`);
console.log(`  Strategies: ${Object.keys(strategies).length}`);
for (const [slug, byType] of Object.entries(strategies))
  for (const [et, a] of Object.entries(byType))
    console.log(
      `    · ${slug.padEnd(10)} ${et.padEnd(12)} ${String(a.trades).padStart(5)} trades  PF ${a.metrics.profitFactor ?? '—'}  ` +
        `deg ${a.degradation.state}${a.qualified ? '  QUALIFIED' : ''}${a.stale ? '  STALE' : ''}`
    );
console.log(`  Candidates: ${candidates.filter((c) => c.status === 'OPEN').length} open / ${candidates.length} total`);

if (!dryRun) {
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'forward-aggregates.json'), JSON.stringify(aggregatesOut), 'utf8');
  await writeFile(join(OUT, 'research-candidates.json'), JSON.stringify(candidatesOut, null, 1), 'utf8');
  console.log(`\n  → ${join(OUT, 'forward-aggregates.json')} / research-candidates.json written\n`);
} else {
  console.log('\n  dry run complete.\n');
}
