# AI_MCP_LAB_ARCHITECTURE

The `/​<loc>/ai-lab/` page: what it claims, why each claim is permitted, and
how the status system keeps it honest.

---

## 1. The honesty contract

The page's credibility rests on one rule, stated in its hero as a "status
legend": **every capability carries a research status, and only things TYO
does daily are marked Live.**

| Status | Meaning | Rendered as |
|---|---|---|
| `live` | In daily use at TYO today | green badge |
| `experimental` | Built and being tried; may change or be dropped | violet badge |
| `research` | Being explored; nothing usable exists yet | cyan badge |
| `development` | Being built toward a defined target | orange badge (reserved) |
| `archived` | Abandoned, kept for the record | grey badge (reserved) |

The badge component is shared with the EA pages (`StatusBadge` in
`src/components/ea-analytics.mjs`), so the vocabulary is identical everywhere.

## 2. Why each Live claim is permitted

A capability may only be marked Live if it is checkable against something
real. Current justifications:

| Capability | Evidence |
|---|---|
| Research | The owner's own development process (stated in the original brand brief) |
| Development assistance | Same |
| **Backtest analysis** | Checkable against this repository: `tools/import-reports.mjs` and `tools/extract-trades.mjs` parse full tester reports — every trade, three dialects — and every analytics section on the site is generated from that output |
| EA comparison | Checkable against the site: `/ea/compare/`, the lab rankings and the risk/return map are cross-system AI-era tooling built in this codebase |

Everything MCP-related is `experimental` or `research`, because no MCP × MT5
bridge ships in this repository. If that changes, the status changes — not
the other way around.

## 3. Forbidden claims (enforced by copy review)

- "AI predicts markets" — the page states the opposite, twice (roles warning
  + MCP honesty note).
- "AI guarantees results" — same.
- Any Research/Experimental item described in the present tense as a product.
- Any user counts, live results, or Monte Carlo output — none exist.

## 4. Page anatomy

```
HERO          AI × MT5 × MCP (spectrum-clipped terms) + status legend
01 arch       8-stage flow: MT5 → MCP → AI layer → analyses → candidate strategy
02 loop       8-stage flow: idea → EA → compile → backtest → AI analysis →
              hypothesis → candidate → validation
03 roles      6 capabilities, each with a status badge; AI-not-a-forecaster warning
04 mcp        bridge diagram (Agent ⇅ MCP ⇅ MT5) + 4 exploration items + honesty note
CTA           EAs / Backtest Lab
```

Diagrams are plain markup styled by CSS — a labelled pipeline does not need
SVG, and as list items the flow reads correctly in a screen reader and in a
search snippet. The connector pulse is transform-only and removed under
`prefers-reduced-motion` with the rest of the site's motion.

## 5. Wiring

- Route: `aiLab: () => '/ai-lab/'` in `src/lib/url.mjs`
- Nav: item 05 in `navItems()` (`src/components/layout.mjs`); menu renumbered 01–08
- Strings: top-level `aiLab:` block in every `src/i18n/<loc>.mjs`; `nav.aiLab`
- Emit + sitemap: `build.mjs` (priority 0.7)

## 6. Extending

To add a capability: add `{ k, v, status }` to `aiLab.roles.items` or
`aiLab.mcp.items` in `en.mjs` (translations optional — English falls through).
To promote a status, change the string. Nothing else moves.
