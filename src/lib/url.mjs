import { BASE_PATH, SITE_URL, LOCALES, DEFAULT_LOCALE } from '../site.config.mjs';

/**
 * Route table. Adding a page = adding a row here + a template in src/pages.
 * `path(params)` returns the locale-relative path with leading and trailing slash.
 */
export const ROUTES = {
  home: () => '/',
  ea: () => '/ea/',
  eaCompare: () => '/ea/compare/',
  eaDetail: (slug) => `/ea/${slug}/`,
  history: () => '/history/',
  technology: () => '/technology/',
  aiLab: () => '/ai-lab/',
  portfolio: () => '/portfolio-lab/',
  lab: () => '/lab/',
  labArticle: (slug) => `/lab/${slug}/`,
  research: () => '/research/',
  researchDetail: (id) => `/research/${id}/`,
  terminal: () => '/terminal/',
  about: () => '/about/',
  contact: () => '/contact/',
};

/** Absolute site path for a locale, e.g. ('ja','/ea/') → '/ja/ea/' */
export function localePath(locale, path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}/${locale}${p === '/' ? '/' : p}`.replace(/\/{2,}/g, '/');
}

/** Non-localised asset path (respects BASE_PATH). */
export const asset = (p) => `${BASE_PATH}${p}`.replace(/\/{2,}/g, '/');

/** Fully-qualified URL for canonical / hreflang / sitemap. */
export const absolute = (p) => `${SITE_URL}${p}`.replace(/([^:]\/)\/+/g, '$1');

/** Filesystem path inside dist/ for a given locale + route. */
export const outPath = (locale, path = '/') =>
  `${locale}${path}index.html`.replace(/\/{2,}/g, '/');

/** hreflang alternates for one logical page across every locale. */
export function alternates(path) {
  const list = LOCALES.map((l) => ({
    hreflang: l.hreflang,
    href: absolute(localePath(l.code, path)),
  }));
  list.push({ hreflang: 'x-default', href: absolute(localePath(DEFAULT_LOCALE, path)) });
  return list;
}
