/**
 * MCP server smoke test (Phase 13B).
 *   node scripts/test-mcp.mjs
 * Spawns scripts/mcp-tyo-lab.mjs over stdio, walks the protocol handshake,
 * lists tools, calls a read-only tool, and checks the draft-proposal guard
 * refuses a nonexistent candidate. No production file is written.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const child = spawn(process.execPath, [join(ROOT, 'scripts', 'mcp-tyo-lab.mjs')], { cwd: ROOT });
const rl = createInterface({ input: child.stdout });

const pending = new Map();
let nextId = 1;
rl.on('line', (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  if (msg.id !== undefined && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

function rpc(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`timeout: ${method}`));
      }
    }, 15000);
  });
}

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n      ${e.message}`);
  }
}

console.log('\nMCP SERVER — smoke\n');

await test('initialize handshake', async () => {
  const r = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } });
  assert.equal(r.result.serverInfo.name, 'tyo-lab');
  assert.ok(r.result.capabilities.tools);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
});

await test('tools/list exposes the pipeline tools', async () => {
  const r = await rpc('tools/list', {});
  const names = r.result.tools.map((t) => t.name);
  for (const n of ['tyo_monitoring_status', 'tyo_list_candidates', 'tyo_import_forward', 'tyo_analyze_forward', 'tyo_draft_experiment_proposal', 'tyo_build_site', 'tyo_export_mt5', 'shadow_status', 'shadow_sessions', 'shadow_performance', 'shadow_candidates'])
    assert.ok(names.includes(n), `missing ${n}`);
  /* safety: no tool name suggests EA modification or auto-promotion */
  assert.ok(!names.some((n) => /modify|promote|trade|order/.test(n)));
});

await test('shadow_status is read-only and honest about NO DATA', async () => {
  const r = await rpc('tools/call', { name: 'shadow_status', arguments: {} });
  assert.match(r.result.content[0].text, /no shadow-forward data|trades=/);
});

await test('shadow_performance requires a strategy and reports absence', async () => {
  const r = await rpc('tools/call', { name: 'shadow_performance', arguments: { strategyId: 'joker' } });
  assert.match(r.result.content[0].text, /no shadow-forward data for joker|"trades"/);
});

await test('tyo_monitoring_status is read-only and honest about NO DATA', async () => {
  const r = await rpc('tools/call', { name: 'tyo_monitoring_status', arguments: {} });
  const text = r.result.content[0].text;
  assert.match(text, /open candidates: \d+/);
});

await test('draft proposal refuses a nonexistent candidate', async () => {
  const r = await rpc('tools/call', {
    name: 'tyo_draft_experiment_proposal',
    arguments: {
      candidateId: 'RC-9999',
      hypothesis: 'x'.repeat(30),
      proposedChange: 'y'.repeat(30),
      analysis: 'z'.repeat(30),
    },
  });
  assert.match(r.result.content[0].text, /refused: candidate RC-9999 does not exist/);
});

await test('unknown tool returns a JSON-RPC error', async () => {
  const r = await rpc('tools/call', { name: 'tyo_place_order', arguments: {} });
  assert.ok(r.error);
});

child.kill();
console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
