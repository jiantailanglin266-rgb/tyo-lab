# EA_DATA_SCHEMA

Single source of truth for the 14 systems, and the contract every EA-facing
template reads from.

---

## 1. Where the data comes from

Three inputs, merged once, in this order:

```
src/data/ea.mjs                 hand-written   ← always wins
tools/imported-reports.json     generated      ← report header
tools/extracted-trades.json     generated      ← deal list
          │
          ▼
   src/lib/ea-model.mjs   buildEAModel()
          │
          ▼
   one frozen model object per EA, consumed by every template
```

Rules:

- **Hand-written beats generated.** If `ea.mjs` sets a field, nothing overwrites it.
- **Generated beats nothing.** A field absent from all three stays `null`.
- **`null` is a first-class value.** It means "not available", renders as `—`,
  and never becomes `0`, `N/A`, or an estimate.
- The merge happens in exactly one place so no template invents a fallback.

Regenerate the two JSON files with:

```bash
npm run import  -- "<reports folder>"     # header figures + curve images
npm run trades  -- "<reports folder>"     # deal-level statistics
```

Both are read-only over the source reports.

## 2. Model shape

```jsonc
{
  "slug": "supremacy",            // URL segment, stable
  "name": "SUPREMACY",
  "number": "14",
  "status": "released",           // released | upcoming | draft(not built)
  "researchStatus": "live",       // live | research | experimental | archived

  "spec": {
    "market": "Crypto",           // Forex | Gold | Crypto | Index
    "symbol": "BTCUSD",
    "timeframe": "M5",
    "strategy": "Japan Original Scalping",
    "strategyTags": ["scalping"], // used by filter + compare
    "risk": "high",               // low | medium | high | variable | null
    "riskDerived": true,          // true = inferred from evidence, labelled as such
    "version": null,              // DATA_REQUIRED
    "releaseDate": null,          // DATA_REQUIRED
    "price": null,                // free | paid | null
    "platform": "MetaTrader 5",
    "minDeposit": null, "accountType": null, "leverage": null, "vps": null
  },

  "media": {
    "cover": "/assets/images/ea/supremacy.jpg",   // auto-detected
    "curveImage": "/assets/images/backtest/supremacy.png",
    "video": { "type": "file", "src": "...", "poster": "..." }
  },

  "backtest": {
    "period": "2020.01.01 – 2026.03.28",
    "initialDeposit": "10,000 USD",   // null when currency unknown
    "netProfit": "12,015.39 USD",     // null when currency unknown
    "maxDrawdown": "48.82% (6,681.39 USD)",
    "drawdownBasis": "equity",        // equity | balance — never mixed silently
    "profitFactor": "2.38",
    "totalTrades": "19,246",
    "winRate": "93.91%",
    "recoveryFactor": "1.80",
    "expectedPayoff": "0.62 USD",
    "sharpe": "0.96",                 // MT5 per-trade Sharpe. NOT annualised.
    "conditions": { "broker": "...", "spread": "...", "modeling": "...",
                    "quality": "...", "dataSource": "...", "commission": null }
  },

  "trades": {                        // from the deal list; null if unavailable
    "counts":   { "closed": 19237, "wins": ..., "losses": ...,
                  "longs": 9821, "shorts": 9425, "sideKnown": true },
    "rates":    { "winRate": 93.91, "lossRate": 6.09 },
    "averages": { "avgWin": 1.15, "avgLoss": -7.42,
                  "largestWin": 1627, "largestLoss": -779.66, "payoffRatio": 0.15 },
    "streaks":  { "maxWins": 268, "maxLosses": 9 },
    "drawdown": { "maxPct": 12.44, "maxAbs": ..., "worstFrom": "2022-06-13",
                  "worstTo": "2022-06-18", "recovered": "2022-08-01",
                  "recoveryDays": 44 },
    "period":   { "from": "2020-01-02", "to": "2026-03-27",
                  "startBalance": 10000, "endBalance": 22015.39,
                  "totalReturnPct": 120.15 },
    "monthly":  [ { "ym": "2020-01", "trades": 214, "pct": 3.42 }, ... ],
    "yearly":   [ { "year": "2020", "trades": 2810, "pct": 41.2, "winRate": 93.8 }, ... ],
    "curve":    [ [1577923800, 10000.12], ... ],   // [unixSeconds, balance], ~400 pts
    "observed": { "maxConcurrentPositions": 12, "stackedEntries": 8104,
                  "stopLossCloses": 17233, "stopLossShare": 89.6 }
  },

  "parameters": [ { "name": "InpLots", "default": "0.01",
                    "description": null,      // DATA_REQUIRED
                    "riskImpact": null } ],   // DATA_REQUIRED

  "riskCharacteristics": {          // DECLARED by the owner — all null today
    "martingale": null, "grid": null, "averaging": null,
    "positionScaling": null, "stopLoss": null, "maxPositions": null
  },

  "versions": [],                   // DATA_REQUIRED
  "timeline": [],                   // DATA_REQUIRED (development story)

  "i18n": { "en": { "tagline": "", "overview": "", "concept": "",
                    "strategy": "", "logic": "", "riskManagement": "",
                    "environment": "", "params": {}, "versionNotes": {},
                    "timelineNotes": {} } },

  "score": { "total": null, "band": "insufficient-data",
             "parts": { ... }, "reasons": [ ... ] }   // see TYO_SCORE_MODEL.md
}
```

## 3. Field ownership

| Owner | Fields |
|---|---|
| `src/data/ea.mjs` (human) | slug, name, number, status, researchStatus, spec.*, riskCharacteristics, versions, timeline, i18n, mql5Url, video |
| `import-reports.mjs` | backtest.*, parameters[].name/default, spec.symbol/timeframe when unset, media.curveImage |
| `extract-trades.mjs` | trades.* |
| `build.mjs` | media.cover (filesystem probe) |
| `ea-model.mjs` | spec.strategyTags, spec.risk when derived, score |

## 4. Invariants the templates rely on

1. Every model has `slug`, `name`, `number`, `spec`, `backtest`, `trades`, `score`.
   Any of those may contain `null` leaves, but the branch itself always exists.
2. `trades.monthly` and `trades.yearly` are sorted ascending, or empty.
3. `trades.curve` is chronological and ≤ 420 points.
4. Percentages are numbers, not strings. Currency-bearing values are
   pre-formatted strings, because their unit is part of the value.
5. `drawdownBasis` is always present when `maxDrawdown` is.
6. Nothing in the model is locale-specific except `i18n`.

## 5. Adding a system

1. Add an entry to `src/data/ea.mjs` (slug, name, number, spec).
2. Drop cover art at `public/assets/images/ea/<slug>.jpg`.
3. Add the report folder to `FOLDER_TO_SLUG` in both tools; run both.
4. `npm run build` — the detail page, index card, compare row, filter facets
   and score appear automatically.

No template change is needed for a new EA.
