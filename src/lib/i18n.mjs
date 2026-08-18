import { LOCALES, DEFAULT_LOCALE } from '../site.config.mjs';

/** Deep-merge `over` on top of `base`. Arrays replace wholesale. */
function merge(base, over) {
  if (over === undefined) return base;
  if (Array.isArray(base) || Array.isArray(over)) return over ?? base;
  if (base && typeof base === 'object' && over && typeof over === 'object') {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
    return out;
  }
  return over === undefined ? base : over;
}

/**
 * Loads every locale dictionary, each already merged over English so no
 * template ever has to guard against a missing key.
 * @returns {Promise<Record<string, object>>}
 */
export async function loadDictionaries() {
  const base = (await import('../i18n/en.mjs')).default;
  const dicts = { en: base };
  for (const loc of LOCALES) {
    if (loc.code === 'en') continue;
    try {
      const mod = (await import(`../i18n/${loc.code}.mjs`)).default;
      dicts[loc.code] = merge(base, mod);
    } catch {
      // Locale listed in config but not translated yet — ship English.
      console.warn(`  ! i18n: no dictionary for "${loc.code}", falling back to English`);
      dicts[loc.code] = base;
    }
  }
  return dicts;
}

/**
 * Resolve per-entry content (EA / article) for a locale, falling back to
 * English and then to the first available translation.
 */
export function entryI18n(entry, locale) {
  const bag = entry?.i18n || {};
  return { ...(bag[DEFAULT_LOCALE] || {}), ...(bag[locale] || {}) };
}

/** Locale-aware date formatting, with a stable ISO fallback. */
export function formatDate(iso, locale) {
  if (!iso) return '';
  const tags = {
    en: 'en-GB',
    ja: 'ja-JP',
    zh: 'zh-CN',
    th: 'th-TH',
    id: 'id-ID',
    vi: 'vi-VN',
    hi: 'hi-IN',
  };
  const d = new Date(iso.length === 7 ? `${iso}-01` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(tags[locale] || 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: iso.length === 7 ? undefined : 'numeric',
      timeZone: 'UTC',
    }).format(d);
  } catch {
    return iso;
  }
}

/** 5000 → "5,000" using the locale's own grouping. */
export function formatNumber(n, locale) {
  const tags = { en: 'en-GB', ja: 'ja-JP', zh: 'zh-CN', th: 'th-TH', id: 'id-ID', vi: 'vi-VN', hi: 'en-IN' };
  try {
    return new Intl.NumberFormat(tags[locale] || 'en-GB').format(n);
  } catch {
    return String(n);
  }
}
