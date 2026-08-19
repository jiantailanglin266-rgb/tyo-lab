# EA_SITE_AUDIT

Audit of the TYO LAB site as it stands before the EA-section upgrade.
Live: <https://jiantailanglin266-rgb.github.io/tyo-lab/>

---

## 1. Stack and build

| | |
|---|---|
| Framework | **None.** Custom static site generator, `build.mjs`, zero runtime deps |
| Language | Plain ESM JavaScript (`.mjs`). No TypeScript, no JSX, no bundler |
| Templating | Tagged-template `html\`\`` in `src/lib/html.mjs`, auto-escaping |
| Output | `dist/` — 156 HTML files, built in ~0.7 s |
| Hosting | GitHub Pages via `.github/workflows/deploy.yml`; `SITE_URL` / `BASE_PATH` derived from the repo |
| Gate | `tools/check.mjs` fails the build on a broken internal link or a missing head tag |
| Client JS | One 780-line file, no libraries |
| CSS | One 3,561-line file, no framework |

**Consequence for this project:** there is no `npm install`, no lint config and no
typecheck to run. "Tests" in this repo means `node build.mjs && node tools/check.mjs`.
Any new dependency would be the first one — the performance brief argues against it.

## 2. Routing

All pages are locale-prefixed. Routes live in one table, `ROUTES` in `src/lib/url.mjs`.

```
/                        language redirect (noindex)
/<loc>/                  home
/<loc>/ea/               EA index
/<loc>/ea/<slug>/        EA detail          ← target of this project
/<loc>/history/          development timeline
/<loc>/technology/       technology & method
/<loc>/lab/              Backtest Lab index
/<loc>/lab/<slug>/       research article
/<loc>/about/  /contact/
/404.html  /sitemap.xml  /robots.txt
```

`<loc>` = `en ja zh th id vi hi`. Adding a page = one row in `ROUTES` + one
module in `src/pages/` + one `emit()` in `build.mjs`. **Adding routes is cheap
and does not disturb existing URLs.**

## 3. Where EA content lives

| Concern | File |
|---|---|
| EA catalogue | `src/data/ea.mjs` — 14 entries built by a `make()` helper |
| Detail page template | `src/pages/ea-detail.mjs` |
| Index page | `src/pages/ea-index.mjs` |
| Card, spec table, metrics, params, versions, timeline | `src/components/ea.mjs` |
| Backtest figures (generated) | `tools/imported-reports.json` ← `tools/import-reports.mjs` |
| Trade-level data (generated) | `tools/extracted-trades.json` ← `tools/extract-trades.mjs` |
| Cover art | `public/assets/images/ea/<slug>.jpg` — auto-detected by `build.mjs` |
| Equity curve image | `public/assets/images/backtest/<slug>.{png,gif}` — auto-copied |
| EA video | `public/assets/videos/ea/<slug>.mp4` + poster |
| All UI strings | `src/i18n/<loc>.mjs`, deep-merged over `en.mjs` |

`build.mjs` merges the generated JSON onto the catalogue at build time, with
**hand-written values in `ea.mjs` always winning**. That merge point is the
natural place to hang everything this project adds.

## 4. The 14 systems

| # | slug | Symbol | TF | Source dialect | Cover | Video | Report |
|---|---|---|---|---|---|---|---|
| 01 | joker | XAUUSD | M5 | MT5 | ✓ | — | ✓ |
| 02 | jayro | GBPUSD / USDJPY | M5 | MT4 | ✓ | ✓ | ✓ |
| 03 | grandslam | BTCUSD | M5 | MT5 | ✓ | — | ✓ |
| 04 | godspeed | GBPJPY | M5 | MT4 | ✓ | — | ✓ |
| 05 | galoa | USDJPY | M5 | MT4 | ✓ | ✓ | ✓ |
| 06 | cosmos | BTCUSD | M5 | MT5 | ✓ | — | ✓ |
| 07 | kokomo | EURUSD | M5 | MT4 | ✓ | — | ✓ |
| 08 | metro | GBPUSD | M5 | MT4 | ✓ | — | ✓ |
| 09 | mirumo | USDJPY | M5 | MT4 | ✓ | — | ✓ |
| 10 | sena | GOLD | M5 | MT4 | ✓ | — | ✓ |
| 11 | rina | GOLD | M5 | MT4 | ✓ | — | ✓ |
| 12 | nexus | BTCUSD | M5 | MT5 | ✓ | ✓ | ✓ |
| 13 | evergreen | EURJPY | M5 | MT4 | ✓ | — | ✓ |
| 14 | supremacy | BTCUSD | M5 | MT5 | ✓ | — | ✓ |

5 MT5 reports, 9 MT4 (Japanese, Shift-JIS). Every system has a tester report
and cover art. **Nothing is missing on the data-source side.**

## 5. What the reports actually contain

This is the finding that decides the whole project. The tester reports are not
just a summary — they carry the **complete deal list**, and it parses.

Verified across all 14 (`tools/extract-trades.mjs`):

| Derivable now, from real trades | Coverage |
|---|---|
| Balance curve as data (downsampled to ~400 points) | 14/14 |
| Monthly returns, % of month-start balance | 14/14 — up to **263 months** |
| Yearly return / trades / win rate | 14/14 — up to **24 years** |
| Long vs short split | 14/14 (MT4 recovered by joining order numbers) |
| Average win / average loss / payoff ratio | 14/14 |
| Largest win / largest loss | 14/14 |
| Max consecutive wins / losses | 14/14 |
| Balance-basis drawdown incl. worst window + recovery date | 14/14 |
| Max concurrent positions, stacked entries, stop-loss share | 14/14 |

**Cross-validation:** extracted balance drawdown matches the figure the report
prints in its own header (cosmos 8.50 % / 8.5 %, supremacy 12.44 % / 12.44 %).
The extractor is reading the same trades the tester counted.

Header-only figures already imported: Profit Factor, equity drawdown, trades,
win rate, expected payoff, Sharpe, recovery factor, broker, spread, modelling
quality, tick/bar counts, full input list.

## 6. Known data problems

### 6.1 Account currency is absent from MT4 reports
Nine systems (`jayro godspeed galoa kokomo metro mirumo sena rina evergreen`)
have money figures with no stated unit. The site already **suppresses** those
rather than guessing — percentages, ratios and counts still publish. Fixable
in one line per EA (`CURRENCY` in `tools/import-reports.mjs`) once the owner
confirms the deposit currency.

### 6.2 MT5 Sharpe is per-trade, not annualised
Reported values include `nexus 30.58` and `joker 9.25`. Those are not
comparable to an industry Sharpe and would mislead anyone reading them as one.
**They must not feed a score, and should carry a definition on the page.**

### 6.3 Drawdown basis differs by dialect
MT5 reports equity drawdown (includes open positions); MT4 only balance
drawdown (closed trades only). For systems that hold losers the two differ a
lot — supremacy is 12 % on balance and 49 % on equity. The site already labels
which basis it is showing. **Cross-EA ranking must not mix the two silently.**

### 6.4 Test periods are wildly unequal
2 years (jayro) to 24 years (six MT4 systems). Any ranking that ignores sample
size will put a 2-year run above a 24-year one.

## 7. Content gaps

Measured against `src/data/ea.mjs`:

```
placeholder: true        14 / 14   ← every system still flagged
tagline / overview /
concept / strategy /
logic / riskManagement /
environment (empty)      14 / 14   ← no prose exists for any EA
mql5Url set               0 / 14
spec.risk set             1 / 14   (jayro only)
spec.version set          0 / 14
spec.releaseDate set      0 / 14
spec.price set            0 / 14
versions[] / timeline[]   0 / 14
i18n locales per entry    en only
```

Detail pages therefore render: hero, spec rail, backtest metrics, equity-curve
image, parameters, download CTA, disclaimer — and skip every prose section,
because empty sections are not rendered. Nothing is broken; it is thin.

## 8. Technical issues found

| | Severity | Note |
|---|---|---|
| Every EA carries a visible `PLACEHOLDER` notice | **P0** | Ships to production today |
| `ea.mjs` `make()` helper mutates and re-assigns `spec`/`i18n` | P2 | Works, but the two-step construction is easy to misread |
| No per-EA `og:image` for social sharing | Fixed | Already wired to cover art |
| Parameters have no descriptions | P1 | `descKey` exists but no dictionary is populated |
| Risk characteristics not modelled at all | **P0** | Nothing distinguishes a martingale system from a stop-loss one |
| Score / comparison / filter | **P0** | Do not exist |
| No trade-level data on the page | P1 | Now extractable — §5 |

## 9. UI issues

- Index cards are one flat grid: no filter, no sort, no search, no compare.
- Detail page is a single column of prose blocks; with no prose it reads sparse.
- Metrics render as a flat 4-column grid with no grouping or hierarchy.
- Equity curve is a **raster image** inverted with a CSS filter — it cannot be
  responsive, zoomed, or read by assistive tech. Replaceable now that the
  curve exists as data.
- Nothing communicates *research status* (live / research / experimental).

## 10. SEO status

Already correct and must not regress:

- Per-page `title`, `description`, canonical, OG + Twitter, per-EA OG image.
- `hreflang` for all 7 locales + `x-default`, on every page and in `sitemap.xml`.
- JSON-LD: `Organization`, `WebSite`, `BreadcrumbList`, `ItemList`,
  `SoftwareApplication` (EA pages), `Article` (lab pages).
- `tools/check.mjs` fails the build if any of that goes missing.

Gaps: EA titles are generic (`GRANDSLAM — Expert Advisors | TYO`) and carry no
market or strategy keyword; no `Dataset`/`FAQPage` structured data; descriptions
fall back to a shared string because no per-EA prose exists.

## 11. Design system (must be preserved)

- Tokens in `:root`: `--bg`, `--fg-1..4`, `--line`, `--s-red…--s-violet`, `--spectrum`.
- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (data/labels),
  plus one Noto face per non-Latin locale. **Do not add fonts.**
- Motion: reveal-on-scroll, number counters, quantum interference canvas,
  aurora + lattice decoration. All removed under `prefers-reduced-motion`.
- Rainbow is reserved for logo, particles, glow, data highlights — never UI chrome.

## 12. Priority

| Phase | Item | Why |
|---|---|---|
| **P0** | EA master data as single source of truth | Everything else depends on it |
| **P0** | Remove `PLACEHOLDER` from production | Currently visible to every visitor |
| **P0** | Risk profile from observed trade behaviour | The most important thing a visitor needs and it is entirely absent |
| **P0** | Detail page 2.0 with the new sections | Turns thin pages into documentation |
| **P0** | Real performance sections (monthly, yearly, streaks, DD) | Data already exists; not showing it is the biggest waste |
| P0 | TYO SCORE | Needs the data layer first |
| P0 | Compare / filter / sort | Index becomes a database |
| P1 | Backtest Lab 2.0 | Cross-EA analysis |
| P1 | AI × MCP Lab | New page, no dependency on the above |
| P2 | Portfolio Lab | Needs correlation, which needs aligned monthly series (available) |

---

*Audit performed against commit `3308969`. No site behaviour was changed to
produce it; `tools/extract-trades.mjs` is read-only over the source reports.*
