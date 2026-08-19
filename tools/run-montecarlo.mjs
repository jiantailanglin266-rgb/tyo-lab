/**
 * ============================================================================
 * MONTE CARLO LAB — resampling the real deal lists (Phase 8)
 * ============================================================================
 *   node tools/run-montecarlo.mjs <source-dir>   (the ゴゴジャン folder)
 *
 * Three stress families per system, all computed from the SAME deal list the
 * rest of the site uses (matched by report basename to extracted-trades.json):
 *
 *   shuffle   1,000 random re-orderings of the per-trade returns.
 *             Compounded final return is order-independent, so the only thing
 *             this measures is PATH risk: how bad the drawdown could have
 *             been if the same trades had arrived in a different order.
 *
 *   missed    1,000 runs per level in which each trade is independently
 *             skipped with 10% / 20% probability — the "your terminal was
 *             offline / requotes ate entries" question.
 *
 *   cost      deterministic per-trade cost stress. The cost unit is the
 *             system's own median absolute per-trade return, so levels scale
 *             with how small the system's edges are: 10% / 25% / 50% of that
 *             median deducted from EVERY trade. Parameterised stress, NOT a
 *             calibrated broker model — the page says so.
 *
 * HONESTY RULES
 *   - Per-trade return rᵢ = profitᵢ / (balanceᵢ − profitᵢ): fraction of the
 *     balance before the close. Trade-close basis throughout; intra-trade
 *     floating drawdown is invisible here and the output says so.
 *   - Seeded PRNG (mulberry32), seed recorded in the JSON. Same seed + same
 *     reports → identical output, byte for byte.
 *   - Every simulation resamples the SAME backtest. This explores fragility
 *     of the record; it adds no information about the future.
 *
 * Writes tools/montecarlo.json.
 * ============================================================================
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode, extractTrades, findReports, FOLDER_TO_SLUG } from './extract-trades.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];

if (!SRC) {
  console.error('usage: node tools/run-montecarlo.mjs <source-dir>');
  process.exit(1);
}

const SEED = 20260820;
const SIMS = 1000;
const MISSED_LEVELS = [10, 20]; // % chance each trade is skipped
const COST_LEVELS = [10, 25, 50]; // % of median |per-trade return| deducted per trade

/* ------------------------------------------------------------------ *
 * Deterministic PRNG — mulberry32
 * ------------------------------------------------------------------ */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * Series math
 * ------------------------------------------------------------------ */

/** Compound a fractional-return sequence → {finalPct, maxDDPct} (trade closes). */
function runPath(r) {
  let index = 1;
  let peak = 1;
  let maxDD = 0;
  for (let i = 0; i < r.length; i++) {
    index *= 1 + r[i];
    if (index > peak) peak = index;
    else {
      const dd = 1 - index / peak;
      if (dd > maxDD) maxDD = dd;
    }
    if (index <= 0) return { finalPct: -100, maxDDPct: 100 }; // busted path
  }
  return { finalPct: (index - 1) * 100, maxDDPct: maxDD * 100 };
}

/** In-place Fisher–Yates over a copy. */
function shuffled(r, rand) {
  const a = r.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** Linear-interpolated percentile of an unsorted list. */
function percentile(list, p) {
  const s = list.slice().sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const v = lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (idx - lo);
  return Math.round(v * 100) / 100;
}

const r2 = (x) => Math.round(x * 100) / 100;

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

console.log(`\n  Monte Carlo — ${SIMS} sims per family, seed ${SEED}\n`);

const extracted = JSON.parse(await readFile(join(ROOT, 'tools', 'extracted-trades.json'), 'utf8'));

const systems = {};

for (const [folder, slug] of Object.entries(FOLDER_TO_SLUG)) {
  const wantedSource = extracted[slug]?.source || null;
  const reports = await findReports(join(SRC, folder));

  /* Use the exact report the rest of the site's trade data came from. */
  let path = wantedSource ? reports.find((p) => basename(p) === wantedSource) : null;
  if (!path) path = reports[0] || null;
  if (!path) {
    console.log(`  ! ${slug.padEnd(10)} no report found — skipped`);
    continue;
  }

  let html;
  try {
    html = decode(await readFile(path));
  } catch {
    console.log(`  ! ${slug.padEnd(10)} unreadable report — skipped`);
    continue;
  }

  const { trades } = extractTrades(html);
  const r = [];
  for (const tr of trades) {
    if (tr.b === null || tr.p === null) continue;
    const base = tr.b - tr.p;
    if (base <= 0) continue;
    r.push(tr.p / base);
  }
  if (r.length < 100) {
    console.log(`  ! ${slug.padEnd(10)} only ${r.length} usable trades — skipped`);
    continue;
  }

  const observed = runPath(r);

  /* shuffle — one PRNG stream per (system × family), derived from the master
     seed and the slug so adding a system never shifts another's draws. */
  const slugHash = [...slug].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const randShuffle = mulberry32(SEED ^ slugHash);
  const dds = [];
  for (let s = 0; s < SIMS; s++) dds.push(runPath(shuffled(r, randShuffle)).maxDDPct);

  /* missed trades */
  const missed = {};
  for (const lvl of MISSED_LEVELS) {
    const rand = mulberry32((SEED ^ slugHash) + lvl);
    const finals = [];
    const mdds = [];
    for (let s = 0; s < SIMS; s++) {
      const kept = r.filter(() => rand() >= lvl / 100);
      const res = runPath(kept);
      finals.push(res.finalPct);
      mdds.push(res.maxDDPct);
    }
    missed[lvl] = {
      final: { p5: percentile(finals, 5), p50: percentile(finals, 50), p95: percentile(finals, 95) },
      dd: { p50: percentile(mdds, 50), p95: percentile(mdds, 95) },
    };
  }

  /* cost stress — deterministic */
  const absR = r.map(Math.abs).sort((a, b) => a - b);
  const medianAbs = absR[Math.floor(absR.length / 2)];
  const cost = COST_LEVELS.map((share) => {
    const c = medianAbs * (share / 100);
    const res = runPath(r.map((x) => x - c));
    return { share, costPctPerTrade: r2(c * 100), finalPct: r2(res.finalPct), maxDDPct: r2(res.maxDDPct) };
  });

  systems[slug] = {
    source: basename(path),
    trades: r.length,
    observed: { finalPct: r2(observed.finalPct), maxDDPct: r2(observed.maxDDPct) },
    shuffle: {
      dd: {
        p50: percentile(dds, 50),
        p90: percentile(dds, 90),
        p95: percentile(dds, 95),
        p99: percentile(dds, 99),
        max: r2(Math.max(...dds)),
      },
    },
    missed,
    cost: { medianAbsTradePct: r2(medianAbs * 100), levels: cost },
  };

  console.log(
    `  · ${slug.padEnd(10)} ${String(r.length).padStart(6)} trades  ` +
      `DD obs ${String(systems[slug].observed.maxDDPct).padStart(6)}%  ` +
      `shuffle p95 ${String(systems[slug].shuffle.dd.p95).padStart(6)}%  p99 ${String(systems[slug].shuffle.dd.p99).padStart(6)}%`
  );
}

const out = {
  generatedAt: new Date().toISOString(),
  seed: SEED,
  sims: SIMS,
  basis: 'trade-close',
  method: {
    returns: 'r_i = profit_i / (balance_i - profit_i), fraction of balance before each close',
    shuffle: `${SIMS} uniform re-orderings (Fisher-Yates, mulberry32). Final return is order-independent; only path drawdown is measured.`,
    missed: `${SIMS} runs per level; each trade independently skipped with the stated probability.`,
    cost: 'Deterministic: every trade return reduced by the stated share of the median absolute per-trade return. Parameterised stress, not a calibrated broker model.',
  },
  systems,
};

await writeFile(join(ROOT, 'tools', 'montecarlo.json'), JSON.stringify(out), 'utf8');
console.log(`\n  → tools/montecarlo.json written (${Object.keys(systems).length} systems)\n`);
