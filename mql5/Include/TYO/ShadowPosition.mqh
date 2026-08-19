//+------------------------------------------------------------------+
//| TYO SHADOW FORWARD ENGINE — virtual position book                 |
//| Phase 13.5. SHADOW-ONLY BY CONSTRUCTION: this library never       |
//| includes <Trade/Trade.mqh> and contains no OrderSend path. A      |
//| shadow build linked only against TYO/ shadow headers is           |
//| structurally incapable of sending real orders (brief §3, §80).    |
//+------------------------------------------------------------------+
#ifndef TYO_SHADOW_POSITION_MQH
#define TYO_SHADOW_POSITION_MQH

#define TYO_SHADOW_ONLY 1   // marker: real-execution code must never be
                            // compiled into a translation unit defining this

enum ENUM_SHADOW_DIR { SHADOW_DIR_LONG = 0, SHADOW_DIR_SHORT = 1 };

enum ENUM_SHADOW_EXIT
  {
   SHADOW_EXIT_SIGNAL = 0,   // strategy exit call
   SHADOW_EXIT_SL     = 1,
   SHADOW_EXIT_TP     = 2,
   SHADOW_EXIT_TRAIL  = 3,
   SHADOW_EXIT_MANUAL = 4,
   SHADOW_EXIT_SESSION= 5    // never used to close; only labels state
  };

//--- one virtual position (brief §9)
struct SShadowPosition
  {
   long              id;             // engine-unique, persists across restarts
   string            tradeId;        // sessionId:id — globally unique
   string            strategyId;
   string            version;
   ulong             magic;
   string            symbol;
   int               dir;            // ENUM_SHADOW_DIR
   double            volume;         // remaining volume (partial closes shrink it)
   double            initialVolume;
   datetime          signalTime;
   datetime          entryTime;
   double            entryPrice;
   double            sl;
   double            tp;
   int               entrySpreadPts;
   double            swapAcc;        // accumulated simulated swap (money)
   double            commissionAcc;  // simulated commission (money)
   string            comment;
   datetime          lastRolloverDay;// last server day swap was applied for
   bool              open;
  };

//--- floating P/L of a virtual position at current prices (gross, money)
double ShadowFloatingProfit(const SShadowPosition &p)
  {
   if(!p.open) return 0.0;
   double px = (p.dir == SHADOW_DIR_LONG)
               ? SymbolInfoDouble(p.symbol, SYMBOL_BID)   // long closes on bid
               : SymbolInfoDouble(p.symbol, SYMBOL_ASK);  // short closes on ask
   double tickSize  = SymbolInfoDouble(p.symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(p.symbol, SYMBOL_TRADE_TICK_VALUE);
   if(tickSize <= 0.0 || tickValue <= 0.0) return 0.0;
   double diff = (p.dir == SHADOW_DIR_LONG) ? (px - p.entryPrice) : (p.entryPrice - px);
   return diff / tickSize * tickValue * p.volume;
  }

//--- realised gross profit for an exit at a given price (money)
double ShadowGrossAt(const SShadowPosition &p, const double exitPrice, const double lots)
  {
   double tickSize  = SymbolInfoDouble(p.symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(p.symbol, SYMBOL_TRADE_TICK_VALUE);
   if(tickSize <= 0.0 || tickValue <= 0.0) return 0.0;
   double diff = (p.dir == SHADOW_DIR_LONG) ? (exitPrice - p.entryPrice) : (p.entryPrice - exitPrice);
   return diff / tickSize * tickValue * lots;
  }

//--- SL/TP touch checks on the CORRECT side of the book (brief §17–18)
bool ShadowSLHit(const SShadowPosition &p)
  {
   if(p.sl <= 0.0) return false;
   if(p.dir == SHADOW_DIR_LONG)
      return SymbolInfoDouble(p.symbol, SYMBOL_BID) <= p.sl;
   return SymbolInfoDouble(p.symbol, SYMBOL_ASK) >= p.sl;
  }

bool ShadowTPHit(const SShadowPosition &p)
  {
   if(p.tp <= 0.0) return false;
   if(p.dir == SHADOW_DIR_LONG)
      return SymbolInfoDouble(p.symbol, SYMBOL_BID) >= p.tp;
   return SymbolInfoDouble(p.symbol, SYMBOL_ASK) <= p.tp;
  }

#endif // TYO_SHADOW_POSITION_MQH
