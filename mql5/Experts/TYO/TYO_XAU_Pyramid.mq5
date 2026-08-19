//+------------------------------------------------------------------+
//|                                            TYO_XAU_Pyramid.mq5   |
//| TYO XAU PYRAMID — evidence-by-design research EA (Phase 15)       |
//|                                                                    |
//| Architecture (§30):                                                |
//|   DEMON higher-TF trend (shared include, audited from JOKER/NEXUS)|
//|   → session / volatility / spread gates                           |
//|   → lower-TF entry engine (PULLBACK / BREAKOUT / MICRO / MOMENTUM)|
//|   → initial entry with HARD stop (§39)                            |
//|   → winner-only pyramid at ATR steps (§34–36)                     |
//|   → ATR trailing + DEMON-reversal basket exit (§40)               |
//|   → risk engine: basket-risk cap, daily loss stop (§37–39)        |
//|                                                                    |
//| Research governance: this EA is developed under RES-XAU-001 with  |
//| HOLD-XAU-001 SEALED (2026-01-01 → 2026-06-30). Research runs use  |
//| guard-generated configs only; the sealed period is refused.       |
//|                                                                    |
//| Symbol-independent (§116–118): everything derives from the chart  |
//| symbol's point/tick/volume specification. Level attribution for   |
//| §50 pyramid analysis rides in the order comment ("XP L<n>").      |
//+------------------------------------------------------------------+
#property copyright   "TYO EA LABS"
#property version     "1.00"
#property description "TYO XAU PYRAMID V0.1 - baseline (evidence-by-design research build)"
#property strict

#include <Trade/Trade.mqh>
#include <TYO/DemonTrend.mqh>
#include <TYO/SessionFilter.mqh>
#include <TYO/VolatilityFilter.mqh>
#include <TYO/RiskEngine.mqh>
#include <TYO/PyramidEngine.mqh>

//--- identity
input ulong  InpMagic              = 15150001;    // Magic number
input string InpVersionTag         = "XAU_PYRAMID_V001"; // strategy version (research log)

//--- timeframes (§31, §115)
input ENUM_TIMEFRAMES InpEntryTF   = PERIOD_M5;   // EntryTF
input ENUM_TIMEFRAMES InpTrendTF   = PERIOD_M15;  // TrendTF (DEMON)

//--- DEMON trend (audited defaults from the gold build, §5)
input int    InpTrendMAPeriod      = 50;          // DEMON MA period
input double InpTrendDiff1         = 40;          // DEMON diff1 (pips)
input double InpTrendDiff2         = 30;          // DEMON diff2 (pips)
input int    InpTrendHour          = 21;          // DEMON trend hour limit
input int    InpGMTShift           = 0;           // server-hour shift for clock rules

//--- entry engine (§32)
input bool   InpUsePullback        = true;        // PULLBACK entry
input bool   InpUseBreakout        = true;        // BREAKOUT entry
input bool   InpUseMicroBreakout   = false;       // MICRO_BREAKOUT entry
input bool   InpUseMomentum        = false;       // MOMENTUM entry
input int    InpPullbackEMA        = 20;          // pullback EMA period
input int    InpBreakoutBars       = 20;          // breakout lookback (bars)
input int    InpMicroBreakoutBars  = 5;           // micro-breakout lookback
input double InpMomentumATR        = 1.2;         // momentum move ≥ ATR × this

//--- volatility / spread (§42–43)
input int    InpATRPeriod          = 14;          // ATRPeriod (entry TF)
input ENUM_TIMEFRAMES InpATRLongTF = PERIOD_H4;   // long-term ATR TF
input int    InpATRLongPeriod     = 50;           // long-term ATR period
input double InpRelATRMin          = 0.6;         // RelativeATRMin (0=off)
input double InpRelATRMax          = 3.0;         // RelativeATRMax (0=off)
input double InpMaxSpreadPips      = 60;          // MaxSpread (pips, 0=off)
input double InpMaxSpreadATR       = 0.25;        // Max spread/ATR (0=off)

//--- sessions (§41, §45–46) — strategy-clock hours
input bool   InpSessionAsia        = false;       // ASIA
input bool   InpSessionLondon      = true;        // LONDON
input bool   InpSessionNY          = true;        // NEW_YORK
input bool   InpSessionOverlap     = true;        // OVERLAP
input int    InpAsiaFrom           = 0;
input int    InpAsiaTo             = 7;
input int    InpLondonFrom         = 7;
input int    InpLondonTo           = 12;
input int    InpOverlapFrom        = 12;
input int    InpOverlapTo          = 16;
input int    InpNYFrom             = 16;
input int    InpNYTo               = 21;
input bool   InpPauseRollover      = true;        // rollover pause (§45)
input int    InpRolloverFrom       = 23;
input int    InpRolloverTo         = 1;
input bool   InpBlockLateFriday    = true;        // late-Friday cutoff (§46)
input int    InpFridayCutoffHour   = 20;

//--- pyramid (§34–37)
input double InpPyramidATR         = 1.0;         // PyramidATR step multiplier
input int    InpMaxPyramidLevels   = 4;           // MaxPyramidLevels
input ENUM_PYRAMID_SIZING InpPyramidSizing = PYR_CONSTANT; // level sizing (§37)
input double InpSizingFactor       = 1.0;         // sizing factor per level
input double InpSizingCapLots      = 1.0;         // hard cap for increasing mode

//--- risk (§37–39, §115)
input ENUM_LOT_MODE InpLotMode     = LOT_CONSTANT; // LotMode
input double InpLots               = 0.10;        // base lots (CONSTANT)
input double InpRiskPercent        = 0.25;        // RiskPercent (RISK_PERCENT)
input double InpSL_ATR             = 2.0;         // SL_ATR (hard stop, §39)
input double InpTrail_ATR          = 1.5;         // Trail_ATR
input double InpMaxBasketRisk      = 3.0;         // MaxBasketRisk (% equity)
input double InpDailyLossLimit     = 5.0;         // DailyLossLimit (% equity, 0=off)
input int    InpMaxPositions       = 10;          // MaxPositions (per magic)
input int    InpReentryDelay       = 3;           // ReentryDelay (entry-TF bars)

CTrade            g_trade;
CDemonTrend       g_trend;
CSessionFilter    g_session;
CVolatilityFilter g_vol;
CRiskEngine       g_risk;
CPyramidEngine    g_pyr;
int               g_emaHandle = INVALID_HANDLE;
datetime          g_lastEntryBar = 0;

//+------------------------------------------------------------------+
int OnInit()
  {
   g_trade.SetExpertMagicNumber(InpMagic);
   g_trade.SetTypeFillingBySymbol(_Symbol);

   if(!g_trend.Init(_Symbol, InpTrendTF, InpTrendMAPeriod, InpTrendDiff1, InpTrendDiff2, InpTrendHour, InpGMTShift))
      return INIT_FAILED;
   if(!g_vol.Init(_Symbol, InpEntryTF, InpATRPeriod, InpATRLongTF, InpATRLongPeriod,
                  InpRelATRMin, InpRelATRMax, InpMaxSpreadPips, InpMaxSpreadATR))
      return INIT_FAILED;
   g_session.Init(InpSessionAsia, InpSessionLondon, InpSessionNY, InpSessionOverlap,
                  InpAsiaFrom, InpAsiaTo, InpLondonFrom, InpLondonTo,
                  InpNYFrom, InpNYTo, InpOverlapFrom, InpOverlapTo,
                  InpPauseRollover, InpRolloverFrom, InpRolloverTo,
                  InpBlockLateFriday, InpFridayCutoffHour, InpGMTShift);
   g_risk.Init(_Symbol, InpLotMode, InpLots, InpRiskPercent, InpMaxBasketRisk, InpDailyLossLimit);
   g_pyr.Init(InpMaxPyramidLevels);

   g_emaHandle = iMA(_Symbol, InpEntryTF, InpPullbackEMA, 0, MODE_EMA, PRICE_CLOSE);
   if(g_emaHandle == INVALID_HANDLE) return INIT_FAILED;

   RebuildBasketState(); // restart-safe: derive level/dir from open positions
   return INIT_SUCCEEDED;
  }

void OnDeinit(const int reason)
  {
   g_trend.Release();
   g_vol.Release();
   if(g_emaHandle != INVALID_HANDLE) IndicatorRelease(g_emaHandle);
  }

//+------------------------------------------------------------------+
//| basket helpers (hedging AND netting compatible: enumerate by      |
//| magic+symbol — on netting the basket is one merged position §119) |
//+------------------------------------------------------------------+
int BasketCount()
  {
   int n = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagic) continue;
      n++;
     }
   return n;
  }

double BasketRiskMoney()
  {
   double risk = 0.0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagic) continue;
      double op = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl = PositionGetDouble(POSITION_SL);
      double vol = PositionGetDouble(POSITION_VOLUME);
      if(sl > 0.0) risk += g_risk.MoneyPerLot(MathAbs(op - sl)) * vol;
     }
   return risk;
  }

void RebuildBasketState()
  {
   int count = 0;
   int dir = 0;
   double lastOpen = 0.0;
   datetime lastTime = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagic) continue;
      count++;
      dir = ((ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? 1 : -1;
      datetime ot = (datetime)PositionGetInteger(POSITION_TIME);
      if(ot > lastTime) { lastTime = ot; lastOpen = PositionGetDouble(POSITION_PRICE_OPEN); }
     }
   if(count > 0)
     {
      double atr = g_vol.ATR();
      g_pyr.OnBasketOpen(dir, lastOpen, atr > 0 ? atr * InpPyramidATR : 0);
      for(int k = 1; k < count; k++) g_pyr.OnAdd(lastOpen);
     }
  }

void CloseBasket(const string reason)
  {
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagic) continue;
      g_trade.PositionClose(ticket);
     }
   g_pyr.OnBasketClosed(iTime(_Symbol, InpEntryTF, 0));
  }

//+------------------------------------------------------------------+
//| entry signal engine (§32): closed bars of the entry TF only       |
//+------------------------------------------------------------------+
int EntrySignal(const int trendDir)
  {
   double atr = g_vol.ATR();
   if(atr <= 0.0) return 0;

   double close1 = iClose(_Symbol, InpEntryTF, 1);
   double low1 = iLow(_Symbol, InpEntryTF, 1);
   double high1 = iHigh(_Symbol, InpEntryTF, 1);

   if(InpUsePullback)
     {
      double ema[];
      ArraySetAsSeries(ema, true);
      if(CopyBuffer(g_emaHandle, 0, 1, 1, ema) == 1)
        {
         if(trendDir > 0 && low1 <= ema[0] && close1 > ema[0]) return 1;   // dip to EMA, closed back above
         if(trendDir < 0 && high1 >= ema[0] && close1 < ema[0]) return -1;
        }
     }
   if(InpUseBreakout)
     {
      int hh = iHighest(_Symbol, InpEntryTF, MODE_HIGH, InpBreakoutBars, 2);
      int ll = iLowest(_Symbol, InpEntryTF, MODE_LOW, InpBreakoutBars, 2);
      if(hh >= 0 && trendDir > 0 && close1 > iHigh(_Symbol, InpEntryTF, hh)) return 1;
      if(ll >= 0 && trendDir < 0 && close1 < iLow(_Symbol, InpEntryTF, ll)) return -1;
     }
   if(InpUseMicroBreakout)
     {
      int hh = iHighest(_Symbol, InpEntryTF, MODE_HIGH, InpMicroBreakoutBars, 2);
      int ll = iLowest(_Symbol, InpEntryTF, MODE_LOW, InpMicroBreakoutBars, 2);
      if(hh >= 0 && trendDir > 0 && close1 > iHigh(_Symbol, InpEntryTF, hh)) return 1;
      if(ll >= 0 && trendDir < 0 && close1 < iLow(_Symbol, InpEntryTF, ll)) return -1;
     }
   if(InpUseMomentum)
     {
      double close3 = iClose(_Symbol, InpEntryTF, 3);
      if(trendDir > 0 && close1 - close3 >= atr * InpMomentumATR) return 1;
      if(trendDir < 0 && close3 - close1 >= atr * InpMomentumATR) return -1;
     }
   return 0;
  }

//+------------------------------------------------------------------+
//| order helpers — every entry ships with its hard stop (§39)        |
//+------------------------------------------------------------------+
bool OpenLevel(const int dir, const double lots, const double atr, const int level)
  {
   if(lots <= 0.0) return false;
   double price = dir > 0 ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl = dir > 0 ? price - atr * InpSL_ATR : price + atr * InpSL_ATR;
   sl = NormalizeDouble(sl, (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS));
   string comment = "XP L" + IntegerToString(level); // §50 level attribution
   bool ok = dir > 0
             ? g_trade.Buy(lots, _Symbol, 0.0, sl, 0.0, comment)
             : g_trade.Sell(lots, _Symbol, 0.0, sl, 0.0, comment);
   return ok;
  }

void TrailStops(const double atr)
  {
   if(atr <= 0.0 || InpTrail_ATR <= 0.0) return;
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagic) continue;

      ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);
      if(type == POSITION_TYPE_BUY)
        {
         double want = NormalizeDouble(bid - atr * InpTrail_ATR, digits);
         if(want > sl) g_trade.PositionModify(ticket, want, tp);
        }
      else
        {
         double want = NormalizeDouble(ask + atr * InpTrail_ATR, digits);
         if(sl == 0.0 || want < sl) g_trade.PositionModify(ticket, want, tp);
        }
     }
  }

//+------------------------------------------------------------------+
void OnTick()
  {
   ENUM_DEMON_TREND trend = g_trend.Update(_Symbol);
   double atr = g_vol.ATR();

   int open = BasketCount();
   if(open == 0 && !g_pyr.Flat()) g_pyr.OnBasketClosed(iTime(_Symbol, InpEntryTF, 0)); // SL took everything out

   //--- basket exit on DEMON reversal (§40)
   if(open > 0)
     {
      if((g_pyr.Dir() > 0 && trend == DEMON_DOWN) || (g_pyr.Dir() < 0 && trend == DEMON_UP))
        {
         CloseBasket("DEMON_REVERSAL");
         return;
        }
      TrailStops(atr);
     }

   //--- pyramid adds: tick-based ladder, winners only (§34)
   if(open > 0 && open < InpMaxPositions && g_pyr.AddAllowed(SymbolInfoDouble(_Symbol, SYMBOL_BID), SymbolInfoDouble(_Symbol, SYMBOL_ASK)))
     {
      if(g_session.EntryAllowed() && g_vol.EntryAllowed() && g_risk.DailyLossOK() && atr > 0.0)
        {
         double baseLots = g_risk.BaseLots(atr * InpSL_ATR);
         double lots = g_risk.LevelLots(baseLots, g_pyr.Level(), InpPyramidSizing, InpSizingFactor, InpSizingCapLots);
         if(g_risk.BasketRiskOK(BasketRiskMoney(), lots, atr * InpSL_ATR))
           {
            int dir = g_pyr.Dir();
            if(OpenLevel(dir, lots, atr, g_pyr.Level() + 1))
               g_pyr.OnAdd(dir > 0 ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID));
           }
        }
     }

   //--- initial entries: once per entry-TF bar
   datetime bar = iTime(_Symbol, InpEntryTF, 0);
   if(bar == g_lastEntryBar) return;
   g_lastEntryBar = bar;

   if(open > 0) return;                      // initial entry only when flat
   if(trend == DEMON_OFF) return;
   if(!g_session.EntryAllowed()) return;
   if(!g_vol.EntryAllowed()) return;
   if(!g_risk.DailyLossOK()) return;
   if(!g_pyr.ReentryAllowed(bar, InpReentryDelay, PeriodSeconds(InpEntryTF))) return;
   if(atr <= 0.0) return;

   int dir = EntrySignal(trend == DEMON_UP ? 1 : -1);
   if(dir == 0) return;
   if((trend == DEMON_UP && dir < 0) || (trend == DEMON_DOWN && dir > 0)) return; // trend-aligned only

   double baseLots = g_risk.BaseLots(atr * InpSL_ATR);
   if(!g_risk.BasketRiskOK(0.0, baseLots, atr * InpSL_ATR)) return;
   if(OpenLevel(dir, baseLots, atr, 1))
     {
      double px = dir > 0 ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
      g_pyr.OnBasketOpen(dir, px, atr * InpPyramidATR);
     }
  }
//+------------------------------------------------------------------+
