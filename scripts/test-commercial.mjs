/**
 * SaaS Phase 1 tests — commercial layer invariants (no backend needed).
 *   node scripts/test-commercial.mjs
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };

console.log('\ncommercial layer (SaaS Phase 1)');

const { PLANS, COMPARISON, DATA_REQUIRED, COMMERCIAL_STATUSES, PARTNER_STATES, SUBSCRIPTION_STATES, PLAN_OF_STATUS, CTA_OF_STATUS } = await import('../src/data/commercial/plans.mjs');
const { PRODUCTS, planOf, ctaOf, PRIVATE_PRODUCT } = await import('../src/data/commercial/products.mjs');
const { PARTNER_ACCESS, COUNTRY_AVAILABILITY, ANALYTICS_EVENTS } = await import('../src/data/commercial/access.mjs');
const { DEVELOPMENT } = await import('../src/data/commercial/development.mjs');
const { COMMERCIAL, PRICING, FLAGS, STATS } = await import('../src/site.config.mjs');
const eaMod = await import('../src/data/ea.mjs');
const eaData = eaMod.default ?? eaMod.EA ?? [];

/* 1. plan model (§8–§12) */
ok(PLANS.map((p) => p.id).join(',') === 'FREE,PRO,PARTNER,PRIVATE', 'four plans in order FREE → PRO → PARTNER → PRIVATE');
ok(PLANS.find((p) => p.id === 'FREE').price.amount === 0, 'FREE is $0');
ok(PLANS.find((p) => p.id === 'PRO').price.amount === PRICING.proMonthly && PRICING.proMonthly === 19, 'PRO price comes from config and is $19');
ok(PLANS.find((p) => p.id === 'PRIVATE').billing === 'inquiry' && PLANS.find((p) => p.id === 'PRIVATE').price.amount === PRICING.privateOneTime, 'PRIVATE is one-time by inquiry (no checkout)');
ok(PLANS.find((p) => p.id === 'PARTNER').requires.includes('manualApproval'), 'PARTNER requires manual approval (§54)');
ok(PLANS.every((p) => p.availability === 'PLANNED'), 'every plan is PLANNED until its backend exists');
ok(COMPARISON.every((r) => r.FREE && r.PRO && r.PARTNER && r.PRIVATE), 'comparison rows cover all four plans');

/* 2. state machines mirror the DB draft */
ok(COMMERCIAL_STATUSES.join(',') === 'DRAFT,FREE,PRO,PARTNER,PRIVATE,PAUSED,RETIRED,RESEARCH_ONLY', 'commercial status enum matches §22');
ok(PARTNER_STATES.join(',') === 'NONE,PENDING,ACTIVE,EXPIRED', 'partner states match §53');
ok(SUBSCRIPTION_STATES.includes('PAST_DUE') && SUBSCRIPTION_STATES.includes('GRACE'), 'subscription states cover payment failure (§48)');

/* 3. products ↔ EA catalogue */
const slugs = new Set((Array.isArray(eaData) ? eaData : []).map((e) => e.slug));
ok(PRODUCTS.every((p) => slugs.size === 0 || slugs.has(p.strategyId)), 'every product references a real strategy slug');
ok(PRODUCTS.every((p) => COMMERCIAL_STATUSES.includes(p.commercialStatus)), 'every product carries a valid commercial status');
ok(PRODUCTS.every((p) => p.commercialStatus === 'RESEARCH_ONLY'), 'no strategy is assigned to a plan yet (owner decision, DATA_REQUIRED)');
ok(PRODUCTS.every((p) => !/^https?:|\/public\//.test(p.downloadArtifact)), 'no product carries a public download URL');
ok(PRODUCTS.every((p) => planOf(p) === PLAN_OF_STATUS[p.commercialStatus] && ctaOf(p) === CTA_OF_STATUS[p.commercialStatus]), 'plan and CTA derive from commercial status only');
ok(PRIVATE_PRODUCT.detailsPublished === false && !PRIVATE_PRODUCT.name, 'private product publishes no name or details (§120)');

/* 4. partner honesty (§50–§56) */
ok(PARTNER_ACCESS.brokers.length === 0 && PARTNER_ACCESS.brokersPublished === false, 'no broker is invented; broker page unpublished');
ok(PARTNER_ACCESS.approval === 'MANUAL' && PARTNER_ACCESS.disclosure === true, 'partner approval is manual and disclosure is on');
ok(Object.values(PARTNER_ACCESS.dataRequired).every((v) => v === DATA_REQUIRED), 'partner owner data is DATA_REQUIRED');
ok(Object.values(COUNTRY_AVAILABILITY).every((v) => v === null), 'country availability is modelled but not invented (§56)');
ok(ANALYTICS_EVENTS.includes('signup') && ANALYTICS_EVENTS.includes('ea_download') && ANALYTICS_EVENTS.length >= 12, 'analytics event names reserved (§75)');

/* 5. platform stats come from config, not a page literal (§7, §140) */
ok(STATS.some((s) => s.key === 'downloads' && s.value === 5000 && s.show), 'download metric lives in config (mirrors platform_stats)');

/* 6. no EA binaries in the public tree (§24, §69) */
async function walk(d, out = []) { for (const e of await readdir(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) await walk(p, out); else out.push(p); } return out; }
const pub = await walk(join(ROOT, 'public'));
ok(!pub.some((f) => /\.(ex4|ex5|mq4|mq5|set)$/i.test(f)), 'no .ex4/.ex5/.mq4/.mq5/.set under public/');
let dist = [];
try { dist = await walk(join(ROOT, 'dist')); } catch {}
ok(!dist.some((f) => /\.(ex4|ex5|mq4|mq5)$/i.test(f)), 'no EA binaries in dist/');

/* 7. feature flags keep unfinished features hidden (§112, §146) */
ok(FLAGS.auth === false && FLAGS.proBilling === false && FLAGS.download === false && FLAGS.license === false, 'account, billing, download and license flags are off by default');

/* 8. rendered pages */
if (dist.length) {
  const locs = ['ja', 'en', 'zh', 'hi', 'id', 'th', 'vi'];
  const have = await Promise.all(locs.map(async (l) => { try { await stat(join(ROOT, 'dist', l, 'access', 'index.html')); await stat(join(ROOT, 'dist', l, 'development', 'index.html')); return true; } catch { return false; } }));
  ok(have.every(Boolean), '/access/ and /development/ built in all 7 locales');
  const access = await readFile(join(ROOT, 'dist', 'en', 'access', 'index.html'), 'utf8');
  ok(/FREE/.test(access) && /TYO PRO/.test(access) && /PARTNER/.test(access) && /TYO PRIVATE/.test(access), 'access page shows all four plans');
  ok(access.includes(`$${PRICING.proMonthly} / month`), 'PRO price rendered from config');
  ok(!/<form[^>]+action="mailto:/.test(access), 'inquiry form never posts to mailto:');
  ok(COMMERCIAL.inquiryEndpoint ? !access.includes('iform--offline') : access.includes('iform--offline'), 'form offline state matches inquiryEndpoint config');
  ok(/referral compensation/i.test(access), 'partner referral disclosure rendered (§51)');
  ok(!/buy now/i.test(access) && !/(^|>)\s*BUY\b/i.test(access), 'no hard-sell wording');
  ok(access.includes('DATA_REQUIRED'), 'DATA_REQUIRED rendered literally where owner data is missing');
  ok(access.includes('TOKYO QUANT SYSTEMS') && access.includes('BUILT IN TOKYO'), 'brand strip rendered (§6)');
  const joker = await readFile(join(ROOT, 'dist', 'en', 'ea', 'joker', 'index.html'), 'utf8');
  ok(joker.includes('/access/?ea=joker'), 'EA detail CTA links to /access/?ea=<slug>');
  ok(joker.includes('id="access"') && /Commercial status/i.test(joker) && /Required plan/i.test(joker), 'EA detail access panel shows commercial status and required plan');
  ok(/RESEARCH ONLY/.test(joker), 'unassigned strategy shows RESEARCH ONLY, not a fake lock (§120, §146)');
  const account = await readFile(join(ROOT, 'dist', 'en', 'account', 'index.html'), 'utf8');
  ok(!/<input[^>]+type="password"/.test(account) && account.includes('noindex'), '/account/ has no fake login and is noindex');
  ok(!/supabase|stripe/i.test(await readFile(join(ROOT, 'dist', 'scripts', 'main.js'), 'utf8')), 'no SaaS client code shipped on research pages (§128)');
}

/* 9. development service definition */
ok(DEVELOPMENT.pricing === 'CONTACT_FOR_QUOTE' && DEVELOPMENT.caseStudies.length === 0 && DEVELOPMENT.whiteLabel === false, 'development: quote-only, no invented case studies, white-label hidden');

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
