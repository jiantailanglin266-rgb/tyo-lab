/**
 * node scripts/unlock-holdout.mjs HOLD-XAU-001
 * HUMAN-run only (Phase 15 §23, §99, §108, §128). Requires UNLOCK_APPROVED
 * (human approval with all §69 gates). Registers contamination for every
 * frozen candidate of the strategy (§83–84).
 */
import { unlockHoldout } from './protocol-tools.mjs';
const id = process.argv[2];
if (!id) { console.error('usage: node scripts/unlock-holdout.mjs <holdoutId>'); process.exit(1); }
try { console.log('\n  ' + (await unlockHoldout(id)) + '\n'); }
catch (e) { console.error(`\n  ✗ ${e.message}\n`); process.exit(1); }
