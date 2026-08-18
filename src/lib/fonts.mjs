/**
 * Per-locale webfont bundles.
 *
 * Each page loads ONLY the scripts it needs: an English page never downloads
 * the Devanagari or CJK faces. Display type (Space Grotesk) and the data mono
 * (JetBrains Mono) are shared, because every locale renders the English
 * display headlines and the numeric data labels.
 */

const SHARED = ['Space+Grotesk:wght@500;700', 'JetBrains+Mono:wght@400;500'];

const BUNDLES = {
  // Latin + Latin-Extended + Vietnamese all come from Inter.
  latin: { families: [...SHARED, 'Inter:wght@400;500;600'], stack: `'Inter'` },
  jp: { families: [...SHARED, 'Inter:wght@400;500;600', 'Noto+Sans+JP:wght@400;500;700'], stack: `'Inter','Noto Sans JP'` },
  sc: { families: [...SHARED, 'Inter:wght@400;500;600', 'Noto+Sans+SC:wght@400;500;700'], stack: `'Inter','Noto Sans SC'` },
  kr: { families: [...SHARED, 'Inter:wght@400;500;600', 'Noto+Sans+KR:wght@400;500;700'], stack: `'Inter','Noto Sans KR'` },
  thai: { families: [...SHARED, 'Inter:wght@400;500;600', 'Noto+Sans+Thai:wght@400;500;700'], stack: `'Inter','Noto Sans Thai'` },
  devanagari: {
    families: [...SHARED, 'Inter:wght@400;500;600', 'Noto+Sans+Devanagari:wght@400;500;700'],
    stack: `'Inter','Noto Sans Devanagari'`,
  },
};

const FALLBACK =
  `system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',` +
  `'Hiragino Sans','Yu Gothic UI','Meiryo',` +
  `'PingFang SC','Microsoft YaHei',` +
  `'Leelawadee UI','Noto Sans Thai',` +
  `'Nirmala UI','Noto Sans Devanagari',` +
  `sans-serif`;

/** Google Fonts stylesheet URL for a locale's bundle. */
export function fontHref(bundleKey) {
  const b = BUNDLES[bundleKey] || BUNDLES.latin;
  const q = b.families.map((f) => `family=${f}`).join('&');
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

/** The CSS custom properties this locale needs, as an inline style body. */
export function fontVars(bundleKey) {
  const b = BUNDLES[bundleKey] || BUNDLES.latin;
  return `:root{--font-body:${b.stack},${FALLBACK};--font-display:'Space Grotesk',${b.stack},${FALLBACK};--font-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}`;
}
