# Commercial Legal Gaps (Phase 16 §101–104)

Must exist **before** any payment is taken. None of these pages exists today.

| Document | Needed for | Status |
|---|---|---|
| Terms of Service | all plans | MISSING |
| Privacy Policy (inquiry data, audit hashes, auth provider) | forms, account | MISSING |
| Risk Disclosure (standalone page; footer text exists) | all | PARTIAL (footer only) |
| Subscription Terms (billing cycle, cancellation, access on lapse) | PRO | MISSING · cancel terms DATA_REQUIRED |
| Refund Policy | PRO, PRIVATE | MISSING · policy DATA_REQUIRED (not invented) |
| IB Disclosure (standalone) | IB | PARTIAL (rendered on /access/) |
| License Agreement (PRO / PRIVATE EULA: scope, devices, redistribution) | PRO, PRIVATE | MISSING |
| Custom Development Agreement template (ownership, rights, NDA) | CUSTOM | MISSING |

Additional checks before launch: marketplace rules on referral wording (MQL5
etc.), regional advertising rules for IB content (the `IB_ACCESS.enabled`
switch exists for this), tax handling via the payment provider, and
confirmation that the configured contact mailbox is monitored.

Performance disclaimer: every plan page repeats that backtest / forward /
live results do not guarantee future profit; the PRIVATE tier states that a
higher price is not a performance promise.

## DATA REQUIRED from the owner (§127) — consolidated

| Item | Where it goes | Current value |
|---|---|---|
| Supported broker(s) | `src/data/commercial/access.mjs` → `brokers[]` | DATA_REQUIRED |
| IB referral URL(s) | same | DATA_REQUIRED |
| IB eligibility rules | same → `dataRequired.ibEligibility` | DATA_REQUIRED |
| IB verification method | same → `verificationMethod` | MANUAL (assumed) |
| PRO EA list | `products.mjs` → `access.pro = true` per slug | none assigned |
| IB EA list | `products.mjs` → `access.ib = true` per slug | none assigned |
| Private EA details (scope, source, limits) | `products.mjs` → `PRIVATE_PRODUCT` | DATA_REQUIRED |
| Contact e-mail confirmation | `site.config.mjs` → `COMMERCIAL.contactEmailConfirmed` | false (e-mail hidden from forms until confirmed) |
| Inquiry endpoint | `site.config.mjs` → `COMMERCIAL.inquiryEndpoint` | empty (forms offline) |
| Payment provider | `site.config.mjs` → `COMMERCIAL.paymentProvider` | empty |
| Refund policy | legal page + i18n | DATA_REQUIRED |
| Cancellation terms | legal page + i18n | DATA_REQUIRED |
| Countries supported | `access.mjs` → `COUNTRY_AVAILABILITY` | null (DATA_REQUIRED) |
| License limits (MT5 accounts / devices) | `PRIVATE_PRODUCT.licenseLimits`, plan limits | DATA_REQUIRED |
| Legal pages (Terms, Privacy, Subscription, Refund, EULA) | new routes | MISSING |
