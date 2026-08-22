# TYO — SaaS System Audit (Phase 0)

Date: 2026-08-23 · Repo: `jiantailanglin266-rgb/tyo-lab` (public) · Branch: `main` only

## 1. Current architecture (facts)

| Area | Finding |
|---|---|
| Framework | Hand-written zero-dependency static site generator (`build.mjs`, ESM). **No framework, no npm dependencies** (`dependencies: {}`, `devDependencies: {}`). |
| Language | JavaScript (ESM `.mjs`). No TypeScript, no bundler, no transpile. |
| Node | `engines >= 18`; CI uses Node 20; local 24. |
| Output | `dist/` — 471 files, 394 HTML pages, 7 locales × ~56 logical routes. Clean URLs (`/{lang}/…/index.html`). |
| Hosting | GitHub Pages via `.github/workflows/deploy.yml` (push to `main` → build → `actions/deploy-pages`). Base path `/tyo-lab/`, SITE_URL `https://<owner>.github.io`. A `netlify.toml` + `public/_headers` also exist (Netlify/Cloudflare-ready, root path, `https://www.tyo-lab.com`). |
| Pages | home, ea (index/compare/detail ×14), history, technology, ai-lab, portfolio-lab, lab (index/article), research (index/detail), terminal, about, contact, **access, development, account** (Phase 16A), 404. |
| EA data model | `src/data/ea.mjs` (15 entries) → `src/lib/ea-model.mjs` decorates with backtest/forward/MC/OOS/WF/shadow evidence, TYO SCORE 2.0, and `model.commercial` (Phase 16A). Source of truth = files in `tools/*.json` (imported reports, aggregates, protocol, validation). |
| Research engines | Phases 6–15: research log, score, portfolio, Monte Carlo, forward/live model, AI provenance gate, terminal, forward import pipeline, MT5 MCP loop (read-only), shadow forward, OOS/WF engine, Evidence-by-Design protocol with sealed holdout. All file-backed, test-covered (58 tests + 25 commercial). |
| i18n | 7 live locales (`en ja zh hi id th vi`), deep-merge over `en`; `ko es pt` are **declared as planned** in `site.config.mjs` but have no dictionary → not built. |
| CSS/JS | One `public/styles/main.css` (~6.8k lines), one `public/scripts/main.js` (vanilla, deferred). No client framework. |
| SEO | Canonical, hreflang (7 + x-default), OGP/Twitter, JSON-LD (Organization, Breadcrumb, Article, **Service** on /development/), `sitemap.xml` (49 logical URLs × 7), `robots.txt` (present, empty → allow all). Account page is `noindex`. |
| Analytics | **None.** No GA4/Plausible/collector. Phase 16A reserved `data-track` attributes only. |
| Env vars | `SITE_URL`, `BASE_PATH`; research scripts use `*_DATA_DIR` overrides. No secrets anywhere. |
| Backend / Auth / API / DB | **None.** Purely static. Contact form → `mailto:` fallback; inquiry forms → configurable endpoint (empty → offline state). |
| Deployment | Automatic on push to `main` (GitHub Pages). No staging. No PR checks (tests are run manually). |
| Secrets in git | None found (`.env`, keys, `.ex5`, `.set` are absent/ignored). Two `.mq5` sources are tracked (research EA + shadow template) — by earlier decision; commercial EAs (ゴゴジャン sources) are not in the repo. |
| Security headers | `_headers` (nosniff, referrer, frame, permissions) — **only honoured on Netlify/Cloudflare; GitHub Pages ignores it.** No CSP. |
| EA commercial metadata | Phase 16A: `src/data/commercial/{plans,products,access,development}.mjs`, `model.commercial`, `/access/`, `/development/`, `/account/`, CTA + badges + facet, 25 tests, 7 docs. Plans are **IB / PRO($10) / PRIVATE / CUSTOM** — differs from the new FREE / PRO($19) / PARTNER / PRIVATE model (see §6). |

## 2. Classification

### A. COMPLETE (reusable as-is)
- Static research site, SSG, i18n engine, design system, SEO/sitemap, check tool.
- EA model + all evidence engines (backtest, OOS/WF, MC, shadow, forward/live, score, portfolio).
- Forward/MT5 import parsers (Phase 12–13) — reusable by the future `/api/performance/upload`.
- Research protocol store with audit log + holdout guard — pattern to mirror for commercial audit logs.
- Phase 16A commercial UI: access hub, development page, inquiry form component, DATA_REQUIRED discipline, feature-flag-like `COMMERCIAL` config, tests.
- GitHub Pages deploy workflow.

### B. NEEDS UPGRADE
- **Plan model rename**: IB/PRO/PRIVATE/CUSTOM → FREE/PRO/PARTNER/PRIVATE (+ Custom Development as a service, not a plan); PRO price $10 → `PRO_MONTHLY_PRICE` config ($19 initial); commercial status enum → DRAFT/FREE/PRO/PARTNER/PRIVATE/PAUSED/RETIRED/RESEARCH_ONLY; CTA labels per §23.
- `platform_stats`: the 5,000+ downloads figure is in `site.config.mjs` (`STATS`) — keep as build-time config now, mirror to DB later.
- `/account/` placeholder → becomes a link-out to `app.` when `ENABLE_AUTH`.
- i18n: add `es`, `pt` dictionaries (declared, missing). `ko` optional.
- Security headers: move to the host that honours them (Netlify/Cloudflare) or accept the GitHub Pages limitation for the public site; CSP for app/api.
- Contact page `mailto:` fallback → route through the same inquiry endpoint when live.
- CI: add `lint/test/build/check` on pull requests (today only deploy on push).
- `.gitignore`: add `.env*`, `supabase/.temp`, `apps/**/node_modules`.

### C. NEW
- TYO APP (auth, dashboard, EA library, licenses, downloads, portfolio, settings).
- TYO API (license verify, ea version, system status, download signing, Stripe webhooks, inquiries, analytics events, performance upload).
- Database (Supabase Postgres + RLS), private storage bucket, migrations.
- Stripe (test mode first), webhooks, plan sync.
- Partner/IB model, manual approval, click logs.
- Admin (protected app), audit logs, release pipeline with human approval.
- Analytics/attribution (UTM, first-party events), content generator (draft-only, claim guard).
- MQL5 license module (`TYOLicense.mqh`, separate from trading logic) + docs.

## 3. Good points
Zero-dependency build (no supply-chain surface), strict evidence provenance, file-backed research that can stay file-backed, honest placeholders already in place, fully tested protocol guards, 7-locale parity checks, tiny client JS on research pages (performance budget already met).

## 4. Technical debt
Single 6.8k-line CSS and 2k-line JS file; no lint/format tooling; no PR CI; i18n dictionaries are large hand-edited modules (no key-parity test except the Phase 16 ad-hoc check); `ko/es/pt` declared but absent; `netlify.toml` and GitHub Pages config coexist (two hosting stories); contact form uses `mailto:`; research JSON in `tools/` mixes data with tooling.

## 5. Security risks (current)
- GitHub Pages ignores `_headers` → no security headers, no CSP on production (low risk for a static site, must not carry auth).
- `robots.txt` is empty — fine, but `/account/` relies on meta noindex only.
- Research EA sources are public by decision; commercial EA binaries must never join them (test-enforced).
- No rate limiting is possible on static hosting → every dynamic endpoint must live on the API tier.
- Public repo: any future `.env`, Supabase service key or Stripe key committed by accident is immediately public → `.gitignore` + secret scanning in CI required before Phase 2.

## 6. SaaS gaps vs the target (§5–§14 of the master prompt)
| Target | Status |
|---|---|
| FREE / PRO / PARTNER / PRIVATE plans | UI exists for IB/PRO/PRIVATE; rename + FREE tier needed (Phase 1 delta) |
| $19 PRO from config | currently $10 literal in data → `PRO_MONTHLY_PRICE` |
| Auth, profiles, roles, RLS | none |
| Dashboard, EA library, licenses, downloads | none (static placeholder) |
| Secure artifact storage + signed URLs | designed (SECURE_DOWNLOAD_ARCHITECTURE.md), not built |
| License API + MQL5 module | none |
| Stripe | none |
| Partner brokers, click log, approval | data model placeholder only |
| Admin, audit, release pipeline | none |
| Analytics / attribution | none |
| Content generator | none |

## 7. Recommended stack (fits the existing site)
- **Public site**: keep the static SSG on GitHub Pages (unchanged).
- **TYO APP**: SvelteKit **or** Next.js App Router on Vercel/Netlify — recommendation: **SvelteKit** (smallest runtime, easy to theme with the existing CSS, no React lock-in). Decision deferred to the freeze; either works with Supabase.
- **TYO API**: Supabase Edge Functions (Deno) for license/verify, ea/version, system/status, download signing, Stripe webhooks; keeps API and DB in one project with RLS.
- **DB / Auth / Storage**: Supabase (Postgres + RLS, Auth with e-mail + Google, private bucket).
- **Billing**: Stripe (Checkout, Customer Portal, webhooks), test mode only until keys exist.
- **Validation**: Zod in the app/API (first dependency — acceptable in the app repo, not in the static site).
- **Email**: provider abstraction (Resend/Postmark later); DB-only until configured.
- **Analytics**: first-party events table + optional Plausible adapter.

## 8. Deployment plan (summary; see DEPLOYMENT_ARCHITECTURE.md)
Public site stays on GitHub Pages. App + API in a **separate private repo** (`tyo-app`), deployed to Vercel/Netlify preview → staging → production with manual promotion. Supabase projects: dev + production (staging optional). Stripe test/live strictly separated by environment.

## 9. DB plan (summary; see DATABASE_SCHEMA.md)
`profiles, ea_products, ea_artifacts, ea_releases, licenses, license_checks, download_logs, subscriptions, brokers, partner_links, partner_clicks, inquiries, analytics_events, attribution, platform_stats, content_drafts, audit_logs, settings`. Research data stays in files; only commercial metadata and aggregates go to DB.

## 10. Required external accounts (only what Phase 2+ truly needs)
| Account | Needed for | Phase |
|---|---|---|
| Supabase project (dev, then prod) | Auth, DB, Storage, Edge Functions | 2 |
| Stripe account (test keys first) | PRO subscription | 5 |
| Domain / DNS (`app.`, `api.` or paths) | app + API hosting | 2 |
| Vercel or Netlify (app hosting) | TYO APP | 2 |
| Email provider (Resend/Postmark) | verification mails go through Supabase initially; transactional mails later | 3+ |
| Analytics (Plausible) — optional | external analytics adapter | 10 |

None exist today. No credentials will be invented; each becomes DATA_REQUIRED at its phase.
