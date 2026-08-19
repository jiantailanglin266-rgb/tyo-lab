# Phase 13 — MT5 MCP continuous research

The §106 loop, implemented end to end with the human firmly in it:

```
MT5 (running, logged-in terminal)
  → scripts/mt5-export.py          READ-ONLY export, magic numbers included
  → scripts/import-forward.mjs     same validation/mapping/privacy as files
  → scripts/analyze-forward.mjs    metrics · degradation · candidates
  → monitoring (site + MCP)
  → research candidate (RC-nnnn)
  → AI analyst drafts a PROPOSAL   tyo_draft_experiment_proposal → DRAFT
  → HUMAN approval                 edit status APPROVED by hand
  → scripts/promote-proposal.mjs   PRINTS an experiment skeleton
  → human pastes + completes it    humanReviewed:false → Phase 10 gate
  → human review flips the flag    only then does it publish
```

## Components

| Piece | File | Notes |
|---|---|---|
| MT5 exporter | `scripts/mt5-export.py` | `pip install MetaTrader5`; attaches to the open terminal; groups deals into closed positions with swap/commission/fees and magic; writes JSONSource under `data/forward/` (gitignored, incl. `exports/`). No credentials accepted, stored or printed; account number never written; the terminal's demo/real trade mode is included so a human can pick `--type` truthfully. |
| MCP server | `scripts/mcp-tyo-lab.mjs` | zero-dependency stdio JSON-RPC. Register: `claude mcp add tyo-lab -- node scripts/mcp-tyo-lab.mjs` (run from the repo root). |
| Proposals | `tools/experiment-proposals.json` | AI drafts land here as `DRAFT`; humans set `APPROVED`/`REJECTED` by hand. |
| Promotion helper | `scripts/promote-proposal.mjs` | print-only; refuses anything not `APPROVED`; the skeleton it prints carries `humanReviewed: false`. |
| Smoke tests | `scripts/test-mcp.mjs` | handshake, tools list, read-only call, draft guard, unknown-tool error. |

## MCP tools

- `tyo_monitoring_status` / `tyo_list_candidates` — read-only state.
- `tyo_export_mt5` — runs the read-only exporter; output path is forced to
  stay under `data/forward/`.
- `tyo_import_forward` — the existing importer with all Phase 12 validation,
  mapping precedence, UNMAPPED quarantine and idempotency; supports dry runs.
- `tyo_analyze_forward` — regenerates aggregates + candidates.
- `tyo_build_site` — local build + checks; does not deploy.
- `tyo_draft_experiment_proposal` — the ONLY research-side write, and it can
  only append a `DRAFT` tied to an existing OPEN/REVIEWED candidate. The
  schema demands an analysis phrased as signals, not causal verdicts (§55).

## Safety invariants (§58, §104, carried into Phase 13)

1. **No tool can modify an EA**, its parameters, or place/close orders — no
   such tool exists, and the exporter is read-only by construction.
2. **No auto-promotion path exists.** The server cannot write to
   `src/data/experiments.mjs`; the promotion helper only prints; the printed
   skeleton is withheld by the Phase 10 gate until a human flips
   `humanReviewed` after review.
3. **Privacy is inherited**, not re-implemented: MCP-driven imports flow
   through the same importer, so trade-level data stays in the gitignored
   store and only aggregates ship.
4. **No credentials anywhere** in the loop.

## What "continuous" means here

The loop can now be driven conversationally (Claude with the tyo-lab MCP
server) or by cron around the three CLI steps. Every automated step ends at
an artifact a human reviews — candidate, proposal, skeleton — never at a
published claim or a changed system.
