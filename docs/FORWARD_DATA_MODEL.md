# Forward data model (Phase 12)

## Evidence types (§2)

`BACKTEST · OOS · WALK_FORWARD · MONTE_CARLO · FORWARD_DEMO · LIVE`
(reserved for future ingestion: `SHADOW`, `PAPER`). They are never mixed:
a backtest is never displayed as forward, a demo never as live (§0, §3–4).

## Account model (§12) — data/forward/normalized/<ACC>.json

```jsonc
{
  "account": {
    "accountId": "ACC-FWD-001",   // internal id ONLY (§5) — never a login
    "evidenceType": "FORWARD_DEMO" | "LIVE",
    "platform": "mt4" | "mt5" | null,
    "broker": "…" | null,          // display name; publishable
    "currency": "USD",             // required; money never leaves this unit
    "accountMode": "Standard" | "ECN" | … | null,
    "startBalance": 10000 | null,  // verified only; enables relative DD
    "status": "ACTIVE",
    "source": "file-import"
  },
  "imports": [ { "at", "file", "hash", "parsed", "imported", "warnings" } ],
  "trades": [ /* normalized trades, sorted by closeTime */ ]
}
```

The forward period is always derived from the first/last trade time, never
typed in (§13).

## Normalized trade (§8)

```jsonc
{
  "tradeId": "ACC-FWD-001:12345",   // accountId:ticket — the dedupe key
  "accountId": "ACC-FWD-001",
  "strategyId": "joker" | "UNMAPPED",
  "mappingSource": "MAGIC" | "COMMENT" | "MANUAL" | "UNKNOWN_MAGIC" | "NONE",
  "magicNumber": 20250101 | null,
  "symbol": "USDJPY" | null,
  "direction": "long" | "short" | null,
  "volume": 0.10 | null,
  "openTime": ms | null,   "closeTime": ms,     // UTC epoch ms
  "openPrice": … | null,   "closePrice": … | null,
  "profit": …,             // gross trade result
  "swap": …, "commission": …, "fees": …,        // separated (§15)
  "netProfit": …,          // profit + swap + commission + fees
  "sl": … | null, "tp": … | null,
  "comment": "…" | null    // PRIVATE — never leaves the normalized store
}
```

## Public aggregate (tools/forward-aggregates.json)

Per strategy × evidence type: account meta (internal id, broker, platform,
mode, currency), period + days, trade count, mapping sources, the full
metric bag (FORWARD_METRICS_MODEL.md), frequency, cost breakdown,
long/short + session/hour/day-of-week/symbol breakdowns, rolling windows,
downsampled cumulative-net curve, rolling-90d PF series, degradation
verdict, backtest baseline, `qualified`, `lastTradeAt`, `stale`.
**Never present**: tickets, comments, per-trade rows, magic numbers, logins
(§70–72 and FORWARD_SECURITY_PRIVACY.md).

## Research candidate (§54) — tools/research-candidates.json

```jsonc
{
  "candidateId": "RC-0001",
  "strategyId": "joker",
  "evidenceType": "FORWARD_DEMO",
  "detectedAt": "YYYY-MM-DD",
  "observation": "…",                        // deterministic, from metrics
  "metrics": { rollingPF, baselinePF, pfRatio, freqRatio, ddRatio, sample },
  "severity": "WATCH" | "DEGRADED" | "SEVERE",
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "suggestedResearchAreas": ["SESSION:NEW_YORK", "LONG_SHORT", …],
  "status": "OPEN" | "REVIEWED" | "PROMOTED_TO_EXPERIMENT" | "DISMISSED"
}
```

Statuses other than OPEN are set by a human editing this file; the analyzer
preserves them and never auto-promotes (§53, §103–104). The structured JSON
is the Phase 13 hand-off format (§57).
