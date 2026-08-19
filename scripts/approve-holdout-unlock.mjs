/**
 * node scripts/approve-holdout-unlock.mjs HOLD-XAU-001 --by "name"
 * HUMAN-run only (Phase 15 §21–22, §69, §128). Checks every unlock gate
 * (candidate frozen, budget recorded, internal validation + Monte Carlo
 * milestones) before granting UNLOCK_APPROVED. AI agents must not run this
 * on their own initiative.
 */
import { approveHoldoutUnlock } from './protocol-tools.mjs';
const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
const byIdx = argv.indexOf('--by');
try { console.log('\n  ' + (await approveHoldoutUnlock(id, byIdx >= 0 ? argv[byIdx + 1] : null)) + '\n'); }
catch (e) { console.error(`\n  ✗ ${e.message}\n`); process.exit(1); }
