# Subscription Architecture (Phase 16 §11–14, §55–58, §80–81)

## Separation
```
TYO LAB (static, GitHub Pages)  →  TYO ACCOUNT (auth + billing)  →  TYO DOWNLOAD API (signed downloads)
```
The static site never handles money, identity or files. `COMMERCIAL.accountUrl`
and `COMMERCIAL.downloadApiUrl` in `src/site.config.mjs` point at the two
services once they exist.

## Provider abstraction
```ts
interface PaymentProvider {          // Stripe | Paddle | Lemon Squeezy
  createCheckout(userId, planId): Promise<{ url }>;
  handleWebhook(event): Promise<SubscriptionEvent>;
  cancel(subscriptionId): Promise<void>;
}
interface SubscriptionProvider {     // state machine over provider events
  stateOf(userId): Promise<'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'>;
  apply(event: SubscriptionEvent): Promise<void>;
}
interface LicenseProvider {          // entitlements → licenses
  issue(userId, strategyId, version, accessType): Promise<License>;
  active(userId): Promise<License[]>;
  revoke(licenseId, reason): Promise<void>;
}
```
Tax / VAT is delegated to the provider (merchant-of-record providers preferred).

## Plan facts
PRO = $10 / month, USD, monthly only (no annual yet). "Cancel anytime" is
displayed only once the chosen provider guarantees it (currently
DATA_REQUIRED). Refund policy: DATA_REQUIRED.

## Entitlement rule
Download allowed ⇔ subscription state ∈ {TRIAL, ACTIVE}. PAST_DUE grace is a
policy decision (default: no access). Knowing a file URL never grants access (§14).

## License record (§19)
```
licenseId, userId, strategyId, version, accessType (IB | PRO | PRIVATE),
issuedAt, expiresAt | null, status (ACTIVE | REVOKED | EXPIRED),
limits { maxMt5Accounts, maxDevices }   // per plan, DATA_REQUIRED
```

## Phase map
16B: auth (e-mail magic link / Google through a mature provider — no home-grown
passwords), entitlement store, signed download API, /account/ live.
16C: payment provider connection + webhooks + subscription states.
16D: IB verification (manual first).
