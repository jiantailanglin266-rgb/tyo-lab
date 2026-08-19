/** node scripts/seal-holdout.mjs HOLD-XAU-001 [--dry-run]  (Phase 15 §14–20) */
import { sealHoldout } from './protocol-tools.mjs';
const id = process.argv[2];
if (!id) { console.error('usage: node scripts/seal-holdout.mjs <holdoutId> [--dry-run]'); process.exit(1); }
try { console.log('\n  ' + (await sealHoldout(id, { dryRun: process.argv.includes('--dry-run') })) + '\n'); }
catch (e) { console.error(`\n  ✗ ${e.message}\n`); process.exit(1); }
