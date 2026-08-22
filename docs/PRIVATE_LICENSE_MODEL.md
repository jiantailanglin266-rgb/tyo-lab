# Private License Model (Phase 16 §23–29, §66, §129–130)

- Product: `PRIVATE_STRATEGY` — existence only. No name, logic, file, report
  or result is published. "Details available upon inquiry."
- Price: $5,000 one-time (USD). **No checkout.** Inquiry → use-case review →
  online meeting → terms → payment → license delivery.
- Price justification: exclusivity, license scope, direct support,
  customization. Never performance. The same risk disclosure applies.
- Inquiry fields: name, company (optional), country, email, platform,
  experience, capital range (optional), preferred market, purpose, message,
  NDA flag. Subject: `TYO PRIVATE EA Inquiry`.
- License record: `licenseId, userId, strategyId, version, accessType:
  PRIVATE, issuedAt, expiresAt | null, status, scope { maxMt5Accounts,
  maxDevices, sourceIncluded }`. Source inclusion and limits: DATA_REQUIRED.
- Security: private artifacts live in private commercial storage, never in
  the public repo; delivery via signed URL after agreement and payment.
- Admin process (16B+): inquiry → status NEW → REVIEWING → MEETING → TERMS →
  PAID → DELIVERED, all in the protected admin app, never on the static site.
