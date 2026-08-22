# TYO — Security Architecture (Phase 0.5 — FREEZE PROPOSAL)

## 1. Trust boundaries
```
Browser (public site)  ── no secrets, no auth, no dynamic endpoints
Browser (app)          ── anon key + user JWT only; RLS enforces everything
Edge Functions (API)   ── service role used ONLY inside functions; never returned
Supabase Postgres      ── RLS on every table; admin by role claim
Private Storage bucket ── no public read; signed URLs only, TTL ≤ 5 min
Stripe                 ── webhook signature verified; events idempotent
MT5 EA (client)        ── license key + account + nonce; no server secret embedded
```

## 2. Controls (mapped to master prompt §99)
| Control | Implementation |
|---|---|
| Supabase RLS | Every table has `enable row level security`; policies: owner-row access (`auth.uid() = user_id`), admin full access via `profiles.role = 'ADMIN'` checked through a `security definer` helper `is_admin()`. Service role only in Edge Functions. |
| Admin authorization | Route group `/admin/*` requires `role ∈ {ADMIN, SUPPORT}` on server load **and** API-side check; non-admin → 404 (not 403, no enumeration). |
| API auth | Supabase JWT for user endpoints; license API is key-based (license key hash + `ea_id` + `mt5_account`), no JWT. |
| Rate limiting | Per-IP-hash and per-license token bucket in the license function (KV/DB counter); login/signup via Supabase Auth built-ins; inquiries per-IP-hash. |
| CORS | Allow-list `APP_URL` (+ `PUBLIC_SITE_URL` for inquiry POST); license API accepts any origin (EA WebRequest) but only `POST` with strict schema. |
| CSRF | App uses SameSite=Lax cookies + origin check on mutating routes; Stripe Checkout/Portal redirects are server-created. |
| XSS | SvelteKit auto-escaping; no `{@html}` with user content; CSP `default-src 'self'` + Supabase/Stripe origins on the app. Public site: no user content rendered. |
| Input validation | Zod schemas on every function (license/verify, download/sign, inquiries, events, performance/upload); reject unknown fields. |
| DB access | Supabase client with parameterised queries; no string-built SQL. |
| Signed URLs | `createSignedUrl(path, 300)` after `entitlement_for`; path never exposed to clients; artifact keys are opaque (`<ea_id>/<version>/<uuid>.zip`). |
| Secrets | Environment only; `.env.example` committed, `.env*` ignored; CI bundle grep for secret patterns. |
| Webhook signature | `stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)`; store `stripe_event_id` unique → idempotency. |
| Audit logging | `audit_logs (actor, action, target, before, after, at, ip_hash)` on release approve/publish, license issue/suspend/revoke, partner approve/revoke, plan overrides, settings changes, content approve. |
| Security headers | App/API: CSP, HSTS, nosniff, frame-ancestors none, referrer strict. Public site: via host if Netlify/Cloudflare; GitHub Pages cannot set headers (accepted for a static site). |

## 3. License API hardening (§35–39)
- Request: `license_key, mt5_account, ea_id, version, timestamp, nonce`.
- Replay resistance: `timestamp` within ±5 min, `nonce` unique per license for 10 min (`license_checks`).
- Key storage: `license_key_hash = sha256(key + pepper)`; raw key shown once at issue and retrievable only via re-issue (old key revoked).
- Errors: `INVALID, EXPIRED, PLAN_REQUIRED, ACCOUNT_MISMATCH, EA_MISMATCH, VERSION_BLOCKED, RATE_LIMITED` — never reveal which field failed beyond the code.
- Client behaviour (MQL5 `TYOLicense.mqh`): verify at init, cache result, refresh after `refresh_after` seconds, grace window `LICENSE_GRACE_SECONDS` on outage; **trading logic untouched; invalid license only blocks new entries (policy), never force-closes positions.**

## 4. Download abuse
`download_logs` + rule: > 10 downloads / 24 h or > 5 distinct ip_hash / 7 d per user → flag in admin; no auto-ban. ip_hash = sha256(ip + daily salt); raw IP never stored.

## 5. Privacy
Profiles store only what the dashboard needs. Inquiries keep `data_json`
for free text; no trading credentials requested anywhere (forms say so).
Analytics events carry no account numbers, no e-mail; user_id only when
logged in. Retention: download/license/analytics logs 24 months (config).

## 6. Security tests (must exist before each phase ships)
FREE user → PRO artifact: denied · user A → user B license: denied ·
unsigned/invalid Stripe webhook: 400 · expired signed URL: 403 · non-admin →
/admin: 404 · license rate limit: 429 · replayed nonce: INVALID ·
service-role string absent from client bundle · RLS policy tests via pgTAP
or SQL fixtures.

## 7. Non-negotiables (from §160)
No secret in git · no public paid artifact · no production billing without
live keys and owner enablement · no automatic commercial release · no
automatic partner activation · no automated trading · no EA trading-logic
change · human approval for sensitive commercial actions · research
provenance preserved.
