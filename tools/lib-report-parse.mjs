/**
 * Shared MetaTrader report-header parsing, extracted for reuse by
 * scan-alt-reports.mjs. Kept byte-identical in behaviour to the logic in
 * import-reports.mjs (which stays a standalone script and is not imported to
 * avoid running its side effects).
 */

export function decode(buf) {
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

const LABELS = {
  symbol: ['symbol', '通貨ペア'],
  period: ['period', '期間'],
  model: ['model', 'モデル'],
  bars: ['bars in test', 'bars', 'テストバー数'],
  ticks: ['ticks modelled', 'ticks', 'モデルティック数'],
  quality: ['modelling quality', 'modeling quality', 'quality', 'モデリング品質'],
  deposit: ['initial deposit', '初期証拠金'],
  spread: ['spread', 'スプレッド'],
  netProfit: ['total net profit', '純益'],
  profitFactor: ['profit factor', 'プロフィットファクタ', 'プロフィットファクター'],
  expectedPayoff: ['expected payoff', '期待利得'],
  eqDrawdownMax: ['equity drawdown maximal'],
  eqDrawdownRel: ['equity drawdown relative'],
  balDrawdownMax: ['maximal drawdown', 'balance drawdown maximal', '最大ドローダウン'],
  balDrawdownRel: ['relative drawdown', 'balance drawdown relative', '相対ドローダウン'],
  totalTrades: ['total trades', '総取引数', '取引総数'],
  profitTrades: ['profit trades (% of total)', '勝率(%)', '勝率 (%)'],
  recoveryFactor: ['recovery factor', 'リカバリーファクター', 'リカバリファクタ'],
  sharpe: ['sharpe ratio', 'シャープレシオ'],
  currency: ['currency', '通貨'],
  broker: ['broker', 'company', 'ブローカー'],
};

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

export function extractPairs(html) {
  const head = html.slice(0, 250000);
  const cells = [...head.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
    m[1]
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/ /g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
  const out = {};
  for (let i = 0; i < cells.length; i++) {
    const key = canonical(cells[i]);
    if (!key || key in out) continue;
    for (let j = i + 1; j < Math.min(i + 5, cells.length); j++) {
      if (cells[j] && !canonical(cells[j])) {
        out[key] = cells[j];
        break;
      }
    }
  }
  return out;
}

export function num(v) {
  if (v === undefined || v === null) return null;
  const m = String(v)
    .replace(/ /g, ' ')
    .match(/-?[\d\s,]*\d(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/[\s,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export const pct = (v) => {
  const m = String(v ?? '').match(/([\d.,]+)\s*%/);
  return m ? Number(m[1]) : null;
};

export function dateRange(period) {
  const s = String(period ?? '');
  const m = s.match(/(\d{4}\.\d{2}\.\d{2})[^\d]*(?:\d{2}:\d{2})?\s*-\s*(\d{4}\.\d{2}\.\d{2})/);
  return m ? `${m[1]} – ${m[2]}` : null;
}

export function timeframeOf(period) {
  const m = String(period ?? '').match(/\b(M1|M5|M15|M30|H1|H4|D1|W1|MN1?)\b/);
  return m ? m[1] : null;
}

/** Normalised summary of one report file. */
export function summarise(html) {
  const p = extractPairs(html);
  const hasEquity = p.eqDrawdownMax !== undefined || p.eqDrawdownRel !== undefined;
  const ddRawMax = hasEquity ? p.eqDrawdownMax : p.balDrawdownMax;
  const ddRawRel = hasEquity ? p.eqDrawdownRel : p.balDrawdownRel;
  const cands = [pct(ddRawMax), pct(ddRawRel)].filter((x) => x !== null);
  const winPct = pct(p.profitTrades);

  return {
    dialect: hasEquity ? 'mt5' : 'mt4',
    symbol: (String(p.symbol ?? '').match(/^(\S+)/) || [])[1] || null,
    timeframe: timeframeOf(p.period),
    period: dateRange(p.period),
    deposit: num(p.deposit),
    currency: p.currency ? String(p.currency).trim() : null,
    netProfit: num(p.netProfit),
    profitFactor: num(p.profitFactor),
    maxDrawdownPct: cands.length ? Math.max(...cands) : null,
    drawdownBasis: hasEquity ? 'equity' : 'balance',
    trades: num(p.totalTrades),
    winRate: winPct,
    expectedPayoff: num(p.expectedPayoff),
    recoveryFactor: num(p.recoveryFactor),
    sharpe: num(p.sharpe),
    quality: p.quality ? String(p.quality).trim() : null,
  };
}
