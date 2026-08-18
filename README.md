# TYO — Algorithmic Trading Lab

Multilingual brand + product site for TYO. English-first, seven locales, six
cinematic video slots on the home page, documented EA catalogue and research
lab underneath.

Zero runtime dependencies. `node build.mjs` renders the whole site to `dist/`
in well under a second.

```bash
npm run assets     # generate placeholder logo / posters / OG (skips existing files)
npm run build      # render dist/
npm run check      # link + head-tag integrity check, exits non-zero on failure
npm run serve      # preview dist/ at http://localhost:4321
npm run dev        # build + serve
npm run release    # build + check (use this in CI)
```

Node 18+ required. No `node_modules`.

---

## 1. Where things live

```
site.config.mjs ......... everything an operator changes: locales, stats,
                          video slots, links, community map points, flags
build.mjs ............... the generator
src/
  i18n/<locale>.mjs ..... UI + marketing copy, one file per language
  data/ea.mjs ........... Expert Advisor catalogue
  data/lab.mjs .......... Backtest Lab articles
  data/history.mjs ...... development stages + dated milestones
  lib/ .................. html escaping, i18n merge, url/routes, fonts,
                          SEO helpers, world-map rasteriser
  components/ ........... layout (header/menu/language/footer/disclaimers),
                          media (video slots + embeds), sections, EA blocks
  pages/ ................ one module per page type
public/ ................. copied verbatim into dist/
  styles/main.css ....... the entire design system
  scripts/main.js ....... the entire runtime
  assets/videos/ ........ ← drop your six films here
  assets/posters/ ....... poster frames (SVG placeholders generated)
  assets/logo/ .......... logo, mark, favicon, touch icon
tools/
  make-placeholders.mjs . generates stand-in brand + poster assets
  check.mjs ............. post-build integrity check
  serve.mjs ............. local preview server
```

---

## 2. URL structure

Every page is locale-prefixed. `/` is a `noindex` redirect that reads
`navigator.languages` (and a remembered choice in `localStorage`) and sends the
visitor to their language, falling back to `/en/`.

```
/                          language redirect
/<loc>/                    home
/<loc>/ea/                 EA index
/<loc>/ea/<slug>/          EA detail
/<loc>/history/            development timeline
/<loc>/technology/         technology & method
/<loc>/lab/                backtest lab index
/<loc>/lab/<slug>/         research article
/<loc>/about/              about + philosophy
/<loc>/contact/            contact + MQL5
/404.html
/sitemap.xml  /robots.txt
```

`<loc>` = `en ja zh th id vi hi`. English is the default and the `x-default`
hreflang target.

---

## 3. Adding a language

1. Add a row to `LOCALES` in `src/site.config.mjs`
   (`code`, `hreflang`, `htmlLang`, `label`, `short`, `native`, `fonts`, `dir`).
   `fonts` picks the webfont bundle in `src/lib/fonts.mjs` —
   `latin | jp | sc | kr | thai | devanagari`.
2. Create `src/i18n/<code>.mjs` exporting a partial object.
3. Rebuild.

Every locale is **deep-merged over `en.mjs`**, so a half-finished translation is
safe to ship — untranslated keys render in English rather than breaking. Korean,
Spanish and Portuguese are pre-configured in `PLANNED_LOCALES`; move a row into
`LOCALES` when its dictionary exists.

Each page downloads **only** the font bundle for its own script, so an English
page never pays for the CJK or Devanagari faces.

**Copy that stays in English in every locale** (brand typography, not body
copy): the hero tagline lines, `Test. Break. Improve. Repeat.`, the technology
word wall, the final card, and the `No Magic. / Only Logic.` philosophy lists.
Override those keys in a locale file if you ever want them translated.

---

## 4. Adding an Expert Advisor

Edit `src/data/ea.mjs`. Copy the `ea-template` block, then:

| field | notes |
|---|---|
| `slug` | becomes `/ <loc>/ea/<slug>/` |
| `status` | `released` \| `upcoming` (listed, badged) \| `draft` (excluded from the build) |
| `spec.*` | any field left `null` is simply not rendered |
| `mql5Url` | empty string hides every MQL5 CTA |
| `backtests[]` | see below |
| `parameters[]` | `descKey` points into `i18n.<loc>.params` |
| `versions[]` | `changeKey` points into `i18n.<loc>.versionNotes` |
| `timeline[]` | `stage` matches an id in `src/data/history.mjs`, `key` points into `i18n.<loc>.timelineNotes` |
| `i18n.en` | required. Other locales optional — they fall back to English. |
| `placeholder` | leave `true` while the copy is a draft |

Adding a locale to `i18n` is additive: `i18n.ja` overrides English for Japanese
visitors, everyone else keeps reading English.

### Backtests

```js
backtests: [{
  id: 'bt-2019-2024',
  label: '2019–2024, USDJPY M15',
  period: '2019.01.01 – 2024.12.31',
  initialDeposit: 'USD 10,000',
  netProfit: null,          // ← null metrics are not rendered at all
  maxDrawdown: '18.4 %',
  conditions: {
    broker: 'ICMarkets-Live',
    spread: 'Variable, real ticks',
    commission: 'USD 7 / lot round turn',
    modeling: 'Every tick based on real ticks',
    dataSource: 'Broker tick history',
    quality: '99.9 %',
  },
  report: '/assets/reports/grandslam-2019-2024.html',   // optional
}]
```

A backtest with **no** populated metrics renders an explicit
*"Data pending publication"* panel instead of an empty table — the site never
invents a number. The backtest disclaimer is attached automatically wherever
metrics appear.

### Backtest video

```js
video: { type: 'youtube', id: 'XXXXXXXXXXX' }          // click-to-load facade
video: { type: 'file', src: '/assets/videos/gs-bt.mp4', poster: '/assets/posters/gs-bt.jpg' }
video: { type: null }                                   // section hidden
```

YouTube loads through `youtube-nocookie.com` and only after the visitor clicks,
so no third-party script runs on page load.

---

## 5. Adding a Backtest Lab article

Edit `src/data/lab.mjs`. The body is a block array so it can be extended
without touching templates:

```js
body: [
  { p: 'paragraph' },
  { h: 'sub-heading' },
  { list: ['bullet', 'bullet'] },
  { note: 'highlighted caveat' },
  { table: { head: ['A','B'], rows: [['1','2']] } },
  { image: { src: '/assets/images/x.png', alt: '', caption: '' } },
]
```

`type` must be one of the keys under `lab.types` in the i18n files:
`backtestReport`, `optimization`, `parameterStudy`, `marketResearch`,
`comparison`, `versionTest`. Set `metrics` with the same shape as an EA
backtest to get the metrics panel; `status: 'draft'` keeps it unbuilt.

---

## 6. The six home-page videos

| slot | file base name | where it appears |
|---|---|---|
| 01 | `VIDEO_01_HERO` | hero, full screen — the only priority-loaded video |
| 02 | `VIDEO_02_AI` | AI Accelerated Development (also on /technology/) |
| 03 | `VIDEO_03_ALGORITHM` | From Idea to Algorithm (also on /history/) |
| 04 | `VIDEO_04_BACKTEST` | Test. Break. Improve. Repeat. (also on /technology/, /lab/) |
| 05 | `VIDEO_05_GLOBAL` | Built in Japan (also on /about/) |
| 06 | `VIDEO_06_FINAL` | closing card (also on /about/) |

Drop files into `public/assets/videos/` using these names:

```
VIDEO_01_HERO.webm          desktop, preferred
VIDEO_01_HERO.mp4           desktop, fallback
VIDEO_01_HERO-mobile.webm   optional, used under 768px
VIDEO_01_HERO-mobile.mp4    optional
```

and a poster at `public/assets/posters/VIDEO_01_HERO.svg` (or swap the
extension in `site.config.mjs` for a JPG frame export).

**The build detects which slots have files.** A slot with no encoded file
renders its poster plus the live particle field instead — no `<video>` element,
no failing request, and the section still looks finished. That is why the site
is presentable today with zero footage.

Loading strategy: the hero has its sources inline with `preload="metadata"`;
every other slot has empty `<video>` tags whose sources are attached by
`IntersectionObserver` when the section approaches. Videos pause when scrolled
out of view and when the tab is hidden. Under `prefers-reduced-motion` nothing
autoplays at all.

---

## 7. Trust numbers

`STATS` in `src/site.config.mjs`:

```js
{ key: 'downloads', value: 5000, suffix: '+', show: true }
```

Change `value` and rebuild — the counter animates to the new figure and
formats per locale. Anything with `show: false` or `value: null` **never
reaches the DOM**, which is why `countries`, `releases`, `backtests` and
`years` are currently absent rather than showing a guess. Turn one on the day
you can evidence it.

---

## 8. Compliance posture

This is a regulated-adjacent product, so the constraints are enforced in code
rather than left to editorial discipline:

- Null metrics are unrenderable; there is no placeholder-number path.
- Every page showing performance data carries the backtest disclaimer.
- The full risk disclosure sits in the footer of every page, in every language.
- EA detail pages repeat the full disclosure in a dedicated section.
- The AI sections state explicitly that AI is not used to predict prices.
- The quantum/probability language is framed as design philosophy, never as
  physical prediction.
- `npm run build` prints a launch checklist for any entry still flagged
  `placeholder: true`, and those pages carry a visible PLACEHOLDER notice.

Language never used anywhere in the copy: guaranteed profit, 100% win, risk
free, AI predicts markets, passive income.

---

## 9. Performance & accessibility

- One 60 KB stylesheet, one 20 KB script, no framework, no third-party JS.
- Fonts load per script via `media="print"` swap with a `<noscript>` fallback.
- All canvases (particle fields, world map) idle when off-screen or when the
  tab is hidden, and do not start at all under `prefers-reduced-motion`.
- The world map is a build-time-rasterised 3 KB base64 landmask painted as
  dots — no map tiles, no geo library.
- Content never depends on JavaScript: reveal animations are scoped to a `.js`
  class set by an inline head script, so if scripting fails everything renders
  visible instead of staying hidden.
- Skip link, single `h1` per page, `aria-current`, focus-visible rings,
  labelled form fields, `alt` on every image, breadcrumbs on detail pages.
- `Escape` closes the menu and the language dropdown; the language dropdown is
  a `<details>` element and works without JS.
- Verified with no horizontal overflow at 320 / 360 / 375 / 390 / 430 px.

---

## 10. SEO

- Per-locale `title`, `description`, canonical, OG + Twitter cards.
- `hreflang` for all seven locales plus `x-default` on every page, and inside
  `sitemap.xml` as `xhtml:link` alternates.
- JSON-LD: `Organization` + `WebSite` site-wide, plus `BreadcrumbList`,
  `ItemList`, `SoftwareApplication` (EA pages) and `Article` (lab pages).
- `robots.txt` points at the sitemap. The root redirect and 404 are `noindex`.

Set the real origin before deploying — `SITE_URL` in `src/site.config.mjs` or
as an environment variable. It drives canonical, hreflang, OGP and the sitemap.

---

## 11. Deploying

Any static host. `dist/` is the publish directory.

- **Netlify / Cloudflare Pages** — `netlify.toml` is included; `public/_headers`
  carries the cache and security headers. `dist/404.html` is picked up
  automatically.
- **Vercel / S3 + CloudFront / Xserver** — upload `dist/`. Make sure the host
  serves `foo/index.html` for `foo/` and `404.html` for misses.
- **Sub-path hosting** — set `BASE_PATH` in `src/site.config.mjs`.

Filenames are not content-hashed, so `_headers` keeps CSS/JS on a short cache.
If you later add fingerprinting, raise those windows.

---

## 12. Assets to replace

Everything below is a generated stand-in. Replace at the same path, no code
change needed.

| path | what it is |
|---|---|
| `public/assets/logo/tyo-logo.svg` | full rainbow wordmark (footer) |
| `public/assets/logo/tyo-mark.svg` | compact mark (header) |
| `public/assets/logo/favicon.svg` | favicon |
| `public/assets/logo/apple-touch-icon.png` | 180×180 touch icon |
| `public/assets/og/og-default.png` | 1200×630 social card |
| `public/assets/posters/VIDEO_0*.svg` | six poster frames |
| `public/assets/videos/` | the six films (empty today) |

`npm run assets` regenerates the placeholders but **never overwrites an
existing file** — pass `--force` if you actually want that.
