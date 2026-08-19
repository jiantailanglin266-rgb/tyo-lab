//+------------------------------------------------------------------+
//| TYO RISK ENGINE (Phase 15 §37–39, §115)                            |
//| Lot sizing, basket-risk cap and the daily loss stop. Hard rules:  |
//| every entry carries a stop (§39: no-SL is forbidden) and the      |
//| worst-case basket loss stays under MaxBasketRisk% of equity.      |
//+------------------------------------------------------------------+
#ifndef TYO_RISK_ENGINE_MQH
#define TYO_RISK_ENGINE_MQH

enum ENUM_LOT_MODE
  {
   LOT_CONSTANT = 0,        // fixed lots per entry
   LOT_RISK_PERCENT = 1     // sized so SL distance ≈ RiskPercent of equity
  };

enum ENUM_PYRAMID_SIZING
  {
   PYR_CONSTANT = 0,        // every level the same size
   PYR_DECREASING = 1,      // level n = base × factor^n (factor < 1)
   PYR_INCREASING_CAPPED = 2 // level n = base × factor^n, hard-capped (§37)
  };

class CRiskEngine
  {
private:
   ENUM_LOT_MODE m_mode;
   double m_fixedLots;
   double m_riskPct;
   double m_maxBasketRiskPct;
   double m_dailyLossLimitPct;
   double m_dayStartEquity;
   int    m_dayOfYear;
   string m_sym;

   double NormalizeVolume(double vol) const
     {
      double minV = SymbolInfoDouble(m_sym, SYMBOL_VOLUME_MIN);
      double maxV = SymbolInfoDouble(m_sym, SYMBOL_VOLUME_MAX);
      double step = SymbolInfoDouble(m_sym, SYMBOL_VOLUME_STEP);
      if(minV <= 0) minV = 0.01;
      if(step <= 0) step = 0.01;
      if(maxV < minV) maxV = minV;
      vol = MathMax(minV, MathMin(maxV, vol));
      vol = MathFloor(vol / step) * step;
      return MathMax(minV, vol);
     }

public:
   void Init(const string sym, const ENUM_LOT_MODE mode, const double fixedLots,
             const double riskPct, const double maxBasketRiskPct, const double dailyLossLimitPct)
     {
      m_sym = sym;
      m_mode = mode;
      m_fixedLots = fixedLots;
      m_riskPct = riskPct;
      m_maxBasketRiskPct = maxBasketRiskPct;
      m_dailyLossLimitPct = dailyLossLimitPct;
      m_dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
      m_dayOfYear = -1;
     }

   /** Money value of a 1-lot move over `dist` price units. */
   double MoneyPerLot(const double dist) const
     {
      double ts = SymbolInfoDouble(m_sym, SYMBOL_TRADE_TICK_SIZE);
      double tv = SymbolInfoDouble(m_sym, SYMBOL_TRADE_TICK_VALUE);
      if(ts <= 0.0 || tv <= 0.0) return 0.0;
      return dist / ts * tv;
     }

   double BaseLots(const double slDistance) const
     {
      if(m_mode == LOT_CONSTANT) return NormalizeVolume(m_fixedLots);
      double perLot = MoneyPerLot(slDistance);
      if(perLot <= 0.0) return 0.0;
      double lots = AccountInfoDouble(ACCOUNT_EQUITY) * m_riskPct / 100.0 / perLot;
      return NormalizeVolume(lots);
     }

   double LevelLots(const double baseLots, const int level, const ENUM_PYRAMID_SIZING sizing,
                    const double factor, const double capLots) const
     {
      double lots = baseLots;
      if(sizing == PYR_DECREASING) lots = baseLots * MathPow(MathMin(factor, 1.0), level);
      if(sizing == PYR_INCREASING_CAPPED) lots = MathMin(baseLots * MathPow(MathMax(factor, 1.0), level), capLots);
      return NormalizeVolume(lots);
     }

   /** §38: would adding `lots` at `slDistance` push the basket's worst-case
    *  loss (sum over open positions of |price−SL| exposure) past the cap? */
   bool BasketRiskOK(const double existingRiskMoney, const double lots, const double slDistance) const
     {
      double addRisk = MoneyPerLot(slDistance) * lots;
      double cap = AccountInfoDouble(ACCOUNT_EQUITY) * m_maxBasketRiskPct / 100.0;
      return existingRiskMoney + addRisk <= cap;
     }

   /** §115 DailyLossLimit: no new entries after losing this % of the day's
    *  starting equity (closed + floating). */
   bool DailyLossOK()
     {
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      if(dt.day_of_year != m_dayOfYear)
        {
         m_dayOfYear = dt.day_of_year;
         m_dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
        }
      if(m_dailyLossLimitPct <= 0.0) return true;
      double eq = AccountInfoDouble(ACCOUNT_EQUITY);
      return eq >= m_dayStartEquity * (1.0 - m_dailyLossLimitPct / 100.0);
     }
  };

#endif // TYO_RISK_ENGINE_MQH
