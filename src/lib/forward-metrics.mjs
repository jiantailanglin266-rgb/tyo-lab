/**
 * ============================================================================
 * FORWARD METRICS — pure arithmetic over normalized trades (Phase 12)
 * ============================================================================
 * Input everywhere: the normalized trade model (docs/FORWARD_DATA_MODEL.md),
 * minimally { netProfit, closeTime } with optional { openTime, direction,
 * symbol, swap, commission, fees, profit }.
 *
 * Honesty rules baked in:
 *   - Everything money-denominated stays in the ACCOUNT CURRENCY; percentage
 *     returns exist only when a verified starting balance is provided.
 *   - Drawdown here is BALANCE-BASED (cumulative net by close time) — the
 *     trade list has no floating-equity column, and the caller must label it
 *     that way. Equity DD is a separate field, only from real equity data.
 *   - Anything not computable returns null. Nothing is estimated.
 * ============================================================================
 */

const MS_DAY = 86400000;
const r2 = (x) => (x === null || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);

/* ------------------------------------------------------------------ *
 * Core metric bag (§14–15)
 * ------------------------------------------------------------------ */

export function computeMetrics(trades, { startBalance = null } = {}) {
  if (!trades.length) return null;
  const sorted = [...trades].sort((a, b) => a.closeTime - b.closeTime);

  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let swap = 0;
  let commission = 0;
  let fees = 0;
  let grossTradeProfit = 0;
  let longs = 0;
  let shorts = 0;
  let longGP = 0;
  let longGL = 0;
  let shortGP = 0;
  let shortGL = 0;
  let holdMs = 0;
  let holdN = 0;

  /* balance-based drawdown on cumulative NET profit */
  let cum = 0;
  let peak = 0;
  let maxDD = 0; // currency
  let maxDDPctOfBalance = null;

  for (const t of sorted) {
    const net = t.netProfit;
    if (net > 0) {
      wins++;
      grossProfit += net;
    } else if (net < 0) {
      losses++;
      grossLoss += -net;
    }
    swap += t.swap || 0;
    commission += t.commission || 0;
    fees += t.fees || 0;
    grossTradeProfit += t.profit ?? net;

    if (t.direction === 'long') {
      longs++;
      if (net > 0) longGP += net;
      else longGL += -net;
    } else if (t.direction === 'short') {
      shorts++;
      if (net > 0) shortGP += net;
      else shortGL += -net;
    }

    if (t.openTime && t.closeTime && t.closeTime >= t.openTime) {
      holdMs += t.closeTime - t.openTime;
      holdN++;
    }

    cum += net;
    if (cum > peak) peak = cum;
    else {
      const dd = peak - cum;
      if (dd > maxDD) maxDD = dd;
    }
  }

  if (startBalance !== null && startBalance > 0 && maxDD > 0) {
    /* worst decline relative to the balance at the running peak */
    maxDDPctOfBalance = (maxDD / (startBalance + peak)) * 100;
  }

  const n = sorted.length;
  const netProfit = grossProfit - grossLoss;
  const decided = wins + losses;

  /* per-trade Sharpe-like ratio (mean/sd of trade net), stated as such */
  let sd = null;
  if (n > 1) {
    const mean = netProfit / n;
    let v = 0;
    for (const t of sorted) v += (t.netProfit - mean) * (t.netProfit - mean);
    sd = Math.sqrt(v / (n - 1));
  }

  return {
    trades: n,
    netProfit: r2(netProfit),
    grossProfit: r2(grossProfit),
    grossLoss: r2(-grossLoss),
    grossTradeProfit: r2(grossTradeProfit),
    swap: r2(swap),
    commission: r2(commission),
    fees: r2(fees),
    profitFactor: grossLoss > 0 ? r2(grossProfit / grossLoss) : grossProfit > 0 ? null : null,
    winRate: decided ? r2((wins / decided) * 100) : null,
    avgWin: wins ? r2(grossProfit / wins) : null,
    avgLoss: losses ? r2(-grossLoss / losses) : null,
    payoffRatio: wins && losses && grossLoss ? r2(grossProfit / wins / (grossLoss / losses)) : null,
    expectedPayoff: r2(netProfit / n),
    maxDrawdown: r2(maxDD),
    maxDrawdownBasis: 'balance',
    relativeDrawdownPct: r2(maxDDPctOfBalance),
    recoveryFactor: maxDD > 0 ? r2(netProfit / maxDD) : null,
    sharpePerTrade: sd && sd > 0 ? r2(netProfit / n / sd) : null,
    longTrades: longs || shorts ? longs : null,
    shortTrades: longs || shorts ? shorts : null,
    longPF: longGL > 0 ? r2(longGP / longGL) : null,
    shortPF: shortGL > 0 ? r2(shortGP / shortGL) : null,
    avgHoldingHours: holdN ? r2(holdMs / holdN / 3600000) : null,
    swapShareOfGrossPct: grossProfit > 0 && swap < 0 ? r2((-swap / grossProfit) * 100) : null,
    commissionShareOfGrossPct: grossProfit > 0 && commission < 0 ? r2((-commission / grossProfit) * 100) : null,
  };
}

/* ------------------------------------------------------------------ *
 * Period & frequency (§13, §22)
 * ------------------------------------------------------------------ */

export function periodOf(trades) {
  if (!trades.length) return null;
  const times = trades.map((t) => t.closeTime).sort((a, b) => a - b);
  const from = times[0];
  const to = times[times.length - 1];
  const days = Math.max(1, Math.round((to - from) / MS_DAY) + 1);
  return {
    from: new Date(from).toISOString().slice(0, 10),
    to: new Date(to).toISOString().slice(0, 10),
    days,
  };
}

export function frequencyOf(trades) {
  const p = periodOf(trades);
  if (!p) return null;
  return {
    perDay: r2(trades.length / p.days),
    perMonth: r2(trades.length / (p.days / 30.44)),
    perYear: r2(trades.length / (p.days / 365.25)),
  };
}

/* ------------------------------------------------------------------ *
 * Rolling windows (§24–25)
 * ------------------------------------------------------------------ */

export function rollingByDays(trades, days, asOf = null) {
  if (!trades.length) return [];
  const end = asOf ?? Math.max(...trades.map((t) => t.closeTime));
  const from = end - days * MS_DAY;
  return trades.filter((t) => t.closeTime > from && t.closeTime <= end);
}

export function rollingByTrades(trades, count) {
  const sorted = [...trades].sort((a, b) => a.closeTime - b.closeTime);
  return sorted.slice(-count);
}

/* ------------------------------------------------------------------ *
 * Breakdowns (§33–37)
 * ------------------------------------------------------------------ */

function bucketMetrics(list) {
  if (!list.length) return null;
  const m = computeMetrics(list);
  return { trades: m.trades, netProfit: m.netProfit, profitFactor: m.profitFactor, winRate: m.winRate };
}

export function sessionBreakdown(trades, sessions) {
  const out = {};
  for (const [name, [from, to]] of Object.entries(sessions)) {
    const list = trades.filter((t) => {
      const h = new Date(t.closeTime).getUTCHours();
      return h >= from && h < to;
    });
    out[name] = bucketMetrics(list);
  }
  return out;
}

export function hourBreakdown(trades) {
  const out = {};
  for (let h = 0; h < 24; h++) {
    const list = trades.filter((t) => new Date(t.closeTime).getUTCHours() === h);
    if (list.length) out[h] = bucketMetrics(list);
  }
  return out;
}

export function dayOfWeekBreakdown(trades) {
  const names = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const out = {};
  for (let d = 0; d < 7; d++) {
    const list = trades.filter((t) => new Date(t.closeTime).getUTCDay() === d);
    if (list.length) out[names[d]] = bucketMetrics(list);
  }
  return out;
}

export function symbolBreakdown(trades) {
  const out = {};
  for (const sym of new Set(trades.map((t) => t.symbol).filter(Boolean))) {
    out[sym] = bucketMetrics(trades.filter((t) => t.symbol === sym));
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Degradation detection (§23, §26–31)
 * Deterministic. Baseline is chosen by the caller (§31); this function
 * only compares and classifies.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Evidence qualification (§45–46) — the ✓ rule, testable in isolation
 * ------------------------------------------------------------------ */

export function qualifiesForward({ trades, days, mappingOk }, config) {
  return trades >= config.minForwardTrades && days >= config.minForwardDays && mappingOk === true;
}

export function degradationOf({ rolling, baseline, config }) {
  const T = config.degradationThresholds;

  if (!rolling || rolling.trades < config.minRollingTrades) {
    return {
      state: 'INSUFFICIENT_DATA',
      reason: `rolling sample ${rolling ? rolling.trades : 0} < ${config.minRollingTrades}`,
      pfRatio: null,
      confidence: null,
      sample: rolling ? rolling.trades : 0,
    };
  }
  if (!baseline || !baseline.profitFactor) {
    return { state: 'INSUFFICIENT_DATA', reason: 'no baseline PF', pfRatio: null, confidence: null, sample: rolling.trades };
  }

  const signals = [];
  let pfRatio = null;
  if (rolling.profitFactor !== null) {
    pfRatio = rolling.profitFactor / baseline.profitFactor;
    if (pfRatio < T.pfRatioSevere) signals.push(['SEVERE', 'pf']);
    else if (pfRatio < T.pfRatioDegraded) signals.push(['DEGRADED', 'pf']);
    else if (pfRatio < T.pfRatioWatch) signals.push(['WATCH', 'pf']);
  }
  let freqRatio = null;
  if (rolling.perMonth !== null && rolling.perMonth !== undefined && baseline.tradesPerMonth) {
    freqRatio = rolling.perMonth / baseline.tradesPerMonth;
    if (freqRatio < T.freqRatioWatch) signals.push(['WATCH', 'frequency']);
  }
  let ddRatio = null;
  if (rolling.maxDrawdown !== null && baseline.maxDrawdown) {
    ddRatio = rolling.maxDrawdown / baseline.maxDrawdown;
    if (ddRatio > T.ddSevereMultiple) signals.push(['SEVERE', 'drawdown']);
  }

  const order = { NORMAL: 0, WATCH: 1, DEGRADED: 2, SEVERE: 3 };
  let state = 'NORMAL';
  for (const [s] of signals) if (order[s] > order[state]) state = s;

  const n = rolling.trades;
  const confidence = n >= config.confidence.high ? 'HIGH' : n >= config.confidence.medium ? 'MEDIUM' : 'LOW';

  return {
    state,
    pfRatio: r2(pfRatio),
    freqRatio: r2(freqRatio),
    ddRatio: r2(ddRatio),
    signals: signals.map(([s, k]) => `${s}:${k}`),
    sample: n,
    confidence,
    baselineType: baseline.type,
    baselinePF: baseline.profitFactor,
    rollingPF: rolling.profitFactor,
  };
}
