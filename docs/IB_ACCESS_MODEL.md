# IB Access Model (Phase 16 §4–8, §50–54, §82–83)

## Principle
EA access fee $0 for eligible users linked through a supported broker
referral — never "free": broker spreads, commissions and swaps still apply.
All wording is conditional ("may be waived", "eligible users"), and the
referral-compensation disclosure is always rendered with the model.

## Switches (`src/data/commercial/access.mjs`)
- `enabled` — show/hide the IB model entirely (platform / regional rules, §1).
- `brokersPublished` — `/supported-brokers/` stays unpublished until a real contract exists.
- `verificationMethod` — `MANUAL` now; `API` later.
- `brokers[]` — empty; entries need id, name, referralUrl, eligibility, countries.
- `disclosure` — always true when the model is shown.

## Flow
TYO LAB → Broker account → TYO IB registration → Verification → EA access.

## Status machine
NOT_CONNECTED → PENDING_VERIFICATION → VERIFIED → ACTIVE ⇄ SUSPENDED.

## Verification record (backend, 16D)
```
ibLinkId, userId, brokerId, accountOrReferralIdHash, email, status,
submittedAt, verifiedAt, verifiedBy, notes
```
Only a hash of the account/referral id is stored; never credentials.
Manual process: user submits → admin verifies in the broker back office →
entitlement `IB` granted to the user → EA access via the download API.

## DATA_REQUIRED from the owner
Supported broker(s) · referral URL(s) · eligibility rules · verification
method (manual/API) · countries supported · whether the compensation
disclosure needs broker-specific wording.
