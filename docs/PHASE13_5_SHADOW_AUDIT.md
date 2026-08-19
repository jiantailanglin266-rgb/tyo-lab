# Phase 13.5 — Shadow Forward audit & PoC record

Pre-implementation audit (§133 steps 1–4) and what was verified.

## Repository state entering 13.5

- Phase 12/13 forward schema: normalized trade model + public aggregates
  keyed by strategy × evidence type; per-type qualification config;
  degradation detector; research candidates; MCP server. All reusable —
  shadow rides the same pipeline with a new source and evidence type.
- Evidence map was six stages; extended to seven (SHADOW_FORWARD between
  MONTE_CARLO and FORWARD) with the point re-split documented in
  SHADOW_EVIDENCE_RULES.md. No published score changed.

## EA execution-structure audit (§133 step 3)

15 MT5 sources exist in the owner's archive. Common structure (verified on
NEXUS, representative of the TYO MQL5 builds): a clean strategy layer
(indicator-based entry/exit signal functions, trend filter, day/time
filters, lot sizing) above a thin CTrade layer concentrated in a handful of
functions that both send orders and read real position state. The position-
state reads are why a naive "just don't send" flag is not enough — the
strategy's decisions depend on the book, so shadow needs a full virtual
book, which the engine provides.

## PoC selection (§72, final reasons)

**NEXUS**: (1) largest evidence base — 19,968 backtest trades, so shadow
samples accumulate fastest toward the 100-trade qualification; (2) smallest
MT5 source (41 KB) with execution calls concentrated in 8 functions —
the safest surface for a 1:1 layer swap; (3) five independent sub-strategies
on distinct magic numbers exercise the multi-magic book, TP/SL, trailing
and max-hold paths in one EA.

## What was verified in this session

- `TYO_ShadowTemplate.mq5` and `NEXUS_Shadow.mq5` both compile clean
  (MetaEditor CLI, 0 errors / 0 warnings).
- Pipeline E2E with a synthetic 130-trade shadow log (local only, removed
  before commit): SHADOW_EA mapping 130/130, QUALIFIED, WATCH raised on the
  frequency signal, candidate RC generated with
  evidenceType SHADOW_FORWARD, site rendered the Shadow tab (badges,
  provenance, SIMULATED labels, disclaimer), evidence 8/20 → 10/20,
  seven-column map, terminal SHADOW row + shadow summary. Then reverted:
  production ships with honest NO DATA.
- Test suites: forward 28/28 (incl. shadow parser, §47 separation, 100-trade
  qualification, 60-trade rejection), MCP 7/7.

## Not verified here (owner milestones)

- Live-terminal run on real-time ticks (§100–102: first milestone through
  100 closed trades) — requires the owner's MT5 attached to a price feed.
- Strategy Tester parity run (§83–86): compare `NEXUS.ex5` vs
  `NEXUS_Shadow.ex5` on the same period/symbol; expected: identical signal
  count and timing, differences only from the execution model. The template
  EA runs in the tester for engine-level replay tests (§81).

  **Recommended two-stage tester procedure** — iterating on "Every tick"
  is slow, so:

  1. **Iteration passes — "1 minute OHLC"** (or "Open prices only" for the
     fastest sweeps). Valid for SIGNAL parity: the NEXUS signal layer is
     closed-bar based (M15/M5 CopyBuffer/CopyTime), so entry/exit signal
     counts, timing and direction are fully comparable in this mode. Run
     both builds, compare ENTRY events in the shadow JSONL against the real
     build's order log until mismatch = 0 (§85–86).
  2. **Final pass — "Every tick based on real ticks"**, once, at the end.
     This is the only mode that exercises the tick-based execution surface
     (SL/TP touch on bid/ask, trailing steps, spread capture), so it is the
     confirmation run for EXECUTION parity — expected differences are the
     documented execution model only.
