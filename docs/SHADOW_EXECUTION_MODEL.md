# Shadow execution model (Phase 13.5 §10–24)

How virtual fills are priced. Every simulated quantity is labelled
SIMULATED on the site and in the session metadata — nothing pretends to be
broker-measured.

| Aspect | Model | Notes |
|---|---|---|
| Entry | buy @ ASK, sell @ BID (§11) | real-time book side, never mid |
| Exit | buy closes @ BID, sell closes @ ASK | |
| Slippage (§13) | `NONE` or `FIXED_POINTS` (default 2pt, adverse on every fill) | labelled `FIXED_Npt_SIMULATED`; RANDOM/VOLATILITY_BASED are future options |
| Spread (§12) | entry & exit spread recorded per trade (points) | real observed spread |
| Commission (§14) | `CommissionPerLot` per side, both sides charged at entry | 0 allowed; labelled SIMULATED |
| Swap (§15) | `SYMBOL_INFO`: SWAP_LONG/SHORT via points→money or currency-per-lot modes; other swap modes → 0 | one night per weekday server-day change; labelled SIMULATED |
| Rollover (§16) | triple swap on a configurable day (default Wednesday) | simplification, documented — broker calendars differ |
| SL (§17) | long: Bid ≤ SL; short: Ask ≥ SL → exit at SL worsened by slippage | tick-based (§19) |
| TP (§18) | long: Bid ≥ TP; short: Ask ≤ TP → exit at TP worsened by slippage | |
| Trailing / breakeven (§20–21) | the EA's own logic calls `ModifySLTP`; the engine only surveils the resulting levels | same broker stop-distance guards as the real build |
| Partial close (§22) | `ClosePartialById`: realises a slice as a normal EXIT record with proportional cost split; remaining volume tracked | |
| Pyramiding (§23) | unlimited concurrent virtual positions per magic; the strategy's own limits apply unchanged | |
| Netting/hedging (§24) | the book is internal and account-mode independent | |

## Honesty boundary

Shadow fills assume the full requested volume executes at the touched price
±simulated slippage. Liquidity, latency, requotes and rejections are NOT
modelled — the site disclaimer (§95–96) says exactly that, on every shadow
panel, in all 7 languages.
