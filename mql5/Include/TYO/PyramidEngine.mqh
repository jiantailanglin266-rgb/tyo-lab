//+------------------------------------------------------------------+
//| TYO PYRAMID ENGINE (Phase 15 §34–36, §50)                          |
//| Winner-only pyramiding state: tracks the basket for one magic and |
//| decides WHEN an add is allowed. It never trades — the EA executes |
//| — so a shadow build reuses it unchanged (§88).                    |
//|                                                                    |
//| Hard rule (§34): adds happen only at entry + level·step in the    |
//| PROFIT direction. There is no averaging-down code path.           |
//+------------------------------------------------------------------+
#ifndef TYO_PYRAMID_ENGINE_MQH
#define TYO_PYRAMID_ENGINE_MQH

class CPyramidEngine
  {
private:
   int      m_dir;            // +1 long basket, -1 short, 0 flat
   int      m_level;          // entries so far (1 = initial)
   double   m_lastAddPrice;
   double   m_stepPrice;      // ATR × multiplier at basket start
   datetime m_lastCloseBar;   // for re-entry delay (§47)
   int      m_maxLevels;

public:
   void Init(const int maxLevels) { m_maxLevels = maxLevels; Reset(); }
   void Reset() { m_dir = 0; m_level = 0; m_lastAddPrice = 0; m_stepPrice = 0; }

   bool Flat() const { return m_dir == 0; }
   int  Dir() const { return m_dir; }
   int  Level() const { return m_level; }

   void OnBasketOpen(const int dir, const double price, const double atrStep)
     {
      m_dir = dir;
      m_level = 1;
      m_lastAddPrice = price;
      m_stepPrice = atrStep; // frozen for the basket: consistent ladder
     }

   void OnAdd(const double price)
     {
      m_level++;
      m_lastAddPrice = price;
     }

   void OnBasketClosed(const datetime barTime)
     {
      Reset();
      m_lastCloseBar = barTime;
     }

   /** §34: the ONLY add condition — price advanced a full step in the
    *  basket's profit direction and the level cap is not reached. */
   bool AddAllowed(const double bid, const double ask) const
     {
      if(m_dir == 0 || m_level >= m_maxLevels || m_stepPrice <= 0.0) return false;
      if(m_dir > 0) return bid >= m_lastAddPrice + m_stepPrice;  // long: higher only
      return ask <= m_lastAddPrice - m_stepPrice;                // short: lower only
     }

   /** §47: re-entry after the basket closes, once the delay has passed. */
   bool ReentryAllowed(const datetime currentBar, const int delayBars, const int periodSeconds) const
     {
      if(m_lastCloseBar == 0) return true;
      return (long)currentBar - (long)m_lastCloseBar >= (long)delayBars * periodSeconds;
     }
  };

#endif // TYO_PYRAMID_ENGINE_MQH
