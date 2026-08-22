/**
 * TYO — global site configuration.
 * Everything an operator is likely to change lives in this file.
 */

/* ------------------------------------------------------------------ *
 * 1. Deployment
 * ------------------------------------------------------------------ */

/** Absolute origin, no trailing slash. Used for canonical / hreflang / OGP / sitemap. */
export const SITE_URL = process.env.SITE_URL || 'https://www.tyo-lab.com';

/** Sub-path if the site is not hosted at the domain root (e.g. '/tyo'). '' = root. */
export const BASE_PATH = process.env.BASE_PATH || '';

/* ------------------------------------------------------------------ *
 * 2. Brand
 * ------------------------------------------------------------------ */

export const BRAND = {
  name: 'TYO',
  legalName: 'TYO Algorithmic Trading Lab',
  signature: 'powered by TYO',
  /** Swap these two files to replace the logo everywhere. */
  logoFull: '/assets/logo/tyo-logo.svg', // footer / large surfaces
  logoMark: '/assets/logo/tyo-mark.svg', // header / favicon-scale
  ogImage: '/assets/og/og-default.png',
  founded: 2021,
};

/* ------------------------------------------------------------------ *
 * 3. Languages
 * `hreflang` is what ends up in <link rel="alternate">.
 * `fonts` selects the webfont bundle (see src/lib/fonts.mjs).
 * Add a locale by adding a row here + a file in src/i18n/.
 * ------------------------------------------------------------------ */

export const LOCALES = [
  { code: 'en', hreflang: 'en', htmlLang: 'en', label: 'English', short: 'EN', native: 'English', fonts: 'latin', dir: 'ltr' },
  { code: 'ja', hreflang: 'ja', htmlLang: 'ja', label: 'Japanese', short: 'JP', native: '日本語', fonts: 'jp', dir: 'ltr' },
  { code: 'zh', hreflang: 'zh-CN', htmlLang: 'zh-Hans', label: 'Chinese', short: '中文', native: '简体中文', fonts: 'sc', dir: 'ltr' },
  { code: 'th', hreflang: 'th', htmlLang: 'th', label: 'Thai', short: 'ไทย', native: 'ไทย', fonts: 'thai', dir: 'ltr' },
  { code: 'id', hreflang: 'id', htmlLang: 'id', label: 'Indonesian', short: 'ID', native: 'Bahasa Indonesia', fonts: 'latin', dir: 'ltr' },
  { code: 'vi', hreflang: 'vi', htmlLang: 'vi', label: 'Vietnamese', short: 'VI', native: 'Tiếng Việt', fonts: 'latin', dir: 'ltr' },
  { code: 'hi', hreflang: 'hi', htmlLang: 'hi', label: 'Hindi', short: 'हिन्दी', native: 'हिन्दी', fonts: 'devanagari', dir: 'ltr' },
];

/**
 * Locales that are designed for but not yet translated. Move a row from here
 * into LOCALES once src/i18n/<code>.mjs exists — the build deep-merges every
 * locale over English, so a partially translated file is safe to ship.
 */
export const PLANNED_LOCALES = [
  { code: 'ko', hreflang: 'ko', htmlLang: 'ko', label: 'Korean', short: 'KO', native: '한국어', fonts: 'kr', dir: 'ltr' },
  { code: 'es', hreflang: 'es', htmlLang: 'es', label: 'Spanish', short: 'ES', native: 'Español', fonts: 'latin', dir: 'ltr' },
  { code: 'pt', hreflang: 'pt-BR', htmlLang: 'pt', label: 'Portuguese', short: 'PT', native: 'Português', fonts: 'latin', dir: 'ltr' },
];

export const DEFAULT_LOCALE = 'en';

/* ------------------------------------------------------------------ *
 * 4. Trust numbers
 * RULE: never publish a number that is not real. Set `show:false`
 * (or value:null) and the tile disappears from the site entirely.
 * ------------------------------------------------------------------ */

export const STATS = [
  { key: 'downloads', value: 5000, suffix: '+', show: true },
  { key: 'countries', value: null, suffix: '+', show: false },
  { key: 'releases', value: null, suffix: '', show: false },
  { key: 'backtests', value: null, suffix: '+', show: false },
  { key: 'years', value: null, suffix: '', show: false },
];

/* ------------------------------------------------------------------ *
 * 5. External links
 * ------------------------------------------------------------------ */

export const LINKS = {
  mql5Profile: 'https://www.mql5.com/en/users/tyo',
  mql5Products: 'https://www.mql5.com/en/users/tyo/seller',
  email: 'contact@tyo-lab.com',
  x: '',
  youtube: '',
  github: '',
};

/* ------------------------------------------------------------------ *
 * 6. Video slots
 * Drop files into public/assets/videos/ using these names and they are
 * picked up automatically. Mobile variants are optional — when the file is
 * absent the desktop source is used. Every slot degrades to its poster.
 * ------------------------------------------------------------------ */

const v = (id, opts) => ({
  id,
  webm: `/assets/videos/${id}.webm`,
  mp4: `/assets/videos/${id}.mp4`,
  webmMobile: `/assets/videos/${id}-mobile.webm`,
  mp4Mobile: `/assets/videos/${id}-mobile.mp4`,
  poster: `/assets/posters/${id}.svg`,
  ...opts,
});

export const VIDEOS = {
  hero: v('VIDEO_01_HERO', { priority: true, theme: 'spectrum' }),
  ai: v('VIDEO_02_AI', { priority: false, theme: 'cyan' }),
  algorithm: v('VIDEO_03_ALGORITHM', { priority: false, theme: 'violet' }),
  backtest: v('VIDEO_04_BACKTEST', { priority: false, theme: 'amber' }),
  global: v('VIDEO_05_GLOBAL', { priority: false, theme: 'blue' }),
  final: v('VIDEO_06_FINAL', { priority: false, theme: 'spectrum' }),
};

/* ------------------------------------------------------------------ *
 * 7. Community footprint — glowing points on the world map.
 * lat/lon drive the projection; `weight` (0–1) drives glow size only.
 * ------------------------------------------------------------------ */

export const COMMUNITY = [
  { id: 'jp', name: 'Japan', city: 'Tokyo', lat: 35.7, lon: 139.7, weight: 1.0, home: true },
  { id: 'in', name: 'India', city: 'Mumbai', lat: 19.1, lon: 72.9, weight: 0.92 },
  { id: 'th', name: 'Thailand', city: 'Bangkok', lat: 13.8, lon: 100.5, weight: 0.85 },
  { id: 'id', name: 'Indonesia', city: 'Jakarta', lat: -6.2, lon: 106.8, weight: 0.85 },
  { id: 'vn', name: 'Vietnam', city: 'Ho Chi Minh', lat: 10.8, lon: 106.7, weight: 0.78 },
  { id: 'cn', name: 'China', city: 'Shanghai', lat: 31.2, lon: 121.5, weight: 0.8 },
  { id: 'eu', name: 'Europe', city: 'London', lat: 51.5, lon: -0.1, weight: 0.6 },
  { id: 'us', name: 'USA', city: 'New York', lat: 40.7, lon: -74.0, weight: 0.6 },
  { id: 'br', name: 'Brazil', city: 'Sao Paulo', lat: -23.5, lon: -46.6, weight: 0.45 },
  { id: 'za', name: 'Africa', city: 'Johannesburg', lat: -26.2, lon: 28.0, weight: 0.35 },
  { id: 'au', name: 'Australia', city: 'Sydney', lat: -33.9, lon: 151.2, weight: 0.4 },
];

/* ------------------------------------------------------------------ *
 * 8. Feature flags
 * ------------------------------------------------------------------ */

export const FEATURES = {
  contactForm: true,
  labSection: true,
  showPlannedLocales: false,
};

/** Formspree / Basin / Netlify-compatible endpoint. Empty string = mailto fallback. */
export const FORM_ENDPOINT = '';

/* ------------------------------------------------------------------ *
 * 9. Commercial layer (Phase 16) — endpoints are owner data.
 * The static site never fabricates a backend: while an endpoint is empty
 * the matching form renders as DATA_REQUIRED (no mailto fallback, §87).
 * ------------------------------------------------------------------ */
export const COMMERCIAL = {
  inquiryEndpoint: '', // POST target for Private / Development / IB-verification inquiries (form service or Contact API)
  accountUrl: '', // TYO ACCOUNT app (auth + billing) — Phase 16B; empty = /account/ shows "not live"
  downloadApiUrl: '', // signed-download API — Phase 16B
  paymentProvider: '', // 'stripe' | 'paddle' | 'lemonsqueezy' — Phase 16C; empty = no checkout anywhere
  contactEmailConfirmed: false, // owner must confirm LINKS.email is monitored before it is presented as the inquiry channel
};
