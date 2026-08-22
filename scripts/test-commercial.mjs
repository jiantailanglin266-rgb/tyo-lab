/**
 * Phase 16A tests — commercial layer invariants (no backend needed).
 *   node scripts/test-commercial.mjs
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };

console.log('\ncommercial layer (Phase 16A)');

const { PLANS, COMPARISON, DATA_REQUIRED } = await import('../src/data/commercial/plans.mjs');
const { PRODUCTS, plansOf, PRIVATE_PRODUCT } = await import('../src/data/commercial/products.mjs');
const { IB_ACCESS } = await import('../src/data/commercial/access.mjs');
const { DEVELOPMENT } = await import('../src/data/commercial/development.mjs');
const { COMMERCIAL } = await import('../src/site.config.mjs');
const eaData = (await import('../src/data/ea.mjs')).default ?? (await import('../src/data/ea.mjs')).EA ?? [];

/* 1. plan model */
ok(PLANS.map((p) => p.id).join(',') === 'IB,PRO,PRIVATE,CUSTOM', 'four plans in order IB → PRO → PRIVATE → CUSTOM');
ok(PLANS.find((p) => p.id === 'PRO').price.amount === 10 && PLANS.find((p) => p.id === 'PRO').price.unit === 'month', 'PRO is $10 / month');
ok(PLANS.find((p) => p.id === 'PRIVATE').price.amount === 5000 && PLANS.find((p) => p.id === 'PRIVATE').billing === 'inquiry', 'PRIVATE is $5,000 by inquiry (no checkout)');
ok(PLANS.find((p) => p.id === 'IB').price.amount === 0 && PLANS.find((p) => p.id === 'IB').price.unit === 'eaFee', 'IB is "EA fee 0", not "free"');
ok(PLANS.every((p) => p.availability === 'PLANNED'), 'every plan is PLANNED until its backend exists');
ok(COMPARISON.every((r) => r.IB && r.PRO && r.PRIVATE), 'comparison rows are complete for the three priced tiers');

/* 2. products ↔ EA catalogue */
const slugs = new Set((Array.isArray(eaData) ? eaData : []).map((e) => e.slug));
ok(PRODUCTS.every((p) => slugs.size === 0 || slugs.has(p.strategyId)), 'every product references a real strategy slug');
ok(PRODUCTS.every((p) => p.access.directPurchase === false), 'no product is direct-purchase');
ok(PRODUCTS.every((p) => !/^https?:|\/public\//.test(p.downloadArtifact)), 'no product carries a public download URL');
ok(PRODUCTS.every((p) => plansOf(p).every((x) => ['IB', 'PRO', 'PRIVATE'].includes(x))), 'plansOf() only yields IB/PRO/PRIVATE');
ok(PRIVATE_PRODUCT.detailsPublished === false && !PRIVATE_PRODUCT.name, 'private product publishes no name or details');

/* 3. IB honesty */
ok(IB_ACCESS.brokers.length === 0 && IB_ACCESS.brokersPublished === false, 'no broker is invented; /supported-brokers/ unpublished');
ok(Object.values(IB_ACCESS.dataRequired).every((v) => v === DATA_REQUIRED), 'IB owner data is DATA_REQUIRED');

/* 4. no EA binaries in the public tree (§69, §133) */
async function walk(d, out = []) { for (const e of await readdir(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) await walk(p, out); else out.push(p); } return out; }
const pub = await walk(join(ROOT, 'public'));
ok(!pub.some((f) => /\.(ex4|ex5|mq4|mq5|set)$/i.test(f)), 'no .ex4/.ex5/.mq4/.mq5/.set under public/');
let dist = [];
try { dist = await walk(join(ROOT, 'dist')); } catch {}
ok(!dist.some((f) => /\.(ex4|ex5|mq4|mq5)$/i.test(f)), 'no EA binaries in dist/');

/* 5. rendered pages (when dist exists) */
if (dist.length) {
  const locs = ['ja', 'en', 'zh', 'hi', 'id', 'th', 'vi'];
  const have = await Promise.all(locs.map(async (l) => { try { await stat(join(ROOT, 'dist', l, 'access', 'index.html')); await stat(join(ROOT, 'dist', l, 'development', 'index.html')); return true; } catch { return false; } }));
  ok(have.every(Boolean), '/access/ and /development/ built in all 7 locales');
  const access = await readFile(join(ROOT, 'dist', 'en', 'access', 'index.html'), 'utf8');
  ok(!/<form[^>]+action="mailto:/.test(access), 'inquiry form never posts to mailto:');
  ok(COMMERCIAL.inquiryEndpoint ? !access.includes('iform--offline') : access.includes('iform--offline'), 'form offline state matches inquiryEndpoint config');
  ok(/referral compensation/i.test(access), 'IB referral disclosure rendered');
  ok(!/buy now/i.test(access), 'no "BUY NOW" wording');
  ok(access.includes('DATA_REQUIRED'), 'DATA_REQUIRED rendered literally where owner data is missing');
  const joker = await readFile(join(ROOT, 'dist', 'en', 'ea', 'joker', 'index.html'), 'utf8');
  ok(joker.includes('/access/?ea=joker'), 'EA detail CTA links to /access/?ea=<slug>');
  ok(joker.includes('id="access"') && /Commercial status/i.test(joker), 'EA detail shows the access panel with commercial status separate from research');
  const account = await readFile(join(ROOT, 'dist', 'en', 'account', 'index.html'), 'utf8');
  ok(!/<input[^>]+type="password"/.test(account) && account.includes('noindex'), '/account/ has no fake login and is noindex');
}

/* 6. development service definition */
ok(DEVELOPMENT.pricing === 'CONTACT_FOR_QUOTE' && DEVELOPMENT.caseStudies.length === 0 && DEVELOPMENT.whiteLabel === false, 'development: quote-only, no invented case studies, white-label hidden');

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
