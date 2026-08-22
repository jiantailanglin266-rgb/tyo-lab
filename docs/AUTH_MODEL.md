# Auth Model (SaaS Phase 2)

Implemented in the separate private app repo `TYO-APP` (SvelteKit + Supabase).
The public site never gains a login; it links to `COMMERCIAL.accountUrl` once
that app is deployed, and shows "not live" until then.

## Identity

- **Passwordless by design** (§18): e-mail magic link + Google OAuth through
  Supabase Auth. TYO never stores a password and never implements its own.
- Session: `@supabase/ssr` cookies, `httpOnly`, `SameSite=Lax`, `Secure`
  outside localhost. `hooks.server.ts` validates the JWT with `getUser()`
  before trusting a session — a cookie alone is not proof.
- Protected route groups: `/dashboard`, `/account`, `/admin` → redirect to
  `/login?next=…` when unauthenticated.
- Sign-out is `POST /logout` only (a GET link would be CSRF-triggerable).

## Profile

`public.profiles` is created by a `SECURITY DEFINER` trigger on
`auth.users` insert (`0003_profile_trigger.sql`), together with an
`attribution` row carrying first-touch UTM data when supplied at signup.

| Field | Who may write |
|---|---|
| `display_name`, `country`, `language` | the user |
| `plan`, `role`, `partner_status`, `stripe_customer_id` | server only — RLS `WITH CHECK` compares against the stored row and rejects client changes |
| `last_login` | set on auth callback |

## Roles

`USER` (default) · `ADMIN` · `SUPPORT`. `public.is_admin()` is
`SECURITY DEFINER` so policies on `profiles` can check a role without
recursing. `/admin` requires the role on the server **and** in the API;
non-admins get 404, not 403 (no enumeration).

## Entitlement

One pure function decides access (`src/lib/entitlement.ts`, 10 unit tests):

```
canDownload(user, product, { licenses, country }) → { allowed, reason, requires }
```

- `RESEARCH_ONLY | DRAFT | PAUSED | RETIRED` → `NOT_DISTRIBUTED` for everyone.
- `FREE` → any signed-in user.
- `PRO` → `plan = PRO` **and** subscription in `TRIAL | ACTIVE | GRACE`;
  an `ACTIVE` partner link also grants PRO-equivalent access.
- `PARTNER` → `partner_links.status = ACTIVE` and not expired.
- `PRIVATE` → an `ACTIVE`, unexpired license row; a plan alone is never enough.
- `country_availability` (when non-empty) is an allow-list.

`effectivePlan()` reflects subscription and partner state, not the stored
column alone — a `PAST_DUE` PRO user is effectively `FREE`.

## Guarantees enforced in SQL, not only in code

- `ea_releases.release_needs_human`: a release cannot reach
  `APPROVED/RELEASED` without `approved_by` (§32).
- `partner_links.partner_needs_human`: a link cannot be `ACTIVE` without an
  approver (§54), and users may only insert `PENDING` rows for themselves.
- `stripe_events` has **no** policy: only the service role touches it.
- `ea_artifacts` (storage paths) is admin/service-role only — clients never
  see a storage key.

## Verification done for this phase

`npm run test` → 10/10 entitlement assertions · `npm run check` → 0 errors /
0 warnings · `npm run build` → succeeds · client-bundle scan finds no
`service_role` / `sk_live` / `sk_test` string · `supabase/tests/rls.sql`
asserts cross-user isolation, DRAFT invisibility, self-promotion refusal and
self-activation refusal (runs against a Supabase instance).

## Blocked until the owner acts

A Supabase project (URL + anon + service_role keys) and, for Google sign-in,
a Google OAuth client. No account was created and no credential invented.
