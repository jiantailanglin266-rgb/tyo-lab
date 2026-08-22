# TYO — Deployment Architecture (Phase 0.5 — FREEZE PROPOSAL)

## 1. Environments
| Tier | Public site | App | API (Edge Functions) | DB / Auth / Storage | Stripe |
|---|---|---|---|---|---|
| local/dev | `npm run dev` (tools/serve) | `vite dev` | `supabase functions serve` | Supabase CLI local or dev project | test keys |
| staging | PR preview (optional Netlify) | Vercel/Netlify preview per PR | dev Supabase project | dev project | test keys |
| production | GitHub Pages (`main`) | Vercel/Netlify production | prod Supabase project | prod project | **live keys only when the owner enables `ENABLE_PRO_BILLING`** |

Production promotion of the app/API is **manual** (protected environment
with required reviewer). The public site keeps its current auto-deploy on
push to `main` (existing behaviour, unchanged).

## 2. Pipelines
**Public site (this repo, existing `deploy.yml`, unchanged)** + new `ci.yml`
on pull requests: `node build.mjs`, `node tools/check.mjs`, all
`scripts/test-*.mjs`, secret scan (gitleaks), no `.ex5/.set` under `public/`.

**App repo (`tyo-app`)**: `lint → typecheck → unit/integration tests (RLS,
webhook signature, entitlement, license) → build → supabase migration
validation (`supabase db lint`, dry-run apply on a shadow DB) → deploy
preview → manual promote`.

## 3. Branching
Existing: `main` only, auto-deploy. Proposal (does not change the site):
`main` (production) · `development` (integration for the app repo) ·
`feature/*`. Research commits continue to land on `main` as today.

## 4. Secrets
GitHub Actions secrets / Vercel env: `SUPABASE_SERVICE_ROLE_KEY`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — server-side only. Client
bundle receives only `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`,
`PUBLIC_SITE_URL`, `PUBLIC_APP_URL`. A CI check greps the built client
bundle for `service_role` / `sk_live` / `sk_test` and fails on hit.

## 5. Migrations
`supabase/migrations/*.sql` in the app repo, applied by CI to dev on merge
to `development`, to production only in the manual promote job. Every
migration is reversible or has a documented rollback. RLS policies live in
migrations, not in the dashboard.

## 6. Domains (DATA_REQUIRED)
Option A (subdomains): `www.` public · `app.` app · `api.` edge functions.
Option B (paths): public on `www.`, app on `app.`, API under `app./api/*`
proxying to Edge Functions. Until decided, default hostnames of each
provider are used and `PUBLIC_SITE_URL / APP_URL / API_URL` carry them.

## 7. Observability
Supabase logs (Edge Functions, Auth), Vercel/Netlify function logs, Stripe
event log, `audit_logs` table for commercial actions, `license_checks` for
denials, `download_logs` for failures. Alerts (later): webhook error rate,
license denial spike, download failure rate.

## 8. Rollback
Public site: revert commit → auto-redeploy. App: redeploy previous build.
DB: migration rollback script; artifacts are immutable (new version = new
row), so a bad release is handled by flipping `ea_products.latest_artifact_id`
back (audit-logged).
