/**
 * ============================================================================
 * CREATE RESEARCH MANIFEST + DRAFT HOLDOUT (Phase 15 §25, §18, §107)
 * ============================================================================
 *   node scripts/create-research-manifest.mjs XAU_PYRAMID [--dry-run]
 *
 * Instantiates the pre-committed research config (data layers, objectives,
 * HOLDOUT PASS THRESHOLDS — frozen here, §77 — and the research budget) as
 * RES-/HOLD- manifests. Layers must be chronological and non-overlapping;
 * the holdout is created DRAFT and must be SEALED before any development
 * run (§135).
 * ============================================================================
 */

import { parseYmd } from '../src/lib/validation.mjs';
import { loadStore, saveStore, audit } from './lib-protocol-io.mjs';

const argv = process.argv.slice(2);
const strategyId = argv.find((a) => !a.startsWith('--'));
const dryRun = argv.includes('--dry-run');

if (strategyId !== 'XAU_PYRAMID') {
  console.error('usage: node scripts/create-research-manifest.mjs XAU_PYRAMID  (add configs for new strategies in config/)');
  process.exit(1);
}
const { XAU_PYRAMID_RESEARCH: R } = await import('../config/xau-pyramid-research.mjs');

/* layer sanity: chronological, non-overlapping (§9, fail-closed) */
const order = ['development', 'internalValidation', 'prospectiveOOS', 'finalHoldout'];
for (let i = 0; i < order.length; i++) {
  const L = R.layers[order[i]];
  if (parseYmd(L.from) === null || parseYmd(L.to) === null || parseYmd(L.from) >= parseYmd(L.to)) {
    console.error(`✗ layer ${order[i]} has invalid dates`);
    process.exit(1);
  }
  if (i > 0 && parseYmd(R.layers[order[i - 1]].to) >= parseYmd(L.from)) {
    console.error(`✗ layers ${order[i - 1]} and ${order[i]} overlap or are out of order`);
    process.exit(1);
  }
}

const store = await loadStore();
if (store.research.some((r) => r.strategyId === strategyId)) {
  console.error(`✗ a research manifest for ${strategyId} already exists — the protocol is one manifest per strategy line`);
  process.exit(1);
}

const seq = store.research.length + 1;
const researchId = `RES-XAU-${String(seq).padStart(3, '0')}`;
const holdoutId = `HOLD-XAU-${String(seq).padStart(3, '0')}`;

const manifest = {
  researchId,
  strategyId,
  displayName: R.displayName,
  version: '0.1.0',
  qualityLevel: 'PROCESS_PROSPECTIVE',
  researchPeriod: R.layers.development,
  internalValidationPeriod: R.layers.internalValidation,
  prospectiveOOSPeriod: R.layers.prospectiveOOS,
  finalHoldoutId: holdoutId,
  objectives: R.objectives,
  /* §75–77: pass thresholds pre-committed and immutable from this moment */
  holdoutPassThresholds: R.holdoutPass,
  budget: R.budget,
  used: { logicVariants: 0, experiments: 0, optimizationRuns: 0, parameterSets: 0 },
  milestones: { baseline: false, internalValidation: false, monteCarlo: false },
  knownExposure: R.knownExposure,
  demonTrend: R.demonTrend,
  createdAt: new Date().toISOString(),
};

const holdout = {
  holdoutId,
  strategyId,
  start: R.layers.finalHoldout.from,
  end: R.layers.finalHoldout.to,
  purpose: 'FINAL_PROSPECTIVE_VALIDATION',
  qualityLevel: 'PROCESS_PROSPECTIVE',
  status: 'DRAFT',
  createdAt: new Date().toISOString(),
};

console.log(`\n  ${researchId} (${strategyId}) — quality PROCESS_PROSPECTIVE`);
console.log(`  development          ${manifest.researchPeriod.from} → ${manifest.researchPeriod.to}`);
console.log(`  internal validation  ${manifest.internalValidationPeriod.from} → ${manifest.internalValidationPeriod.to}`);
console.log(`  prospective OOS      ${manifest.prospectiveOOSPeriod.from} → ${manifest.prospectiveOOSPeriod.to}`);
console.log(`  FINAL HOLDOUT        ${holdout.start} → ${holdout.end}  [${holdoutId}, DRAFT]`);
console.log(`  budget: variants ≤${R.budget.maxLogicVariants} · experiments ≤${R.budget.maxExperiments} · optimization ≤${R.budget.maxOptimizationRuns}`);
console.log(`  holdout pass (frozen): PF ≥${R.holdoutPass.minPF}, payoff >${R.holdoutPass.minExpectedPayoff}, annualized trades ≥${R.holdoutPass.minAnnualizedTrades}, DD ≤ internal ×${R.holdoutPass.maxDDvsInternalMultiple}`);

if (dryRun) {
  console.log('\n  dry run — nothing written.\n');
  process.exit(0);
}

store.research.push(manifest);
store.holdouts.push(holdout);
await saveStore(store);
await audit({ userAction: 'CREATE_RESEARCH_MANIFEST', researchId, holdoutId, reason: 'phase-15 protocol instantiation' });
console.log(`\n  → seal before ANY development run: node scripts/seal-holdout.mjs ${holdoutId}\n`);
