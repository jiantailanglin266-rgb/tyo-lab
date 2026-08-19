# Forward import pipeline (Phase 12A)

```
MT4/MT5 export (CSV / HTML statement / JSON)
  → scripts/import-forward.mjs      parse · validate · map · dedupe
  → data/forward/normalized/<ACC>.json   (PRIVATE, gitignored)
  → scripts/analyze-forward.mjs     metrics · rolling · degradation · candidates
  → tools/forward-aggregates.json + tools/research-candidates.json  (public)
  → npm run release                 site + evidence map update automatically
```

## CLI

```bash
node scripts/import-forward.mjs report.csv \
  --account ACC-FWD-001 --type FORWARD_DEMO --currency USD \
  [--broker NAME] [--platform mt4|mt5] [--mode Standard] \
  [--strategy slug] [--balance 10000] [--dry-run]
```

- `--dry-run` parses, validates, maps and reports — writes nothing (§63).
- Output summary: source + hash, account, parsed/imported counts, mapped vs
  UNMAPPED, strategies touched, warnings (§62).
- `FORWARD_DATA_DIR` / `FORWARD_OUT_DIR` env overrides exist for the test
  suite only.

## Sources (src/lib/forward-source.mjs)

| Source | Notes |
|---|---|
| CSV | preferred — the only format that reliably carries magic numbers and comments. Flexible header aliases, `,`/`;` delimiters, quoted fields, comma decimals. |
| HTML | MT4 account statement ("Closed Transactions", 14 columns) with full swap/commission separation. Tester-report dialects parse as a warned fallback (no tickets → synthesized, costs not separated — prefer CSV). |
| JSON | already-normalized arrays (`[{ticket, closeTime, profit, …}]` or `{trades: []}`). |
| MT5MCPSource | Phase 13 adapter contract: an MCP bridge must deliver the JSONSource shape through this same importer so live feeds inherit identical validation, mapping and privacy (§100, §106). Not implemented in Phase 12 (§58). |

## Validation (§64)

Fatal (nothing written): invalid close time, open-after-close, non-positive
volume, currency mismatch vs the account's stored currency, evidence-type
mismatch, account-id/type prefix disagreement, magic-map conflict.
Warned: missing symbol, duplicate ticket within the file (second skipped),
tester-dialect HTML.

## Mapping (§9–11)

Precedence `MAGIC > COMMENT > MANUAL`, recorded per trade as
`mappingSource`. A magic not in `config/magic-map.mjs` is quarantined as
`UNMAPPED` — the importer never guesses an EA. Comment fallback applies only
to trades WITHOUT a magic. `--strategy` (MANUAL) also applies only to
magic-less trades.

## Idempotency & audit (§65–68)

- Trade key `accountId:ticket`; existing keys skipped on re-import.
- File hash (sha256) stored per import; the same file twice is a no-op.
- Raw file archived untouched under `data/forward/raw/<hash>-<name>`.
- Every run appends `{at, file, hash, account, parsed, imported, unmapped,
  warnings, result}` to `data/forward/audit-log.jsonl`.
- Manual corrections happen in mapping/override config, never in raw (§69).

## Daily process (§60)

Import → analyze → `npm run release`. Each step is a separate command so any
of them can later be driven by CI or an MCP bridge.
