/**
 * Validation engine I/O helpers (Phase 14): plan store, trade loading from
 * the SAME tester reports the rest of the site uses, hashing, and the
 * append-only public results store.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decode, extractTrades, findReports, FOLDER_TO_SLUG } from '../tools/extract-trades.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const VAL_DATA = process.env.VALIDATION_DATA_DIR || join(ROOT, 'data', 'validation');
export const PLANS_FILE = process.env.VALIDATION_PLANS_FILE || join(ROOT, 'tools', 'validation-plans.json');
export const RESULTS_FILE = process.env.VALIDATION_RESULTS_FILE || join(ROOT, 'tools', 'validation-results.json');

export const sha = (s) => createHash('sha256').update(s).digest('hex');

export async function loadPlans() {
  try {
    return JSON.parse(await readFile(PLANS_FILE, 'utf8'));
  } catch {
    return { _readme: 'Validation plans (Phase 14). DRAFT until a human approves via scripts/approve-validation-plan.mjs; APPROVED plans are immutable (hash-checked at run).', plans: [] };
  }
}

export async function savePlans(store) {
  await writeFile(PLANS_FILE, JSON.stringify(store, null, 1), 'utf8');
}

export async function loadResults() {
  try {
    return JSON.parse(await readFile(RESULTS_FILE, 'utf8'));
  } catch {
    return { _readme: 'Validation results (public aggregates). Derived by scripts/run-oos.mjs / run-wf.mjs from immutable manifests; evidence stages are computed from these records, never hand-set.', generatedAt: null, validations: [] };
  }
}

export async function saveResults(store) {
  store.generatedAt = new Date().toISOString();
  await writeFile(RESULTS_FILE, JSON.stringify(store, null, 1), 'utf8');
}

/** The frozen content a plan hash covers (§146): everything that defines the
 *  validation. Approval pins it; runners refuse a mismatch. */
export function planHash(plan) {
  const frozen = {
    validationPlanId: plan.validationPlanId,
    strategyId: plan.strategyId,
    version: plan.version,
    method: plan.method,
    provenance: plan.provenance,
    split: plan.split || null,
    wf: plan.wf || null,
    thresholds: plan.thresholds,
    parameterMode: plan.parameterMode,
  };
  return sha(JSON.stringify(frozen));
}

/**
 * Load the strategy's closed trades by re-parsing the SAME tester report the
 * site's trade data came from (matched by basename, like Monte Carlo).
 * Returns metric-ready trades + provenance.
 */
export async function loadStrategyTrades(slug, srcDir) {
  const folder = Object.entries(FOLDER_TO_SLUG).find(([, s]) => s === slug)?.[0];
  if (!folder) throw new Error(`no source folder mapped for ${slug}`);

  const extracted = JSON.parse(await readFile(join(ROOT, 'tools', 'extracted-trades.json'), 'utf8'));
  const wanted = extracted[slug]?.source || null;

  const reports = await findReports(join(srcDir, folder));
  let path = wanted ? reports.find((p) => basename(p) === wanted) : null;
  if (!path) path = reports[0] || null;
  if (!path) throw new Error(`no tester report found for ${slug} under ${srcDir}`);

  const buf = await readFile(path);
  const { trades: raw, dialect } = extractTrades(decode(buf));
  if (raw.length < 50) throw new Error(`unusable deal list in ${basename(path)}`);

  const trades = raw
    .filter((t) => t.p !== null && t.t)
    .map((t) => ({
      closeTime: t.t,
      openTime: null,
      netProfit: t.p,
      profit: t.p,
      swap: 0,
      commission: 0,
      fees: 0,
      direction: t.side || null,
      symbol: null,
      balance: t.b,
    }));
  const first = trades[0];
  const startBalance = first && first.balance !== null ? first.balance - first.netProfit : null;

  return {
    trades,
    startBalance,
    dialect,
    reportFile: basename(path),
    reportHash: sha(buf),
    eaHash: null, // set by caller from the .mq5 when available
  };
}

export async function ensureDirs() {
  for (const d of ['manifests', 'runs', 'windows', 'generated']) await mkdir(join(VAL_DATA, d), { recursive: true });
}
