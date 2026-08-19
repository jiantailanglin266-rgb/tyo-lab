# EA_CONTENT_GAPS

Everything on an EA page is in one of three states.

| State | Meaning | How it renders |
|---|---|---|
| **HAVE** | Derived from a tester report. Evidenced. | Normally |
| **DATA_REQUIRED** | Only the owner knows it. Not derivable, not guessable. | Section is omitted entirely |
| **SUPPRESSED** | Known but not publishable as-is (unit missing). | `—`, with the reason stated |

Nothing is ever invented to fill a gap. A section with no data does not render.

---

## 1. Placeholder audit

`grep -rn "placeholder: true" src/data/ea.mjs` → **14 / 14**.

Every published system carries `placeholder: true`, which puts a visible
`PLACEHOLDER — Sample content` notice on its live detail page today. There is
no lorem ipsum and no fake number anywhere; the flag exists because the prose
fields are empty strings, and empty sections are skipped.

**Action taken in Phase 1:** the flag is removed once a system's page is built
from evidenced data plus honest omissions. It no longer means "has fake
content" — it meant "has no content", and that is now fixed by the data layer.

## 2. Per-field status, all 14 systems

### HAVE — evidenced, no owner input needed

| Field | Source |
|---|---|
| Symbol, timeframe, test period | report header |
| Profit factor, expected payoff, recovery factor | report header |
| Max drawdown (+ basis) | report header |
| Total trades, win rate | report header |
| Broker/server, spread mode, modelling method, quality, tick & bar count | report header |
| Full input parameter list with defaults | report header |
| **Monthly return series** (up to 263 months) | deal list |
| **Yearly return / trades / win rate** (up to 24 years) | deal list |
| **Balance curve** as data | deal list |
| **Long vs short split** | deal list |
| **Average win / loss, payoff ratio** | deal list |
| **Largest win / largest loss** | deal list |
| **Max consecutive wins / losses** | deal list |
| **Worst drawdown window + recovery date** | deal list |
| **Max concurrent positions** | deal list |
| **Stacked entries** (opened while another was open) | deal list |
| **Stop-loss close share** | deal list |
| Cover art, equity-curve image | repo assets |

### DATA_REQUIRED — owner input only

| Field | Systems | Why it cannot be derived |
|---|---|---|
| `tagline` | 14/14 | Editorial |
| `overview`, `concept` | 14/14 | Intent behind the system |
| `strategy`, `logic` | 14/14 | The report shows *what happened*, never *why*. Inferring entry rules from trades would be a guess presented as fact |
| `riskManagement` prose | 14/14 | Design intent |
| `environment` | 14/14 | Recommended broker/deposit/leverage |
| `mql5Url` | 14/14 | Product URLs |
| `spec.version`, `spec.releaseDate` | 14/14 | Release facts |
| `spec.price` (free / paid) | 14/14 | Commercial |
| `versions[]` | 14/14 | Change history |
| `timeline[]` (development story) | 14/14 | STEP 12 — why it was built, what it solves, how it evolved |
| Declared martingale / grid / averaging | 14/14 | See §4 — *observed* behaviour is published instead |
| Market-condition suitability (STEP 3) | 14/14 | See §5 |
| Parameter descriptions + risk impact | 14/14 | Only the developer knows what each input does |
| Account currency | 9 MT4 systems | See §3 |
| Live / forward-test results | 14/14 | None supplied. Not fabricated |

### SUPPRESSED — known, not publishable

| Field | Systems | Reason |
|---|---|---|
| Initial deposit, net profit, expected payoff, absolute drawdown | jayro, godspeed, galoa, kokomo, metro, mirumo, sena, rina, evergreen | MT4 reports state no account currency. "3,000,000" means very different things in JPY and USD, so the amount is withheld while every percentage and ratio still publishes |

## 3. Account currency — the single cheapest unblock

Nine systems would gain deposit, net profit, expected payoff and absolute
drawdown from **one line each**:

```js
// tools/import-reports.mjs
const CURRENCY = {
  kokomo: 'JPY',   // ← owner confirms, then: npm run import -- <folder>
};
```

Evidence available in the reports: server `XMTrading-Real 37`, deposits of
3,000,000 and 200,000, profits in the tens of millions. That is *consistent*
with JPY but is not proof, so nothing is assumed.

## 4. Risk characteristics — observed, not declared

STEP 10 asks for martingale / grid / averaging / position scaling / stop loss /
max positions. The owner has not declared these. Rather than leave the most
safety-relevant section blank, Phase 1 publishes what the **trade record
demonstrably shows**, under an explicit "Observed in backtest" label:

| Published | Derived from |
|---|---|
| Max concurrent positions | counting open/close events |
| Position stacking | entries opened while another was live |
| Stop-loss usage share | share of closes marked `s/l` |
| Worst losing streak | consecutive negative trades |
| Loss-side concentration | largest loss vs average loss |

A declared-behaviour block (`riskCharacteristics` in the master data) sits
alongside it and stays `DATA_REQUIRED` until the owner fills it in. The page
never claims a system *is not* a martingale — only what the record shows.

## 5. Market conditions (STEP 3)

Trending / range / high-vol / low-vol / news / session suitability is
**not published**. It is derivable in principle by joining trade timestamps to
a market-regime classification, but that classification does not exist in this
repo, and a hand-assigned GOOD/NEUTRAL/BAD grid would be an opinion formatted
as data. Session-of-day distribution *is* derivable from timestamps and is a
candidate for Phase 3; regime labelling needs owner input or a documented
methodology first.

## 6. What the owner needs to supply

Ranked by how much page they unlock:

1. **Prose per EA** — tagline, overview, concept, strategy, logic, risk
   management, environment (7 fields × 14). Unlocks sections 01, 02, 10, 12.
2. **MQL5 URLs** — restores every download CTA across the site.
3. **Account currency** for the 9 MT4 systems — one word each.
4. **Version + release date + free/paid** per EA.
5. **Parameter descriptions** — the highest-effort, highest-credibility item.
6. **Development story** per EA — why built, what problem, how it evolved.
7. **Declared risk characteristics** — martingale / grid / averaging yes-no.
8. Forward or live results, if any exist.

Items 2–4 and 7 are short and unlock a disproportionate amount of page.
Items 1, 5 and 6 are writing work.

---

*Compiled from `src/data/ea.mjs`, `tools/imported-reports.json` and
`tools/extracted-trades.json` at commit `3308969`.*
