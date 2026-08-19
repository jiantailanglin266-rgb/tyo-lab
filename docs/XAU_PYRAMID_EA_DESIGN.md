# XAU_PYRAMID EA design (Phase 15 §30–50, §114–120)

`mql5/Experts/TYO/TYO_XAU_Pyramid.mq5` + shared includes (all new, no
existing EA touched):

| Include | Responsibility |
|---|---|
| TYO/DemonTrend.mqh | audited family trend logic, parameterised (§5) |
| TYO/SessionFilter.mqh | ASIA/LONDON/NY/OVERLAP windows, rollover pause, late-Friday cutoff (§41, §45–46) |
| TYO/VolatilityFilter.mqh | ATR, relATR band, absolute + spread/ATR gates (§42–43) |
| TYO/RiskEngine.mqh | lot modes, level sizing (CONSTANT/DECREASING/INCREASING_CAPPED), basket-risk cap, daily loss stop (§37–39) |
| TYO/PyramidEngine.mqh | winner-only ladder state; no averaging-down code path exists (§34); re-entry delay (§47) |

## Flow

DEMON trend (M15) → gates (session/vol/spread/daily-loss) → M5 closed-bar
entry engine (PULLBACK / BREAKOUT / MICRO_BREAKOUT / MOMENTUM, each
switchable — §32) → initial entry with HARD ATR stop (§39: no-SL is
impossible) → tick-based pyramid adds at entry + level·(ATR×step), profit
direction only, level-capped, basket-risk-checked → ATR trailing + DEMON
reversal basket exit (§40).

## Engineering rules honoured

- **Symbol independence** (§116–118): everything from the chart symbol's
  point/tick/volume spec; gold pips via the family convention; broker
  suffixes inherent.
- **Netting/hedging** (§119): positions enumerated by magic+symbol; on
  netting the basket is the merged position.
- **Performance** (§120): all indicator handles created once in OnInit;
  entries bar-gated; the per-tick path is ladder/trail arithmetic only.
- **Restart-safe**: basket state rebuilt from open positions on init.
- **§50 attribution**: order comments `XP L<n>` let deal-list analysis
  split profit by pyramid level.
- **News filter** (§44): MT5 economic-calendar access is not available to
  the tester deterministically, so no news filter is implemented — nothing
  fabricated; sessions/spread gates carry that load for now.
- **Shadow readiness** (§88): decision logic lives in the includes and the
  EA's execution surface is thin (Buy/Sell/Modify/Close), mirroring the
  NEXUS_Shadow adaptation pattern; an XAU_PYRAMID_Shadow build follows the
  Phase 13.5 recipe once a candidate exists.

Compiled: 0 errors, 0 warnings (MetaEditor CLI, combined include tree with
the standard library).
