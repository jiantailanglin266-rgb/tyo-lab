# Shadow MCP integration (Phase 13.5 §63–70, §108–109)

Four read-only tools added to `scripts/mcp-tyo-lab.mjs` (register once:
`claude mcp add tyo-lab -- node scripts/mcp-tyo-lab.mjs`):

| Tool | Returns |
|---|---|
| `shadow_status` | per-strategy shadow state: trades, PF, qualification, degradation, staleness, sessions, feed-gap share, last trade (§67) |
| `shadow_sessions` | engine-session provenance: version, execution/slippage/commission models, settings hash |
| `shadow_performance` | the full public aggregate for one strategy (metrics, costs incl. SIMULATED assumptions, rolling windows, breakdowns) |
| `shadow_candidates` | research candidates whose evidenceType is SHADOW_FORWARD |

Export/import/analyze run through the existing Phase 13 tools
(`tyo_import_forward` accepts SHADOW_FORWARD; §65's optional export is the
same import path — shadow logs are files the importer reads).

## Rules kept (§64–66, §68–70, §108)

- All shadow tools are **read-only**; the only write anywhere in the server
  remains the DRAFT proposal, unchanged from Phase 13.
- **No trade-execution tool exists** (§66) — asserted by the smoke test.
- AI may analyse shadow performance but the schema forces signal-phrased
  analysis; causes are never asserted (§68), and the human approval chain
  (candidate → proposal DRAFT → human APPROVED → hand-authored experiment →
  Phase 10 review gate) is inherited verbatim (§69). No EA is ever modified
  automatically (§70).
- Regression: the Phase 13 smoke suite still passes with the new tools
  (initialize, tools/list, shadow_status, unknown-tool rejection — §109).
