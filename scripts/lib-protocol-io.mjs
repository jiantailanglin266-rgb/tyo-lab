/**
 * Evidence-by-design protocol store + audit (Phase 15).
 * tools/research-protocol.json is the committed source of truth for research
 * manifests, holdout manifests, frozen candidates and the contamination
 * register. Every state change appends to the gitignored audit log (§24).
 */

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const STORE_FILE = process.env.PROTOCOL_STORE_FILE || join(ROOT, 'tools', 'research-protocol.json');
const AUDIT_DIR = process.env.PROTOCOL_AUDIT_DIR || join(ROOT, 'data', 'research');

export const sha = (s) => createHash('sha256').update(s).digest('hex');

export function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    return null;
  }
}

export async function loadStore() {
  try {
    return JSON.parse(await readFile(STORE_FILE, 'utf8'));
  } catch {
    return {
      _readme:
        'Evidence-by-design research protocol (Phase 15). Research manifests, sealed holdouts, frozen candidates and the contamination register. Holdout unlock and approvals are HUMAN actions; sealed periods are refused by every research tool (src/lib/holdout-guard.mjs).',
      research: [],
      holdouts: [],
      candidates: [],
      contamination: [],
    };
  }
}

export async function saveStore(store) {
  await writeFile(STORE_FILE, JSON.stringify(store, null, 1), 'utf8');
}

/** §24: append-only audit trail of every protocol action. */
export async function audit(entry) {
  await mkdir(AUDIT_DIR, { recursive: true });
  await appendFile(
    join(AUDIT_DIR, 'audit-log.jsonl'),
    JSON.stringify({ timestamp: new Date().toISOString(), gitCommit: gitCommit(), ...entry }) + '\n',
    'utf8'
  );
}

/** Frozen-content hash for holdout manifests (period immutable once SEALED). */
export const holdoutHash = (h) => sha(JSON.stringify({ holdoutId: h.holdoutId, strategyId: h.strategyId, start: h.start, end: h.end, purpose: h.purpose }));
