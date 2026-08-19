/**
 * ============================================================================
 * FORWARD IMPORTER — file → normalized trade store (Phase 12A)
 * ============================================================================
 *   node scripts/import-forward.mjs <file> --account ACC-FWD-001 \
 *        --type FORWARD_DEMO --currency USD [options]
 *
 * Required:
 *   --account   internal account id (ACC-FWD-nnn / ACC-LIVE-nnn). NEVER a
 *               broker login — privacy rule §5.
 *   --type      FORWARD_DEMO | LIVE   (never guessed — §0)
 *   --currency  account currency (three letters)
 *
 * Optional:
 *   --broker      broker display name (public)
 *   --platform    mt4 | mt5
 *   --mode        account mode label (Standard / ECN / Raw …)
 *   --strategy    slug — MANUAL mapping for trades with no magic & no
 *                 comment match (never overrides a magic mapping)
 *   --balance     verified starting balance (enables relative drawdown)
 *   --dry-run     parse + validate + report, write nothing (§63)
 *
 * Guarantees:
 *   - raw file is never modified; a copy is archived under data/forward/raw/
 *   - idempotent: same file (hash) or same account+ticket → no duplicates
 *   - unknown magic → trade quarantined as UNMAPPED, never guessed
 *   - every run appended to data/forward/audit-log.jsonl
 * ============================================================================
 */

import { readFile, writeFile, mkdir, appendFile, copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sourceFor } from '../src/lib/forward-source.mjs';
import { MAGIC_MAP, COMMENT_PATTERNS, validateMagicMap } from '../config/magic-map.mjs';
import { EVIDENCE_TYPES } from '../config/forward-evidence.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/* FORWARD_DATA_DIR override exists for the test suite only, so fixtures can
   run through the real pipeline without touching the private store. */
const DATA = process.env.FORWARD_DATA_DIR || join(ROOT, 'data', 'forward');

/* ---- args ---------------------------------------------------------- */

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith('--'));
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : null;
};
const has = (name) => argv.includes(`--${name}`);

const accountId = flag('account');
const evidenceType = flag('type');
const currency = flag('currency');
const dryRun = has('dry-run');

function usage(msg) {
  if (msg) console.error(`\n  ✗ ${msg}`);
  console.error(
    '\n  usage: node scripts/import-forward.mjs <file> --account ACC-FWD-001 --type FORWARD_DEMO --currency USD\n' +
      '         [--broker NAME] [--platform mt4|mt5] [--mode Standard] [--strategy slug] [--balance N] [--dry-run]\n'
  );
  process.exit(1);
}

if (!file) usage('no input file');
if (!accountId || !/^ACC-(FWD|LIVE)-\d{3}$/.test(accountId)) usage('--account must look like ACC-FWD-001 / ACC-LIVE-001');
if (!evidenceType || !['FORWARD_DEMO', 'LIVE'].includes(evidenceType)) usage('--type must be FORWARD_DEMO or LIVE');
if (accountId.startsWith('ACC-LIVE-') !== (evidenceType === 'LIVE')) usage('account id prefix and --type disagree');
if (!currency || !/^[A-Z]{3}$/.test(currency)) usage('--currency must be a 3-letter code');
if (!EVIDENCE_TYPES.includes(evidenceType)) usage('unknown evidence type');

const manualStrategy = flag('strategy');

/* ---- load & parse --------------------------------------------------- */

const srcPath = resolve(file);
let buf;
try {
  buf = await readFile(srcPath);
} catch {
  usage(`cannot read ${srcPath}`);
}
const hash = createHash('sha256').update(buf).digest('hex');

const source = sourceFor(srcPath);
if (!source) usage(`unsupported extension (need .csv/.html/.htm/.json): ${basename(srcPath)}`);

const { trades: parsed, warnings } = source.parse(buf);
if (!parsed.length) {
  console.error(`\n  ✗ no trades parsed from ${basename(srcPath)} (${source.name})`);
  for (const w of warnings) console.error(`    ! ${w}`);
  process.exit(1);
}

/* ---- registry sanity (§11) ------------------------------------------ */

let knownSlugs = [];
try {
  const { publishedEA } = await import('../src/data/ea.mjs');
  knownSlugs = publishedEA().map((e) => e.slug);
} catch {
  warnings.push('could not load EA catalogue — magic-map targets unvalidated');
}
if (knownSlugs.length) {
  const v = validateMagicMap(knownSlugs);
  if (!v.ok) {
    console.error(`\n  ✗ magic-map conflict/unknown targets: ${v.bad.map(([m, s]) => `${m}→${s}`).join(', ')}`);
    process.exit(1);
  }
  if (manualStrategy && !knownSlugs.includes(manualStrategy)) usage(`--strategy '${manualStrategy}' is not a known EA slug`);
}

/* ---- validate + map (§9–11, §64) ------------------------------------ */

const errors = [];
const mapped = [];
let unmapped = 0;
const seenTickets = new Set();
const strategySet = new Set();

for (const [i, t] of parsed.entries()) {
  if (t.closeTime === null || Number.isNaN(t.closeTime)) {
    errors.push(`trade ${i}: invalid close time`);
    continue;
  }
  if (t.openTime !== null && t.openTime > t.closeTime) {
    errors.push(`trade ${i} (${t.ticket}): open after close`);
    continue;
  }
  if (t.volume !== null && t.volume <= 0) {
    errors.push(`trade ${i} (${t.ticket}): invalid volume ${t.volume}`);
    continue;
  }
  if (!t.symbol) warnings.push(`trade ${t.ticket ?? i}: missing symbol`);

  const ticket = t.ticket ?? `NOTICKET-${t.closeTime}-${i}`;
  if (seenTickets.has(ticket)) {
    warnings.push(`duplicate ticket in file: ${ticket} — second occurrence skipped`);
    continue;
  }
  seenTickets.add(ticket);

  /* mapping precedence: MAGIC > COMMENT (only when no magic) > MANUAL */
  let strategyId = null;
  let mappingSource = null;
  if (t.magic !== null && t.magic !== undefined && !Number.isNaN(t.magic)) {
    if (MAGIC_MAP[t.magic]) {
      strategyId = MAGIC_MAP[t.magic];
      mappingSource = 'MAGIC';
    }
  } else if (t.comment) {
    for (const [re, slug] of COMMENT_PATTERNS) {
      if (re.test(t.comment)) {
        strategyId = slug;
        mappingSource = 'COMMENT';
        break;
      }
    }
  }
  if (!strategyId && manualStrategy && (t.magic === null || t.magic === undefined)) {
    strategyId = manualStrategy;
    mappingSource = 'MANUAL';
  }
  if (!strategyId) {
    strategyId = 'UNMAPPED';
    mappingSource = t.magic !== null && t.magic !== undefined ? 'UNKNOWN_MAGIC' : 'NONE';
    unmapped++;
  } else {
    strategySet.add(strategyId);
  }

  mapped.push({
    tradeId: `${accountId}:${ticket}`,
    accountId,
    strategyId,
    mappingSource,
    magicNumber: t.magic ?? null,
    symbol: t.symbol,
    direction: t.direction,
    volume: t.volume,
    openTime: t.openTime,
    closeTime: t.closeTime,
    openPrice: t.openPrice,
    closePrice: t.closePrice,
    profit: t.profit,
    swap: t.swap,
    commission: t.commission,
    fees: t.fees,
    netProfit: t.netProfit,
    sl: t.sl,
    tp: t.tp,
    comment: t.comment,
  });
}

if (errors.length) {
  console.error(`\n  ✗ validation failed (${errors.length} error(s)) — nothing written:`);
  for (const e of errors.slice(0, 20)) console.error(`    ! ${e}`);
  process.exit(1);
}

/* ---- merge with the existing store (idempotency §65–67) ------------- */

const normPath = join(DATA, 'normalized', `${accountId}.json`);
let store = {
  account: {
    accountId,
    evidenceType,
    platform: flag('platform') || null,
    broker: flag('broker') || null,
    currency,
    accountMode: flag('mode') || null,
    startBalance: flag('balance') ? Number(flag('balance')) : null,
    status: 'ACTIVE',
    source: 'file-import',
  },
  imports: [],
  trades: [],
};
try {
  store = JSON.parse(await readFile(normPath, 'utf8'));
} catch {
  /* first import for this account */
}

if (store.account.currency && store.account.currency !== currency) {
  console.error(`\n  ✗ currency mismatch: account ${accountId} is ${store.account.currency}, file declared ${currency}`);
  process.exit(1);
}
if (store.account.evidenceType !== evidenceType) {
  console.error(`\n  ✗ evidence-type mismatch: account ${accountId} is ${store.account.evidenceType}, got ${evidenceType}`);
  process.exit(1);
}
if (store.imports.some((imp) => imp.hash === hash)) {
  console.log(`\n  = ${basename(srcPath)} already imported into ${accountId} (same hash) — nothing to do\n`);
  process.exit(0);
}

const existing = new Set(store.trades.map((t) => t.tradeId));
const fresh = mapped.filter((t) => !existing.has(t.tradeId));
const skippedDup = mapped.length - fresh.length;

/* ---- report ---------------------------------------------------------- */

console.log(`\n  FORWARD IMPORT ${dryRun ? '(dry run — nothing written)' : ''}`);
console.log(`  Source:   ${basename(srcPath)} (${source.name}, sha256 ${hash.slice(0, 12)}…)`);
console.log(`  Account:  ${accountId}  [${evidenceType}] ${currency}${store.account.broker ? '  ' + store.account.broker : ''}`);
console.log(`  Trades parsed:   ${parsed.length}`);
console.log(`  Trades imported: ${fresh.length}${skippedDup ? `  (${skippedDup} already present)` : ''}`);
console.log(`  Mapped:   ${fresh.filter((t) => t.strategyId !== 'UNMAPPED').length}`);
console.log(`  Unmapped: ${fresh.filter((t) => t.strategyId === 'UNMAPPED').length}  (quarantined, never guessed)`);
console.log(`  Strategies: ${[...strategySet].join(', ') || '—'}`);
console.log(`  Warnings: ${warnings.length}`);
for (const w of warnings.slice(0, 15)) console.log(`    ! ${w}`);

if (dryRun) {
  console.log('\n  dry run complete.\n');
  process.exit(0);
}

/* ---- write ----------------------------------------------------------- */

await mkdir(join(DATA, 'raw'), { recursive: true });
await mkdir(join(DATA, 'normalized'), { recursive: true });

/* archive the raw file untouched (skip if already inside raw/) */
const rawDest = join(DATA, 'raw', `${hash.slice(0, 12)}-${basename(srcPath)}`);
const already = await access(rawDest, constants.F_OK).then(() => true, () => false);
if (!already && resolve(dirname(srcPath)) !== resolve(join(DATA, 'raw'))) await copyFile(srcPath, rawDest);

store.trades.push(...fresh);
store.trades.sort((a, b) => a.closeTime - b.closeTime);
store.imports.push({
  at: new Date().toISOString(),
  file: basename(srcPath),
  hash,
  parsed: parsed.length,
  imported: fresh.length,
  warnings: warnings.length,
});
await writeFile(normPath, JSON.stringify(store, null, 1), 'utf8');

await appendFile(
  join(DATA, 'audit-log.jsonl'),
  JSON.stringify({
    at: new Date().toISOString(),
    file: basename(srcPath),
    hash,
    account: accountId,
    evidenceType,
    parsed: parsed.length,
    imported: fresh.length,
    unmapped: fresh.filter((t) => t.strategyId === 'UNMAPPED').length,
    warnings: warnings.length,
    result: 'OK',
  }) + '\n',
  'utf8'
);

console.log(`\n  → ${normPath}`);
console.log('  → run `node scripts/analyze-forward.mjs` to rebuild the public aggregates\n');
