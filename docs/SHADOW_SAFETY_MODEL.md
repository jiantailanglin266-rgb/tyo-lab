# Shadow safety model (Phase 13.5 §3, §78–80, §132)

The absolute rule: **a shadow build must be structurally incapable of
sending a real order.** Defence in depth:

1. **No trade code exists to call.** The TYO shadow headers never include
   `<Trade/Trade.mqh>`; there is no `CTrade`, no `OrderSend`, no
   `MqlTradeRequest` anywhere in the shadow translation unit. This is the
   preferred SHADOW-ONLY BUILD (§80): the compiled `NEXUS_Shadow.ex5` and
   `TYO_ShadowTemplate.ex5` contain no order-sending path at all — not a
   flag that could be flipped at runtime.
2. **Separate binaries** (§79): `NEXUS.mq5` (real) and `NEXUS_Shadow.mq5`
   (shadow) are distinct sources producing distinct EX5s. The original is
   untouched.
3. **Marker macro**: `ShadowPosition.mqh` defines `TYO_SHADOW_ONLY`; any
   future file that mixes real execution into a shadow build can guard
   against it (`#ifdef TYO_SHADOW_ONLY #error ... #endif`).
4. **Visible state** (§7–8): OnInit prints `=== SHADOW MODE ACTIVE === NO
   REAL ORDERS WILL BE SENT`, and the chart banner `TYO SHADOW FORWARD — NO
   LIVE ORDERS` renders every tick with session stats and feed status.
5. **Fail closed** (§33–34): new virtual entries are refused on feed
   staleness, invalid/unavailable quotes, or a storage error (a failed state
   write disables entries until restart).
6. **Read-only account access**: the engine reads prices and symbol specs;
   the strategy's margin check stays read-only (`OrderCalcMargin` computes,
   never sends). No credentials are read, stored or logged; no account
   number appears in any log line.
7. **MCP surface** (§64–66): the Phase 13.5 MCP tools are read-only
   (`shadow_status/sessions/performance/candidates`); no trade-execution
   tool exists anywhere in the server, verified by the smoke test's
   name-pattern assertion.

Failure condition §132 (any real order sent in shadow mode) is therefore not
a runtime risk to be caught — the capability is absent from the binary.
