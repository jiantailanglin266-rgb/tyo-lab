/**
 * ============================================================================
 * MetaTrader Strategy Tester report importer
 * ============================================================================
 *   node tools/import-reports.mjs <source-dir>
 *
 * Reads the tester reports that sit next to each EA's source and writes
 * tools/imported-reports.json — the evidenced backtest data that
 * src/data/ea.mjs consumes.
 *
 * THREE REPORT DIALECTS ARE HANDLED
 *   1. MT5  — UTF-16LE, English labels that end with ':'
 *   2. MT4  — Shift-JIS, Japanese labels, value in the next cell
 *   3. MT4  — UTF-8/ANSI, English labels, value in the next cell
 *
 * WHY THIS IS A SEPARATE STEP
 *   The site refuses to render a metric it was not given, so every number has
 *   to come from an evidenced source. This importer is that source: values are
 *   copied verbatim from a tester report and the test conditions (broker,
 *   spread, modelling quality, period, tick count) travel with them.
 *
 * NOTHING IS INVENTED. A field the report does not contain stays null.
 * ============================================================================
 */

import { readFile, readdir, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];

if (!SRC) {
  console.error('usage: node tools/import-reports.mjs <source-dir>');
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * 1. Decoding
 * ------------------------------------------------------------------ */

/** MT5 writes UTF-16LE; Japanese MT4 writes Shift-JIS; others are UTF-8. */
function decode(buf) {
  if (buf[0] === 0xff && buf[1] === 0xfe) return { text: buf.toString('utf16le'), enc: 'utf-16le' };
  if (buf[0] === 0xfe && buf[1] === 0xff) return { text: buf.swap16().toString('utf16le'), enc: 'utf-16be' };

  const utf8 = buf.toString('utf8');
  // U+FFFD means the bytes were not valid UTF-8 — almost always Shift-JIS here.
  if (utf8.includes('�')) {
    try {
      return { text: new TextDecoder('shift_jis').decode(buf), enc: 'shift_jis' };
    } catch {
      /* fall through */
    }
  }
  return { text: utf8, enc: 'utf-8' };
}

const stripTags = (s) =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

/* ------------------------------------------------------------------ *
 * 2. Label dictionary — every dialect maps onto one canonical key
 * ------------------------------------------------------------------ */

const LABELS = {
  symbol: ['symbol', '通貨ペア'],
  period: ['period', '期間'],
  model: ['model', 'モデル'],
  inputs: ['inputs', 'parameters', 'パラメーター', 'パラメータ'],
  bars: ['bars in test', 'bars', 'テストバー数'],
  ticks: ['ticks modelled', 'ticks', 'モデルティック数'],
  quality: ['modelling quality', 'modeling quality', 'quality', 'モデリング品質'],
  deposit: ['initial deposit', '初期証拠金'],
  spread: ['spread', 'スプレッド'],
  netProfit: ['total net profit', '純益'],
  grossProfit: ['gross profit', '総利益'],
  grossLoss: ['gross loss', '総損失'],
  profitFactor: ['profit factor', 'プロフィットファクタ', 'プロフィットファクター'],
  expectedPayoff: ['expected payoff', '期待利得'],
  absDrawdown: ['absolute drawdown', 'balance drawdown absolute', '絶対ドローダウン'],
  // Equity and balance drawdown are kept apart on purpose. For a system that
  // holds losing positions open, balance drawdown can be a small fraction of
  // the real peak-to-trough equity dip, so reporting it as "the" drawdown
  // would understate the risk. Equity always wins when both are present.
  eqDrawdownMax: ['equity drawdown maximal'],
  eqDrawdownRel: ['equity drawdown relative'],
  balDrawdownMax: ['maximal drawdown', 'balance drawdown maximal', '最大ドローダウン'],
  balDrawdownRel: ['relative drawdown', 'balance drawdown relative', '相対ドローダウン'],
  totalTrades: ['total trades', '総取引数', '取引総数'],
  profitTrades: ['profit trades (% of total)', '勝率(%)', '勝率 (%)'],
  lossTrades: ['loss trades (% of total)', '敗率 (%)', '敗率(%)'],
  recoveryFactor: ['recovery factor', 'リカバリーファクター', 'リカバリファクタ'],
  sharpe: ['sharpe ratio', 'シャープレシオ'],
  currency: ['currency', '通貨'],
  broker: ['broker', 'company', 'ブローカー'],
};

/** canonical key for a raw label, or null */
function canonical(label) {
  const l = label
    .replace(/[:：]\s*$/, '')
    .trim()
    .toLowerCase();
  for (const [key, names] of Object.entries(LABELS)) {
    if (names.some((n) => l === n)) return key;
  }
  return null;
}

/**
 * Walk the flat cell list and pair each recognised label with the next
 * non-empty cell. This survives MT4/MT5 colspan differences, which modelling
 * the table structure would not.
 */
const IS_INPUT = /^[A-Za-z_]\w*\s*=/;

function extractPairs(html) {
  const head = html.slice(0, 250000); // the summary sits well before the deal list
  const cells = [...head.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => stripTags(m[1]));
  const out = {};
  for (let i = 0; i < cells.length; i++) {
    const key = canonical(cells[i]);
    if (!key || key in out) continue;

    // MT4 packs every EA input into one semicolon-separated cell; MT5 gives
    // each input its own row. Collect the whole run either way.
    if (key === 'inputs') {
      const parts = [];
      for (let j = i + 1; j < cells.length; j++) {
        const c = cells[j];
        if (!c) continue; // MT5 interleaves empty spacer cells
        if (!IS_INPUT.test(c)) break;
        parts.push(c);
        if (parts.length > 200) break;
      }
      if (parts.length) out.inputs = parts.join('; ');
      continue;
    }

    for (let j = i + 1; j < Math.min(i + 5, cells.length); j++) {
      if (cells[j] && !canonical(cells[j])) {
        out[key] = cells[j];
        break;
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 3. Normalising values
 * ------------------------------------------------------------------ */

const clean = (v) => (v === undefined || v === null || v === '' ? null : String(v).replace(/ /g, ' ').trim());

/** "1 234.56" / "1,234.56" / "-12.34 (5.67%)" → number, or null */
function num(v) {
  if (v === undefined || v === null) return null;
  const m = String(v)
    .replace(/ /g, ' ')
    .match(/-?[\d\s,]*\d(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/[\s,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** First percentage inside a string, e.g. "2779156.19 (18.17%)" → "18.17" */
const pct = (v) => (String(v ?? '').match(/([\d.,]+)\s*%/) || [])[1] || null;

const fmt = (n, digits = 2) =>
  n === null ? null : n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Modelling method, normalised to something a non-MT4 reader can parse. */
function modelText(raw) {
  const s = clean(raw);
  if (!s) return null;
  if (/全ティック|every tick/i.test(s)) return 'Every tick';
  if (/コントロールポイント|control points/i.test(s)) return 'Control points';
  if (/始値|open prices/i.test(s)) return 'Open prices only';
  return s;
}

/** Spread, normalised. */
function spreadText(raw) {
  const s = clean(raw);
  if (!s) return null;
  if (/変動|current|floating|variable/i.test(s)) return 'Variable (as recorded in the tick data)';
  return s;
}

/**
 * Timeframe out of a period string.
 * MT5: "M5 2019.01.01 - 2024.12.31"   MT4-JP: "5分足(M5) 2003.05.05 ..."
 */
function timeframe(period) {
  const m = String(period ?? '').match(/\b(M1|M5|M15|M30|H1|H4|D1|W1|MN1?)\b/);
  return m ? m[1] : null;
}

/** Just the date range out of a period string. */
function dateRange(period) {
  const s = String(period ?? '');
  const m = s.match(/(\d{4}\.\d{2}\.\d{2})[^\d]*(?:\d{2}:\d{2})?\s*-\s*(\d{4}\.\d{2}\.\d{2})/);
  return m ? `${m[1]} – ${m[2]}` : null;
}

/** Years covered, for the label. */
function span(period) {
  const r = dateRange(period);
  if (!r) return null;
  const [a, b] = r.split(' – ').map((d) => d.slice(0, 4));
  return a === b ? a : `${a}–${b}`;
}

/* ------------------------------------------------------------------ *
 * 4. Report → site shape
 * ------------------------------------------------------------------ */

function toRecord(p, meta) {
  const symbolRaw = clean(p.symbol) || '';
  const symbol = (symbolRaw.match(/^(\S+)/) || [])[1] || null;
  const period = clean(p.period);
  const tf = timeframe(period);
  const range = dateRange(period);

  const currency = clean(p.currency) || meta.currency || null;
  const cur = currency ? ` ${currency}` : '';
  /** Money is only publishable once it carries a unit. */
  const money = (n) => (currency && n !== null ? `${fmt(n)}${cur}` : null);

  const deposit = num(p.deposit);
  const net = num(p.netProfit);

  // Drawdown: equity basis when the report has it, balance basis otherwise.
  // The basis is recorded so the page can state which one it is showing.
  const hasEquity = p.eqDrawdownMax !== undefined || p.eqDrawdownRel !== undefined;
  const ddRawMax = hasEquity ? p.eqDrawdownMax : p.balDrawdownMax;
  const ddRawRel = hasEquity ? p.eqDrawdownRel : p.balDrawdownRel;
  const ddBasis = hasEquity ? 'equity' : 'balance';

  const ddMoney = num(ddRawMax);
  // MT reports print "money (pct%)" on the maximal row and "pct% (money)" on
  // the relative row; take the largest percentage either row states.
  const pctCandidates = [pct(ddRawMax), pct(ddRawRel)].filter(Boolean).map(Number);
  const ddPct = pctCandidates.length ? Math.max(...pctCandidates).toFixed(2) : null;

  let maxDrawdown = null;
  if (ddPct && currency && ddMoney !== null) maxDrawdown = `${ddPct}% (${fmt(ddMoney)}${cur})`;
  else if (ddPct) maxDrawdown = `${ddPct}%`;
  else maxDrawdown = money(ddMoney);

  const trades = num(p.totalTrades);
  const winPct = pct(p.profitTrades);

  // MT4 has no recovery-factor row. Deriving it (net profit ÷ max drawdown)
  // would mix a balance-based drawdown into a figure readers expect to be
  // equity-based, so it is left out rather than approximated.
  const recovery = num(p.recoveryFactor);

  const qualityBits = [];
  if (clean(p.quality)) qualityBits.push(clean(p.quality));
  if (num(p.ticks) !== null) qualityBits.push(`${num(p.ticks).toLocaleString('en-US')} ticks`);
  if (num(p.bars) !== null) qualityBits.push(`${num(p.bars).toLocaleString('en-US')} bars`);

  const backtest = {
    id: 'bt-full',
    label: [symbol, tf, span(period)].filter(Boolean).join(' · ') || null,
    period: range,
    initialDeposit: currency && deposit !== null ? `${fmt(deposit, 0)}${cur}` : null,
    netProfit: money(net),
    maxDrawdown,
    profitFactor: fmt(num(p.profitFactor)),
    totalTrades: trades !== null ? trades.toLocaleString('en-US') : null,
    winRate: winPct ? `${winPct}%` : null,
    recoveryFactor: fmt(recovery),
    expectedPayoff: money(num(p.expectedPayoff)),
    sharpe: fmt(num(p.sharpe)),
    conditions: {
      broker: clean(p.broker) || meta.server || null,
      spread: spreadText(p.spread),
      commission: null, // reported per-deal, not in the header
      modeling: modelText(p.model),
      dataSource: symbolRaw || null,
      quality: qualityBits.length ? qualityBits.join(' · ') : null,
      drawdownBasis: ddBasis,
    },
    report: null,
  };

  const parameters = String(p.inputs ?? '')
    .split(/;\s*/)
    .map((s) => s.trim())
    .filter((s) => s.includes('='))
    .map((s) => {
      const i = s.indexOf('=');
      return { name: s.slice(0, i).trim(), default: s.slice(i + 1).trim().replace(/^"|"$/g, ''), descKey: null };
    })
    // Drop the "------ Section ------" separators MT4 EAs use as headings,
    // and any input whose value did not survive (nothing to document).
    .filter((x) => x.name && x.default && !/^-{2,}/.test(x.default.replace(/\s/g, '')));

  return { symbol, timeframe: tf, period: range, backtest, parameters };
}

/* ------------------------------------------------------------------ *
 * 5a. Account currency
 *
 * MT5 reports state the deposit currency; the Japanese MT4 reports do not.
 * A money figure with no unit cannot be read correctly — "3,000,000" is a
 * very different result in JPY than in USD — so unlabelled money figures are
 * DROPPED rather than shown bare or guessed at. Percentages, ratios and trade
 * counts are unit-free and survive.
 *
 * To publish the money figures for those systems, state the account currency
 * of the test here and re-run the importer.
 * ------------------------------------------------------------------ */

const CURRENCY = {
  // slug: 'JPY',
};

/* ------------------------------------------------------------------ *
 * 5b. Folder → slug, and choosing the headline report
 * ------------------------------------------------------------------ */

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

/** Prefer the full-history run; never an optimisation pass. */
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
 * 6. Equity curve
 * MetaTrader saves the balance/equity graph next to the report under the
 * same base name (.png for MT5, .gif for MT4). Copying it in gives each EA
 * page the one chart that actually explains the numbers above it.
 * ------------------------------------------------------------------ */

const CURVE_DIR = join(ROOT, 'public', 'assets', 'images', 'backtest');

const exists = (p) => access(p, constants.F_OK).then(() => true, () => false);

async function copyCurve(reportPath, slug) {
  const base = reportPath.slice(0, -extname(reportPath).length);
  for (const ext of ['.png', '.gif']) {
    if (await exists(base + ext)) {
      await mkdir(CURVE_DIR, { recursive: true });
      const dest = join(CURVE_DIR, slug + ext);
      await copyFile(base + ext, dest);
      return `/assets/images/backtest/${slug}${ext}`;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * 7. Run
 * ------------------------------------------------------------------ */

console.log(`\n  Importing tester reports from ${SRC}\n`);

const results = {};
const problems = [];

for (const [folder, slug] of Object.entries(FOLDER_TO_SLUG)) {
  const reports = await findReports(join(SRC, folder));
  if (!reports.length) {
    problems.push(`${slug}: no report file found`);
    continue;
  }

  let chosen = null;
  for (const path of reports) {
    let text;
    let enc;
    try {
      ({ text, enc } = decode(await readFile(path)));
    } catch (err) {
      continue;
    }
    const pairs = extractPairs(text);
    if (!pairs.symbol && !pairs.netProfit) continue;

    const server = (text.match(/<meta name="server" content="([^"]*)"/i) || [])[1] || null;
    const rec = toRecord(pairs, { server, currency: CURRENCY[slug] || null });
    if (!rec.backtest.totalTrades) continue;

    const curve = await copyCurve(path, slug);
    chosen = { ...rec, curve, source: basename(path), encoding: enc, alternates: reports.length - 1 };
    break;
  }

  if (!chosen) {
    problems.push(`${slug}: ${reports.length} report file(s) but none parsed`);
    continue;
  }

  results[slug] = chosen;
  const b = chosen.backtest;
  console.log(
    `  · ${slug.padEnd(10)} ${(chosen.symbol || '?').padEnd(8)} ${(chosen.timeframe || '?').padEnd(4)} ` +
      `${(b.period || '?').padEnd(26)} trades=${String(b.totalTrades ?? '-').padStart(7)}  ` +
      `PF=${String(b.profitFactor ?? '-').padStart(5)}  win=${String(b.winRate ?? '-').padStart(7)}  ` +
      `DD=${String(b.maxDrawdown ?? '-').padStart(24)}`
  );
}

await writeFile(join(ROOT, 'tools', 'imported-reports.json'), JSON.stringify(results, null, 2), 'utf8');

console.log(`\n  → ${Object.keys(results).length}/${Object.keys(FOLDER_TO_SLUG).length} reports parsed`);
if (problems.length) {
  console.log('\n  Unparsed:');
  for (const p of problems) console.log(`    ! ${p}`);
}
console.log(`\n  → tools/imported-reports.json written\n`);
