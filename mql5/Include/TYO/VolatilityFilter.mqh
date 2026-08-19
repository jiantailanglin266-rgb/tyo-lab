//+------------------------------------------------------------------+
//| TYO VOLATILITY FILTER (Phase 15 §42–43)                            |
//| ATR regime gate (current ATR / long-term ATR inside a band) plus  |
//| the two gold-critical spread gates: absolute spread and           |
//| spread / ATR. Handles are created once (§120).                    |
//+------------------------------------------------------------------+
#ifndef TYO_VOLATILITY_FILTER_MQH
#define TYO_VOLATILITY_FILTER_MQH

class CVolatilityFilter
  {
private:
   int    m_atr;        // entry-TF ATR
   int    m_atrLong;    // long-term ATR (regime baseline)
   double m_relMin;
   double m_relMax;
   double m_maxSpreadPips;   // absolute cap, family pip convention
   double m_maxSpreadATR;    // spread / ATR cap (0 = off)
   string m_sym;

public:
   bool Init(const string sym, const ENUM_TIMEFRAMES entryTF, const int atrPeriod,
             const ENUM_TIMEFRAMES longTF, const int atrLongPeriod,
             const double relMin, const double relMax,
             const double maxSpreadPips, const double maxSpreadATR)
     {
      m_sym = sym;
      m_relMin = relMin;
      m_relMax = relMax;
      m_maxSpreadPips = maxSpreadPips;
      m_maxSpreadATR = maxSpreadATR;
      m_atr = iATR(sym, entryTF, atrPeriod);
      m_atrLong = iATR(sym, longTF, atrLongPeriod);
      return m_atr != INVALID_HANDLE && m_atrLong != INVALID_HANDLE;
     }

   void Release()
     {
      if(m_atr != INVALID_HANDLE) IndicatorRelease(m_atr);
      if(m_atrLong != INVALID_HANDLE) IndicatorRelease(m_atrLong);
     }

   /** Closed-bar ATR on the entry TF (price units); 0 on failure. */
   double ATR() const
     {
      double a[];
      ArraySetAsSeries(a, true);
      if(CopyBuffer(m_atr, 0, 1, 1, a) < 1) return 0.0;
      return a[0];
     }

   double RelativeATR() const
     {
      double a[], b[];
      ArraySetAsSeries(a, true);
      ArraySetAsSeries(b, true);
      if(CopyBuffer(m_atr, 0, 1, 1, a) < 1) return 0.0;
      if(CopyBuffer(m_atrLong, 0, 1, 1, b) < 1) return 0.0;
      return b[0] > 0.0 ? a[0] / b[0] : 0.0;
     }

   double SpreadPrice() const
     {
      return SymbolInfoDouble(m_sym, SYMBOL_ASK) - SymbolInfoDouble(m_sym, SYMBOL_BID);
     }

   /** All volatility/spread gates for a NEW entry (fail closed). */
   bool EntryAllowed() const
     {
      double atr = ATR();
      if(atr <= 0.0) return false;
      double rel = RelativeATR();
      if(rel <= 0.0) return false;
      if(m_relMin > 0.0 && rel < m_relMin) return false;
      if(m_relMax > 0.0 && rel > m_relMax) return false;

      double spread = SpreadPrice();
      if(spread <= 0.0) return false;
      double pip = SymbolInfoDouble(m_sym, SYMBOL_POINT);
      long digits = SymbolInfoInteger(m_sym, SYMBOL_DIGITS);
      if(digits == 3 || digits == 5 || digits == 2) pip *= 10.0;
      if(m_maxSpreadPips > 0.0 && spread / pip > m_maxSpreadPips) return false;
      if(m_maxSpreadATR > 0.0 && spread / atr > m_maxSpreadATR) return false;
      return true;
     }
  };

#endif // TYO_VOLATILITY_FILTER_MQH
