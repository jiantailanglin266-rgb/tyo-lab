# Phase 16 — Commercial layer: repository audit (before implementation)

Date: 2026-08-22 · Scope: what exists today that the commercial layer touches.

## Findings

| Area | State found | Consequence for Phase 16A |
|---|---|---|
| Hosting | Static site on GitHub Pages (`/tyo-lab/` base path), no server | Payment / login / secure download cannot live here; UI + architecture only (§16, §132) |
| Contact channel | `LINKS.email = contact@tyo-lab.com` already public on /contact/ | Used as the interim inquiry channel; **owner must confirm it is monitored** (DATA_REQUIRED list) |
| Forms | `/contact/` posts to `FORM_ENDPOINT` (empty) → `mailto:` fallback | New inquiry forms post to a configurable endpoint and never fall back to `mailto:`; while unset they render as DATA_REQUIRED with the e-mail shown (§87) |
| EA data | `src/data/ea.mjs` — 15 systems (`joker`…`supremacy`, `ea-template`); `spec.price: 'free'|'paid'|null`; research status lives on the model | No commercial metadata. Added as a separate layer `src/data/commercial/products.mjs` keyed by slug; research status and commercial status never merge (§74) |
| EA detail CTAs | "View on MQL5" (external) + in-page performance anchor | New "ACCESS THIS STRATEGY" → `/access/?ea=<slug>` (§43) |
| EA index | facet chips: market / strategy / risk; compare picker | New facet **Access** (IB / PRO / PRIVATE) from commercial data (§46–47) |
| Navigation | Header full (5 + 3 items); fullscreen menu + footer carry the rest | EA ACCESS and DEVELOPMENT go to menu/footer (`headerHidden`), not the header (§42) |
| Legal | Footer risk disclosure + backtest disclaimer (7 locales). No Terms / Privacy / Refund / Subscription / IB disclosure pages | Documented as gaps in `COMMERCIAL_LEGAL_GAPS.md`; IB referral disclosure added on the access page (§52) |
| Downloads | No EA binaries anywhere under `public/` (verified by test) | Stays that way (§69, §133); design in `SECURE_DOWNLOAD_ARCHITECTURE.md` |
| Brokers / IB | No broker, IB URL, rate or eligibility data exists | Everything broker-related is `DATA_REQUIRED` and feature-flagged (§1) |
| Payment | No provider chosen | `PaymentProvider / SubscriptionProvider / LicenseProvider` interfaces documented, nothing wired (§11–12) |
| Analytics | None on site | Event names reserved (§112) as `data-track` attributes; no collector |
| i18n | 7 locales (ja en zh hi id th vi), per-page blocks in `src/i18n/*.mjs` | New `access`, `development`, `account` blocks in all 7 |

## Invariants carried into the implementation

- Nothing is invented: no broker, rate, URL, subscriber count, testimonial, private EA name/result.
- `DATA_REQUIRED` is rendered literally where owner data is missing.
- Research status ≠ commercial status; the EA model exposes both, the UI never blends them.
- No fake login / lock UI while auth does not exist (§78): `/account/` states plainly that the account layer is not live.
- Commercial surface ≈ 30% of the visual weight: one hub page, one development page, one CTA per EA, badges.
