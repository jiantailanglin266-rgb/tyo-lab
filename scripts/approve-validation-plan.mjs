/**
 * ============================================================================
 * APPROVE VALIDATION PLAN — human-run only (Phase 14 §76–79, §146)
 * ============================================================================
 *   node scripts/approve-validation-plan.mjs VAL-OOS-000001 --by "owner"
 *
 * DRAFT → APPROVED, records who approved and when, and pins the plan hash.
 * After approval the plan is immutable: runners refuse a hash mismatch, and
 * fixing a mistake means a NEW plan (§146). AI agents must not run this on
 * their own initiative — approval represents a human decision (§78).
 * ============================================================================
 */

import { loadPlans, savePlans, planHash } from './lib-validation-io.mjs';

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
const byIdx = argv.indexOf('--by');
const by = byIdx >= 0 ? argv[byIdx + 1] : null;

if (!id || !by) {
  console.error('usage: node scripts/approve-validation-plan.mjs <planId> --by "name"');
  process.exit(1);
}

const store = await loadPlans();
const plan = store.plans.find((p) => p.validationPlanId === id);
if (!plan) {
  console.error(`✗ ${id} not found`);
  process.exit(1);
}
if (plan.status !== 'DRAFT') {
  console.error(`✗ ${id} is ${plan.status} — only DRAFT plans can be approved; create a new plan instead`);
  process.exit(1);
}

plan.status = 'APPROVED';
plan.approvedByHuman = { by, at: new Date().toISOString() };
plan.planHash = planHash(plan);
await savePlans(store);

console.log(`\n  APPROVED ${id} by ${by}`);
console.log(`  plan hash ${plan.planHash.slice(0, 16)}… — the plan is now immutable (§146)\n`);
