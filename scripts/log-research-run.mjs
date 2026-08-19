/**
 * node scripts/log-research-run.mjs RES-XAU-001 --type experiment|optimization|variant
 *      [--note "..."] [--parameter-sets N] [--dry-run]     (Phase 15 §29)
 * Refuses past the pre-committed research budget — more search means more
 * overfitting risk, and the count itself is evidence (§27).
 */
import { logResearchRun } from './protocol-tools.mjs';
const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
const flag = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
if (!id || !flag('type')) { console.error('usage: node scripts/log-research-run.mjs <researchId> --type experiment|optimization|variant [--note ...] [--parameter-sets N]'); process.exit(1); }
try {
  console.log('\n  ' + (await logResearchRun(id, flag('type'), flag('note', ''), { parameterSets: Number(flag('parameter-sets', 0)), dryRun: argv.includes('--dry-run') })) + '\n');
} catch (e) { console.error(`\n  ✗ ${e.message}\n`); process.exit(1); }
