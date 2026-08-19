# Forward data — security & privacy (Phase 12 §5, §70–72)

The repository and the site are PUBLIC. Trade-level account data is PRIVATE.
This document is the boundary.

## Never public, anywhere (§5)

Login IDs, investor passwords, API keys, server credentials, full account
numbers, personal information. These never enter the repo in any form —
accounts exist publicly only as internal ids (`ACC-FWD-001`,
`ACC-LIVE-001`).

## Private layer (gitignored — never committed)

```
data/forward/raw/           original statements/exports, archived untouched
data/forward/normalized/    per-account trade-level JSON (tickets, comments,
                            magic numbers, prices, volumes)
data/forward/audit-log.jsonl
```

`.gitignore` covers all three. The private layer lives only on the owner's
machine.

## Public layer (committed, rendered)

`tools/forward-aggregates.json` and `tools/research-candidates.json` —
aggregates only. Publishable account fields are exactly the §4 list:
internal account id, broker display name, account type, currency, platform,
verified period, trade counts, performance aggregates. Explicitly absent:
tickets, order comments, magic numbers, per-trade rows, balances other than
an owner-approved starting balance, timestamps finer than the derived
period + last-trade date.

The test suite asserts the boundary: the public aggregate is scanned for
ticket fields, trade ids and comment strings, and the build fails the test
if any leak (§85).

## Data minimization on the site (§72–73)

Pages embed only each system's own aggregate (a few KB inside its detail
page and the terminal); no page loads the full trade history, and the
static-build architecture is unchanged (§74) — GitHub Pages compatible, no
server.

## Fixtures (§87)

Test fixtures are synthetic, generated at test run time into a temp
directory, pushed through the real pipeline via `FORWARD_DATA_DIR` /
`FORWARD_OUT_DIR` overrides, and deleted. They never touch the production
store, the committed aggregates, or the site. The E2E verification fixture
used during Phase 12 development was likewise removed before commit; the
shipped aggregates are empty.
