/**
 * ============================================================================
 * PROPOSAL → EXPERIMENT SKELETON (Phase 13C) — human-run, print-only
 * ============================================================================
 *   node scripts/promote-proposal.mjs EP-0001
 *
 * Deliberately does NOT write to src/data/experiments.mjs (§104: no auto
 * promotion). For an APPROVED proposal it prints a ready-to-paste experiment
 * skeleton with `humanReviewed: false`, so even after pasting, the Phase 10
 * safety gate withholds the entry until a human flips the flag after review.
 * ============================================================================
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];

if (!id || !/^EP-\d{4}$/.test(id)) {
  console.error('usage: node scripts/promote-proposal.mjs EP-0001');
  process.exit(1);
}

const store = JSON.parse(await readFile(join(ROOT, 'tools', 'experiment-proposals.json'), 'utf8'));
const p = (store.proposals || []).find((x) => x.proposalId === id);
if (!p) {
  console.error(`✗ ${id} not found`);
  process.exit(1);
}
if (p.status !== 'APPROVED') {
  console.error(`✗ ${id} is ${p.status} — a human must set status to APPROVED in tools/experiment-proposals.json first`);
  process.exit(1);
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

console.log(`
Paste into CURATED in src/data/experiments.mjs (use the next free EXP id),
then complete dataset/metrics/decision honestly. It will NOT publish until
a human review sets ai.humanReviewed to true (Phase 10 gate).

  {
    experimentId: 'EXP-0000XX', // ← next free id
    strategyId: '${esc(p.strategyId)}',
    title: 'TODO — one line',
    category: 'stability', // adjust
    status: 'RESEARCHING',
    source: 'ai',
    metadataAvailable: true,
    createdAt: '${p.createdAt}',
    ai: {
      model: '${esc(p.ai?.model || 'unspecified')}',
      role: 'Drafted from monitoring candidate ${esc(p.candidateId)} (proposal ${esc(p.proposalId)}): ${esc(p.analysis).slice(0, 140)}',
      humanReviewed: false, // ← flip ONLY after human review; gate withholds until then
    },
    hypothesis: '${esc(p.hypothesis)}',
    changeSummary: '${esc(p.proposedChange)}',
    dataset: null, // TODO
    metricsBefore: null,
    metricsAfter: null,
    diff: null,
    comparable: true,
    decision: null,
    reason: null,
    gitCommit: null,
    notes: 'Origin: ${esc(p.candidateId)} / ${esc(p.proposalId)}.',
  },
`);
