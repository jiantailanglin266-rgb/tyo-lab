# TYO — SaaS Architecture (Phase 0.5 — FREEZE PROPOSAL)

Status: **PROPOSED — awaiting owner approval before any Phase 2+ code.**

## 1. Principle
```
EXISTING TYO RESEARCH PLATFORM  (unchanged, static, public, SEO)
            +
NEW TYO SAAS COMMERCIAL LAYER   (separate app + API + DB, private repo)
```
The public site never gains a server. Everything that needs identity, money
or files lives in the app/API tier. Research data stays file-backed in this
repo; the SaaS reads commercial metadata from the DB and links to research
pages by `strategy_id` (= EA slug).

## 2. Logical tiers
```
PUBLIC TYO LAB          GitHub Pages (this repo)        /{lang}/…  research, EA, access, development
      │  links (no JS coupling)
TYO APP                 SvelteKit on Vercel/Netlify      app.<domain>   auth, dashboard, EA library, licenses, downloads, portfolio, admin
      │  HTTPS, JWT (Supabase session)
TYO API                 Supabase Edge Functions          api.<domain> or app.<domain>/api   license/verify, ea/version, system/status, download/sign, stripe/webhook, inquiries, events, performance/upload
      │
SUPABASE                Postgres + RLS · Auth · Private Storage · (Edge Functions runtime)
STRIPE                  Checkout · Subscriptions · Customer Portal · Webhooks (test mode first)
```
Domains are undecided (DATA_REQUIRED). Fallback without custom domains:
`<owner>.github.io/tyo-lab/` (public), `tyo-app.vercel.app` (app),
`<project>.supabase.co/functions/v1/...` (API). The architecture does not
depend on the final hostnames; only `PUBLIC_SITE_URL / APP_URL / API_URL`.

## 3. Repositories
| Repo | Visibility | Contents |
|---|---|---|
| `tyo-lab` (this) | public | static site, research engines, commercial UI, docs |
| `tyo-app` (new) | **private** | SvelteKit app + Edge Functions + `supabase/migrations` + tests |
| `tyo-artifacts` (optional) or private bucket only | private | EA release bundles; never in git if a bucket suffices |

Cross-repo contract: the public site links to `APP_URL` routes
(`/login`, `/dashboard`, `/ea/<slug>`, `/pricing`) and the app reads
`ea_products.strategy_id` to deep-link back to `PUBLIC_SITE_URL/{lang}/ea/<slug>/`.

## 4. Plans and entitlements
| Plan | Price | Entitlement source | Notes |
|---|---|---|---|
| FREE | $0 | signup | free EA library, basic backtest/forward views, research access |
| PRO | `PRO_MONTHLY_PRICE` (initial $19) via `STRIPE_PRO_PRICE_ID` | Stripe subscription state | PRO EA library, updates, analytics, portfolio, enhanced support — **never "all EAs"** |
| PARTNER | $0 to user | manual approval → `partner_links.status = ACTIVE` (expiry) | PRO-equivalent or configured access; broker-linked |
| PRIVATE | $5,000 one-time | inquiry → screening → agreement → payment → delivery; admin-issued license | no checkout; "Details available by inquiry." |
| Custom Development | quote | inquiry only | service, not a plan |

Entitlement = f(profile.plan, subscriptions.status, partner_links.status,
licenses). Computed server-side in one function `entitlement_for(user, ea)`
used by the download signer and the license API. Clients never decide.

Commercial status per EA: `DRAFT | FREE | PRO | PARTNER | PRIVATE | PAUSED |
RETIRED | RESEARCH_ONLY` — independent from research status (kept in files).

## 5. Core flows
**Download**: user → app → `POST /download/sign {ea_id}` → session check →
`entitlement_for` → latest released `ea_artifacts` row → signed URL (TTL
≤ 5 min) → `download_logs` (ip_hash, ua) → 302.

**License**: PRO download auto-issues a license (`TYO-XXXX-XXXX-XXXX`, stored
as hash); EA calls `POST /api/license/verify` on start, caches locally,
refreshes per `refresh_after`; grace window on API outage is config;
license failure never force-closes open positions (§133–135).

**Billing**: Checkout → `checkout.session.completed` → `subscriptions` upsert
→ `profiles.plan = PRO`; `subscription.updated/deleted`, `invoice.paid /
payment_failed` keep state (`ACTIVE | GRACE | PAST_DUE | CANCELLED`); PRO
until period end on cancel. Webhooks are the source of truth; signature
verified; idempotent by event id.

**Partner**: user submits broker + account/referral id → `partner_links
(PENDING)` → admin approves → `ACTIVE` with expiry → entitlement; clicks
logged in `partner_clicks`; disclosure shown on every partner surface.

**Release**: research candidate → validation → **human approval** →
`ea_releases (APPROVED)` → build/upload → sha256 → private bucket →
`ea_artifacts (RELEASED)` → `ea_products.latest_artifact_id`. No automation
may set RELEASED without `approved_by`.

**Inquiry**: public forms → `POST /inquiries` → `inquiries` row (type
PRIVATE | DEVELOPMENT | MODIFICATION | PARTNER) → email provider if
configured, else DB only.

**Analytics**: first-party `analytics_events` (signup, login, ea_view,
ea_download, pricing_view, checkout_start, subscription_success,
partner_click, license_activate, portfolio_view, private_inquiry,
custom_development_inquiry) + `attribution` (first-touch UTM at signup).
External analytics via adapter (Plausible) — optional.

**Content**: admin-only draft generator behind `ContentGeneratorProvider`
with a financial-claim guard and mandatory disclosures; statuses DRAFT →
REVIEWED → APPROVED → PUBLISHED_EXTERNAL (manual).

## 6. Feature flags (app + API, env-driven)
`ENABLE_AUTH, ENABLE_PRO_BILLING, ENABLE_DOWNLOAD, ENABLE_LICENSE,
ENABLE_PARTNER, ENABLE_CONTENT_AI, ENABLE_PERFORMANCE_UPLOAD`. The public
site reads only `COMMERCIAL.accountUrl` (empty → /account/ stays "not live").

## 7. What the public site changes (Phase 1 delta only)
Rename plans to FREE/PRO/PARTNER/PRIVATE, price from config, CTA labels per
access type, status enum, `es/pt` locales, links to `APP_URL` behind a flag.
No runtime JS from Supabase/Stripe is ever shipped on research pages.

## 8. Performance & code splitting
Research pages: unchanged bundle (one deferred `main.js`). App: its own
bundle; Supabase/Stripe clients only inside the app. Admin: separate route
group, lazy-loaded.

## 9. Decisions requested for the freeze
1. App framework: **SvelteKit (recommended)** vs Next.js.
2. API placement: **Supabase Edge Functions (recommended)** vs app-server routes.
3. Domain architecture: paths vs subdomains (needs DNS).
4. PRO price confirmation: $19 / month.
5. Which EAs are FREE / PRO / PARTNER (research-only by default).
6. Private inquiry mailbox + email provider.
7. Supabase + Stripe accounts (owner-created; no credentials invented).
