# Shadow data model (Phase 13.5 §9, §29, §43–46)

## Virtual position (engine-side, §9)

`SShadowPosition`: id, tradeId (`sessionId:id`), strategyId, version, magic,
symbol, direction, volume + initialVolume, signalTime, entryTime,
entryPrice, sl, tp, entrySpread, accumulated swap/commission, comment,
status (open / restored / openAtSessionEnd).

## Session metadata (§29–30, §118–122)

Logged on every SESSION_START: sessionId, strategyId, **version** (a version
change starts a new evidence series — §27, §122), symbol, timeframe,
executionModel, slippageModel, commissionModel, swapModel, **settingsHash**
(strategy inputs + execution model, §121), engine version, restored-position
count. Broker name is optional and config-gated (§30, §32); account numbers
never appear (§94).

## Event log line → normalized trade (§43–46)

`parseShadowJSONL` (ShadowSource, added to CSV/HTML/JSON/MT5MCP in
`src/lib/forward-source.mjs`) reads EXIT lines into the Phase 12 normalized
trade model — same fields, plus `shadowStrategyId` (the engine's own
identity assertion). SESSION_START lines become session provenance;
FEED_GAP lines accumulate into the account's gap total.

## Import rules (§47)

- A `.jsonl` shadow log imports **only** under `--type SHADOW_FORWARD` with
  an `ACC-SHW-nnn` account; statements/CSV can never be imported as shadow
  and vice versa. SHADOW_FORWARD is never conflated with FORWARD_DEMO or
  LIVE anywhere downstream.
- Mapping precedence gains `SHADOW_EA` (highest): the engine asserts its
  strategyId, validated against the catalogue and against the magic map —
  a conflict is an import error.

## Public aggregate additions

The Phase 12 aggregate gains `shadowMeta: { sessions, latest:{version,
executionModel, slippageModel, commissionModel, settingsHash, …},
feedGapShare }` for SHADOW_FORWARD datasets. Trade-level rows, comments and
raw logs stay private (§92–94); the site receives aggregates, the
downsampled cumulative curve and the rolling-PF series only (§93, §116–117).
