# Evidence-by-design protocol (Phase 15)

The development standard for every NEW TYO strategy (§140):

```
SEAL (holdout fixed + sealed BEFORE development)
→ RESEARCH (development layer only; guarded tooling; budget-capped)
→ internal validation / WF (internal layer)
→ CANDIDATE FREEZE (source + parameter hashes pinned)
→ Monte Carlo
→ HUMAN unlock (gated on §69) → ONE-SHOT prospective validation
→ Shadow → Forward → Live
```

## Roles (§100)

AI may: analyse research, propose hypotheses, compare candidates, draft
plans and reports. AI may NOT: unlock holdouts, approve anything, promote
to production, or redefine periods from results. Every approval surface is
a human-run CLI whose flag no creation path can set.

## What each artifact pins

| Artifact | Pins |
|---|---|
| Research manifest (RES-) | data layers, objectives, **holdout pass thresholds (§77)**, search budget, quality level, known exposure |
| Holdout manifest (HOLD-) | period + purpose, hash at SEALED; period changes require INVALIDATED + a new id (§20) |
| Frozen candidate (CAN-) | source hash, parameter hash, git commit, budget consumed at freeze (§62–63) |
| Contamination register | strategy/version × holdout × observedAt, appended at unlock (§83–84) |

## Failure is data (§81, §130–131)

A FAILED holdout publishes like a PASS, stays in the research log, and the
version is closed — the fix is a NEW version whose evidence quality against
the same holdout is reduced (§85). The protocol's success metric is that it
can reject.

## First subject

XAU_PYRAMID (TYO XAU PYRAMID) — RES-XAU-001 / HOLD-XAU-001 SEALED
2026-01-01 → 2026-06-30 before any development run. See
XAU_PYRAMID_RESEARCH_PLAN.md.
