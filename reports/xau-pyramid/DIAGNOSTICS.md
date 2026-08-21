# XAU_PYRAMID diagnostics log (Phase 15.1)

Debug runs (`--type baseline`, budget-exempt: implementation verification, not
strategy research). All periods inside the development layer; HOLD-XAU-001
untouched and SEALED throughout.

## Bug 1 — zero trades in 8 years (BASELINE-0001)

BASELINE-0001 (2016-02→2023-12, history quality 100%) produced **0 trades**.
Bisect on 2023-03 (1 month):

| Run | Change vs baseline | Trades |
|---|---|---|
| DIAG-0004 | trend diffs 5/3 + all filters open | 475 |
| DIAG-0005 | filters open, trend diffs baseline 40/30 | 193 |
| DIAG-0006 | only vol/spread filter opened | 108 |
| DIAG-0007 | only relATR band opened (spread/ATR 0.25 kept) | ~97 |
| DIAG-0008 | pure baseline params, **fixed build** | 96 |

Root cause: `CVolatilityFilter::RelativeATR()` returned
`ATR(M5,14) / ATR(H4,50)` — a cross-timeframe ratio whose natural scale is
`~1/sqrt(48) ≈ 0.14`, structurally below the `[0.6, 3.0]` regime band, so the
volatility gate blocked **every** entry. DEMON trend, sessions, spread gates,
pyramid and risk logic were all healthy (DIAG-0005/-0006).

Fix (VolatilityFilter.mqh): bar-time normalization
`rel = (ATR_entry / ATR_long) * sqrt(PeriodSeconds(longTF)/PeriodSeconds(entryTF))`
so a steady regime reads ≈ 1.0 and the band means what it says. Parameter
values unchanged; recompiled 0 errors / 0 warnings. DIAG-0008 confirms the
band now trims only genuine regime extremes (96 vs 108 unfiltered).

## Infra 1 — "tester agent authorization error" → empty reports

Docker Desktop (`com.docker.backend`) listens on `0.0.0.0:3000`. When the MT5
dispatcher picked local agent port 3000 and connected before its own agent
bound `127.0.0.1:3000`, the connection landed on Docker's socket → 30 s
timeout → aborted run with an empty report (bars 0, period 1970). This began
the moment the owner's terminal restarted at 06:15 and released its own hold
on port 3000 (earlier successes had silently routed to 3001/3003).

Mitigations (scripts/):
- `xau-port-guard.mjs` — holds `127.0.0.1:3000` (idempotent, 12 h TTL) so the
  dispatcher falls through to 3001+, which MT5 treats as normal. Non-invasive
  for the owner's terminal (it falls through the same way).
- `xau-research-run.mjs` — detects empty reports (`1970.01.01` signature),
  discards and relaunches up to 4 attempts; spawns the port guard before each
  run.

DIAG-0001/0002/0003 were empty-report casualties of this race (deleted).
BASELINE-0001 was a *real* run of the buggy build and is kept as the record
of Bug 1.

## Infra 2 — long runs "freezing" (BASELINE-0002 ×3, TRACE-0003)

Not a freeze. A trace build (per-tick Print around the suspect timestamp)
passed the "stuck" timestamp normally at CPU 98%; the agent log had merely
stopped because no trade events occurred. Every long run was instead
**terminated externally**: the owner's EA automation
(`STELLAR\EA\scripts\pyr_*.py` → `taskkill /F /IM terminal64.exe`,
`monitoring/shadow_runner.py` → `Stop-Process`) kills MT5 *by process
name*, and the research terminal shares that name. MT5 refuses to run under
a renamed executable (exit 10001), so the name cannot be changed.

Mitigations (no change to the owner's scripts):
- runner detects the terminal's disappearance immediately and relaunches
  (instead of waiting out the timeout); partial reports (bars ≪ period)
  are discarded, not archived;
- `xau-segmented-run.mjs` runs calendar-year segments (2–4 min each) and
  merges them into one analysis with a continuous equity curve (balance
  rebuilt from the profit stream) — a kill costs one segment, not 8 years;
- window minimized at launch so a stray MT5 window is not hand-closed.
- Lesson: never run two drivers at once — a portable MT5 folder is
  single-instance and the second launch exits in ~8 s (looked like a kill).

## Data 1 — 2017.hcc corrupt in the research copy

Y2017 stopped at exactly 6,516 bars twice (1,205 ticks/bar vs ≈20 for
every other year; 13 GB tick cache, memory exhaustion). The agent log
showed the M5 cache holding only 2016 data for a 2017 test: the copied
`history\GOLD\2017.hcc` was unusable. Quarantined to
`C:\TYO-Research\_quarantine\2017.hcc.broken`; re-downloaded from the
server for the rerun. Tick-density sanity check (ticks/bar ≈ 20 for model 1)
is now part of segment review.
