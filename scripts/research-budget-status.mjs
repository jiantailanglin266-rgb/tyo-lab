/** node scripts/research-budget-status.mjs RES-XAU-001  (Phase 15 §26–29) */
import { budgetStatus } from './protocol-tools.mjs';
const id = process.argv[2];
if (!id) { console.error('usage: node scripts/research-budget-status.mjs <researchId>'); process.exit(1); }
try { console.log('\n' + (await budgetStatus(id)).split('\n').map((l) => '  ' + l).join('\n') + '\n'); }
catch (e) { console.error(`\n  ✗ ${e.message}\n`); process.exit(1); }
