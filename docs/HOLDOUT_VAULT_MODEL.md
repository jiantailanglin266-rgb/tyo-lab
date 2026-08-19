# Holdout vault model (Phase 15 §14–24, §101–104)

## Lifecycle (§19)

`DRAFT → SEALED → UNLOCK_APPROVED → UNLOCKED → CONSUMED`, with
`INVALIDATED` as the only escape hatch (a sealed period is never edited —
§20). The manifest hash is pinned at SEALED; any mutation is detected and
fatal.

## Access policy (§16–17)

`src/lib/holdout-guard.mjs` is the single gate: any research period that
intersects a holdout in ANY blocking state (SEALED through CONSUMED) is
refused with `ERROR: Requested period intersects FINAL HOLDOUT.` Unparseable
dates fail closed. Research tooling (`generate-research-config.mjs`, future
runners) must pass through it — verified by the §112 security test, which
tampers a research layer into the sealed range and asserts refusal.

The one legitimate consumer is `run-prospective-validation.mjs`, whose
inverse gate demands an UNLOCKED holdout and a run covering EXACTLY the
sealed period, once (§70–71); publishing marks it CONSUMED.

## Unlock chain (§21–23, §69, §127–128)

```
human: approve-holdout-unlock.mjs --by "name"
   gates: candidate FROZEN · budget recorded ·
          internalValidation + monteCarlo milestones · manifest hash intact
human: unlock-holdout.mjs
   → UNLOCKED + contamination register entries for every frozen candidate
```

No MCP tool can unlock, approve or seal (asserted by the MCP smoke test);
the AI cannot set the approval state (§22, §98–99).

## Honest isolation statement (§101–104)

Raw holdout data staging lives outside normal tooling (`data/holdout/`,
gitignored) and no repository script accepts a holdout path — but MT5's own
tester can read all history, and the developer has lived through the
market. The vault therefore provides PROCESS-level isolation with a full
audit trail (`data/research/audit-log.jsonl`: timestamp, action, holdout,
reason, git commit — §24), not cryptographic ignorance. The site labels the
resulting evidence PROCESS_PROSPECTIVE and explains why.
