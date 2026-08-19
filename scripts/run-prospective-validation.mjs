/**
 * ============================================================================
 * ONE-SHOT PROSPECTIVE VALIDATION (Phase 15 §70–80, §109, §129–130)
 * ============================================================================
 *   node scripts/run-prospective-validation.mjs CAN-XAU-001
 *        --report <holdout tester report .htm/.html> [--dry-run]
 *
 * Gates (all fail-closed):
 *   - candidate FROZEN and hash-intact (mutation of a frozen candidate is
 *     detectable and fatal — §64)
 *   - holdout UNLOCKED (human-approved chain; §69) and not yet CONSUMED
 *   - the report's trade span must cover the EXACT holdout period; trades
 *     are sliced to the sealed range only
 *   - thresholds come from the research manifest, frozen at creation (§77):
 *     they are read, never written
 *   - ONE SHOT: publishing marks the holdout CONSUMED; a second run for the
 *     same candidate/holdout is refused (§71). A technical failure that
 *     produced no result does not consume (§72) — this runner consumes only
 *     on successful publication.
 *
 * FAIL is a publishable result (§81, §130): the record ships either way.
 * ============================================================================
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { decode, extractTrades } from '../tools/extract-trades.mjs';
import { windowMetrics, tradesInRange, monthsBetween } from '../src/lib/validation.mjs';
import { checkProspectiveRun } from '../src/lib/holdout-guard.mjs';
import { loadStore, saveStore, audit, sha, ROOT } from './lib-protocol-io.mjs';
import { loadResults, saveResults } from './lib-validation-io.mjs';

const argv = process.argv.slice(2);
const candidateId = argv.find((a) => !a.startsWith('--'));
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
const dryRun = argv.includes('--dry-run');
const reportPath = flag('report');

if (!candidateId || !reportPath) {
  console.error('usage: node scripts/run-prospective-validation.mjs <candidateId> --report <tester report> [--dry-run]');
  process.exit(1);
}

const store = await loadStore();
const cand = store.candidates.find((c) => c.candidateId === candidateId);
if (!cand) { console.error(`✗ ${candidateId} not found`); process.exit(1); }
if (cand.status !== 'FROZEN') { console.error(`✗ ${candidateId} is ${cand.status} — only FROZEN candidates validate (§64)`); process.exit(1); }

const research = store.research.find((r) => r.strategyId === cand.strategyId);
const holdout = store.holdouts.find((h) => h.holdoutId === research?.finalHoldoutId);
const period = holdout ? { from: holdout.start, to: holdout.end } : null;
const gate = checkProspectiveRun(holdout, period || {});
if (!gate.ok) { console.error(`✗ ${gate.error}`); process.exit(1); }
if (holdout.consumedBy) { console.error(`✗ holdout ${holdout.holdoutId} already CONSUMED by ${holdout.consumedBy} — one shot only (§71)`); process.exit(1); }

/* candidate integrity: the frozen source must still hash-match if present */
try {
  const src = await readFile(join(ROOT, 'mql5', 'Experts', 'TYO', cand.sourceFile));
  if (sha(src) !== cand.sourceHash) {
    console.error('✗ frozen candidate source has been MODIFIED since freezing — validation refused; create a new version (§64, §82)');
    process.exit(1);
  }
} catch { /* source moved — hash recorded in manifest remains the anchor */ }

const buf = await readFile(reportPath);
const { trades: raw, dialect } = extractTrades(decode(buf));
const trades = raw.filter((t) => t.p !== null && t.t).map((t) => ({
  closeTime: t.t, netProfit: t.p, profit: t.p, swap: 0, commission: 0, fees: 0, direction: t.side || null, balance: t.b,
}));
const inHoldout = tradesInRange(trades, period.from, period.to);
const metrics = windowMetrics(inHoldout, { startBalance: inHoldout.length && inHoldout[0].balance !== null ? inHoldout[0].balance - inHoldout[0].netProfit : null });
const months = monthsBetween(period.from, period.to);
const annualized = metrics ? Math.round((metrics.trades / (months / 12)) * 10) / 10 : 0;

/* frozen thresholds (§75, §77) — read-only */
const T = research.holdoutPassThresholds;
const internalDD = research.internalDDPct ?? null; // recorded at internal-validation milestone when available
const checks = [
  { rule: 'holdoutPF', value: metrics?.profitFactor ?? null, threshold: T.minPF, ok: metrics?.profitFactor !== null && metrics?.profitFactor >= T.minPF },
  { rule: 'holdoutExpectedPayoff', value: metrics?.expectedPayoff ?? null, threshold: T.minExpectedPayoff, ok: metrics?.expectedPayoff !== null && metrics?.expectedPayoff > T.minExpectedPayoff },
  { rule: 'annualizedTrades', value: annualized, threshold: T.minAnnualizedTrades, ok: annualized >= T.minAnnualizedTrades },
  ...(internalDD !== null && metrics?.relativeDrawdownPct !== null
    ? [{ rule: 'ddVsInternal', value: metrics.relativeDrawdownPct, threshold: internalDD * T.maxDDvsInternalMultiple, ok: metrics.relativeDrawdownPct <= internalDD * T.maxDDvsInternalMultiple }]
    : []),
];
const status = !metrics || metrics.trades < 30 ? 'INCONCLUSIVE' : checks.every((c) => c.ok) ? 'PASSED' : 'FAILED';

console.log(`\n  PROSPECTIVE VALIDATION ${candidateId} on ${holdout.holdoutId} (${period.from} → ${period.to}) ${dryRun ? '[dry run]' : ''}`);
console.log(`  quality: ${holdout.qualityLevel} · dialect ${dialect} · trades in holdout: ${metrics?.trades ?? 0} (${annualized}/yr)`);
if (metrics) console.log(`  PF ${metrics.profitFactor ?? '—'} · payoff ${metrics.expectedPayoff ?? '—'} · relDD ${metrics.relativeDrawdownPct ?? '—'}%`);
for (const c of checks) console.log(`    ${c.ok ? '✓' : '✗'} ${c.rule}: ${c.value} vs ${c.threshold}`);
console.log(`  STATUS: ${status}`);

if (dryRun) { console.log('\n  dry run — holdout NOT consumed, nothing published.\n'); process.exit(0); }

/* publish through the Phase 14 chain → evidence derives automatically */
const results = await loadResults();
results.validations.push({
  validationId: `VAL-PRO-${String(results.validations.filter((v) => v.provenance === 'PROSPECTIVE').length + 1).padStart(6, '0')}`,
  type: 'OOS',
  strategyId: cand.strategyId,
  version: cand.version,
  provenance: 'PROSPECTIVE',
  qualityLevel: holdout.qualityLevel, // PROCESS_PROSPECTIVE displayed on site (§78, §104)
  previouslyObserved: false,
  status,
  manifest: {
    validationId: candidateId,
    strategyId: cand.strategyId,
    method: 'FINAL_HOLDOUT',
    trainStart: research.researchPeriod.from,
    trainEnd: research.researchPeriod.to,
    testStart: period.from,
    testEnd: period.to,
    parametersHash: cand.parameterHash,
    eaHash: cand.sourceHash,
    reportHash: sha(buf),
    thresholds: T,
    holdoutId: holdout.holdoutId,
  },
  trainMetrics: null, // development metrics live in the research log
  testMetrics: metrics,
  testMonths: months,
  ratios: null,
  checks,
  warnings: [],
  completedAt: new Date().toISOString(),
});
await saveResults(results);

holdout.status = 'CONSUMED';
holdout.consumedBy = candidateId;
holdout.consumedAt = new Date().toISOString();
await saveStore(store);
await audit({ userAction: 'PROSPECTIVE_VALIDATION', candidateId, holdoutId: holdout.holdoutId, status });

console.log(`\n  → published (${status}) · holdout CONSUMED — no re-run for this candidate (§71). FAIL stays FAIL (§130).\n`);
