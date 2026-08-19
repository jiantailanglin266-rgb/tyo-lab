//+------------------------------------------------------------------+
//| TYO SHADOW FORWARD — integration template (Phase 13.5)            |
//|                                                                    |
//| Demonstrates the Signal Engine → ShadowExecution wiring and lets  |
//| the shadow engine itself be exercised in the Strategy Tester      |
//| (brief §81). The MA-cross below is a THROWAWAY DEMO SIGNAL for    |
//| engine testing — it is not a TYO strategy and produces no         |
//| published evidence.                                                |
//|                                                                    |
//| SHADOW-ONLY BUILD: no <Trade/Trade.mqh>, no OrderSend — this EX5  |
//| is structurally incapable of sending real orders (§78–80).        |
//+------------------------------------------------------------------+
#property copyright "TYO"
#property version   "1.00"
#property strict

#include <TYO/ShadowExecution.mqh>

//--- engine inputs (§99); defaults are the conservative shadow config
input string ShadowStrategyId   = "template";            // strategyId (EA slug)
input string ShadowVersion      = "TEMPLATE_V1.0.0";     // strategy version (§27)
input ENUM_SHADOW_SLIPPAGE SlippageMode = SHADOW_SLIPPAGE_FIXED; // simulated slippage
input int    FixedSlippagePoints = 2;                    // adverse points per fill
input double CommissionPerLot   = 0.0;                   // per side, account ccy (simulated)
input ENUM_SHADOW_SWAP SwapMode = SHADOW_SWAP_SYMBOL_INFO; // simulated swap source
input int    TripleSwapDay      = 3;                     // 3=Wednesday (simplified)
input int    FeedStaleSeconds   = 120;                   // no tick this long → block entries

//--- demo-signal inputs (NOT a strategy)
input ulong  DemoMagic          = 990001;
input double DemoLots           = 0.10;
input int    FastMA             = 12;
input int    SlowMA             = 48;

CShadowExecution g_shadow;
int g_fast = INVALID_HANDLE;
int g_slow = INVALID_HANDLE;
datetime g_lastBar = 0;

//+------------------------------------------------------------------+
int OnInit()
  {
   string settings = StringFormat("%s|%s|fast=%d|slow=%d|lots=%.2f",
                                  ShadowStrategyId, ShadowVersion, FastMA, SlowMA, DemoLots);
   if(!g_shadow.Init(ShadowStrategyId, ShadowVersion, settings,
                     SlippageMode, FixedSlippagePoints, CommissionPerLot,
                     SwapMode, TripleSwapDay, FeedStaleSeconds))
      return INIT_FAILED;

   g_fast = iMA(_Symbol, _Period, FastMA, 0, MODE_EMA, PRICE_CLOSE);
   g_slow = iMA(_Symbol, _Period, SlowMA, 0, MODE_EMA, PRICE_CLOSE);
   if(g_fast == INVALID_HANDLE || g_slow == INVALID_HANDLE) return INIT_FAILED;
   return INIT_SUCCEEDED;
  }

void OnDeinit(const int reason) { g_shadow.Deinit(reason); }

//+------------------------------------------------------------------+
//| Signal Engine (demo): +1 cross up, -1 cross down, 0 nothing       |
//| The real integration pattern: your existing signal functions stay |
//| EXACTLY as they are; only the execution calls change (§4–5).      |
//+------------------------------------------------------------------+
int DemoSignal()
  {
   double f[3], s[3];
   if(CopyBuffer(g_fast, 0, 1, 2, f) < 2) return 0;
   if(CopyBuffer(g_slow, 0, 1, 2, s) < 2) return 0;
   if(f[1] > s[1] && f[0] <= s[0]) return  1;
   if(f[1] < s[1] && f[0] >= s[0]) return -1;
   return 0;
  }

//+------------------------------------------------------------------+
void OnTick()
  {
   g_shadow.OnTickUpdate(); // rollover swap, SL/TP surveillance, overlay

   // demo logic runs once per bar
   datetime bar = iTime(_Symbol, _Period, 0);
   if(bar == g_lastBar) return;
   g_lastBar = bar;

   int sig = DemoSignal();
   if(sig == 0) return;

   // exit the opposite side on a fresh cross, then (virtually) enter
   if(sig > 0 && g_shadow.DirByMagic(DemoMagic) == SHADOW_DIR_SHORT) g_shadow.CloseAllByMagic(DemoMagic, "SIGNAL");
   if(sig < 0 && g_shadow.DirByMagic(DemoMagic) == SHADOW_DIR_LONG)  g_shadow.CloseAllByMagic(DemoMagic, "SIGNAL");

   if(g_shadow.CountByMagic(DemoMagic) == 0)
     {
      if(sig > 0) g_shadow.Buy(DemoMagic, DemoLots, "demo-cross-up");
      else        g_shadow.Sell(DemoMagic, DemoLots, "demo-cross-down");
     }
  }
//+------------------------------------------------------------------+
