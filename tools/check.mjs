/**
 * Post-build integrity check for dist/.
 *   node tools/check.mjs
 *
 * Verifies that every internal href/src resolves to a file that actually
 * exists, and reports the head-tag coverage the SEO setup depends on.
 * Exits non-zero on a broken reference so it can gate a deploy.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
/** When the site is built for a sub-path (GitHub Pages), internal hrefs carry
 *  this prefix; strip it before resolving against dist/. */
const BASE = process.env.BASE_PATH || '';

async function walk(dir, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = await walk(DIST);
const rel = (p) => p.slice(DIST.length).split(sep).join('/');
const present = new Set(files.map(rel));
const htmls = files.filter((f) => f.endsWith('.html'));

const broken = [];
const missingHead = [];
let internal = 0;
let external = 0;

for (const f of htmls) {
  const src = await readFile(f, 'utf8');

  for (const m of src.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const h = m[1];
    if (/^(https?:|mailto:|tel:|#|data:|\/\/)/.test(h)) {
      external++;
      continue;
    }
    internal++;
    let clean = h.split('#')[0].split('?')[0];
    if (!clean) continue;
    if (BASE && clean.startsWith(BASE + '/')) clean = clean.slice(BASE.length);
    const target = clean.endsWith('/') ? clean + 'index.html' : clean;
    if (!present.has(target)) broken.push(`${rel(f)}  ->  ${h}`);
  }

  // noindex pages (root language redirect, 404) only need the basics.
  const isNoindex = /name="robots" content="noindex/.test(src);
  const need = [
    ['<title>', /<title>[^<]{5,}<\/title>/],
    ['lang', /<html lang="[a-zA-Z-]+"/],
  ];
  if (!isNoindex) {
    need.push(
      ['description', /<meta name="description" content="[^"]{20,}"/],
      ['og:image', /property="og:image"/],
      ['json-ld', /application\/ld\+json/],
      ['canonical', /rel="canonical"/],
      ['hreflang', /hreflang="x-default"/]
    );
  }
  for (const [name, re] of need) if (!re.test(src)) missingHead.push(`${rel(f)}  missing ${name}`);
}

console.log(`\n  html files            ${htmls.length}`);
console.log(`  internal references   ${internal}  (${external} external / anchors skipped)`);
console.log(`  broken references     ${broken.length}`);
broken.slice(0, 25).forEach((b) => console.log(`    X ${b}`));
console.log(`  head-tag gaps         ${missingHead.length}`);
missingHead.slice(0, 25).forEach((b) => console.log(`    X ${b}`));

const sm = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
console.log(`  sitemap urls          ${(sm.match(/<url>/g) || []).length}`);
console.log(`  sitemap alternates    ${(sm.match(/xhtml:link/g) || []).length}`);

const total = files.reduce((n, f) => n + 1, 0);
console.log(`  files in dist         ${total}\n`);

process.exit(broken.length || missingHead.length ? 1 : 0);
