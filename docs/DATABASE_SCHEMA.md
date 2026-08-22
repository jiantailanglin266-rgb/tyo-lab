# TYO — Database Schema (Phase 0.5 DRAFT — not applied)

Postgres (Supabase). Research data stays in files; only commercial metadata,
entitlements, logs and aggregates live here. All tables: RLS enabled.

```sql
-- identity -----------------------------------------------------------
create type plan_t as enum ('FREE','PRO','PARTNER','PRIVATE');
create type role_t as enum ('USER','ADMIN','SUPPORT');   -- RESEARCHER later
create type partner_status_t as enum ('NONE','PENDING','ACTIVE','EXPIRED');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  country char(2),
  language text default 'en',
  plan plan_t not null default 'FREE',
  role role_t not null default 'USER',
  stripe_customer_id text unique,
  partner_status partner_status_t not null default 'NONE',
  referral_source text,            -- TikTok|YouTube|Instagram|X|MQL5|Google|Direct|Partner|Other
  referral_campaign text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login timestamptz
);

-- EA commercial layer ------------------------------------------------
create type commercial_status_t as enum ('DRAFT','FREE','PRO','PARTNER','PRIVATE','PAUSED','RETIRED','RESEARCH_ONLY');
create type release_status_t as enum ('CANDIDATE','VALIDATING','APPROVED','RELEASED','WITHDRAWN');

create table ea_products (
  ea_id uuid primary key default gen_random_uuid(),
  strategy_id text not null unique,        -- = EA slug in src/data/ea.mjs (research link)
  name text not null,
  slug text not null unique,
  version text,
  commercial_status commercial_status_t not null default 'DRAFT',
  plan_required plan_t,                    -- null = not downloadable
  latest_artifact_id uuid,
  country_availability text[],             -- null = unrestricted / undecided
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ea_artifacts (
  artifact_id uuid primary key default gen_random_uuid(),
  ea_id uuid not null references ea_products(ea_id),
  version text not null,
  file_name text not null,
  storage_path text not null,              -- private bucket key, opaque
  sha256 text not null,
  bundle jsonb,                            -- {ex5, set, manual, risk_guide, changelog}
  release_status release_status_t not null default 'CANDIDATE',
  created_at timestamptz default now(),
  unique (ea_id, version)
);

create table ea_releases (
  release_id uuid primary key default gen_random_uuid(),
  ea_id uuid not null references ea_products(ea_id),
  version text not null,
  research_version text,                   -- e.g. XAU_PYRAMID_V001
  evidence_snapshot jsonb,                 -- copied from tools/*.json at approval time
  artifact_id uuid references ea_artifacts(artifact_id),
  approved_by uuid references profiles(id),   -- REQUIRED for status >= APPROVED (check constraint)
  released_at timestamptz,
  status release_status_t not null default 'CANDIDATE',
  constraint release_needs_human check (status in ('CANDIDATE','VALIDATING') or approved_by is not null)
);

-- entitlements -------------------------------------------------------
create type license_status_t as enum ('ACTIVE','SUSPENDED','EXPIRED','REVOKED');

create table licenses (
  license_id uuid primary key default gen_random_uuid(),
  license_key_hash text not null unique,   -- sha256(key + pepper); raw key never stored
  user_id uuid not null references profiles(id),
  ea_id uuid not null references ea_products(ea_id),
  status license_status_t not null default 'ACTIVE',
  mt5_account text,                        -- bound on first verify
  max_accounts int not null default 1,
  expires_at timestamptz,                  -- null = lifetime (PRIVATE) / follows subscription (PRO)
  created_at timestamptz default now(),
  last_verified_at timestamptz
);

create table license_checks (              -- replay + rate limit + audit
  id bigserial primary key,
  license_id uuid references licenses(license_id),
  nonce text,
  result text not null,                    -- OK|INVALID|EXPIRED|PLAN_REQUIRED|ACCOUNT_MISMATCH|EA_MISMATCH|VERSION_BLOCKED|RATE_LIMITED
  ea_version text,
  ip_hash text,
  checked_at timestamptz default now(),
  unique (license_id, nonce)
);

create type sub_status_t as enum ('ACTIVE','GRACE','PAST_DUE','CANCELLED','EXPIRED','TRIAL');
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  stripe_subscription_id text unique,
  stripe_price_id text,
  status sub_status_t not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  updated_at timestamptz default now()
);
create table stripe_events (               -- idempotency
  event_id text primary key,
  type text not null,
  received_at timestamptz default now(),
  processed boolean default false
);

create table download_logs (
  id bigserial primary key,
  user_id uuid not null references profiles(id),
  ea_id uuid not null references ea_products(ea_id),
  artifact_id uuid not null references ea_artifacts(artifact_id),
  version text not null,
  downloaded_at timestamptz default now(),
  ip_hash text,                            -- sha256(ip + daily salt), raw IP never stored
  user_agent text
);

-- partner / IB -------------------------------------------------------
create table brokers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  country char(2),
  referral_url text,
  conditions text,
  country_availability text[],
  active boolean default false,
  sort_order int default 0
);
create table partner_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  broker_id uuid not null references brokers(id),
  account_or_referral_hash text,
  status partner_status_t not null default 'PENDING',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);
create table partner_clicks (
  id bigserial primary key,
  user_id uuid references profiles(id),
  broker_id uuid not null references brokers(id),
  campaign text,
  clicked_at timestamptz default now()
);

-- inquiries / content / analytics ------------------------------------
create type inquiry_type_t as enum ('PRIVATE','DEVELOPMENT','MODIFICATION','PARTNER','GENERAL');
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  type inquiry_type_t not null,
  name text, email text not null, company text, country char(2),
  data_json jsonb not null default '{}',
  status text not null default 'NEW',      -- NEW|REVIEWING|QUOTED|ACCEPTED|DECLINED|CLOSED
  created_at timestamptz default now()
);

create table analytics_events (
  id bigserial primary key,
  user_id uuid references profiles(id),
  anon_id text,
  event text not null,                     -- signup|login|ea_view|ea_download|pricing_view|checkout_start|subscription_success|partner_click|license_activate|portfolio_view|private_inquiry|custom_development_inquiry
  props jsonb default '{}',
  page text,
  created_at timestamptz default now()
);
create table attribution (
  user_id uuid primary key references profiles(id),
  first_touch jsonb,                       -- {utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing, at}
  latest_touch jsonb
);

create table platform_stats (
  key text primary key,                    -- 'mql5_downloads'
  value numeric not null,
  suffix text default '+',
  note text,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now()
);
create table platform_stats_history (
  id bigserial primary key, key text not null, value numeric not null, recorded_at timestamptz default now()
);

create table content_drafts (
  id uuid primary key default gen_random_uuid(),
  ea_id uuid references ea_products(ea_id),
  platform text not null,                  -- TikTok|YouTube Shorts|Instagram|X|MQL5|Blog|Email
  language text not null,
  snapshot jsonb,                          -- performance snapshot used
  output jsonb,                            -- {hook, body, metrics, risk_disclosure, cta, hashtags}
  status text not null default 'DRAFT',    -- DRAFT|REVIEWED|APPROVED|PUBLISHED_EXTERNAL
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table settings (                    -- plan rules, prices (mirrors env), feature flags
  key text primary key, value jsonb not null, updated_by uuid, updated_at timestamptz default now()
);

create table audit_logs (
  id bigserial primary key,
  actor uuid references profiles(id),
  action text not null,
  target_table text, target_id text,
  before jsonb, after jsonb,
  ip_hash text,
  created_at timestamptz default now()
);
```

## RLS (minimum, see SECURITY_ARCHITECTURE.md)
- `profiles`: select/update own row; admin all.
- `licenses`, `download_logs`, `subscriptions`, `partner_links`, `inquiries (own)`, `attribution`, `analytics_events (insert own)`: owner rows; admin all.
- `ea_products`, `brokers`, `platform_stats`: public **select** of non-DRAFT / active rows; write admin only.
- `ea_artifacts`, `ea_releases`, `stripe_events`, `license_checks`, `content_drafts`, `settings`, `audit_logs`: admin / service role only (users never read storage paths).

## Sync with research files
`ea_products.strategy_id` ↔ `src/data/ea.mjs` slug. A script (`tools/sync-commercial.mjs`, later) exports `PRODUCTS` → DB and pulls `commercial_status` back into `src/data/commercial/products.mjs` for the static build, so the public site never needs a DB at build time.
