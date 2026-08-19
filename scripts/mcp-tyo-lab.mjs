/**
 * ============================================================================
 * TYO LAB MCP SERVER (Phase 13B) — zero-dependency stdio JSON-RPC
 * ============================================================================
 * Lets an MCP client (Claude Code / Claude Desktop) drive the §106 loop:
 *
 *   MT5 → export → import → analyze → monitoring → candidates
 *        → draft experiment PROPOSAL → HUMAN approval
 *
 * Register:
 *   claude mcp add tyo-lab -- node scripts/mcp-tyo-lab.mjs
 *
 * HARD SAFETY RULES (Phase 12 §58, §104 carried forward):
 *   - No tool modifies an EA, its parameters, or any strategy source.
 *   - No tool writes to src/data/experiments.mjs or promotes anything: the
 *     only write surfaces are the private forward store (via the existing
 *     importer), the generated aggregates, and DRAFT entries in
 *     tools/experiment-proposals.json. Approval is a human editing status
 *     by hand; published experiments additionally pass the Phase 10
 *     human-review gate.
 *   - No credentials pass through here; the MT5 exporter is read-only and
 *     attaches to an already-open terminal.
 * ============================================================================
 */

import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ *
 * tool implementations
 * ------------------------------------------------------------------ */

function runScript(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: ROOT, shell: false });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ code, out: out.slice(0, 20000) }));
  });
}

async function readJSON(rel, fallback) {
  try {
    return JSON.parse(await readFile(join(ROOT, rel), 'utf8'));
  } catch {
    return fallback;
  }
}

const TOOLS = [
  {
    name: 'tyo_monitoring_status',
    description:
      'Read-only. Current forward/live monitoring state: per-strategy datasets, qualification, degradation verdicts, staleness, and open research candidates. Empty means no trading data has been imported — the honest state, never an error.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const agg = await readJSON('tools/forward-aggregates.json', { strategies: {}, accounts: [] });
      const cand = await readJSON('tools/research-candidates.json', { candidates: [] });
      const lines = [];
      lines.push(`accounts: ${agg.accounts.length}`);
      for (const [slug, byType] of Object.entries(agg.strategies || {})) {
        for (const [etype, a] of Object.entries(byType)) {
          lines.push(
            `${slug} [${etype}] trades=${a.trades} PF=${a.metrics?.profitFactor ?? '—'} ` +
              `deg=${a.degradation?.state} qualified=${a.qualified} stale=${a.stale} last=${(a.lastTradeAt || '').slice(0, 10)}`
          );
        }
      }
      if (!Object.keys(agg.strategies || {}).length) lines.push('no forward/live datasets imported yet (NO DATA)');
      const open = (cand.candidates || []).filter((c) => c.status === 'OPEN');
      lines.push(`open candidates: ${open.length}`);
      for (const c of open) lines.push(`  ${c.candidateId} ${c.strategyId} ${c.severity} — ${c.observation}`);
      return lines.join('\n');
    },
  },
  {
    name: 'tyo_list_candidates',
    description: 'Read-only. Full research-candidates.json (monitoring candidates awaiting human review; never auto-promoted).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      return JSON.stringify(await readJSON('tools/research-candidates.json', { candidates: [] }), null, 1);
    },
  },
  {
    name: 'tyo_export_mt5',
    description:
      'Run the READ-ONLY MT5 history exporter against the already-open local terminal (requires Windows + MetaTrader5 pip package). Writes a JSONSource file under data/forward/ (gitignored). Never places or modifies orders; never handles credentials.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'integer', minimum: 1, maximum: 3650, description: 'lookback window (default 365)' },
        out: { type: 'string', description: 'output path, must stay under data/forward/ (default data/forward/exports/mt5.json)' },
        magic: { type: 'integer', description: 'export only this magic number' },
      },
      additionalProperties: false,
    },
    async run(args) {
      const out = args.out || 'data/forward/exports/mt5.json';
      if (!/^data[\\/]forward[\\/]/.test(out)) return 'refused: --out must stay under data/forward/ (private, gitignored)';
      await runScript('cmd', ['/c', 'mkdir', join(ROOT, 'data', 'forward', 'exports')]).catch(() => {});
      const a = ['scripts/mt5-export.py', '--days', String(args.days || 365), '--out', out];
      if (args.magic !== undefined) a.push('--magic', String(args.magic));
      const r = await runScript('python', a);
      return `exit ${r.code}\n${r.out}`;
    },
  },
  {
    name: 'tyo_import_forward',
    description:
      'Run the forward importer on a file (CSV / MT4-statement HTML / JSON). Validates, maps magic→strategy, quarantines unknowns as UNMAPPED, dedupes idempotently. Writes only to the private gitignored store. Use dryRun first.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string' },
        account: { type: 'string', pattern: '^ACC-(FWD|LIVE)-\\d{3}$' },
        type: { type: 'string', enum: ['FORWARD_DEMO', 'LIVE'] },
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
        broker: { type: 'string' },
        platform: { type: 'string', enum: ['mt4', 'mt5'] },
        mode: { type: 'string' },
        strategy: { type: 'string' },
        balance: { type: 'number' },
        dryRun: { type: 'boolean' },
      },
      required: ['file', 'account', 'type', 'currency'],
      additionalProperties: false,
    },
    async run(args) {
      const a = ['scripts/import-forward.mjs', args.file, '--account', args.account, '--type', args.type, '--currency', args.currency];
      for (const k of ['broker', 'platform', 'mode', 'strategy']) if (args[k]) a.push(`--${k}`, args[k]);
      if (args.balance !== undefined) a.push('--balance', String(args.balance));
      if (args.dryRun) a.push('--dry-run');
      const r = await runScript(process.execPath, a);
      return `exit ${r.code}\n${r.out}`;
    },
  },
  {
    name: 'tyo_analyze_forward',
    description: 'Regenerate the public aggregates and research candidates from the private normalized store (metrics, rolling windows, degradation detection).',
    inputSchema: { type: 'object', properties: { dryRun: { type: 'boolean' } }, additionalProperties: false },
    async run(args) {
      const a = ['scripts/analyze-forward.mjs'];
      if (args.dryRun) a.push('--dry-run');
      const r = await runScript(process.execPath, a);
      return `exit ${r.code}\n${r.out}`;
    },
  },
  {
    name: 'tyo_build_site',
    description: 'Rebuild the static site and run the link/head checks (node build.mjs && node tools/check.mjs). Does not deploy.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const b = await runScript(process.execPath, ['build.mjs']);
      if (b.code !== 0) return `build failed (exit ${b.code})\n${b.out}`;
      const c = await runScript(process.execPath, ['tools/check.mjs']);
      return `build exit 0, check exit ${c.code}\n${b.out}\n${c.out}`;
    },
  },
  {
    name: 'tyo_draft_experiment_proposal',
    description:
      'Write a DRAFT experiment proposal derived from a research candidate into tools/experiment-proposals.json. DRAFT only: this never creates or edits an experiment, and promotion requires a human to review the draft, set status APPROVED by hand, and author the experiment (which the Phase 10 human-review gate still guards). The analysis text must state signals, not assert causes.',
    inputSchema: {
      type: 'object',
      properties: {
        candidateId: { type: 'string', pattern: '^RC-\\d{4}$' },
        hypothesis: { type: 'string', minLength: 20 },
        proposedChange: { type: 'string', minLength: 20 },
        analysis: { type: 'string', minLength: 20, description: 'what the data shows (signals), never a causal verdict' },
        aiModel: { type: 'string', description: 'which model drafted this' },
      },
      required: ['candidateId', 'hypothesis', 'proposedChange', 'analysis'],
      additionalProperties: false,
    },
    async run(args) {
      const cand = await readJSON('tools/research-candidates.json', { candidates: [] });
      const c = (cand.candidates || []).find((x) => x.candidateId === args.candidateId);
      if (!c) return `refused: candidate ${args.candidateId} does not exist`;
      if (!['OPEN', 'REVIEWED'].includes(c.status)) return `refused: candidate ${args.candidateId} is ${c.status}`;

      const file = 'tools/experiment-proposals.json';
      const store = await readJSON(file, { _readme: 'AI-drafted experiment proposals. DRAFT until a human sets APPROVED/REJECTED by hand. Never auto-promoted; published experiments still pass the Phase 10 human-review gate.', proposals: [] });
      const next = 1 + store.proposals.reduce((m, p) => Math.max(m, Number(p.proposalId.replace('EP-', '')) || 0), 0);
      const proposal = {
        proposalId: `EP-${String(next).padStart(4, '0')}`,
        candidateId: c.candidateId,
        strategyId: c.strategyId,
        createdAt: new Date().toISOString().slice(0, 10),
        hypothesis: args.hypothesis,
        proposedChange: args.proposedChange,
        analysis: args.analysis,
        ai: { model: args.aiModel || 'unspecified', humanReviewed: false },
        status: 'DRAFT',
      };
      store.proposals.push(proposal);
      await writeFile(join(ROOT, file), JSON.stringify(store, null, 1), 'utf8');
      return `DRAFT saved: ${proposal.proposalId} for ${c.candidateId} (${c.strategyId}). A human must review and set status by hand.`;
    },
  },
];

/* ------------------------------------------------------------------ *
 * stdio JSON-RPC (newline-delimited, MCP 2024-11+ transport)
 * ------------------------------------------------------------------ */

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  let req;
  try {
    req = JSON.parse(line);
  } catch {
    return;
  }
  const { id, method, params } = req;

  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion || '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: { name: 'tyo-lab', version: '1.0.0' },
        },
      });
    } else if (method === 'notifications/initialized' || method?.startsWith('notifications/')) {
      /* notifications: no response */
    } else if (method === 'tools/list') {
      send({
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) },
      });
    } else if (method === 'tools/call') {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) {
        send({ jsonrpc: '2.0', id, error: { code: -32602, message: `unknown tool ${params?.name}` } });
        return;
      }
      const text = await tool.run(params?.arguments || {});
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } });
    } else if (id !== undefined) {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: `method ${method} not supported` } });
    }
  } catch (e) {
    if (id !== undefined) send({ jsonrpc: '2.0', id, error: { code: -32000, message: String(e?.message || e) } });
  }
});
