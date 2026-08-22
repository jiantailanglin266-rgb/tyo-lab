# Secure Download Architecture (Phase 16 §15–16, §60–71)

## Non-negotiables
- No EA binary (.ex4 / .ex5 / .mq4 / .mq5 / .set) in the public repo or
  `public/` — enforced by `scripts/test-commercial.mjs`.
- No download is ever a plain file URL. Every download is a short-lived
  signed URL issued only after an entitlement check.

## Components
```
release pipeline (private)  →  private object storage  →  download API  →  signed URL (TTL ≤ 10 min)
        │                              │                        │
   checksum SHA-256             versioned keys            entitlement check
   manifest update           strategyId/version/...      (IB | PRO | PRIVATE)
```
- **Manifest** (`products.json` in the private repo; mirrored fields in
  `products.mjs`): strategyId, latestVersion, releasedAt, checksum, artifact
  key, bundle contents (ex5 / set / README / CHANGELOG).
- **Download API**: `GET /download/:strategyId/:version` → verify session →
  verify entitlement (license active, plan includes strategy, device/account
  limits) → audit row → 302 to a signed URL.
- **Audit** (minimal privacy): userId, strategyId, version, downloadedAt,
  ipHash (salted), user-agent family. Anomaly rule: more than N downloads in
  24 h or more than M distinct ipHash in 7 d → flag for review (no auto-ban).
- **Checksum** is shown on the account download page so users can verify.
- **Version updates** per plan: IB standard, PRO priority, PRIVATE private —
  labels today; policy text DATA_REQUIRED.

## Repositories
`public research repo` (this site) vs `private commercial artifacts`
(binaries, manifest, release workflow). GitHub Actions later: Release EA →
checksum → upload to private storage → update manifest.

## MT5 license check (future, §20)
Optional: the EA calls a license endpoint with licenseId + account hash; the
server answers allow / deny; offline grace window configurable. Not in MVP.
