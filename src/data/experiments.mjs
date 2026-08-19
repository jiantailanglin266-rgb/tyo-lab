/**
 * ============================================================================
 * EXPERIMENTS — the research record
 * ============================================================================
 * Three classes, one shape (docs/EXPERIMENT_DATA_MODEL.md):
 *
 *   CURATED        hand-written below. Research performed while building this
 *                  platform, with full metadata and a git commit for each —
 *                  the observation, hypothesis, change, result and decision
 *                  all happened and are checkable against the repository.
 *
 *   RECONSTRUCTED  tools/experiments-generated.json (Class A). Real metric
 *                  pairs from surviving alternate tester reports; hypothesis
 *                  and decision were never written down and stay null.
 *
 *   GENERATED      tools/experiments-generated.json (Class B). Split-stability
 *                  analyses computed by tools/run-experiments.mjs under a
 *                  decision rule fixed before computation.
 *
 * NOTHING in this file may state a result that cannot be checked against the
 * repo, a tester report, or the generated JSON.
 * ============================================================================
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Statuses the UI recognises. Colour is never the only signal. */
export const EXPERIMENT_STATUSES = [
  'IDEA',
  'RESEARCHING',
  'BACKTESTING',
  'VALIDATING',
  'ACCEPTED',
  'REJECTED',
  'INCONCLUSIVE',
  'ARCHIVED',
];

/* ------------------------------------------------------------------ *
 * CURATED — platform research, git-linked
 * strategyId null = experiment concerns the research platform / methodology
 * rather than a single system.
 * ------------------------------------------------------------------ */

const CURATED = [
  {
    experimentId: 'EXP-000001',
    strategyId: null,
    title: 'Equity-basis vs balance-basis drawdown across the catalogue',
    category: 'methodology',
    status: 'ACCEPTED',
    source: 'hybrid',
    metadataAvailable: true,
    createdAt: '2026-08-19',
    hypothesis:
      'Balance-basis drawdown (closed trades only) materially understates peak-to-trough risk for systems that hold losing positions, and must not be ranked against equity-basis figures silently.',
    changeSummary:
      'Importer reads equity drawdown wherever the report states it and records the basis; every page carrying a drawdown states which basis it shows; balance-basis pages carry an explicit caveat.',
    dataset: 'All 14 tester reports (5 MT5 with both bases, 9 MT4 balance-only).',
    metricsBefore: { note: 'SUPREMACY drawdown as first imported (balance basis)', value: '12.44%' },
    metricsAfter: { note: 'SUPREMACY drawdown on equity basis, same report', value: '48.82%' },
    diff: null,
    comparable: true,
    decision: 'ACCEPTED',
    reason:
      'The gap on the worst case was a factor of ~4 (12.44% vs 48.82%). Publishing the balance figure as "the" drawdown would have materially understated risk.',
    gitCommit: '5fb90db',
    notes: 'Basis labelling now appears on detail pages, the compare matrix and the risk/return map.',
  },
  {
    experimentId: 'EXP-000002',
    strategyId: null,
    title: 'Stop-loss share denominator — data-integrity check',
    category: 'data-integrity',
    status: 'ACCEPTED',
    source: 'hybrid',
    metadataAvailable: true,
    createdAt: '2026-08-19',
    hypothesis: 'An observed stop-loss share above 100% indicates the denominator excludes some closed trades.',
    changeSummary:
      'Closed-trade count switched from wins+losses to all closed trades including break-even; win/loss rates kept on decided trades only.',
    dataset: 'Extracted deal lists, all 14 systems.',
    metricsBefore: { note: 'SUPREMACY stop-loss share', value: '100.05%' },
    metricsAfter: { note: 'After including 9 break-even trades in the denominator', value: '100.00%' },
    diff: null,
    comparable: true,
    decision: 'ACCEPTED',
    reason: 'Share can no longer exceed 100%; extracted totals now match each report header exactly.',
    gitCommit: 'c101f55',
    notes: null,
  },
  {
    experimentId: 'EXP-000003',
    strategyId: null,
    title: 'Positive-month share as a consistency score input',
    category: 'scoring',
    status: 'REJECTED',
    source: 'hybrid',
    metadataAvailable: true,
    createdAt: '2026-08-19',
    hypothesis: 'Share of profitable months is a usable consistency measure for these systems as-is.',
    changeSummary: 'None shipped in this form — the raw share was evaluated and rejected as a standalone input.',
    dataset: 'Extracted monthly series, all 14 systems.',
    metricsBefore: { note: 'Systems posting 90%+ positive months', value: '9 of 14' },
    metricsAfter: { note: 'Among them, systems with a 40%+ drawdown', value: '4' },
    diff: null,
    comparable: true,
    decision: 'REJECTED',
    reason:
      'Grid- and martingale-style exits win almost every month by construction and give it back in one. Rewarding the raw share ranks the riskiest builds highest — the opposite of what a consistency score is for. Replaced by share × worst-month factor.',
    gitCommit: 'c101f55',
    notes: 'The replacement is EXP-000004.',
  },
  {
    experimentId: 'EXP-000004',
    strategyId: null,
    title: 'TYO SCORE: worst-month factor and drawdown cap',
    category: 'scoring',
    status: 'ACCEPTED',
    source: 'hybrid',
    metadataAvailable: true,
    createdAt: '2026-08-19',
    hypothesis:
      'Scaling consistency by the worst month, and capping the total by drawdown, restores discrimination without hand-tuning per system.',
    changeSummary:
      'Consistency × max(0.5, 1 − |worst month|/100); total capped at 40/55/70 for DD ≥ 60/45/30%.',
    dataset: 'All 14 systems, header + monthly series.',
    metricsBefore: { note: 'Score range before the corrections', value: '60–86, JAYRO at 60 on a 70.8% DD' },
    metricsAfter: { note: 'Score range after', value: '40–84, JAYRO capped to 40' },
    diff: null,
    comparable: true,
    decision: 'ACCEPTED',
    reason:
      'RINA (2nd-highest profit factor, 56% DD) lands at 55 and JAYRO at 40 — the ordering now reflects what the score claims to measure. Caps are disclosed on every page they bind.',
    gitCommit: 'c101f55',
    notes: 'Model documented in docs/TYO_SCORE_MODEL.md; superseded by V2 in docs/TYO_SCORE_V2_MODEL.md.',
  },
  {
    experimentId: 'EXP-000005',
    strategyId: null,
    title: 'Risk/return map: simple annual average vs CAGR',
    category: 'methodology',
    status: 'ACCEPTED',
    source: 'hybrid',
    metadataAvailable: true,
    createdAt: '2026-08-20',
    hypothesis: 'CAGR compares unequal test lengths more honestly than total-return-divided-by-years.',
    changeSummary: 'Scatter Y-axis switched to CAGR; caption states the fixed-lot understatement trade-off.',
    dataset: 'Extracted balance series, all 14 systems (2–24 years).',
    metricsBefore: { note: 'RINA simple average (24y, 35× account growth)', value: '179%/yr' },
    metricsAfter: { note: 'RINA CAGR, same record', value: '20.6%/yr' },
    diff: null,
    comparable: true,
    decision: 'ACCEPTED',
    reason:
      'The simple average produced figures no reader interprets correctly and compressed twelve systems into an unreadable band behind two outliers. CAGR puts 13 of 14 inside 1–28%.',
    gitCommit: 'eb87c6e',
    notes: null,
  },
  {
    experimentId: 'EXP-000006',
    strategyId: null,
    title: 'Correlation minimum-overlap rule',
    category: 'methodology',
    status: 'ACCEPTED',
    source: 'hybrid',
    metadataAvailable: true,
    createdAt: '2026-08-20',
    hypothesis: 'Pairwise correlations computed over few shared months are noise and should not be displayed.',
    changeSummary: 'Pearson r rendered only when a pair shares ≥ 24 months; thinner pairs display an em dash.',
    dataset: 'Extracted monthly series; 91 possible pairs across 14 systems.',
    metricsBefore: { note: 'Pairs computable with no minimum', value: '91' },
    metricsAfter: { note: 'Pairs surviving the 24-month rule', value: '78' },
    diff: null,
    comparable: true,
    decision: 'ACCEPTED',
    reason:
      'The 13 suppressed pairs involve short-window systems whose r estimates would swing wildly with 1–2 months of data. Surviving range: −0.56 to +0.49, median 0.07.',
    gitCommit: '7d5e77b',
    notes: null,
  },
];

/* ------------------------------------------------------------------ *
 * Loader — merges curated with the generated JSON.
 * ------------------------------------------------------------------ */

export async function loadExperiments() {
  let gen = { reconstructed: [], splits: [] };
  try {
    gen = JSON.parse(await readFile(join(ROOT, 'tools', 'experiments-generated.json'), 'utf8'));
  } catch {
    /* absent file = curated only; the page states counts from what exists */
  }

  /* The split-stability class is produced by the commit that ships Phase 6;
     linked here rather than hard-coding a hash into a generated file. */
  const splits = (gen.splits || []).map((e) => ({ ...e, gitCommit: e.gitCommit || 'phase-6' }));

  const all = [...CURATED, ...(gen.reconstructed || []), ...splits];

  /* Newest first for listing; undated (reconstructed) entries sink. */
  all.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || a.experimentId.localeCompare(b.experimentId));
  return all;
}

export function experimentStats(experiments) {
  const by = (s) => experiments.filter((e) => e.status === s).length;
  return {
    total: experiments.length,
    accepted: by('ACCEPTED'),
    rejected: by('REJECTED'),
    inconclusive: by('INCONCLUSIVE'),
    archived: by('ARCHIVED'),
    strategies: new Set(experiments.map((e) => e.strategyId).filter(Boolean)).size,
  };
}
