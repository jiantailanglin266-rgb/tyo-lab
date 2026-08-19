/**
 * ============================================================================
 * Alternate-report scanner
 * ============================================================================
 *   node tools/scan-alt-reports.mjs <source-dir>
 *
 * The site's headline figures come from ONE report per system (the ranked
 * pick in import-reports.mjs). But several folders hold more than one report
 * — different versions, different platforms, different periods. Those extra
 * runs are the only surviving record of historical experimentation, so this
 * tool parses every report header and writes tools/alt-reports.json for the
 * experiment reconstructor.
 *
 * Read-only. Nothing here decides what counts as an experiment — it just
 * makes every run's stated figures available.
 * ============================================================================
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode, summarise } from './lib-report-parse.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];
if (!SRC) {
  console.error('usage: node tools/scan-alt-reports.mjs <source-dir>');
  process.exit(1);
}

const FOLDER_TO_SLUG = {
  COSMOS: 'cosmos',
  GALOA: 'galoa',
  GODSPEED: 'godspeed',
  GRANDSLAM: 'grandslam',
  JAYRO: 'jayro',
  JOKER: 'joker',
  KOKOMO: 'kokomo',
  METRO: 'metro',
  MIRUMO: 'mirumo',
  NEXUS: 'nexus',
  RINA: 'rina',
  'SENA TOKYO': 'sena',
  SUPREMACY: 'supremacy',
  EVERGREEN: 'evergreen',
};

async function findReports(dir) {
  const out = [];
  const walk = async (d, depth) => {
    if (depth > 2) return;
    let entries;
    try {
      entries = await readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p, depth + 1);
      else if (/\.html?$/i.test(e.name)) out.push(p);
    }
  };
  await walk(dir, 0);
  return out;
}

console.log(`\n  Scanning every tester report under ${SRC}\n`);

const out = {};
for (const [folder, slug] of Object.entries(FOLDER_TO_SLUG)) {
  const files = await findReports(join(SRC, folder));
  const runs = [];
  const seen = new Set();
  for (const path of files) {
    let html;
    try {
      html = decode(await readFile(path));
    } catch {
      continue;
    }
    const s = summarise(html);
    if (!s.symbol && s.trades === null) continue;
    /* " - コピー" duplicates parse to identical rows; drop by content key. */
    const key = [s.symbol, s.period, s.trades, s.netProfit, s.profitFactor].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    runs.push({ file: basename(path), ...s });
  }
  runs.sort((a, b) => (a.period || '').localeCompare(b.period || ''));
  out[slug] = runs;
  console.log(
    `  · ${slug.padEnd(10)} ${String(runs.length)} distinct run(s)` +
      (runs.length > 1 ? '  ← reconstruction material' : '')
  );
  for (const r of runs) {
    console.log(
      `      ${r.dialect.padEnd(4)} ${(r.symbol || '?').padEnd(8)} ${(r.timeframe || '?').padEnd(4)} ` +
        `${(r.period || 'period ?').padEnd(26)} PF=${String(r.profitFactor ?? '—').padStart(6)} ` +
        `DD=${String(r.maxDrawdownPct ?? '—').padStart(6)}%(${r.drawdownBasis[0]}) ` +
        `trades=${String(r.trades ?? '—').padStart(6)} win=${String(r.winRate ?? '—').padStart(6)}%  [${r.file}]`
    );
  }
}

await writeFile(join(ROOT, 'tools', 'alt-reports.json'), JSON.stringify(out, null, 2), 'utf8');
console.log(`\n  → tools/alt-reports.json written\n`);
