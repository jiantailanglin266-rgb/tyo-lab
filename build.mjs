/**
 * ============================================================================
 * TYO — static site generator
 * ============================================================================
 * Zero dependencies. `node build.mjs` writes the whole multilingual site to
 * dist/ in well under a second, which keeps the edit → look loop instant.
 *
 *   dist/
 *     index.html                 language redirect
 *     404.html
 *     robots.txt  sitemap.xml
 *     <locale>/                  one tree per locale
 *       index.html  ea/  ea/<slug>/  history/  technology/  lab/  lab/<slug>/
 *       about/  contact/
 *     styles/ scripts/ assets/   copied from public/
 * ============================================================================
 */

import { mkdir, writeFile, readdir, cp, rm, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LOCALES, DEFAULT_LOCALE, SITE_URL, BASE_PATH, VIDEOS, BRAND, LINKS, FEATURES } from './src/site.config.mjs';
import { loadDictionaries, entryI18n } from './src/lib/i18n.mjs';
import { localePath, outPath, absolute, asset, ROUTES } from './src/lib/url.mjs';
import { buildMask } from './src/lib/worldmap.mjs';
import { Document } from './src/components/layout.mjs';

import { publishedEA, EA } from './src/data/ea.mjs';
import { publishedArticles, ARTICLES } from './src/data/lab.mjs';
import { STAGES, MILESTONES } from './src/data/history.mjs';

import Home from './src/pages/home.mjs';
import EAIndex from './src/pages/ea-index.mjs';
import EADetail from './src/pages/ea-detail.mjs';
import History from './src/pages/history.mjs';
import Technology from './src/pages/technology.mjs';
import LabIndex from './src/pages/lab-index.mjs';
import LabArticle from './src/pages/lab-article.mjs';
import About from './src/pages/about.mjs';
import Contact from './src/pages/contact.mjs';
import NotFound from './src/pages/notfound.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');

const t0 = Date.now();
const written = [];
const sitemap = [];
const warnings = [];

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

const exists = (p) =>
  access(p, constants.F_OK).then(
    () => true,
    () => false
  );

async function emit(relPath, content) {
  const full = join(DIST, relPath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, String(content), 'utf8');
  written.push(relPath);
}

/** Register a page in the sitemap. `path` is locale-relative. */
function registerSitemap(path, priority, changefreq) {
  sitemap.push({
    // one <url> entry per logical page, with every locale as an alternate
    loc: absolute(localePath(DEFAULT_LOCALE, path)),
    alternates: LOCALES.map((l) => ({ hreflang: l.hreflang, href: absolute(localePath(l.code, path)) })),
    priority,
    changefreq,
  });
}

/* ------------------------------------------------------------------ *
 * 1. Inputs
 * ------------------------------------------------------------------ */

console.log('\n  TYO — building\n');

const dicts = await loadDictionaries();
const { b64: mask, land, total } = buildMask();
console.log(`  · world mask   ${land}/${total} cells land (${(mask.length / 1024).toFixed(1)} KB base64)`);

/**
 * Which encodings actually exist per slot. Templates emit a <source> only for
 * files that are really on disk, so a missing .webm never produces a 404.
 */
const has = {};
for (const [key, v] of Object.entries(VIDEOS)) {
  const check = (p) => exists(join(PUBLIC, p.replace(/^\//, '')));
  const [webm, mp4, webmMobile, mp4Mobile] = await Promise.all([
    check(v.webm),
    check(v.mp4),
    check(v.webmMobile),
    check(v.mp4Mobile),
  ]);
  has[key] = { webm, mp4, webmMobile, mp4Mobile, any: webm || mp4 };
}
const videoCount = Object.values(has).filter((h) => h.any).length;
console.log(`  · video slots  ${videoCount}/${Object.keys(VIDEOS).length} encoded (missing slots fall back to poster + particles)`);

const ea = publishedEA();
const articles = publishedArticles();

/**
 * Resolve each EA's cover art: public/assets/images/ea/<slug>.<ext>.
 * An explicit `image` in the data file wins; otherwise the first extension
 * found on disk is used; nothing found leaves image = null (art-less layout).
 */
let coverCount = 0;
for (const e of ea) {
  if (e.image) {
    coverCount++;
    continue;
  }
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const rel = `/assets/images/ea/${e.slug}.${ext}`;
    if (await exists(join(PUBLIC, rel.slice(1)))) {
      e.image = rel;
      coverCount++;
      break;
    }
  }
}
console.log(`  · EA covers    ${coverCount}/${ea.length} found in public/assets/images/ea/`);
if (coverCount < ea.length)
  warnings.push(
    `${ea.length - coverCount} EA cover image(s) missing — drop <slug>.png into public/assets/images/ea/ (` +
      ea.filter((e) => !e.image).map((e) => e.slug).join(', ') +
      ')'
  );

for (const e of EA) if (e.placeholder && e.status !== 'draft') warnings.push(`EA "${e.slug}" still has placeholder:true — replace the copy in src/data/ea.mjs`);
for (const a of ARTICLES) if (a.placeholder && a.status !== 'draft') warnings.push(`Lab article "${a.slug}" still has placeholder:true — replace the copy in src/data/lab.mjs`);
if (!MILESTONES.length) warnings.push('MILESTONES is empty — the "Selected milestones" block on /history/ is hidden until you add dated entries you can evidence.');

/* ------------------------------------------------------------------ *
 * 2. Clean + copy static assets
 * ------------------------------------------------------------------ */

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
if (await exists(PUBLIC)) {
  for (const entry of await readdir(PUBLIC, { withFileTypes: true })) {
    await cp(join(PUBLIC, entry.name), join(DIST, entry.name), { recursive: true });
  }
}

/* ------------------------------------------------------------------ *
 * 3. JSON-LD builders
 * ------------------------------------------------------------------ */

const breadcrumb = (locale, trail) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absolute(localePath(locale, item.path)),
  })),
});

const softwareLd = (e, locale, c) => {
  const node = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: e.name,
    applicationCategory: 'FinanceApplication',
    operatingSystem: e.spec.platform || 'MetaTrader 5',
    url: absolute(localePath(locale, ROUTES.eaDetail(e.slug))),
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
  if (c.overview) node.description = c.overview;
  if (e.spec.version) node.softwareVersion = e.spec.version;
  if (e.spec.releaseDate) node.datePublished = e.spec.releaseDate;
  if (e.spec.price === 'free') node.offers = { '@type': 'Offer', price: '0', priceCurrency: 'USD' };
  if (e.mql5Url) node.downloadUrl = e.mql5Url;
  return node;
};

const articleLd = (a, locale, c) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: c.title,
  description: c.summary || '',
  datePublished: a.date,
  inLanguage: (LOCALES.find((l) => l.code === locale) || {}).hreflang,
  author: { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
  mainEntityOfPage: absolute(localePath(locale, ROUTES.labArticle(a.slug))),
});

/* ------------------------------------------------------------------ *
 * 4. Render every locale
 * ------------------------------------------------------------------ */

for (const loc of LOCALES) {
  const locale = loc.code;
  const t = dicts[locale];
  const ctx = { locale, t, has, mask, stages: STAGES };

  /* ---- home ---- */
  await emit(
    outPath(locale, ROUTES.home()),
    Document({
      ...ctx,
      path: ROUTES.home(),
      title: t.seo.home.title,
      description: t.seo.home.desc,
      bodyClass: 'is-home',
      children: Home({ ...ctx, ea }),
    })
  );

  /* ---- EA index ---- */
  await emit(
    outPath(locale, ROUTES.ea()),
    Document({
      ...ctx,
      path: ROUTES.ea(),
      title: t.seo.ea.title,
      description: t.seo.ea.desc,
      jsonLd: [
        breadcrumb(locale, [
          { name: t.nav.home, path: ROUTES.home() },
          { name: t.nav.ea, path: ROUTES.ea() },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: ea.map((e, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: e.name,
            url: absolute(localePath(locale, ROUTES.eaDetail(e.slug))),
          })),
        },
      ],
      children: EAIndex({ ...ctx, ea }),
    })
  );

  /* ---- EA detail ---- */
  for (let i = 0; i < ea.length; i++) {
    const e = ea[i];
    const c = entryI18n(e, locale);
    const next = ea[(i + 1) % ea.length];
    await emit(
      outPath(locale, ROUTES.eaDetail(e.slug)),
      Document({
        ...ctx,
        path: ROUTES.eaDetail(e.slug),
        title: `${e.name} — ${t.nav.ea} | ${BRAND.name}`,
        description: c.tagline || c.overview || t.seo.ea.desc,
        ogImage: e.image || undefined,
        jsonLd: [
          breadcrumb(locale, [
            { name: t.nav.home, path: ROUTES.home() },
            { name: t.nav.ea, path: ROUTES.ea() },
            { name: e.name, path: ROUTES.eaDetail(e.slug) },
          ]),
          softwareLd(e, locale, c),
        ],
        children: EADetail({ ...ctx, ea: e, next: ea.length > 1 ? next : null }),
      })
    );
  }

  /* ---- history ---- */
  await emit(
    outPath(locale, ROUTES.history()),
    Document({
      ...ctx,
      path: ROUTES.history(),
      title: t.seo.history.title,
      description: t.seo.history.desc,
      jsonLd: [
        breadcrumb(locale, [
          { name: t.nav.home, path: ROUTES.home() },
          { name: t.nav.history, path: ROUTES.history() },
        ]),
      ],
      children: History({ ...ctx, milestones: MILESTONES }),
    })
  );

  /* ---- technology ---- */
  await emit(
    outPath(locale, ROUTES.technology()),
    Document({
      ...ctx,
      path: ROUTES.technology(),
      title: t.seo.technology.title,
      description: t.seo.technology.desc,
      jsonLd: [
        breadcrumb(locale, [
          { name: t.nav.home, path: ROUTES.home() },
          { name: t.nav.technology, path: ROUTES.technology() },
        ]),
      ],
      children: Technology({ ...ctx }),
    })
  );

  /* ---- lab ---- */
  if (FEATURES.labSection) {
    await emit(
      outPath(locale, ROUTES.lab()),
      Document({
        ...ctx,
        path: ROUTES.lab(),
        title: t.seo.lab.title,
        description: t.seo.lab.desc,
        jsonLd: [
          breadcrumb(locale, [
            { name: t.nav.home, path: ROUTES.home() },
            { name: t.nav.lab, path: ROUTES.lab() },
          ]),
        ],
        children: LabIndex({ ...ctx, articles }),
      })
    );

    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      const c = entryI18n(a, locale);
      await emit(
        outPath(locale, ROUTES.labArticle(a.slug)),
        Document({
          ...ctx,
          path: ROUTES.labArticle(a.slug),
          title: `${c.title} — ${t.nav.lab} | ${BRAND.name}`,
          description: c.summary || t.seo.lab.desc,
          jsonLd: [
            breadcrumb(locale, [
              { name: t.nav.home, path: ROUTES.home() },
              { name: t.nav.lab, path: ROUTES.lab() },
              { name: c.title, path: ROUTES.labArticle(a.slug) },
            ]),
            articleLd(a, locale, c),
          ],
          children: LabArticle({
            ...ctx,
            article: a,
            ea: a.ea ? ea.find((e) => e.slug === a.ea) || null : null,
            prev: articles[i - 1] || null,
            next: articles[i + 1] || null,
          }),
        })
      );
    }
  }

  /* ---- about ---- */
  await emit(
    outPath(locale, ROUTES.about()),
    Document({
      ...ctx,
      path: ROUTES.about(),
      title: t.seo.about.title,
      description: t.seo.about.desc,
      jsonLd: [
        breadcrumb(locale, [
          { name: t.nav.home, path: ROUTES.home() },
          { name: t.nav.about, path: ROUTES.about() },
        ]),
      ],
      children: About({ ...ctx }),
    })
  );

  /* ---- contact ---- */
  await emit(
    outPath(locale, ROUTES.contact()),
    Document({
      ...ctx,
      path: ROUTES.contact(),
      title: t.seo.contact.title,
      description: t.seo.contact.desc,
      jsonLd: [
        breadcrumb(locale, [
          { name: t.nav.home, path: ROUTES.home() },
          { name: t.nav.contact, path: ROUTES.contact() },
        ]),
      ],
      children: Contact({ ...ctx }),
    })
  );
}

/* ------------------------------------------------------------------ *
 * 5. Sitemap entries (one per logical page, alternates inline)
 * ------------------------------------------------------------------ */

registerSitemap(ROUTES.home(), '1.0', 'weekly');
registerSitemap(ROUTES.ea(), '0.9', 'weekly');
for (const e of ea) registerSitemap(ROUTES.eaDetail(e.slug), '0.8', 'monthly');
registerSitemap(ROUTES.history(), '0.7', 'monthly');
registerSitemap(ROUTES.technology(), '0.7', 'monthly');
if (FEATURES.labSection) {
  registerSitemap(ROUTES.lab(), '0.7', 'weekly');
  for (const a of articles) registerSitemap(ROUTES.labArticle(a.slug), '0.6', 'monthly');
}
registerSitemap(ROUTES.about(), '0.6', 'yearly');
registerSitemap(ROUTES.contact(), '0.5', 'yearly');

const today = new Date().toISOString().slice(0, 10);
await emit(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
${u.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${u.loc}"/>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`
);

await emit(
  'robots.txt',
  `User-agent: *
Allow: /

Sitemap: ${SITE_URL}${BASE_PATH}/sitemap.xml
`
);

/* ------------------------------------------------------------------ *
 * 6. Root redirect + 404
 * ------------------------------------------------------------------ */

const supported = LOCALES.map((l) => l.code);
await emit(
  'index.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${BRAND.name} — ${BRAND.legalName}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${absolute(localePath(DEFAULT_LOCALE, '/'))}">
${LOCALES.map((l) => `<link rel="alternate" hreflang="${l.hreflang}" href="${absolute(localePath(l.code, '/'))}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${absolute(localePath(DEFAULT_LOCALE, '/'))}">
<meta http-equiv="refresh" content="0;url=${localePath(DEFAULT_LOCALE, '/')}">
<style>html{background:#050505;color:#8a8a8a;font:14px/1.6 system-ui,sans-serif}body{margin:0;display:grid;place-items:center;min-height:100vh}</style>
<script>
(function () {
  var supported = ${JSON.stringify(supported)};
  var base = ${JSON.stringify(BASE_PATH)};
  try {
    var saved = localStorage.getItem('tyo-locale');
    var picks = (saved ? [saved] : []).concat(navigator.languages || [navigator.language || 'en']);
    for (var i = 0; i < picks.length; i++) {
      var tag = String(picks[i] || '').toLowerCase();
      var code = tag.split('-')[0];
      if (tag.indexOf('zh') === 0) code = 'zh';
      if (supported.indexOf(code) > -1) { location.replace(base + '/' + code + '/'); return; }
    }
  } catch (e) {}
  location.replace(base + '/${DEFAULT_LOCALE}/');
})();
</script>
</head>
<body><p><a href="${localePath(DEFAULT_LOCALE, '/')}" style="color:#fff">${BRAND.name} — continue in English</a></p></body>
</html>
`
);

{
  const t = dicts[DEFAULT_LOCALE];
  await emit(
    '404.html',
    Document({
      locale: DEFAULT_LOCALE,
      t,
      path: '/',
      title: `404 — ${BRAND.name}`,
      description: t.meta.defaultDesc,
      bodyClass: 'is-404',
      noindex: true,
      children: NotFound({ locale: DEFAULT_LOCALE, t }),
    })
  );
}

/* ------------------------------------------------------------------ *
 * 7. Report
 * ------------------------------------------------------------------ */

const htmlPages = written.filter((f) => f.endsWith('.html')).length;
console.log(`  · locales      ${LOCALES.map((l) => l.code).join(' ')}`);
console.log(`  · pages        ${htmlPages} html  (${ea.length} EA × ${LOCALES.length}, ${articles.length} articles × ${LOCALES.length})`);
console.log(`  · sitemap      ${sitemap.length} logical URLs × ${LOCALES.length} locales`);
console.log(`\n  ✓ dist/ ready in ${Date.now() - t0} ms\n`);

if (warnings.length) {
  console.log('  Before launch:');
  for (const w of warnings) console.log(`    ! ${w}`);
  console.log('');
}
