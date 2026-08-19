/**
 * ============================================================================
 * PROTOCOL TOOLS — shared implementations for the Phase 15 CLI set
 * ============================================================================
 * Thin CLI wrappers (seal-holdout, research-budget-status, log-research-run,
 * mark-milestone, freeze-candidate, approve-holdout-unlock, unlock-holdout,
 * generate-research-config) call into here. Every state change audits (§24);
 * every guard failure exits non-zero with the reason.
 * ============================================================================
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { PROTOCOL_CONFIG } from '../config/research-protocol.mjs';
import { checkResearchPeriod, HOLDOUT_ERROR } from '../src/lib/holdout-guard.mjs';
import { ROOT, loadStore, saveStore, audit, sha, gitCommit, holdoutHash } from './lib-protocol-io.mjs';

export async function sealHoldout(holdoutId, { dryRun = false } = {}) {
  const store = await loadStore();
  const h = store.holdouts.find((x) => x.holdoutId === holdoutId);
  if (!h) throw new Error(`${holdoutId} not found`);
  if (h.status !== 'DRAFT') throw new Error(`${holdoutId} is ${h.status} — only DRAFT can be sealed; changing a sealed period means INVALIDATED + a new holdout (§20)`);
  if (dryRun) return `[dry run] would seal ${holdoutId} (${h.start} → ${h.end})`;
  h.status = 'SEALED';
  h.sealedAt = new Date().toISOString();
  h.manifestHash = holdoutHash(h);
  await saveStore(store);
  await audit({ userAction: 'SEAL_HOLDOUT', holdoutId, reason: 'pre-development seal (§135)' });
  return `SEALED ${holdoutId} (${h.start} → ${h.end}) · hash ${h.manifestHash.slice(0, 12)}… — the period is now immutable and refused by every research tool`;
}

export async function budgetStatus(researchId) {
  const store = await loadStore();
  const r = store.research.find((x) => x.researchId === researchId);
  if (!r) throw new Error(`${researchId} not found`);
  const rows = [
    ['Logic variants', r.used.logicVariants, r.budget.maxLogicVariants],
    ['Experiments', r.used.experiments, r.budget.maxExperiments],
    ['Optimization runs', r.used.optimizationRuns, r.budget.maxOptimizationRuns],
    ['Parameter sets', r.used.parameterSets, r.budget.maxParameterSets],
  ];
  return rows.map(([k, u, m]) => `${k.padEnd(18)} ${u} / ${m}${u >= m ? '  ← BUDGET REACHED' : ''}`).join('\n');
}

/** §29: increment a budget counter; refuse past the cap. */
export async function logResearchRun(researchId, type, note, { parameterSets = 0, dryRun = false } = {}) {
  const key = { variant: 'logicVariants', experiment: 'experiments', optimization: 'optimizationRuns' }[type];
  if (!key) throw new Error(`type must be variant|experiment|optimization`);
  const store = await loadStore();
  const r = store.research.find((x) => x.researchId === researchId);
  if (!r) throw new Error(`${researchId} not found`);
  const capKey = 'max' + key[0].toUpperCase() + key.slice(1);
  if (r.used[key] + 1 > r.budget[capKey]) throw new Error(`RESEARCH BUDGET EXCEEDED: ${key} ${r.used[key]}/${r.budget[capKey]} — more search means more overfitting risk (§27); stop or extend the budget explicitly in a new manifest revision`);
  if (r.used.parameterSets + parameterSets > r.budget.maxParameterSets)
    throw new Error(`RESEARCH BUDGET EXCEEDED: parameterSets ${r.used.parameterSets}+${parameterSets} > ${r.budget.maxParameterSets}`);
  if (dryRun) return `[dry run] would log ${type} (${key} → ${r.used[key] + 1}/${r.budget[capKey]})`;
  r.used[key]++;
  r.used.parameterSets += parameterSets;
  await saveStore(store);
  await audit({ userAction: 'LOG_RESEARCH_RUN', researchId, type, note, parameterSets });
  return `${type} logged: ${key} ${r.used[key]}/${r.budget[capKey]}${parameterSets ? ` · parameterSets ${r.used.parameterSets}/${r.budget.maxParameterSets}` : ''}`;
}

export async function markMilestone(researchId, milestone, by) {
  const store = await loadStore();
  const r = store.research.find((x) => x.researchId === researchId);
  if (!r) throw new Error(`${researchId} not found`);
  if (!(milestone in r.milestones)) throw new Error(`milestone must be one of ${Object.keys(r.milestones).join('|')}`);
  r.milestones[milestone] = true;
  await saveStore(store);
  await audit({ userAction: 'MARK_MILESTONE', researchId, milestone, by });
  return `milestone ${milestone} = true (${researchId})`;
}

/** §62–64: freeze a candidate — hashes pinned, mutation detectable forever. */
export async function freezeCandidate(strategyId, version, sourcePath, parameterSnapshot, { dryRun = false } = {}) {
  const store = await loadStore();
  const r = store.research.find((x) => x.strategyId === strategyId);
  if (!r) throw new Error(`no research manifest for ${strategyId} — create + seal first (§135)`);
  const h = store.holdouts.find((x) => x.holdoutId === r.finalHoldoutId);
  if (!h || h.status === 'DRAFT') throw new Error(`holdout not SEALED — freezing before sealing violates the protocol (§135)`);
  if (store.candidates.some((c) => c.strategyId === strategyId && c.version === version))
    throw new Error(`candidate version ${version} already exists — a frozen candidate is immutable; use a new version (§64, §82)`);

  const src = await readFile(sourcePath);
  const candidate = {
    candidateId: `CAN-XAU-${String(store.candidates.length + 1).padStart(3, '0')}`,
    strategyId,
    version,
    sourceFile: sourcePath.replace(/\\/g, '/').split('/').pop(),
    sourceHash: sha(src),
    parameterHash: sha(JSON.stringify(parameterSnapshot)),
    parameters: parameterSnapshot,
    gitCommit: gitCommit(),
    budgetAtFreeze: { ...(store.research.find((x) => x.strategyId === strategyId).used) },
    status: 'FROZEN',
    frozenAt: new Date().toISOString(),
  };
  if (dryRun) return `[dry run] would freeze ${candidate.candidateId} ${version} src ${candidate.sourceHash.slice(0, 12)}… params ${candidate.parameterHash.slice(0, 12)}…`;
  store.candidates.push(candidate);
  await saveStore(store);
  await audit({ userAction: 'FREEZE_CANDIDATE', candidateId: candidate.candidateId, strategyId, version });
  return `FROZEN ${candidate.candidateId} (${strategyId} ${version})\n  source   ${candidate.sourceHash.slice(0, 16)}…\n  params   ${candidate.parameterHash.slice(0, 16)}…\n  commit   ${candidate.gitCommit}\n  budget   ${JSON.stringify(candidate.budgetAtFreeze)}`;
}

/** §69: HUMAN-run approval — checks every gate, then UNLOCK_APPROVED. */
export async function approveHoldoutUnlock(holdoutId, by) {
  if (!by) throw new Error('--by "name" required: approval is a human act (§21–22, §128)');
  const store = await loadStore();
  const h = store.holdouts.find((x) => x.holdoutId === holdoutId);
  if (!h) throw new Error(`${holdoutId} not found`);
  if (h.status !== 'SEALED') throw new Error(`${holdoutId} is ${h.status} — only SEALED can be approved for unlock`);
  if (holdoutHash(h) !== h.manifestHash) throw new Error('holdout manifest mutated since sealing — INVALID');

  const r = store.research.find((x) => x.finalHoldoutId === holdoutId);
  const gates = {
    candidateFrozen: store.candidates.some((c) => c.strategyId === h.strategyId && c.status === 'FROZEN'),
    budgetRecorded: r && Object.values(r.used).some((v) => v > 0),
    internalValidationComplete: r?.milestones.internalValidation === true,
    monteCarloComplete: r?.milestones.monteCarlo === true,
  };
  const failed = Object.entries(gates).filter(([, ok]) => !ok).map(([k]) => k);
  if (failed.length) throw new Error(`unlock gate not satisfied (§69): ${failed.join(', ')}`);

  h.status = 'UNLOCK_APPROVED';
  h.unlockApproval = { by, at: new Date().toISOString() };
  await saveStore(store);
  await audit({ userAction: 'APPROVE_HOLDOUT_UNLOCK', holdoutId, by });
  return `UNLOCK_APPROVED ${holdoutId} by ${by} — a human may now run unlock-holdout.mjs`;
}

/** §23, §83–84: unlock + contamination register entry. */
export async function unlockHoldout(holdoutId) {
  const store = await loadStore();
  const h = store.holdouts.find((x) => x.holdoutId === holdoutId);
  if (!h) throw new Error(`${holdoutId} not found`);
  if (h.status !== 'UNLOCK_APPROVED') throw new Error(`${holdoutId} is ${h.status} — human approval (approve-holdout-unlock.mjs) must come first; AI/automation must never reach this state on its own (§21, §99, §128)`);
  h.status = 'UNLOCKED';
  h.unlockedAt = new Date().toISOString();
  for (const c of store.candidates.filter((x) => x.strategyId === h.strategyId && x.status === 'FROZEN')) {
    store.contamination.push({ strategyId: h.strategyId, version: c.version, holdoutId, observedAt: h.unlockedAt });
  }
  await saveStore(store);
  await audit({ userAction: 'UNLOCK_HOLDOUT', holdoutId });
  return `UNLOCKED ${holdoutId} — the period is no longer unknown to this strategy line (contamination registered). One prospective run only (§70–71).`;
}

/** §17, §38: tester-config generation with the date guard (§112 target). */
export async function generateResearchConfig(researchId, layer, { dryRun = false } = {}) {
  const store = await loadStore();
  const r = store.research.find((x) => x.researchId === researchId);
  if (!r) throw new Error(`${researchId} not found`);
  const period = { development: r.researchPeriod, internal: r.internalValidationPeriod, prospectiveOOS: r.prospectiveOOSPeriod }[layer];
  if (!period) throw new Error('layer must be development|internal|prospectiveOOS');

  const guard = checkResearchPeriod(store.holdouts, r.strategyId, period);
  if (!guard.ok) throw new Error(`${HOLDOUT_ERROR} (${guard.holdoutId})`);

  const ini = [
    `; TYO Phase 15 research config — ${researchId} / ${layer}`,
    '[Tester]',
    `Expert=TYO\\TYO_XAU_Pyramid`,
    'Symbol=XAUUSD',
    'Period=M5',
    `FromDate=${period.from.replace(/-/g, '.')}`,
    `ToDate=${period.to.replace(/-/g, '.')}`,
    'Model=1 ; 1-minute OHLC for iteration; candidates re-verified on real ticks (§41 of Phase 14)',
    'Deposit=10000',
    'Leverage=1:500',
    `Report=tyo-xau-${researchId}-${layer}`,
    'ShutdownTerminal=1',
  ].join('\n');
  if (dryRun) return `[dry run] config for ${layer} ${period.from} → ${period.to}`;
  const dir = join(ROOT, 'data', 'research', 'generated');
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${researchId}-${layer}.ini`);
  await writeFile(path, ini, 'utf8');
  await audit({ userAction: 'GENERATE_RESEARCH_CONFIG', researchId, layer, period });
  return `→ ${path} (${period.from} → ${period.to}; holdout guard passed)`;
}
