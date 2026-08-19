/**
 * node scripts/generate-research-config.mjs RES-XAU-001 --layer development|internal|prospectiveOOS [--dry-run]
 * (Phase 15 §17, §38) Emits a Strategy Tester config for a RESEARCH layer.
 * Any period intersecting a SEALED holdout is refused with the canonical
 * error — this is the §112 security-test surface.
 */
import { generateResearchConfig } from './protocol-tools.mjs';
const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
if (!id || !flag('layer')) { console.error('usage: node scripts/generate-research-config.mjs <researchId> --layer development|internal|prospectiveOOS'); process.exit(1); }
try { console.log('\n  ' + (await generateResearchConfig(id, flag('layer'), { dryRun: argv.includes('--dry-run') })) + '\n'); }
catch (e) { console.error(`\n  ✗ ${e.message}\n`); process.exit(1); }
