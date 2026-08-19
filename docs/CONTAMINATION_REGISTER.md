# Contamination register (Phase 15 §82–86)

## Model (§84)

`tools/research-protocol.json → contamination[]`:

```jsonc
{ "strategyId": "XAU_PYRAMID", "version": "V001",
  "holdoutId": "HOLD-XAU-001", "observedAt": "ISO timestamp" }
```

Appended automatically by `unlock-holdout.mjs` for every frozen candidate of
the strategy at the moment of unlock — from then on the period is not
unknown to that strategy line.

## Consequences

- A new version developed AFTER observing a holdout may be validated
  against the same period only as reduced-quality evidence (§85): the
  validation record carries `previouslyObserved: true` and does not light
  the map at full prospective quality.
- Full-quality prospective evidence for a post-observation version requires
  a NEW holdout on genuinely new data (§86) — practically, waiting for the
  market to produce it.
- Cross-strategy exposure is also recorded at manifest creation
  (`knownExposure`): for XAU_PYRAMID, gold 2026-01→02 appears in other TYO
  systems' reports; this bounds the quality claim to PROCESS_PROSPECTIVE
  even before any unlock.

The register is read-only history: entries are never edited or removed.
