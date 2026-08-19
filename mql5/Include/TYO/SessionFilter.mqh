//+------------------------------------------------------------------+
//| TYO SESSION FILTER (Phase 15 §41, §45–46)                          |
//| Session gating on the strategy clock (server hour + shift), with  |
//| rollover-spread pause and late-Friday cutoff options. Hours are   |
//| inputs on the EA side so gold session research stays flexible.    |
//+------------------------------------------------------------------+
#ifndef TYO_SESSION_FILTER_MQH
#define TYO_SESSION_FILTER_MQH

class CSessionFilter
  {
private:
   bool m_asia, m_london, m_ny, m_overlap;
   int  m_asiaFrom, m_asiaTo, m_londonFrom, m_londonTo, m_nyFrom, m_nyTo, m_ovFrom, m_ovTo;
   bool m_pauseRollover;
   int  m_rollFrom, m_rollTo;   // e.g. 23 → 1
   bool m_blockLateFriday;
   int  m_fridayCutoffHour;
   int  m_gmtShift;

   bool InWindow(const int h, const int from, const int to) const
     {
      if(from == to) return false;
      if(from < to) return h >= from && h < to;
      return h >= from || h < to; // wraps midnight
     }

public:
   void Init(const bool asia, const bool london, const bool ny, const bool overlap,
             const int asiaFrom, const int asiaTo, const int londonFrom, const int londonTo,
             const int nyFrom, const int nyTo, const int ovFrom, const int ovTo,
             const bool pauseRollover, const int rollFrom, const int rollTo,
             const bool blockLateFriday, const int fridayCutoffHour, const int gmtShift)
     {
      m_asia = asia; m_london = london; m_ny = ny; m_overlap = overlap;
      m_asiaFrom = asiaFrom; m_asiaTo = asiaTo;
      m_londonFrom = londonFrom; m_londonTo = londonTo;
      m_nyFrom = nyFrom; m_nyTo = nyTo;
      m_ovFrom = ovFrom; m_ovTo = ovTo;
      m_pauseRollover = pauseRollover; m_rollFrom = rollFrom; m_rollTo = rollTo;
      m_blockLateFriday = blockLateFriday; m_fridayCutoffHour = fridayCutoffHour;
      m_gmtShift = gmtShift;
     }

   int Hour() const
     {
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      int h = dt.hour - m_gmtShift;
      if(h < 0) h += 24; else if(h > 23) h -= 24;
      return h;
     }

   /** New entries allowed in the current session window? */
   bool EntryAllowed() const
     {
      int h = Hour();
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      if(m_pauseRollover && InWindow(h, m_rollFrom, m_rollTo)) return false;
      if(m_blockLateFriday && dt.day_of_week == 5 && h >= m_fridayCutoffHour) return false;

      bool inAny = false;
      if(m_asia && InWindow(h, m_asiaFrom, m_asiaTo)) inAny = true;
      if(m_london && InWindow(h, m_londonFrom, m_londonTo)) inAny = true;
      if(m_ny && InWindow(h, m_nyFrom, m_nyTo)) inAny = true;
      if(m_overlap && InWindow(h, m_ovFrom, m_ovTo)) inAny = true;
      return inAny;
     }
  };

#endif // TYO_SESSION_FILTER_MQH
