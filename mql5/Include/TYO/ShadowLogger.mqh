//+------------------------------------------------------------------+
//| TYO SHADOW FORWARD ENGINE — append-only JSONL logger + state      |
//| Events (brief §37): SESSION_START SIGNAL ENTRY MODIFY             |
//| PARTIAL_CLOSE EXIT FEED_GAP SESSION_END ERROR                     |
//| Files under MQL5/Files/TYO/shadow/ (brief §36):                   |
//|   shadow-<strategy>-YYYY-MM-DD.jsonl   daily rotation (§90)       |
//|   shadow-state-<strategy>.json         atomic snapshot (§40)      |
//+------------------------------------------------------------------+
#ifndef TYO_SHADOW_LOGGER_MQH
#define TYO_SHADOW_LOGGER_MQH

#include <TYO/ShadowPosition.mqh>

//--- minimal JSON string escaping
string ShadowJsonEsc(const string s)
  {
   string r = s;
   StringReplace(r, "\\", "\\\\");
   StringReplace(r, "\"", "\\\"");
   StringReplace(r, "\n", "\\n");
   StringReplace(r, "\r", "\\r");
   return r;
  }

string ShadowIsoUTC(const datetime t)
  {
   return TimeToString(t, TIME_DATE | TIME_SECONDS); // broker server time;
   // normalisation to UTC happens in the importer using session metadata
  }

class CShadowLogger
  {
private:
   string            m_dir;
   string            m_strategy;
   string            m_stateFile;

   string LogFileName()
     {
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      return StringFormat("%sshadow-%s-%04d-%02d-%02d.jsonl", m_dir, m_strategy, dt.year, dt.mon, dt.day);
     }

public:
   bool Init(const string strategyId)
     {
      m_strategy  = strategyId;
      m_dir       = "TYO\\shadow\\";
      m_stateFile = m_dir + "shadow-state-" + strategyId + ".txt"; // line format, not JSON
      if(!FolderCreate("TYO") && GetLastError() != 5019) { /* exists is fine */ }
      ResetLastError();
      if(!FolderCreate("TYO\\shadow") && GetLastError() != 5019) { }
      ResetLastError();
      return true;
     }

   //--- append one raw JSON line (caller builds the object body)
   bool Append(const string json)
     {
      int h = FileOpen(LogFileName(), FILE_READ | FILE_WRITE | FILE_TXT | FILE_ANSI | FILE_SHARE_READ);
      if(h == INVALID_HANDLE) return false;
      FileSeek(h, 0, SEEK_END);
      FileWriteString(h, json + "\n");
      FileClose(h);
      return true;
     }

   bool Event(const string event, const string fields)
     {
      string line = "{\"event\":\"" + event + "\",\"timestamp\":\"" + ShadowIsoUTC(TimeCurrent()) + "\"";
      if(StringLen(fields) > 0) line += "," + fields;
      line += "}";
      return Append(line);
     }

   //--- serialise one position for EXIT / state lines
   string PositionJson(const SShadowPosition &p, const double lots, const double exitPrice,
                       const string exitReason, const double gross, const double netProfit,
                       const int exitSpreadPts)
     {
      return StringFormat(
         "\"tradeId\":\"%s\",\"strategyId\":\"%s\",\"version\":\"%s\",\"magic\":%I64u," +
         "\"symbol\":\"%s\",\"direction\":\"%s\",\"volume\":%.2f," +
         "\"signalTime\":%I64d,\"entryTime\":%I64d,\"entryPrice\":%.5f," +
         "\"exitTime\":%I64d,\"exitPrice\":%.5f,\"exitReason\":\"%s\"," +
         "\"sl\":%.5f,\"tp\":%.5f,\"entrySpread\":%d,\"exitSpread\":%d," +
         "\"grossProfit\":%.2f,\"swap\":%.2f,\"commission\":%.2f,\"fees\":0," +
         "\"netProfit\":%.2f",
         ShadowJsonEsc(p.tradeId), ShadowJsonEsc(p.strategyId), ShadowJsonEsc(p.version), p.magic,
         p.symbol, (p.dir == SHADOW_DIR_LONG ? "long" : "short"), lots,
         (long)p.signalTime * 1000, (long)p.entryTime * 1000, p.entryPrice,
         (long)TimeCurrent() * 1000, exitPrice, exitReason,
         p.sl, p.tp, p.entrySpreadPts, exitSpreadPts,
         gross, p.swapAcc, p.commissionAcc, netProfit);
     }

   //--- ATOMIC state snapshot (brief §40): write tmp, then move over
   bool SaveState(const string json)
     {
      string tmp = m_stateFile + ".tmp";
      int h = FileOpen(tmp, FILE_WRITE | FILE_TXT | FILE_ANSI);
      if(h == INVALID_HANDLE) return false;
      FileWriteString(h, json);
      FileClose(h);
      if(FileIsExist(m_stateFile)) FileDelete(m_stateFile);
      return FileMove(tmp, 0, m_stateFile, 0);
     }

   string LoadState()
     {
      if(!FileIsExist(m_stateFile)) return "";
      int h = FileOpen(m_stateFile, FILE_READ | FILE_TXT | FILE_ANSI);
      if(h == INVALID_HANDLE) return "";
      string s = "";
      while(!FileIsEnding(h)) s += FileReadString(h) + "\n";
      FileClose(h);
      return s;
     }
  };

#endif // TYO_SHADOW_LOGGER_MQH
