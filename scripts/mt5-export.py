"""
============================================================================
MT5 HISTORY EXPORTER (Phase 13A)
============================================================================
Exports closed-position history from a RUNNING, ALREADY-LOGGED-IN MetaTrader
5 terminal into the JSONSource shape that scripts/import-forward.mjs accepts
— including magic numbers and comments, which HTML statements never carry.

    pip install MetaTrader5
    python scripts/mt5-export.py --days 365 --out data/forward/exports/mt5.json

Then feed it to the same import pipeline as any file:

    node scripts/import-forward.mjs data/forward/exports/mt5.json \
         --account ACC-FWD-001 --type FORWARD_DEMO --currency USD ...

SECURITY / PRIVACY (docs/FORWARD_SECURITY_PRIVACY.md):
  - READ-ONLY: this script never places, modifies or closes orders.
  - NO CREDENTIALS: it attaches to the terminal the owner already opened;
    no login, password or server is accepted, stored or printed.
  - The export lands under data/forward/ (gitignored) — trade-level data
    never enters the public repository.
  - The account NUMBER is not written into the export; the importer assigns
    the internal ACC-FWD/LIVE id. The terminal's trade mode (demo/real) is
    included so the importer's FORWARD_DEMO vs LIVE claim can be sanity-
    checked by a human before import.
============================================================================
"""

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone

try:
    import MetaTrader5 as mt5  # type: ignore
except ImportError:
    print("MetaTrader5 package missing:  pip install MetaTrader5", file=sys.stderr)
    sys.exit(1)


def main() -> int:
    ap = argparse.ArgumentParser(description="Export MT5 closed-position history as JSONSource trades")
    ap.add_argument("--days", type=int, default=365, help="how far back to export (default 365)")
    ap.add_argument("--out", required=True, help="output JSON path (keep it under data/forward/, which is gitignored)")
    ap.add_argument("--magic", type=int, default=None, help="export only this magic number")
    args = ap.parse_args()

    if not mt5.initialize():
        print(f"cannot attach to a running MT5 terminal: {mt5.last_error()}", file=sys.stderr)
        return 1

    try:
        acc = mt5.account_info()
        if acc is None:
            print("no account logged in", file=sys.stderr)
            return 1

        now = datetime.now(timezone.utc)
        deals = mt5.history_deals_get(now - timedelta(days=args.days), now + timedelta(days=1))
        if deals is None:
            print(f"history_deals_get failed: {mt5.last_error()}", file=sys.stderr)
            return 1

        # Group deals by position id: entry deal opens, exit deal(s) close.
        # Swap/commission/fees accumulate across every deal of the position.
        positions: dict[int, dict] = {}
        for d in deals:
            if d.type not in (mt5.DEAL_TYPE_BUY, mt5.DEAL_TYPE_SELL):
                continue  # balance ops, credits etc.
            p = positions.setdefault(d.position_id, {
                "ticket": str(d.position_id),
                "magic": None, "symbol": None, "direction": None, "volume": 0.0,
                "openTime": None, "closeTime": None, "openPrice": None, "closePrice": None,
                "profit": 0.0, "swap": 0.0, "commission": 0.0, "fees": 0.0,
                "sl": None, "tp": None, "comment": None,
            })
            p["swap"] += d.swap
            p["commission"] += d.commission
            p["fees"] += getattr(d, "fee", 0.0) or 0.0
            p["profit"] += d.profit
            if d.entry == mt5.DEAL_ENTRY_IN:
                p["magic"] = d.magic
                p["symbol"] = d.symbol
                p["direction"] = "long" if d.type == mt5.DEAL_TYPE_BUY else "short"
                p["volume"] = d.volume
                p["openTime"] = d.time_msc
                p["openPrice"] = d.price
                p["comment"] = d.comment or None
            elif d.entry in (mt5.DEAL_ENTRY_OUT, mt5.DEAL_ENTRY_OUT_BY):
                p["closeTime"] = d.time_msc
                p["closePrice"] = d.price
                if d.comment and not p["comment"]:
                    p["comment"] = d.comment

        trades = []
        for p in positions.values():
            if p["closeTime"] is None:  # still open — not evidence yet
                continue
            if args.magic is not None and p["magic"] != args.magic:
                continue
            p["netProfit"] = round(p["profit"] + p["swap"] + p["commission"] + p["fees"], 2)
            for k in ("profit", "swap", "commission", "fees", "volume"):
                p[k] = round(p[k], 2)
            trades.append(p)
        trades.sort(key=lambda t: t["closeTime"])

        out = {
            "_source": "mt5-export.py (read-only; no credentials stored)",
            "_exportedAt": now.isoformat(),
            "_terminal": {
                # NO login number, NO server, NO name — only what a human
                # needs to pick --type and --currency correctly at import.
                "tradeMode": {0: "demo", 1: "contest", 2: "real"}.get(acc.trade_mode, str(acc.trade_mode)),
                "currency": acc.currency,
                "leverage": acc.leverage,
            },
            "trades": trades,
        }
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False)

        magics = sorted({t["magic"] for t in trades if t["magic"] is not None})
        print(f"exported {len(trades)} closed positions -> {args.out}")
        print(f"terminal: {out['_terminal']['tradeMode']} account, {acc.currency}")
        print(f"magic numbers seen: {magics or 'none'}  (map them in config/magic-map.mjs)")
        return 0
    finally:
        mt5.shutdown()


if __name__ == "__main__":
    sys.exit(main())
