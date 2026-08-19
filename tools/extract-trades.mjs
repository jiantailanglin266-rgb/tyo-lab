/**
 * ============================================================================
 * Trade-level extractor for MetaTrader tester reports
 * ============================================================================
 *   node tools/extract-trades.mjs <source-dir>
 *
 * The header summary that tools/import-reports.mjs reads gives ~15 numbers.
 * The deal list underneath it gives every trade the strategy ever made, and
 * from that the site can show monthly returns, yearly tables, drawdown curves,
 * long/short splits and streak statistics WITHOUT anyone inventing a figure.
 *
 * Writes tools/extracted-trades.json.
 *
 * WHAT IS DERIVED vs WHAT IS READ
 *   read     — closed-trade profit, running balance, timestamp, direction
 *   derived  — monthly/yearly aggregation, balance-basis drawdown, streaks,
 *              averages, position-stacking observations
 *   never    — anything the deal list does not support. Missing stays null.
 *
 * CURRENCY
 *   MT4 reports do not state the account currency, so absolute money is not
 *   publishable for them (see import-reports.mjs). Percentages, counts and
 *   ratios are unit-free and are emitted for every system.
 *
 * TWO DIALECTS
 *   MT5 deals : [time, deal#, symbol, type, in/out, volume, price, order#,
 *                commission, swap, profit, balance, comment]      (13 cols)
 *   MT4 orders: [#, time, type, order#, lots, price, S/L, T/P,
 *                profit, balance]                             (10 cols, 9 on
 *                                                              non-closing)
 * ============================================================================
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];

if (!SRC) {
  console.error('usage: node tools/extract-trades.mjs <source-dir>');
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Shared with import-reports.mjs: decoding + folder map
 * ------------------------------------------------------------------ */

function decode(buf) {
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.toString('utf16le');
  if (buf[0] === 0xfe && buf[1] === 0xff) return buf.swap16().toString('utf16le');
  const utf8 = buf.toString('utf8');
  if (utf8.includes('�')) {
    try {
      return new TextDecoder('shift_jis').decode(buf);
    } catch {
      /* fall through */
    }
  }
  return utf8;
}

const FOLDER_TO_SLUG = {
  COSMOS: 'cosmos',
  GALOA: 'galoa',
  GODSPEED: 'godspeed',
  GRANDSLAM: 'grandslam',
  JAYRO: 'jayro',
  JOKER: 'joker',
  KOKOMO: 'kokomo',
  METRO: 'metro',
  MIRUMO: 'mirumo',
  NEXUS: 'nexus',
  RINA: 'rina',
  'SENA TOKYO': 'sena',
  SUPREMACY: 'supremacy',
  EVERGREEN: 'evergreen',
};

function rank(name) {
  const n = name.toLowerCase();
  let s = 0;
  if (/full/.test(n)) s += 10;
  if (/bt/.test(n)) s += 4;
  if (/\d{4}/.test(n)) s += 2;
  if (/opt/.test(n)) s -= 20;
  if (/コピー|copy|\(1\)/.test(n)) s -= 1;
  return s;
}

async function findReports(dir) {
  const out = [];
  const walk = async (d, depth) => {
    if (depth > 2) return;
    let entries;
    try {
      entries = await readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p, depth + 1);
      else if (/\.html?$/i.test(e.name)) out.push(p);
    }
  };
  await walk(dir, 0);
  return out.sort((a, b) => rank(basename(b)) - rank(basename(a)));
}

/* ------------------------------------------------------------------ *
 * Row scanning
 * A streaming regex over the whole document is far cheaper than building a
 * DOM for a 56 MB report, and the tables are machine-generated so the shape
 * is stable.
 * ------------------------------------------------------------------ */

const CELL = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
const ROW = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

function cells(rowHtml) {
  CELL.lastIndex = 0;
  const out = [];
  let m;
  while ((m = CELL.exec(rowHtml))) {
    out.push(
      m[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/ /g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }
  return out;
}

/** "1 234.56" / "-1,234.56" → number | null */
function num(v) {
  if (v === undefined || v === null || v === '') return null;
  const t = String(v).replace(/[\s ,]/g, '');
  if (!/^-?\d*\.?\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** "2020.01.02 00:10:00" → Date (UTC) | null */
function parseTime(v) {
  const m = String(v || '').match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
}

/**
 * Pull closed trades out of either dialect.
 * A "closed trade" is a row that realises a profit and moves the balance.
 */
function extractTrades(html) {
  ROW.lastIndex = 0;
  const trades = [];
  let openLots = 0;
  let maxConcurrent = 0;
  let stacked = 0; // times a new position opened while others were still open
  let slCloses = 0;
  let dialect = null;
  let m;
  /* MT4 closing rows do not carry the direction, but they do carry the order
     number the open row used — so the side is recoverable by joining on it. */
  const mt4Side = new Map();

  while ((m = ROW.exec(html))) {
    const c = cells(m[1]);
    if (c.length < 9) continue;

    /* MT5: time in col 0, in/out marker in col 4, profit col 10, balance 11 */
    if (c.length === 13 && /^\d{4}\.\d{2}\.\d{2}/.test(c[0])) {
      dialect = dialect || 'mt5';
      const dir = c[4];
      if (dir === 'in') {
        openLots++;
        if (openLots > 1) stacked++;
        if (openLots > maxConcurrent) maxConcurrent = openLots;
        continue;
      }
      if (dir !== 'out') continue; // balance rows and the like
      openLots = Math.max(0, openLots - 1);
      const profit = num(c[10]);
      const balance = num(c[11]);
      const t = parseTime(c[0]);
      if (profit === null || !t) continue;
      if (/\bsl\b/i.test(c[12] || '')) slCloses++;
      // On an 'out' deal the type is the closing side, so the position was
      // the opposite direction.
      trades.push({ t: t.getTime(), p: profit, b: balance, side: c[3] === 'sell' ? 'long' : 'short' });
      continue;
    }

    /* MT4: index col 0, time col 1, type col 2, profit col 8, balance col 9 */
    if (c.length === 10 && /^\d{4}\.\d{2}\.\d{2}/.test(c[1])) {
      dialect = dialect || 'mt4';
      const type = (c[2] || '').toLowerCase();
      if (!/^(s\/l|t\/p|close|close at stop|sell|buy)$/.test(type) && !/close/.test(type)) {
        // not a closing row
      }
      const profit = num(c[8]);
      const balance = num(c[9]);
      const t = parseTime(c[1]);
      if (profit === null || balance === null || !t) continue;
      if (/s\/l/.test(type)) slCloses++;
      openLots = Math.max(0, openLots - 1);
      trades.push({ t: t.getTime(), p: profit, b: balance, side: mt4Side.get(c[3]) || null });
      continue;
    }

    /* MT4 opening rows are 9 wide: count concurrency from them. */
    if (c.length === 9 && /^\d{4}\.\d{2}\.\d{2}/.test(c[1])) {
      dialect = dialect || 'mt4';
      const type = (c[2] || '').toLowerCase();
      if (type === 'buy' || type === 'sell') {
        mt4Side.set(c[3], type === 'buy' ? 'long' : 'short');
        openLots++;
        if (openLots > 1) stacked++;
        if (openLots > maxConcurrent) maxConcurrent = openLots;
      }
      continue;
    }
  }

  trades.sort((a, b) => a.t - b.t);
  return { trades, dialect, maxConcurrent, stacked, slCloses };
}

/* ------------------------------------------------------------------ *
 * Aggregation — everything below is arithmetic on the extracted trades.
 * ------------------------------------------------------------------ */

const pct = (x) => (x === null || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);

function aggregate(trades) {
  if (!trades.length) return null;

  const first = trades[0];
  const last = trades[trades.length - 1];
  /* Balance before the first close, so month-one return has a base. */
  const startBalance = first.b !== null ? first.b - first.p : null;

  let wins = 0;
  let losses = 0;
  let grossWin = 0;
  let grossLoss = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let curWinRun = 0;
  let curLossRun = 0;
  let maxWinRun = 0;
  let maxLossRun = 0;
  let longs = 0;
  let shorts = 0;
  let sideKnown = 0;

  /* Balance-basis drawdown from the running balance column. */
  let peak = startBalance;
  let maxDD = 0;
  let maxDDPct = 0;
  let ddStart = null;
  let worstFrom = null;
  let worstTo = null;
  let recoveredAt = null;
  let inDD = false;

  const monthly = new Map(); // 'YYYY-MM' -> {profit, trades, startBal, endBal}
  const yearly = new Map();
  const curve = []; // sampled [tsSeconds, balance]

  for (let i = 0; i < trades.length; i++) {
    const tr = trades[i];
    if (tr.p > 0) {
      wins++;
      grossWin += tr.p;
      if (tr.p > largestWin) largestWin = tr.p;
      curWinRun++;
      if (curWinRun > maxWinRun) maxWinRun = curWinRun;
      curLossRun = 0;
    } else if (tr.p < 0) {
      losses++;
      grossLoss += -tr.p;
      if (tr.p < largestLoss) largestLoss = tr.p;
      curLossRun++;
      if (curLossRun > maxLossRun) maxLossRun = curLossRun;
      curWinRun = 0;
    }
    if (tr.side === 'long') {
      longs++;
      sideKnown++;
    } else if (tr.side === 'short') {
      shorts++;
      sideKnown++;
    }

    if (tr.b !== null) {
      if (peak === null || tr.b > peak) {
        peak = tr.b;
        if (inDD) {
          inDD = false;
          recoveredAt = tr.t;
        }
        ddStart = tr.t;
      } else if (peak !== null && peak > 0) {
        const dd = peak - tr.b;
        const ddP = (dd / peak) * 100;
        if (!inDD) inDD = true;
        if (ddP > maxDDPct) {
          maxDDPct = ddP;
          maxDD = dd;
          worstFrom = ddStart;
          worstTo = tr.t;
          recoveredAt = null;
        }
      }
    }

    const d = new Date(tr.t);
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const y = String(d.getUTCFullYear());
    if (!monthly.has(ym)) monthly.set(ym, { profit: 0, trades: 0, startBal: tr.b - tr.p, endBal: tr.b });
    const mo = monthly.get(ym);
    mo.profit += tr.p;
    mo.trades++;
    mo.endBal = tr.b;
    if (!yearly.has(y)) yearly.set(y, { profit: 0, trades: 0, startBal: tr.b - tr.p, endBal: tr.b, wins: 0 });
    const yr = yearly.get(y);
    yr.profit += tr.p;
    yr.trades++;
    yr.endBal = tr.b;
    if (tr.p > 0) yr.wins++;
  }

  /* Downsample the balance curve to ~400 points: enough to draw, small
     enough to inline in the page without a data request. */
  const STEP = Math.max(1, Math.floor(trades.length / 400));
  for (let i = 0; i < trades.length; i += STEP) {
    if (trades[i].b !== null) curve.push([Math.round(trades[i].t / 1000), Math.round(trades[i].b * 100) / 100]);
  }
  const lastT = trades[trades.length - 1];
  if (lastT.b !== null) curve.push([Math.round(lastT.t / 1000), Math.round(lastT.b * 100) / 100]);

  /* Every closed trade, including the ones that closed at exactly zero.
     Using wins+losses here understates the denominator and produced a
     stop-loss share above 100%. */
  const closed = trades.length;
  const breakeven = closed - wins - losses;

  return {
    counts: {
      closed,
      wins,
      losses,
      breakeven,
      longs: sideKnown ? longs : null,
      shorts: sideKnown ? shorts : null,
      sideKnown: sideKnown > 0,
    },
    rates: {
      winRate: wins + losses ? pct((wins / (wins + losses)) * 100) : null,
      lossRate: wins + losses ? pct((losses / (wins + losses)) * 100) : null,
    },
    averages: {
      avgWin: wins ? pct(grossWin / wins) : null,
      avgLoss: losses ? pct(-grossLoss / losses) : null,
      largestWin: pct(largestWin),
      largestLoss: pct(largestLoss),
      payoffRatio: wins && losses && grossLoss ? pct(grossWin / wins / (grossLoss / losses)) : null,
    },
    streaks: { maxWins: maxWinRun, maxLosses: maxLossRun },
    drawdown: {
      /* Balance basis: the deal list has no floating equity column, so this
         is closed-trade drawdown and is labelled as such on the page. */
      maxPct: pct(maxDDPct),
      maxAbs: pct(maxDD),
      worstFrom: worstFrom ? new Date(worstFrom).toISOString().slice(0, 10) : null,
      worstTo: worstTo ? new Date(worstTo).toISOString().slice(0, 10) : null,
      recovered: recoveredAt ? new Date(recoveredAt).toISOString().slice(0, 10) : null,
      recoveryDays:
        worstTo && recoveredAt ? Math.round((recoveredAt - worstTo) / 86400000) : null,
    },
    period: {
      from: new Date(first.t).toISOString().slice(0, 10),
      to: new Date(last.t).toISOString().slice(0, 10),
      startBalance: pct(startBalance),
      endBalance: pct(last.b),
      totalReturnPct: startBalance ? pct(((last.b - startBalance) / startBalance) * 100) : null,
    },
    monthly: [...monthly.entries()]
      .sort()
      .map(([ym, v]) => ({
        ym,
        trades: v.trades,
        /* Return relative to the balance at the start of that month, which is
           what makes the heatmap comparable across a 23-year test where the
           account grows by orders of magnitude. */
        pct: v.startBal ? pct((v.profit / v.startBal) * 100) : null,
      })),
    yearly: [...yearly.entries()]
      .sort()
      .map(([y, v]) => ({
        year: y,
        trades: v.trades,
        pct: v.startBal ? pct((v.profit / v.startBal) * 100) : null,
        winRate: v.trades ? pct((v.wins / v.trades) * 100) : null,
      })),
    curve,
  };
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

console.log(`\n  Extracting trade data from ${SRC}\n`);

const out = {};
const problems = [];

for (const [folder, slug] of Object.entries(FOLDER_TO_SLUG)) {
  const reports = await findReports(join(SRC, folder));
  if (!reports.length) {
    problems.push(`${slug}: no report`);
    continue;
  }

  let done = false;
  for (const path of reports) {
    let html;
    try {
      html = decode(await readFile(path));
    } catch {
      continue;
    }

    const { trades, dialect, maxConcurrent, stacked, slCloses } = extractTrades(html);
    if (trades.length < 20) continue;

    const agg = aggregate(trades);
    if (!agg) continue;

    out[slug] = {
      source: basename(path),
      dialect,
      /* Observed behaviour, not developer claims. The page labels it that
         way so nobody reads it as a spec sheet. */
      observed: {
        maxConcurrentPositions: maxConcurrent || null,
        stackedEntries: stacked || 0,
        stopLossCloses: slCloses || 0,
        stopLossShare: agg.counts.closed ? pct((slCloses / agg.counts.closed) * 100) : null,
      },
      ...agg,
    };

    const d = agg.drawdown;
    console.log(
      `  · ${slug.padEnd(10)} ${String(dialect).padEnd(4)} ${String(agg.counts.closed).padStart(6)} closed  ` +
        `${String(agg.monthly.length).padStart(4)} months  ${String(agg.yearly.length).padStart(3)} yrs  ` +
        `DD(bal) ${String(d.maxPct ?? '—').padStart(6)}%  ` +
        `streak W${String(agg.streaks.maxWins).padStart(3)}/L${String(agg.streaks.maxLosses).padStart(3)}  ` +
        `L/S ${agg.counts.sideKnown ? agg.counts.longs + '/' + agg.counts.shorts : 'n-a'}`
    );
    done = true;
    break;
  }
  if (!done) problems.push(`${slug}: ${reports.length} report(s), no usable deal list`);
}

await writeFile(join(ROOT, 'tools', 'extracted-trades.json'), JSON.stringify(out), 'utf8');

console.log(`\n  → ${Object.keys(out).length}/${Object.keys(FOLDER_TO_SLUG).length} systems extracted`);
if (problems.length) {
  console.log('\n  Unextracted:');
  for (const p of problems) console.log(`    ! ${p}`);
}
console.log('\n  → tools/extracted-trades.json written\n');
