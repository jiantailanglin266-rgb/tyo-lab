/**
 * ============================================================================
 * Experiment generator — the two classes of experiment that can be produced
 * WITHOUT anyone inventing a result
 * ============================================================================
 *   node tools/run-experiments.mjs
 *
 * Writes tools/experiments-generated.json, consumed by src/data/experiments.mjs.
 *
 * CLASS A — RECONSTRUCTED (EXP-000101…)
 *   Several EA folders hold more than one tester report: earlier versions,
 *   platform ports, different windows. The surviving reports give real
 *   before/after metrics, but the hypothesis and the decision lived in the
 *   developer's head and were never written down. So these records carry
 *   `metadataAvailable: false`, hypothesis/decision stay NOT_AVAILABLE, and
 *   the page says "Historical experiment metadata unavailable". The numbers
 *   are real; the narrative is honestly absent.
 *
 * CLASS B — SPLIT STABILITY (EXP-000201…)
 *   Run fresh, today, on the extracted monthly series: split each system's
 *   months 70/30 chronologically and test whether the early profile persists
 *   in the late window. The decision rule is fixed BEFORE looking at any
 *   result (see DECISION RULE below) so the outcome cannot be steered.
 *
 *   This is NOT out-of-sample validation and is never labelled as such: the
 *   optimisation window of these systems is undocumented, so the late 30%
 *   may or may not have been seen during tuning. It is a stability check on
 *   the recorded equity path — useful, honest, and clearly named.
 *
 * DECISION RULE (Class B, declared up front):
 *   late window must have ≥ 12 months, else INCONCLUSIVE.
 *   ACCEPTED  — late positive-month share ≥ early − 10pp  AND  late mean > 0
 *   REJECTED  — late mean ≤ 0  OR  late positive share < early − 20pp
 *   otherwise INCONCLUSIVE
 * ============================================================================
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = async (rel) => JSON.parse(await readFile(join(ROOT, rel), 'utf8'));

const trades = await read('tools/extracted-trades.json');
const alt = await read('tools/alt-reports.json');

const r2 = (x) => (x === null || x === undefined ? null : Math.round(x * 100) / 100);

/* ------------------------------------------------------------------ *
 * CLASS A — reconstructions from alternate reports
 * Each entry is hand-mapped: which two files form a pair and what KIND of
 * difference the filenames/params evidence. Nothing subjective beyond the
 * pairing itself, which is stated in `pairing`.
 * ------------------------------------------------------------------ */

const RECON = [
  {
    id: 'EXP-000101',
    slug: 'galoa',
    title: 'GALOA — SUNS build vs current build, full 2003–2026 window',
    category: 'version',
    files: ['SUNS 2003-2026.htm', 'GALOABT20032026TDS変動.htm'],
    pairing:
      'Two full-history runs of the same USDJPY M5 system survive: one under the earlier working name "SUNS", one as the current GALOA build on tick-data-suite variable spread. Same market, near-identical window.',
    comparable: true,
  },
  {
    id: 'EXP-000102',
    slug: 'galoa',
    title: 'GALOA — recent-window run (2024–2026)',
    category: 'dataset',
    files: ['SUNS 2003-2026.htm', 'USDJPY SUNS2024-2025.htm'],
    pairing:
      'A short recent-window run of the SUNS build exists alongside its full-history run. Different windows, so figures are not directly comparable; the record shows the recent window was tested separately.',
    comparable: false,
  },
  {
    id: 'EXP-000103',
    slug: 'grandslam',
    title: 'GRANDSLAM — 2022-start vs 2024-start dataset window',
    category: 'dataset',
    files: ['ReportTester-52755788.html', 'GDXBT.html'],
    pairing:
      'Two runs of the same BTCUSD M5 system over different start dates. The 2022-start window includes the 2022 crypto drawdown regime and reports 60.76% equity drawdown; the 2024-start window reports 21.56%. Same system, different market regimes covered.',
    comparable: false,
  },
  {
    id: 'EXP-000104',
    slug: 'joker',
    title: 'JOKER — MT4 build vs MT5 rebuild',
    category: 'platform',
    files: ['StrategyTester.htm', 'joker520btmt5.html'],
    pairing:
      'An MT4 GOLD run (2003–2026, balance-basis DD 68.16%) and an MT5 XAUUSD rebuild (2016–2026, equity-basis DD 2.00%) both survive. Different platform, period AND drawdown basis, so the figures must not be read as a controlled comparison — but the migration itself is documented fact.',
    comparable: false,
  },
  {
    id: 'EXP-000105',
    slug: 'nexus',
    title: 'NEXUS — two builds on the identical dataset',
    category: 'version',
    files: ['Engish-fullbt - コピー.html', 'englishi-02fullbt - コピー.html'],
    pairing:
      'Two runs over the identical window (2018.01.01–2026.03.28, BTCUSD M5) with the identical trade count (19,968) but different profit factor (1.52 vs 1.54) and equity drawdown (2.60% vs 5.56%) — a genuine A/B of two builds on the same data. Which build came first is not recorded.',
    comparable: true,
  },
  {
    id: 'EXP-000106',
    slug: 'godspeed',
    title: 'GODSPEED — cross-market run on GOLD',
    category: 'dataset',
    files: ['GODSPEED.htm', 'StrategyTester.htm'],
    pairing:
      'Alongside the GBPJPY release run, the folder holds a GOLD 2006–2026 run. The record shows the logic was tried on a second market; whether that variant relates to the released SENA/RINA gold systems is not documented.',
    comparable: false,
  },
];

function findRun(slug, file) {
  return (alt[slug] || []).find((r) => r.file === file) || null;
}

const metricsOf = (run) =>
  run
    ? {
        symbol: run.symbol,
        period: run.period,
        profitFactor: r2(run.profitFactor),
        maxDrawdownPct: r2(run.maxDrawdownPct),
        drawdownBasis: run.drawdownBasis,
        trades: run.trades,
        winRate: r2(run.winRate),
        dialect: run.dialect,
      }
    : null;

function diffOf(a, b, comparable) {
  if (!comparable || !a || !b) return null;
  const d = {};
  if (a.profitFactor !== null && b.profitFactor !== null) d.profitFactor = r2(b.profitFactor - a.profitFactor);
  if (a.maxDrawdownPct !== null && b.maxDrawdownPct !== null && a.drawdownBasis === b.drawdownBasis)
    d.maxDrawdownPct = r2(b.maxDrawdownPct - a.maxDrawdownPct);
  if (a.trades !== null && b.trades !== null) d.trades = b.trades - a.trades;
  if (a.winRate !== null && b.winRate !== null) d.winRate = r2(b.winRate - a.winRate);
  return Object.keys(d).length ? d : null;
}

const reconstructed = RECON.map((rc) => {
  const before = metricsOf(findRun(rc.slug, rc.files[0]));
  const after = metricsOf(findRun(rc.slug, rc.files[1]));
  return {
    experimentId: rc.id,
    strategyId: rc.slug,
    title: rc.title,
    category: rc.category,
    status: 'ARCHIVED',
    source: 'human',
    metadataAvailable: false,
    createdAt: null, // date of the original work is not recorded
    hypothesis: null, // NOT_AVAILABLE — never written down
    changeSummary: null,
    dataset: rc.pairing,
    metricsBefore: before,
    metricsAfter: after,
    diff: diffOf(before, after, rc.comparable),
    comparable: rc.comparable,
    decision: null, // NOT_AVAILABLE
    reason: null,
    gitCommit: null,
    files: rc.files,
  };
});

/* ------------------------------------------------------------------ *
 * CLASS B — split-stability analyses, run now
 * ------------------------------------------------------------------ */

function windowStats(months) {
  const rated = months.filter((m) => m.pct !== null && m.pct !== undefined);
  const n = rated.length;
  if (!n) return null;
  const pos = rated.filter((m) => m.pct > 0).length;
  const mean = rated.reduce((s, m) => s + m.pct, 0) / n;
  const worst = Math.min(...rated.map((m) => m.pct));
  return {
    months: n,
    from: rated[0].ym,
    to: rated[n - 1].ym,
    positiveShare: r2((pos / n) * 100),
    meanMonthly: r2(mean),
    worstMonth: r2(worst),
  };
}

const RUN_DATE = '2026-08-20';
const SPLIT_COMMIT = null; // filled by the commit that adds this tool; linked in data layer

const splits = Object.entries(trades)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([slug, t], i) => {
    const monthly = t.monthly || [];
    const cut = Math.floor(monthly.length * 0.7);
    const early = windowStats(monthly.slice(0, cut));
    const late = windowStats(monthly.slice(cut));

    let decision = 'INCONCLUSIVE';
    let reason = 'Late window shorter than 12 months.';
    if (early && late && late.months >= 12) {
      const shareDrop = early.positiveShare - late.positiveShare;
      if (late.meanMonthly <= 0 || shareDrop > 20) {
        decision = 'REJECTED';
        reason =
          late.meanMonthly <= 0
            ? `Mean monthly return turned non-positive in the late window (${late.meanMonthly}%).`
            : `Positive-month share fell by ${r2(shareDrop)}pp, beyond the 20pp rejection bound.`;
      } else if (shareDrop <= 10 && late.meanMonthly > 0) {
        decision = 'ACCEPTED';
        reason = `Late window kept a positive mean month (${late.meanMonthly}%) and its positive-month share (${late.positiveShare}%) stayed within 10pp of the early window (${early.positiveShare}%).`;
      } else {
        decision = 'INCONCLUSIVE';
        reason = `Positive-month share fell by ${r2(shareDrop)}pp — inside the rejection bound but outside the acceptance bound.`;
      }
    }

    return {
      experimentId: `EXP-${String(201 + i).padStart(6, '0')}`,
      strategyId: slug,
      title: `${slug.toUpperCase()} — 70/30 split stability of the monthly profile`,
      category: 'stability',
      status: decision,
      source: 'hybrid', // computed by tooling, decision rule authored by a human
      metadataAvailable: true,
      createdAt: RUN_DATE,
      hypothesis:
        'The monthly return profile of the first 70% of the backtest (positive-month share, mean monthly return) persists in the final 30%.',
      changeSummary:
        'No change to the system. Deterministic analysis over the extracted monthly series; decision rule fixed before computation.',
      dataset: `Extracted monthly returns, chronological 70/30 split at month ${cut} of ${monthly.length}.`,
      metricsBefore: early,
      metricsAfter: late,
      diff:
        early && late
          ? {
              positiveShare: r2(late.positiveShare - early.positiveShare),
              meanMonthly: r2(late.meanMonthly - early.meanMonthly),
              worstMonth: r2(late.worstMonth - early.worstMonth),
            }
          : null,
      comparable: true,
      decision,
      reason,
      gitCommit: SPLIT_COMMIT,
      notes:
        'Not out-of-sample validation: the optimisation window of this system is undocumented, so the late 30% may have been seen during tuning. This is a stability check on the recorded equity path.',
    };
  });

const out = { reconstructed, splits, generatedAt: RUN_DATE };
await writeFile(join(ROOT, 'tools', 'experiments-generated.json'), JSON.stringify(out, null, 2), 'utf8');

console.log(`\n  Class A (reconstructed): ${reconstructed.length}`);
for (const e of reconstructed)
  console.log(`    ${e.experimentId}  ${e.strategyId.padEnd(10)} ${e.category.padEnd(8)} comparable=${e.comparable}`);
console.log(`\n  Class B (split stability): ${splits.length}`);
for (const e of splits)
  console.log(
    `    ${e.experimentId}  ${e.strategyId.padEnd(10)} ${e.status.padEnd(13)} ` +
      `early ${e.metricsBefore.positiveShare}%/${e.metricsBefore.meanMonthly}%  late ${e.metricsAfter.positiveShare}%/${e.metricsAfter.meanMonthly}%`
  );
console.log(`\n  → tools/experiments-generated.json written\n`);
