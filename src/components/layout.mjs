import { html, raw, esc, when } from '../lib/html.mjs';
import { localePath, asset, absolute, alternates, ROUTES } from '../lib/url.mjs';
import { fontHref, fontVars } from '../lib/fonts.mjs';
import { BRAND, LOCALES, LINKS, SITE_URL, FEATURES } from '../site.config.mjs';

/* ------------------------------------------------------------------ *
 * LanguageSelector
 * ------------------------------------------------------------------ */

export function LanguageSelector({ locale, t, path, variant = 'header' }) {
  const current = LOCALES.find((l) => l.code === locale);
  return html`
    <details class="lang lang--${raw(variant)}" data-lang-switcher>
      <summary aria-label="${t.ui.selectLanguage}">
        <span class="lang__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3Z" />
          </svg>
        </span>
        <span class="lang__current">${current?.short || locale.toUpperCase()}</span>
        <span class="lang__chev" aria-hidden="true"></span>
      </summary>
      <div class="lang__menu" role="listbox">
        <p class="lang__title">${t.ui.language}</p>
        <ul>
          ${LOCALES.map(
            (l) => html`<li>
              <a
                href="${localePath(l.code, path)}"
                hreflang="${l.hreflang}"
                lang="${l.htmlLang}"
                class="lang__item${raw(l.code === locale ? ' is-active' : '')}"
                ${raw(l.code === locale ? 'aria-current="true"' : '')}
              >
                <span class="lang__native">${l.native}</span>
                <span class="lang__label">${l.label}</span>
              </a>
            </li>`
          )}
        </ul>
      </div>
    </details>
  `;
}

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */

function navItems(locale, t) {
  return [
    { href: localePath(locale, ROUTES.ea()), label: t.nav.ea, n: '02' },
    { href: localePath(locale, ROUTES.history()), label: t.nav.history, n: '03' },
    { href: localePath(locale, ROUTES.technology()), label: t.nav.technology, n: '04' },
    { href: localePath(locale, ROUTES.aiLab()), label: t.nav.aiLab, n: '05' },
    ...(FEATURES.labSection ? [{ href: localePath(locale, ROUTES.lab()), label: t.nav.lab, n: '06' }] : []),
    { href: localePath(locale, ROUTES.about()), label: t.nav.about, n: '07' },
    { href: localePath(locale, ROUTES.contact()), label: t.nav.contact, n: '08' },
  ];
}

export function Header({ locale, t, path, active }) {
  const items = navItems(locale, t);
  return html`
    <header class="hdr" data-header>
      <div class="hdr__bar">
        <a class="hdr__brand" href="${localePath(locale, ROUTES.home())}" aria-label="${BRAND.name} — ${t.meta.brandLine}">
          <img src="${asset(BRAND.logoMark)}" alt="" width="34" height="34" decoding="async" />
          <span class="hdr__wordmark">${BRAND.name}</span>
        </a>

        <nav class="hdr__nav" aria-label="${t.ui.menu}">
          <ul>
            ${items.map(
              (i) => html`<li>
                <a href="${i.href}"${raw(active === i.href ? ' aria-current="page"' : '')}>${i.label}</a>
              </li>`
            )}
          </ul>
        </nav>

        <div class="hdr__end">
          ${LanguageSelector({ locale, t, path })}
          <button class="hdr__toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-menu">
            <span class="hdr__toggle-label">${t.ui.menu}</span>
            <span class="hdr__burger" aria-hidden="true"><i></i><i></i></span>
          </button>
        </div>
      </div>
      <div class="hdr__progress" data-scroll-progress aria-hidden="true"></div>
    </header>

    <div class="menu" id="site-menu" data-menu hidden>
      <div class="menu__inner">
        <nav class="menu__nav" aria-label="${t.ui.menu}">
          <ol>
            <li>
              <a href="${localePath(locale, ROUTES.home())}"><span class="menu__n">01</span><span class="menu__t">${t.nav.home}</span></a>
            </li>
            ${items.map(
              (i) => html`<li>
                <a href="${i.href}"><span class="menu__n">${i.n}</span><span class="menu__t">${i.label}</span></a>
              </li>`
            )}
          </ol>
        </nav>
        <div class="menu__side">
          <p class="menu__label">${t.footer.langTitle}</p>
          <ul class="menu__langs">
            ${LOCALES.map(
              (l) => html`<li>
                <a href="${localePath(l.code, path)}" hreflang="${l.hreflang}" lang="${l.htmlLang}"
                   class="${raw(l.code === locale ? 'is-active' : '')}">${l.native}</a>
              </li>`
            )}
          </ul>
          ${when(
            LINKS.mql5Profile,
            () => html`<a class="menu__mql5" href="${LINKS.mql5Profile}" target="_blank" rel="noopener noreferrer">
              ${t.ui.mql5Profile} <span aria-hidden="true">↗</span>
            </a>`
          )}
        </div>
      </div>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Disclaimer
 * ------------------------------------------------------------------ */

/** Short, always-visible backtest caveat. Used on every page showing numbers. */
export function BacktestDisclaimer({ t, compact = false }) {
  return html`
    <aside class="disclaimer${raw(compact ? ' disclaimer--compact' : '')}" role="note">
      <p class="disclaimer__title">${t.footer.backtestDisclaimerTitle}</p>
      <p class="disclaimer__body">${t.footer.backtestDisclaimer}</p>
    </aside>
  `;
}

/** Full risk disclosure. Collapsed by default in the footer. */
export function RiskDisclaimer({ t }) {
  return html`
    <details class="risk">
      <summary>
        <span class="risk__icon" aria-hidden="true">!</span>
        <span>${t.footer.disclaimerTitle}</span>
        <span class="risk__chev" aria-hidden="true"></span>
      </summary>
      <div class="risk__body">${t.footer.disclaimer.map((p) => html`<p>${p}</p>`)}</div>
    </details>
  `;
}

/* ------------------------------------------------------------------ *
 * Footer
 * ------------------------------------------------------------------ */

export function Footer({ locale, t, path }) {
  const year = new Date().getUTCFullYear();
  const items = navItems(locale, t);
  return html`
    <footer class="ftr">
      <div class="ftr__top">
        <div class="ftr__brand">
          <img class="ftr__logo" src="${asset(BRAND.logoFull)}" alt="${BRAND.name}" width="220" height="64" loading="lazy" decoding="async" />
          <p class="ftr__tagline">${t.footer.tagline}</p>
          <p class="ftr__madein">${t.footer.madeIn}</p>
        </div>

        <nav class="ftr__col" aria-label="${t.footer.navTitle}">
          <p class="ftr__label">${t.footer.navTitle}</p>
          <ul>
            <li><a href="${localePath(locale, ROUTES.home())}">${t.nav.home}</a></li>
            ${items.map((i) => html`<li><a href="${i.href}">${i.label}</a></li>`)}
          </ul>
        </nav>

        <div class="ftr__col">
          <p class="ftr__label">${t.footer.linksTitle}</p>
          <ul>
            ${when(
              LINKS.mql5Profile,
              () => html`<li><a href="${LINKS.mql5Profile}" target="_blank" rel="noopener noreferrer">${t.ui.mql5Profile} <span aria-hidden="true">↗</span></a></li>`
            )}
            ${when(
              LINKS.email,
              () => html`<li><a href="mailto:${LINKS.email}">${LINKS.email}</a></li>`
            )}
            ${when(LINKS.x, () => html`<li><a href="${LINKS.x}" target="_blank" rel="noopener noreferrer">X <span aria-hidden="true">↗</span></a></li>`)}
            ${when(
              LINKS.youtube,
              () => html`<li><a href="${LINKS.youtube}" target="_blank" rel="noopener noreferrer">YouTube <span aria-hidden="true">↗</span></a></li>`
            )}
          </ul>
        </div>

        <div class="ftr__col ftr__col--lang">
          <p class="ftr__label">${t.footer.langTitle}</p>
          <ul class="ftr__langs">
            ${LOCALES.map(
              (l) => html`<li>
                <a href="${localePath(l.code, path)}" hreflang="${l.hreflang}" lang="${l.htmlLang}"
                   class="${raw(l.code === locale ? 'is-active' : '')}">${l.native}</a>
              </li>`
            )}
          </ul>
        </div>
      </div>

      <div class="ftr__legal">${RiskDisclaimer({ t })}</div>

      <div class="ftr__base">
        <p>© ${year} ${BRAND.legalName}. ${t.footer.rights}</p>
        <p class="ftr__sig">${BRAND.signature}</p>
      </div>
    </footer>
  `;
}

/* ------------------------------------------------------------------ *
 * Document shell
 * ------------------------------------------------------------------ */

/**
 * @param {object} o
 * @param {string} o.locale        locale code
 * @param {object} o.t             merged dictionary
 * @param {string} o.path          locale-relative path, e.g. '/ea/'
 * @param {string} o.title
 * @param {string} o.description
 * @param {string} [o.ogImage]
 * @param {string} [o.bodyClass]
 * @param {object[]} [o.jsonLd]    extra JSON-LD nodes
 * @param {*} o.children
 */
export function Document(o) {
  const loc = LOCALES.find((l) => l.code === o.locale) || LOCALES[0];
  const canonical = absolute(localePath(o.locale, o.path));
  const ogImage = absolute(asset(o.ogImage || BRAND.ogImage));

  const baseLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND.legalName,
      alternateName: BRAND.name,
      url: SITE_URL,
      logo: absolute(asset(BRAND.logoFull)),
      description: o.t.meta.defaultDesc,
      foundingDate: String(BRAND.founded),
      address: { '@type': 'PostalAddress', addressCountry: 'JP' },
      sameAs: [LINKS.mql5Profile, LINKS.x, LINKS.youtube, LINKS.github].filter(Boolean),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: `${BRAND.name} — ${BRAND.legalName}`,
      inLanguage: loc.hreflang,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ];
  const ld = [...baseLd, ...(o.jsonLd || [])];

  return raw(`<!doctype html>
<html lang="${esc(loc.htmlLang)}" dir="${esc(loc.dir)}" data-locale="${esc(o.locale)}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<script>document.documentElement.className=document.documentElement.className.replace('no-js','js')</script>
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<meta name="theme-color" content="#050505">
<meta name="color-scheme" content="dark">
${
  o.noindex
    ? '<meta name="robots" content="noindex,follow">'
    : `<link rel="canonical" href="${esc(canonical)}">\n` +
      alternates(o.path)
        .map((a) => `<link rel="alternate" hreflang="${esc(a.hreflang)}" href="${esc(a.href)}">`)
        .join('\n')
}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(BRAND.name)}">
<meta property="og:locale" content="${esc(loc.hreflang.replace('-', '_'))}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<link rel="icon" href="${esc(asset('/assets/logo/favicon.svg'))}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${esc(asset('/assets/logo/apple-touch-icon.png'))}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(fontHref(loc.fonts))}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${esc(fontHref(loc.fonts))}"></noscript>
<style>${fontVars(loc.fonts)}</style>
<link rel="stylesheet" href="${esc(asset('/styles/main.css'))}">
<script type="application/ld+json">${JSON.stringify(ld.length === 1 ? ld[0] : ld).replace(/</g, '\\u003c')}</script>
</head>
<body class="${esc(o.bodyClass || '')}">
<a class="skip" href="#main">${esc(o.t.ui.skipToContent)}</a>
${Header({ locale: o.locale, t: o.t, path: o.path, active: localePath(o.locale, o.path) })}
<main id="main">${o.children}</main>
${Footer({ locale: o.locale, t: o.t, path: o.path })}
<script src="${esc(asset('/scripts/main.js'))}" defer></script>
</body>
</html>`);
}
