//+------------------------------------------------------------------+
//| TYO SHADOW FORWARD ENGINE — execution core (Phase 13.5)           |
//|                                                                    |
//| Evaluates strategy signals against REAL-TIME market prices and    |
//| manages VIRTUAL positions. No <Trade/Trade.mqh>, no OrderSend, no |
//| trade request is ever constructed: a build linked only against    |
//| TYO/ shadow headers is structurally incapable of real orders      |
//| (brief §3, §78–80).                                                |
//|                                                                    |
//| Execution model (§10–16): buy@ASK / sell@BID, exits on the        |
//| opposite side; optional SIMULATED slippage, commission and swap — |
//| every simulated quantity is labelled as such downstream.          |
//+------------------------------------------------------------------+
#ifndef TYO_SHADOW_EXECUTION_MQH
#define TYO_SHADOW_EXECUTION_MQH

#include <TYO/ShadowPosition.mqh>
#include <TYO/ShadowLogger.mqh>

enum ENUM_SHADOW_SLIPPAGE
  {
   SHADOW_SLIPPAGE_NONE = 0,     // ideal fills (optimistic — labelled)
   SHADOW_SLIPPAGE_FIXED = 1     // fixed adverse points on entry and exit
  };

enum ENUM_SHADOW_SWAP
  {
   SHADOW_SWAP_NONE = 0,         // ignore swap (labelled)
   SHADOW_SWAP_SYMBOL_INFO = 1   // SymbolInfoDouble SWAP_LONG/SHORT where the
                                 // swap mode is points or currency-per-lot
  };

#define TYO_SHADOW_MAX_SIG 256   // recent signal keys kept for dedupe (§41)

class CShadowExecution
  {
private:
   CShadowLogger     m_log;
   SShadowPosition   m_pos[];
   string            m_sig[];          // recent signal keys (ring)
   int               m_sigN;
   long              m_nextId;
   string            m_strategy;
   string            m_version;
   string            m_sessionId;
   string            m_settingsHash;
   // execution model
   ENUM_SHADOW_SLIPPAGE m_slipMode;
   int               m_slipPts;
   double            m_commPerLotSide; // account currency per 1.0 lot per side
   ENUM_SHADOW_SWAP  m_swapMode;
   int               m_tripleDay;      // day_of_week getting 3x swap (simplified)
   int               m_feedStaleSec;
   // feed state
   datetime          m_lastTick;
   datetime          m_gapStart;
   bool              m_storageError;
   // session stats for the overlay
   int               m_closed;
   double            m_netAcc;

   string SlipName()   { return m_slipMode == SHADOW_SLIPPAGE_NONE ? "NONE" : StringFormat("FIXED_%dpt_SIMULATED", m_slipPts); }
   string SwapName()   { return m_swapMode == SHADOW_SWAP_NONE ? "NONE" : "SYMBOL_INFO_SIMULATED"; }
   string CommName()   { return StringFormat("%.2f/lot/side_SIMULATED", m_commPerLotSide); }

   //--- tiny stable hash over the settings string (§121)
   string Hash(const string s)
     {
      uint a = 1, b = 0;
      for(int i = 0; i < StringLen(s); i++)
        {
         a = (a + (uint)StringGetCharacter(s, i)) % 65521;
         b = (b + a) % 65521;
        }
      return StringFormat("%08x", (b << 16) | a);
     }

   int SpreadPts(const string sym)
     {
      double pt = SymbolInfoDouble(sym, SYMBOL_POINT);
      if(pt <= 0.0) return -1;
      double sp = SymbolInfoDouble(sym, SYMBOL_ASK) - SymbolInfoDouble(sym, SYMBOL_BID);
      return (int)MathRound(sp / pt);
     }

   double SlipPrice(const string sym) // adverse price offset (money side applied by caller)
     {
      if(m_slipMode != SHADOW_SLIPPAGE_FIXED || m_slipPts <= 0) return 0.0;
      return m_slipPts * SymbolInfoDouble(sym, SYMBOL_POINT);
     }

   //--- one night of swap for a position (money); 0 when unknown — labelled
   double SwapPerNight(const SShadowPosition &p, const int dayOfWeek)
     {
      if(m_swapMode == SHADOW_SWAP_NONE) return 0.0;
      long mode = SymbolInfoInteger(p.symbol, SYMBOL_SWAP_MODE);
      double rate = (p.dir == SHADOW_DIR_LONG)
                    ? SymbolInfoDouble(p.symbol, SYMBOL_SWAP_LONG)
                    : SymbolInfoDouble(p.symbol, SYMBOL_SWAP_SHORT);
      double night = 0.0;
      if(mode == SYMBOL_SWAP_MODE_POINTS)
        {
         double pt = SymbolInfoDouble(p.symbol, SYMBOL_POINT);
         double ts = SymbolInfoDouble(p.symbol, SYMBOL_TRADE_TICK_SIZE);
         double tv = SymbolInfoDouble(p.symbol, SYMBOL_TRADE_TICK_VALUE);
         if(pt > 0 && ts > 0 && tv > 0) night = rate * pt / ts * tv * p.volume;
        }
      else if(mode == SYMBOL_SWAP_MODE_CURRENCY_SYMBOL || mode == SYMBOL_SWAP_MODE_CURRENCY_DEPOSIT ||
              mode == SYMBOL_SWAP_MODE_CURRENCY_MARGIN)
         night = rate * p.volume;
      else
         return 0.0; // interest/reopen modes: not simulated — stays 0, labelled
      if(dayOfWeek == m_tripleDay) night *= 3.0; // simplification, documented
      return night;
     }

   bool SigSeen(const string key)
     {
      for(int i = 0; i < m_sigN; i++) if(m_sig[i] == key) return true;
      return false;
     }

   void SigRemember(const string key)
     {
      if(m_sigN < TYO_SHADOW_MAX_SIG) { ArrayResize(m_sig, m_sigN + 1); m_sig[m_sigN++] = key; }
      else { for(int i = 1; i < m_sigN; i++) m_sig[i - 1] = m_sig[i]; m_sig[m_sigN - 1] = key; }
     }

   //--- state persistence: pipe-delimited lines, atomic write (§39–41)
   void SaveState()
     {
      string s = "TYO_SHADOW_STATE_V1\n";
      s += "SESSION|" + m_sessionId + "|" + m_strategy + "|" + m_version + "|" + m_settingsHash + "\n";
      s += StringFormat("NEXTID|%I64d\n", m_nextId);
      s += StringFormat("STATS|%d|%.2f\n", m_closed, m_netAcc);
      for(int i = 0; i < m_sigN; i++) s += "SIG|" + m_sig[i] + "\n";
      for(int i = 0; i < ArraySize(m_pos); i++)
        {
         SShadowPosition p = m_pos[i];
         if(!p.open) continue;
         string c = p.comment; StringReplace(c, "|", "%7C");
         s += StringFormat("POS|%I64d|%s|%s|%s|%I64u|%s|%d|%.2f|%.2f|%I64d|%I64d|%.5f|%.5f|%.5f|%d|%.2f|%.2f|%I64d|%s\n",
                           p.id, p.tradeId, p.strategyId, p.version, p.magic, p.symbol, p.dir,
                           p.volume, p.initialVolume, (long)p.signalTime, (long)p.entryTime, p.entryPrice,
                           p.sl, p.tp, p.entrySpreadPts, p.swapAcc, p.commissionAcc,
                           (long)p.lastRolloverDay, c);
        }
      if(!m_log.SaveState(s))
        {
         if(!m_storageError) m_log.Event("ERROR", "\"error\":\"state save failed — new entries disabled\"");
         m_storageError = true; // fail closed (§34)
        }
     }

   int RestoreState()
     {
      string s = m_log.LoadState();
      if(StringLen(s) == 0) return 0;
      string lines[];
      int n = StringSplit(s, '\n', lines);
      if(n < 1 || lines[0] != "TYO_SHADOW_STATE_V1") return 0;
      int restored = 0;
      for(int i = 1; i < n; i++)
        {
         string f[];
         int m = StringSplit(lines[i], '|', f);
         if(m < 2) continue;
         if(f[0] == "NEXTID") m_nextId = StringToInteger(f[1]);
         else if(f[0] == "STATS" && m >= 3) { m_closed = (int)StringToInteger(f[1]); m_netAcc = StringToDouble(f[2]); }
         else if(f[0] == "SIG") SigRemember(f[1]);
         else if(f[0] == "POS" && m >= 20)
           {
            SShadowPosition p;
            p.id = StringToInteger(f[1]); p.tradeId = f[2]; p.strategyId = f[3]; p.version = f[4];
            p.magic = (ulong)StringToInteger(f[5]); p.symbol = f[6]; p.dir = (int)StringToInteger(f[7]);
            p.volume = StringToDouble(f[8]); p.initialVolume = StringToDouble(f[9]);
            p.signalTime = (datetime)StringToInteger(f[10]); p.entryTime = (datetime)StringToInteger(f[11]);
            p.entryPrice = StringToDouble(f[12]); p.sl = StringToDouble(f[13]); p.tp = StringToDouble(f[14]);
            p.entrySpreadPts = (int)StringToInteger(f[15]); p.swapAcc = StringToDouble(f[16]);
            p.commissionAcc = StringToDouble(f[17]); p.lastRolloverDay = (datetime)StringToInteger(f[18]);
            string c = f[19]; StringReplace(c, "%7C", "|"); p.comment = c;
            p.open = true;
            int k = ArraySize(m_pos); ArrayResize(m_pos, k + 1); m_pos[k] = p;
            restored++;
           }
        }
      return restored;
     }

   //--- internal close: computes gross/net at an exit price, logs EXIT
   bool CloseInternal(const int idx, double exitPrice, const string reason, const double lots)
     {
      SShadowPosition p = m_pos[idx];
      double vol = MathMin(lots <= 0.0 ? p.volume : lots, p.volume);
      // proportional cost split for partial closes
      double share = (p.volume > 0.0) ? vol / p.volume : 1.0;
      double swapPart = p.swapAcc * share;
      double commPart = p.commissionAcc * share;
      double gross = ShadowGrossAt(p, exitPrice, vol);
      double net = gross + swapPart + commPart; // costs are stored negative
      int exitSpread = SpreadPts(p.symbol);

      SShadowPosition rec = p;         // snapshot for the log line
      rec.swapAcc = swapPart;
      rec.commissionAcc = commPart;
      string ev = (vol < p.volume) ? "PARTIAL_CLOSE" : "EXIT";
      // the importer only ingests EXIT lines; a partial close realises its
      // slice as a normal EXIT record plus a PARTIAL_CLOSE audit line
      m_log.Event("EXIT", m_log.PositionJson(rec, vol, exitPrice, reason, gross, net, exitSpread));
      if(vol < p.volume)
         m_log.Event("PARTIAL_CLOSE", StringFormat("\"tradeId\":\"%s\",\"closedVolume\":%.2f,\"remaining\":%.2f",
                                                   p.tradeId, vol, p.volume - vol));
      m_closed++;
      m_netAcc += net;

      if(vol >= p.volume)
        {
         for(int i = idx; i < ArraySize(m_pos) - 1; i++) m_pos[i] = m_pos[i + 1];
         ArrayResize(m_pos, ArraySize(m_pos) - 1);
        }
      else
        {
         m_pos[idx].volume -= vol;
         m_pos[idx].swapAcc -= swapPart;
         m_pos[idx].commissionAcc -= commPart;
         // partial slice gets a derived trade id next time via initialVolume bookkeeping
        }
      SaveState();
      return true;
     }

public:
   //--- lifecycle -----------------------------------------------------
   bool Init(const string strategyId, const string version, const string settingsForHash,
             const ENUM_SHADOW_SLIPPAGE slipMode, const int slipPts,
             const double commissionPerLotSide, const ENUM_SHADOW_SWAP swapMode,
             const int tripleSwapDayOfWeek = 3, const int feedStaleSeconds = 120)
     {
      m_strategy = strategyId;
      m_version = version;
      m_slipMode = slipMode;
      m_slipPts = slipPts;
      m_commPerLotSide = commissionPerLotSide;
      m_swapMode = swapMode;
      m_tripleDay = tripleSwapDayOfWeek;
      m_feedStaleSec = feedStaleSeconds;
      m_nextId = 1;
      m_sigN = 0;
      m_closed = 0;
      m_netAcc = 0.0;
      m_storageError = false;
      m_lastTick = TimeCurrent();
      m_gapStart = 0;
      m_settingsHash = Hash(settingsForHash + "|" + SlipName() + "|" + CommName() + "|" + SwapName());
      if(!m_log.Init(strategyId)) return false;
      int restored = RestoreState();
      m_sessionId = strategyId + "-" + IntegerToString((long)TimeCurrent());
      m_log.Event("SESSION_START", StringFormat(
         "\"sessionId\":\"%s\",\"strategyId\":\"%s\",\"version\":\"%s\",\"symbol\":\"%s\",\"timeframe\":\"%s\"," +
         "\"executionModel\":\"BID_ASK\",\"slippageModel\":\"%s\",\"commissionModel\":\"%s\",\"swapModel\":\"%s\"," +
         "\"settingsHash\":\"%s\",\"restoredPositions\":%d,\"engine\":\"TYO_SHADOW_1.0\",\"serverTZ\":\"broker\"",
         m_sessionId, m_strategy, m_version, _Symbol, EnumToString(_Period),
         SlipName(), CommName(), SwapName(), m_settingsHash, restored));
      Print("=== SHADOW MODE ACTIVE === NO REAL ORDERS WILL BE SENT (", m_strategy, " ", m_version, ")");
      return true;
     }

   void Deinit(const int reason)
     {
      // open positions are NOT force-closed (§124) — they persist in state
      m_log.Event("SESSION_END", StringFormat("\"sessionId\":\"%s\",\"reason\":%d,\"openAtSessionEnd\":%d",
                                              m_sessionId, reason, ArraySize(m_pos)));
      SaveState();
      Comment("");
     }

   //--- must be called FIRST in OnTick ---------------------------------
   void OnTickUpdate()
     {
      datetime now = TimeCurrent();
      // feed-gap bookkeeping (§33, §126–128): weekends are market closure,
      // not gaps; only weekday gaps under 48h count against the feed
      if(m_lastTick > 0 && now - m_lastTick > m_feedStaleSec)
        {
         MqlDateTime a, b;
         TimeToStruct(m_lastTick, a);
         TimeToStruct(now, b);
         bool weekday = (a.day_of_week >= 1 && a.day_of_week <= 5 && b.day_of_week >= 1 && b.day_of_week <= 5);
         if(weekday && now - m_lastTick < 48 * 3600)
            m_log.Event("FEED_GAP", StringFormat("\"gapMs\":%I64d", (long)(now - m_lastTick) * 1000));
        }
      m_lastTick = now;

      // rollover swap (§15–16): server-day change applies one night per day
      MqlDateTime dt;
      TimeToStruct(now, dt);
      datetime today = now - (now % 86400);
      bool mutated = false;
      for(int i = 0; i < ArraySize(m_pos); i++)
        {
         if(m_pos[i].lastRolloverDay == 0) { m_pos[i].lastRolloverDay = today; continue; }
         while(m_pos[i].lastRolloverDay < today)
           {
            m_pos[i].lastRolloverDay += 86400;
            MqlDateTime rd;
            TimeToStruct(m_pos[i].lastRolloverDay, rd);
            if(rd.day_of_week == 0 || rd.day_of_week == 6) continue; // weekend
            m_pos[i].swapAcc += SwapPerNight(m_pos[i], rd.day_of_week);
            mutated = true;
           }
        }

      // SL/TP surveillance (§17–19): tick-based, correct book side, exit at
      // the trigger price worsened by simulated slippage
      for(int i = ArraySize(m_pos) - 1; i >= 0; i--)
        {
         SShadowPosition p = m_pos[i];
         double slip = SlipPrice(p.symbol);
         if(ShadowSLHit(p))
           {
            double px = (p.dir == SHADOW_DIR_LONG) ? p.sl - slip : p.sl + slip;
            CloseInternal(i, px, "SL", 0.0);
            mutated = false; // CloseInternal already saved
            continue;
           }
         if(ShadowTPHit(p))
           {
            double px = (p.dir == SHADOW_DIR_LONG) ? p.tp - slip : p.tp + slip;
            CloseInternal(i, px, "TP", 0.0);
            mutated = false;
           }
        }
      if(mutated) SaveState();
      Overlay();
     }

   //--- fail-closed entry guard (§33–34) --------------------------------
   bool CanEnter(const string sym)
     {
      if(m_storageError) return false;
      if(TimeCurrent() - m_lastTick > m_feedStaleSec) return false; // FEED_STALE
      int sp = SpreadPts(sym);
      if(sp < 0) return false; // symbol/point unavailable
      if(SymbolInfoDouble(sym, SYMBOL_BID) <= 0.0 || SymbolInfoDouble(sym, SYMBOL_ASK) <= 0.0) return false;
      return true;
     }

   //--- virtual entries (§10–11): buy@ASK / sell@BID + adverse slippage --
   long Open(const int dir, const ulong magic, const double lots, const string comment,
             const double sl = 0.0, const double tp = 0.0, const string signalKey = "")
     {
      if(!CanEnter(_Symbol)) return -1;
      string key = (StringLen(signalKey) > 0)
                   ? signalKey
                   : m_strategy + "|" + _Symbol + "|" + IntegerToString((long)iTime(_Symbol, _Period, 0)) +
                     "|" + IntegerToString(dir) + "|" + IntegerToString((long)magic);
      if(SigSeen(key)) return -1; // §41–42: no double entry on the same signal
      SigRemember(key);

      double slip = SlipPrice(_Symbol);
      double px = (dir == SHADOW_DIR_LONG)
                  ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) + slip
                  : SymbolInfoDouble(_Symbol, SYMBOL_BID) - slip;

      SShadowPosition p;
      p.id = m_nextId++;
      p.tradeId = m_sessionId + ":" + IntegerToString(p.id);
      p.strategyId = m_strategy;
      p.version = m_version;
      p.magic = magic;
      p.symbol = _Symbol;
      p.dir = dir;
      p.volume = lots;
      p.initialVolume = lots;
      p.signalTime = TimeCurrent();
      p.entryTime = TimeCurrent();
      p.entryPrice = px;
      p.sl = sl;
      p.tp = tp;
      p.entrySpreadPts = SpreadPts(_Symbol);
      p.swapAcc = 0.0;
      p.commissionAcc = -MathAbs(m_commPerLotSide) * lots * 2.0; // both sides, negative
      p.comment = comment;
      p.lastRolloverDay = TimeCurrent() - (TimeCurrent() % 86400);
      p.open = true;

      int k = ArraySize(m_pos);
      ArrayResize(m_pos, k + 1);
      m_pos[k] = p;

      m_log.Event("ENTRY", StringFormat(
         "\"tradeId\":\"%s\",\"strategyId\":\"%s\",\"magic\":%I64u,\"symbol\":\"%s\",\"direction\":\"%s\"," +
         "\"volume\":%.2f,\"price\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"spread\":%d,\"comment\":\"%s\"",
         p.tradeId, p.strategyId, p.magic, p.symbol, (dir == SHADOW_DIR_LONG ? "long" : "short"),
         lots, px, sl, tp, p.entrySpreadPts, ShadowJsonEsc(comment)));
      SaveState();
      return p.id;
     }

   long Buy(const ulong magic, const double lots, const string comment,
            const double sl = 0.0, const double tp = 0.0, const string signalKey = "")
     { return Open(SHADOW_DIR_LONG, magic, lots, comment, sl, tp, signalKey); }

   long Sell(const ulong magic, const double lots, const string comment,
             const double sl = 0.0, const double tp = 0.0, const string signalKey = "")
     { return Open(SHADOW_DIR_SHORT, magic, lots, comment, sl, tp, signalKey); }

   //--- exits ------------------------------------------------------------
   bool CloseById(const long id, const string reason = "SIGNAL")
     {
      for(int i = 0; i < ArraySize(m_pos); i++)
         if(m_pos[i].id == id)
           {
            SShadowPosition p = m_pos[i];
            double slip = SlipPrice(p.symbol);
            double px = (p.dir == SHADOW_DIR_LONG)
                        ? SymbolInfoDouble(p.symbol, SYMBOL_BID) - slip
                        : SymbolInfoDouble(p.symbol, SYMBOL_ASK) + slip;
            return CloseInternal(i, px, reason, 0.0);
           }
      return false;
     }

   bool ClosePartialById(const long id, const double lots, const string reason = "SIGNAL")
     {
      for(int i = 0; i < ArraySize(m_pos); i++)
         if(m_pos[i].id == id)
           {
            SShadowPosition p = m_pos[i];
            double slip = SlipPrice(p.symbol);
            double px = (p.dir == SHADOW_DIR_LONG)
                        ? SymbolInfoDouble(p.symbol, SYMBOL_BID) - slip
                        : SymbolInfoDouble(p.symbol, SYMBOL_ASK) + slip;
            return CloseInternal(i, px, reason, lots);
           }
      return false;
     }

   int CloseAllByMagic(const ulong magic, const string reason = "SIGNAL")
     {
      int n = 0;
      for(int i = ArraySize(m_pos) - 1; i >= 0; i--)
         if(m_pos[i].magic == magic)
           {
            SShadowPosition p = m_pos[i];
            double slip = SlipPrice(p.symbol);
            double px = (p.dir == SHADOW_DIR_LONG)
                        ? SymbolInfoDouble(p.symbol, SYMBOL_BID) - slip
                        : SymbolInfoDouble(p.symbol, SYMBOL_ASK) + slip;
            if(CloseInternal(i, px, reason, 0.0)) n++;
           }
      return n;
     }

   bool ModifySLTP(const long id, const double sl, const double tp)
     {
      for(int i = 0; i < ArraySize(m_pos); i++)
         if(m_pos[i].id == id)
           {
            m_pos[i].sl = sl;
            m_pos[i].tp = tp;
            m_log.Event("MODIFY", StringFormat("\"tradeId\":\"%s\",\"sl\":%.5f,\"tp\":%.5f", m_pos[i].tradeId, sl, tp));
            SaveState();
            return true;
           }
      return false;
     }

   //--- queries the strategy layer needs (mirrors real-position reads) ---
   int  TotalOpen() const { return ArraySize(m_pos); }
   bool GetByIndex(const int i, SShadowPosition &out) const
     { if(i < 0 || i >= ArraySize(m_pos)) return false; out = m_pos[i]; return true; }
   bool GetById(const long id, SShadowPosition &out) const
     {
      for(int i = 0; i < ArraySize(m_pos); i++)
         if(m_pos[i].id == id) { out = m_pos[i]; return true; }
      return false;
     }

   int CountByMagic(const ulong magic) const
     {
      int n = 0;
      for(int i = 0; i < ArraySize(m_pos); i++) if(m_pos[i].magic == magic) n++;
      return n;
     }

   double FloatingByMagic(const ulong magic) const
     {
      double s = 0.0;
      for(int i = 0; i < ArraySize(m_pos); i++)
         if(m_pos[i].magic == magic) s += ShadowFloatingProfit(m_pos[i]) + m_pos[i].swapAcc + m_pos[i].commissionAcc;
      return s;
     }

   double VolumeByMagic(const ulong magic) const
     {
      double s = 0.0;
      for(int i = 0; i < ArraySize(m_pos); i++) if(m_pos[i].magic == magic) s += m_pos[i].volume;
      return s;
     }

   datetime LastEntryTimeByMagic(const ulong magic) const
     {
      datetime t = 0;
      for(int i = 0; i < ArraySize(m_pos); i++)
         if(m_pos[i].magic == magic && m_pos[i].entryTime > t) t = m_pos[i].entryTime;
      return t;
     }

   double LastEntryPriceByMagic(const ulong magic) const
     {
      datetime t = 0; double px = 0.0;
      for(int i = 0; i < ArraySize(m_pos); i++)
         if(m_pos[i].magic == magic && m_pos[i].entryTime >= t) { t = m_pos[i].entryTime; px = m_pos[i].entryPrice; }
      return px;
     }

   int DirByMagic(const ulong magic) const // -1 none, else ENUM_SHADOW_DIR of first
     {
      for(int i = 0; i < ArraySize(m_pos); i++) if(m_pos[i].magic == magic) return m_pos[i].dir;
      return -1;
     }

   //--- persistent on-chart banner (§7–8) --------------------------------
   void Overlay()
     {
      Comment(StringFormat(
         "TYO SHADOW FORWARD — NO LIVE ORDERS\n%s %s  session %s\nopen: %d   closed: %d   net(sim): %.2f\nfeed: %s",
         m_strategy, m_version, m_sessionId, ArraySize(m_pos), m_closed, m_netAcc,
         (TimeCurrent() - m_lastTick > m_feedStaleSec ? "STALE — entries blocked" : "live")));
     }
  };

#endif // TYO_SHADOW_EXECUTION_MQH
