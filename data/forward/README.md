# data/forward — PRIVATE trade data (never committed)

Drop MT4/MT5 exports anywhere and run the importer; it archives a copy under
`raw/` and writes `normalized/<ACC>.json`. Both directories and the audit log
are gitignored because this repository is public.

```bash
node scripts/import-forward.mjs statement.html --account ACC-FWD-001 --type FORWARD_DEMO --currency USD --broker "BrokerName" --platform mt4 --strategy joker --dry-run
node scripts/import-forward.mjs statement.html --account ACC-FWD-001 --type FORWARD_DEMO --currency USD --broker "BrokerName" --platform mt4 --strategy joker
node scripts/analyze-forward.mjs
npm run release
```

Only `tools/forward-aggregates.json` and `tools/research-candidates.json`
(public-safe aggregates) are committed. See docs/FORWARD_SECURITY_PRIVACY.md.
