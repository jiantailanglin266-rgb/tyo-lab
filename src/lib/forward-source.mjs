/**
 * ============================================================================
 * FORWARD DATA SOURCES (Phase 12 §6, §100)
 * ============================================================================
 * One interface, several sources:
 *
 *   ForwardDataSource
 *     ├─ CSVSource      MT4/MT5 history exports, flexible header aliases
 *     ├─ HTMLSource     MT4 account statement ("Closed Transactions") and,
 *     │                 as a warned fallback, the tester-report dialects via
 *     │                 tools/extract-trades.mjs
 *     ├─ JSONSource     already-normalized trade arrays
 *     └─ MT5MCPSource   Phase 13 stub — the adapter contract exists so a
 *                       live MCP feed can write the SAME normalized shape
 *
 * Every source returns { trades, warnings }, where each trade is the
 * normalized model (docs/FORWARD_DATA_MODEL.md) MINUS accountId/strategyId,
 * which the importer assigns. Sources never guess: a field they cannot read
 * is null, and anything suspicious lands in `warnings`.
 * ============================================================================
 */

import { decode, extractTrades } from '../../tools/extract-trades.mjs';

/* ------------------------------------------------------------------ *
 * shared parsing helpers
 * ------------------------------------------------------------------ */

/** "2020.01.02 03:04[:05]" | ISO → ms | null */
export function parseTime(v) {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[.\-/](\d{2})[.\-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  m = s.match(/^(\d{4})[.\-/](\d{2})[.\-/](\d{2})$/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

export function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const t = String(v).replace(/[\s ,]/g, (c) => (c === ',' ? (String(v).includes('.') ? '' : '.') : ''));
  // Above: "1 234.56" → 1234.56; "12,34" (comma decimal, no dot) → 12.34
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const DIR = { buy: 'long', sell: 'short', 'buy limit': 'long', 'sell limit': 'short', 'buy stop': 'long', 'sell stop': 'short' };

/* ------------------------------------------------------------------ *
 * CSVSource
 * ------------------------------------------------------------------ */

/** Header aliases → canonical field. Lower-cased, non-alnum stripped. */
const CSV_ALIASES = {
  ticket: 'ticket', order: 'ticket', deal: 'ticket', position: 'ticket',
  magic: 'magic', magicnumber: 'magic', expertid: 'magic',
  symbol: 'symbol', item: 'symbol', pair: 'symbol',
  type: 'type', direction: 'type', side: 'type',
  volume: 'volume', size: 'volume', lots: 'volume',
  opentime: 'openTime', timeopen: 'openTime', entrytime: 'openTime',
  closetime: 'closeTime', timeclose: 'closeTime', exittime: 'closeTime', time: 'closeTime',
  openprice: 'openPrice', priceopen: 'openPrice', entryprice: 'openPrice',
  closeprice: 'closePrice', priceclose: 'closePrice', exitprice: 'closePrice', price: 'closePrice',
  profit: 'profit', pl: 'profit', pnl: 'profit',
  swap: 'swap', storage: 'swap',
  commission: 'commission', comm: 'commission',
  fee: 'fees', fees: 'fees', taxes: 'fees', tax: 'fees',
  sl: 'sl', stoploss: 'sl',
  tp: 'tp', takeprofit: 'tp',
  comment: 'comment',
};

function splitCSVLine(line, delim) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === delim) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseCSV(text) {
  const warnings = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { trades: [], warnings: ['CSV has no data rows'] };

  const delim = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
  const header = splitCSVLine(lines[0], delim).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const cols = header.map((h) => CSV_ALIASES[h] || null);

  if (!cols.includes('closeTime') || !cols.includes('profit')) {
    return { trades: [], warnings: [`CSV header not recognised (need close time + profit). Header: ${lines[0]}`] };
  }

  const trades = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = splitCSVLine(lines[li], delim);
    const row = {};
    cols.forEach((k, i) => { if (k) row[k] = cells[i]; });

    const type = String(row.type || '').toLowerCase();
    if (type && !(type in DIR) && !/^(buy|sell)/.test(type)) continue; // balance/deposit rows

    const closeTime = parseTime(row.closeTime);
    const profit = num(row.profit);
    if (closeTime === null || profit === null) {
      warnings.push(`row ${li + 1}: unparseable close time or profit — skipped`);
      continue;
    }
    const swap = num(row.swap) ?? 0;
    const commission = num(row.commission) ?? 0;
    const fees = num(row.fees) ?? 0;

    trades.push({
      ticket: row.ticket ? String(row.ticket) : null,
      magic: row.magic !== undefined && row.magic !== '' ? Number(row.magic) : null,
      symbol: row.symbol || null,
      direction: DIR[type] || (/^buy/.test(type) ? 'long' : /^sell/.test(type) ? 'short' : null),
      volume: num(row.volume),
      openTime: parseTime(row.openTime),
      closeTime,
      openPrice: num(row.openPrice),
      closePrice: num(row.closePrice),
      profit,
      swap,
      commission,
      fees,
      netProfit: profit + swap + commission + fees,
      sl: num(row.sl),
      tp: num(row.tp),
      comment: row.comment || null,
    });
  }
  return { trades, warnings };
}

/* ------------------------------------------------------------------ *
 * HTMLSource — MT4 account statement ("Closed Transactions") first,
 * tester dialects as a warned fallback.
 * ------------------------------------------------------------------ */

const ROW = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
const CELL = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

function cellsOf(rowHtml) {
  CELL.lastIndex = 0;
  const out = [];
  let m;
  while ((m = CELL.exec(rowHtml))) {
    out.push(m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ').trim());
  }
  return out;
}

/** MT4 statement closed-transaction rows:
 *  Ticket | Open Time | Type | Size | Item | Price | S/L | T/P | Close Time | Price | Commission | Taxes | Swap | Profit */
function parseMT4Statement(html) {
  ROW.lastIndex = 0;
  const trades = [];
  let m;
  while ((m = ROW.exec(html))) {
    const c = cellsOf(m[1]);
    if (c.length < 14) continue;
    const type = String(c[2] || '').toLowerCase();
    if (type !== 'buy' && type !== 'sell') continue;
    const openTime = parseTime(c[1]);
    const closeTime = parseTime(c[8]);
    const profit = num(c[13]);
    if (openTime === null || closeTime === null || profit === null) continue;
    const commission = num(c[10]) ?? 0;
    const fees = num(c[11]) ?? 0;
    const swap = num(c[12]) ?? 0;
    trades.push({
      ticket: c[0] || null,
      magic: null, // MT4 statements do not carry magic numbers
      symbol: c[4] ? c[4].toUpperCase() : null,
      direction: type === 'buy' ? 'long' : 'short',
      volume: num(c[3]),
      openTime,
      closeTime,
      openPrice: num(c[5]),
      closePrice: num(c[9]),
      profit,
      swap,
      commission,
      fees,
      netProfit: profit + swap + commission + fees,
      sl: num(c[6]),
      tp: num(c[7]),
      comment: null,
    });
  }
  return trades;
}

export function parseHTML(buf) {
  const html = typeof buf === 'string' ? buf : decode(buf);
  const warnings = [];

  const statement = parseMT4Statement(html);
  if (statement.length) return { trades: statement, warnings };

  /* fallback: tester-report dialects (no tickets, no cost split) */
  const { trades: tester } = extractTrades(html);
  if (tester.length) {
    warnings.push(
      'HTML matched the tester-report dialect, not an account statement: no tickets, swap/commission not separated. ' +
        'Tickets are synthesized from close time + index; prefer a CSV history export.'
    );
    return {
      trades: tester.map((t, i) => ({
        ticket: `T${t.t}-${i}`,
        magic: null,
        symbol: null,
        direction: t.side || null,
        volume: null,
        openTime: null,
        closeTime: t.t,
        openPrice: null,
        closePrice: null,
        profit: t.p,
        swap: 0,
        commission: 0,
        fees: 0,
        netProfit: t.p,
        sl: null,
        tp: null,
        comment: null,
      })),
      warnings,
    };
  }
  return { trades: [], warnings: ['no recognisable trade table in HTML'] };
}

/* ------------------------------------------------------------------ *
 * JSONSource — already-normalized arrays (e.g. from a future exporter)
 * ------------------------------------------------------------------ */

export function parseJSON(text) {
  const warnings = [];
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { trades: [], warnings: ['invalid JSON'] };
  }
  const list = Array.isArray(data) ? data : Array.isArray(data.trades) ? data.trades : null;
  if (!list) return { trades: [], warnings: ['JSON is not a trade array (or {trades: []})'] };

  const trades = [];
  for (const [i, t] of list.entries()) {
    const closeTime = typeof t.closeTime === 'number' ? t.closeTime : parseTime(t.closeTime);
    const profit = num(t.profit);
    if (closeTime === null || profit === null) {
      warnings.push(`entry ${i}: missing closeTime/profit — skipped`);
      continue;
    }
    const swap = num(t.swap) ?? 0;
    const commission = num(t.commission) ?? 0;
    const fees = num(t.fees) ?? 0;
    trades.push({
      ticket: t.ticket != null ? String(t.ticket) : null,
      magic: t.magic != null ? Number(t.magic) : null,
      symbol: t.symbol || null,
      direction: t.direction === 'long' || t.direction === 'short' ? t.direction : null,
      volume: num(t.volume),
      openTime: typeof t.openTime === 'number' ? t.openTime : parseTime(t.openTime),
      closeTime,
      openPrice: num(t.openPrice),
      closePrice: num(t.closePrice),
      profit,
      swap,
      commission,
      fees,
      netProfit: num(t.netProfit) ?? profit + swap + commission + fees,
      sl: num(t.sl),
      tp: num(t.tp),
      comment: t.comment || null,
    });
  }
  return { trades, warnings };
}

/* ------------------------------------------------------------------ *
 * MT5MCPSource — Phase 13 adapter contract (NOT implemented in Phase 12)
 * ------------------------------------------------------------------ */

/**
 * Contract: an MCP bridge must deliver trades in the JSONSource shape and
 * call the same importer, so a live feed gets identical validation, mapping,
 * dedupe and privacy treatment as a file import. No network code ships in
 * Phase 12 (§58, §100).
 */
export const MT5MCPSource = {
  implemented: false,
  expects: 'JSONSource trade array via the import pipeline',
};

/** Pick a parser by file extension. */
export function sourceFor(path) {
  const ext = path.toLowerCase().split('.').pop();
  if (ext === 'csv') return { name: 'CSV', parse: (buf) => parseCSV(decode(buf)) };
  if (ext === 'html' || ext === 'htm') return { name: 'HTML', parse: (buf) => parseHTML(buf) };
  if (ext === 'json') return { name: 'JSON', parse: (buf) => parseJSON(decode(buf)) };
  return null;
}
