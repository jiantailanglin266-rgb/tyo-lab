/**
 * node scripts/freeze-candidate.mjs XAU_PYRAMID --version V001
 *      --source mql5/Experts/TYO/TYO_XAU_Pyramid.mq5 --params params.json [--dry-run]
 * (Phase 15 §62–64) FROZEN means frozen: hashes pinned; any later change is
 * a NEW version with a new candidate id.
 */
import { readFile } from 'node:fs/promises';
import { freezeCandidate } from './protocol-tools.mjs';
const argv = process.argv.slice(2);
const strategyId = argv.find((a) => !a.startsWith('--'));
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
if (!strategyId || !flag('version') || !flag('source') || !flag('params')) {
  console.error('usage: node scripts/freeze-candidate.mjs <strategyId> --version Vnnn --source <mq5> --params <json>');
  process.exit(1);
}
try {
  const params = JSON.parse(await readFile(flag('params'), 'utf8'));
  console.log('\n  ' + (await freezeCandidate(strategyId, flag('version'), flag('source'), params, { dryRun: argv.includes('--dry-run') })) + '\n');
} catch (e) { console.error(`\n  ✗ ${e.message}\n`); process.exit(1); }
