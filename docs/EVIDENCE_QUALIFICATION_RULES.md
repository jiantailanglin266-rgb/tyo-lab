# Evidence qualification rules (Phase 12 §45–47)

When does a forward or live dataset light its cell on the evidence map and
add its points to TYO SCORE 2.0? Rules are config
(`config/forward-evidence.mjs`), enforcement is code, and nothing is ever
ticked by hand (§44).

## FORWARD_DEMO → forward stage ✓ (+3)

All of:

1. ≥ `minForwardTrades` (30) closed trades,
2. ≥ `minForwardDays` (30) calendar days between first and last trade
   (derived from the data, never typed in),
3. every trade mapped with a valid source (`MAGIC`, `COMMENT`, or `MANUAL`)
   — a dataset containing `UNMAPPED` or unknown-magic trades does not
   qualify,
4. imported through the pipeline from a named account record
   (`evidenceType: FORWARD_DEMO`).

## LIVE → live stage ✓ (+3)

The same four conditions, **plus** the account record's verified evidence
type must be `LIVE` (§46) — enforced twice: the importer refuses an
`ACC-LIVE-*` id with `--type FORWARD_DEMO` and vice versa, and the analyzer
keys the aggregate by the account's stored type.

## Manual Phase 9 records

A hand-filled record in `tools/forward-live.json` still renders, but since
Phase 12 it lights the stage only if it, too, states ≥ 30 trades and covers
≥ 30 days. Below that it displays as information with the stage pending.

## Unqualified data still shows

Qualification gates the evidence ✓ and the score, not the display: an
aggregate below the minimums renders in full with the badge
"BELOW EVIDENCE MINIMUMS", so a young forward record is visible without
being over-credited.

## TYO SCORE interaction (§47)

Evidence Quality gains +3 per qualified stage (forward, live) exactly as
documented in TYO_SCORE_V2_MODEL.md. Forward/live PROFIT is never added to
the performance components — those five remain backtest-derived — so a
profitable live record raises the score only through the evidence axis,
never twice.

Verified end-to-end with a local fixture: qualification true → evidence
8/20 → 11/20, JOKER score 71 → 74; after fixture removal the production
build returned to 8/20 with no residue.
