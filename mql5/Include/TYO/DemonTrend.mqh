//+------------------------------------------------------------------+
//| TYO DEMON TREND — shared higher-timeframe trend module (Phase 15) |
//| Extracted 1:1 from the TrendCheck() logic shipped in the NEXUS /  |
//| JOKER family (see docs/DEMON_TREND_AUDIT.md): MA(period) on the   |
//| trend TF; UP when ma[1]-ma[15] >= diff1·pip AND ma[1]-ma[50] >=   |
//| diff2·pip; DOWN mirrored; OFF otherwise or past the trend hour.   |
//| Existing EAs are untouched — this include is for NEW strategies.  |
//+------------------------------------------------------------------+
#ifndef TYO_DEMON_TREND_MQH
#define TYO_DEMON_TREND_MQH

enum ENUM_DEMON_TREND { DEMON_OFF = 0, DEMON_UP = 1, DEMON_DOWN = -1 };

/** Pip size in price terms, matching the family PipsToPrice(). */
double DemonPip(const string sym)
  {
   double p = SymbolInfoDouble(sym, SYMBOL_POINT);
   long digits = SymbolInfoInteger(sym, SYMBOL_DIGITS);
   if(digits == 3 || digits == 5 || digits == 2) p *= 10.0;
   return p;
  }

class CDemonTrend
  {
private:
   int               m_handle;
   ENUM_TIMEFRAMES   m_tf;
   double            m_diff1;
   double            m_diff2;
   int               m_trendHour;   // entries allowed only while hour < this
   int               m_gmtShift;    // broker-server → strategy clock shift
   datetime          m_lastBar;
   ENUM_DEMON_TREND  m_state;

public:
   bool Init(const string sym, const ENUM_TIMEFRAMES tf, const int maPeriod,
             const double diff1Pips, const double diff2Pips, const int trendHour,
             const int gmtShift = 0)
     {
      m_tf = tf;
      m_diff1 = diff1Pips;
      m_diff2 = diff2Pips;
      m_trendHour = trendHour;
      m_gmtShift = gmtShift;
      m_lastBar = 0;
      m_state = DEMON_OFF;
      m_handle = iMA(sym, tf, maPeriod, 0, MODE_SMA, PRICE_CLOSE);
      return m_handle != INVALID_HANDLE;
     }

   void Release() { if(m_handle != INVALID_HANDLE) IndicatorRelease(m_handle); }

   /** Evaluate once per trend-TF bar (cheap on every tick). */
   ENUM_DEMON_TREND Update(const string sym)
     {
      datetime t[];
      ArraySetAsSeries(t, true);
      if(CopyTime(sym, m_tf, 0, 1, t) <= 0) return m_state;
      if(t[0] == m_lastBar) return m_state;

      m_state = DEMON_OFF;
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      int hour = dt.hour - m_gmtShift;
      if(hour < 0) hour += 24; else if(hour > 23) hour -= 24;

      if(hour < m_trendHour)
        {
         double ma[];
         ArraySetAsSeries(ma, true);
         if(CopyBuffer(m_handle, 0, 0, 51, ma) > 50)
           {
            double pip = DemonPip(sym);
            if((ma[1] - ma[15]) >= m_diff1 * pip && (ma[1] - ma[50]) >= m_diff2 * pip)
               m_state = DEMON_UP;
            else if((ma[15] - ma[1]) >= m_diff1 * pip && (ma[50] - ma[1]) >= m_diff2 * pip)
               m_state = DEMON_DOWN;
           }
        }
      m_lastBar = t[0];
      return m_state;
     }

   ENUM_DEMON_TREND State() const { return m_state; }
  };

#endif // TYO_DEMON_TREND_MQH
