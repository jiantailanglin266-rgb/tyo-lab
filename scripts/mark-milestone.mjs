/** node scripts/mark-milestone.mjs RES-XAU-001 --milestone baseline|internalValidation|monteCarlo --by "name" */
import { markMilestone } from './protocol-tools.mjs';
const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
if (!id || !flag('milestone') || !flag('by')) { console.error('usage: node scripts/mark-milestone.mjs <researchId> --milestone m --by "name"'); process.exit(1); }
try { console.log('\n  ' + (await markMilestone(id, flag('milestone'), flag('by'))) + '\n'); }
catch (e) { console.error(`\n  ✗ ${e.message}\n`); process.exit(1); }
