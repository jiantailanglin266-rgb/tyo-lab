# EA Access Model (Phase 16)

Four ways to use a TYO strategy. Nothing is sold on the static site; the site
explains, compares, and routes to the account layer or to an inquiry.

| Level | Plan | Price (USD) | How it is obtained | Backend needed | Status |
|---|---|---|---|---|---|
| 1 | IB ACCESS | EA access fee $0 (broker costs apply) | Supported-broker referral account → verification | IB verification (manual at first) | PLANNED · broker DATA_REQUIRED |
| 2 | TYO PRO | $10 / month | Subscription through TYO Account | Auth + billing + signed download | PLANNED · provider DATA_REQUIRED |
| 3 | TYO PRIVATE | $5,000 one-time | Inquiry → use-case review → meeting → terms → payment → delivery | Inquiry endpoint + manual process | PLANNED |
| 4 | CUSTOM DEVELOPMENT | Quote | Inquiry → consultation → specification | Inquiry endpoint | PLANNED |

## Data model

- `src/data/commercial/plans.mjs` — `PLANS` (id, level, price, billing, availability, features, requires, cancel), `COMPARISON`, state enums.
- `src/data/commercial/products.mjs` — one `PRODUCTS` entry per strategy slug: `access {ib, pro, private, directPurchase:false}`, `status` (DRAFT | AVAILABLE | PAUSED | PRIVATE | RETIRED), `latestVersion`, `downloadArtifact` (never a public path), `checksum`, `updatePolicy`, `sourceIncluded`, `bundle`, `countryAvailability`.
- The EA model (`src/lib/ea-model.mjs`) exposes `model.commercial = {status, plans, access, latestVersion, countryAvailability}` — separate from `researchStatus` (§74).

## UI surfaces

- `/access/` — hub: plan cards, strategy × plan matrix (reads `?ea=` to focus a row), IB section with disclosure, PRO section, PRIVATE section with inquiry form, custom pointer, comparison, FAQ.
- `/ea/<slug>/` — "ACCESS THIS STRATEGY" in the hero → `/access/?ea=<slug>`; "How to access this EA" panel with commercial status + plan badges.
- `/ea/` — plan badges on cards; facet **Access** (only when at least one product is assigned).
- `/account/` — honest "not live" page until `COMMERCIAL.accountUrl` is set.

## Plan assignment (owner task)

Default: every product is DRAFT with no plan. Set `access.ib / pro / private`
and `status` per strategy in `products.mjs`; the UI updates everywhere. A
strategy with no plan shows "PLAN PENDING", never a fake lock.
