# EA Access Model (SaaS Phase 1)

Four ways to use a TYO strategy. Nothing is sold on the static site; the site
explains, compares, and routes to the account layer or to an inquiry.

| Level | Plan | Price (USD) | How it is obtained | Backend needed | Status |
|---|---|---|---|---|---|
| 1 | FREE | $0 | TYO account signup | Auth (Phase 2) + download (Phase 4) | PLANNED |
| 2 | PRO | `PRICING.proMonthly` (19) via `STRIPE_PRO_PRICE_ID` | Subscription in the TYO account | Auth + billing + signed download (Phase 5) | PLANNED · provider DATA_REQUIRED |
| 3 | PARTNER | $0 to the user (broker-linked) | Supported-broker referral → manual approval | Partner verification (Phase 8) | PLANNED · broker DATA_REQUIRED |
| 4 | PRIVATE | `PRICING.privateOneTime` (5,000) one-time | Inquiry → screening → agreement → payment → delivery | Inquiry endpoint + manual process | PLANNED |

CUSTOM DEVELOPMENT is a **service**, not a plan (`/development/`, quote only).

## Data model

- `src/data/commercial/plans.mjs` — `PLANS`, `COMPARISON`, state enums
  (`COMMERCIAL_STATUSES`, `PARTNER_STATES`, `SUBSCRIPTION_STATES`,
  `LICENSE_STATES`), plus `PLAN_OF_STATUS` and `CTA_OF_STATUS`.
- `src/data/commercial/products.mjs` — one entry per strategy slug with a
  single `commercialStatus` (`DRAFT | FREE | PRO | PARTNER | PRIVATE | PAUSED
  | RETIRED | RESEARCH_ONLY`), version/checksum/artifact placeholders (never a
  public URL), update policy, bundle shape, country availability.
- `src/lib/ea-model.mjs` exposes `model.commercial = {status, plan, cta,
  latestVersion, countryAvailability}` — separate from `researchStatus` (§22, §74).
- Prices come from `site.config.mjs → PRICING` (env: `PRO_MONTHLY_PRICE`,
  `PRIVATE_ONE_TIME_PRICE`). No price literal exists in a page.

## CTA per commercial status (§23)

| Status | CTA on the EA page |
|---|---|
| FREE | FREE DOWNLOAD |
| PRO | AVAILABLE ON PRO |
| PARTNER | PARTNER ACCESS |
| PRIVATE | PRIVATE INQUIRY |
| RESEARCH_ONLY | RESEARCH ONLY (+ MQL5 link when the strategy is published there) |
| DRAFT / PAUSED / RETIRED | no CTA — status only |

## UI surfaces

`/access/` (hub: plan cards, strategy × access matrix with `?ea=` focus,
FREE / PRO / PARTNER / PRIVATE sections, custom pointer, comparison, FAQ,
brand strip) · `/ea/<slug>/` (hero CTA + "How to access this EA" panel) ·
`/ea/` (status badge + Access facet) · `/account/` (not-live notice).

## Plan assignment (owner task, DATA_REQUIRED)

Every product ships as `RESEARCH_ONLY`. Set `commercialStatus` per strategy in
`products.mjs` (later generated from the `ea_products` table) and the whole UI
follows. A strategy with no assignment never shows a fake lock.
