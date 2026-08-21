/**
 * ============================================================================
 * Local tester-agent port guard (Phase 15.1 infrastructure)
 * ============================================================================
 * Docker Desktop holds a wildcard listener on 0.0.0.0:3000. When the MT5
 * tester dispatcher picks agent port 3000 and connects BEFORE its own agent
 * binds 127.0.0.1:3000, the connection lands on Docker's socket and the run
 * aborts with "tester agent authorization error" (empty report).
 *
 * Holding 127.0.0.1:3000 ourselves makes the dispatcher's port-availability
 * check fail, so it falls through to 3001+ where no foreign listener exists —
 * observed to succeed deterministically. MT5 treats a busy agent port as
 * normal (any other terminal on this machine falls through the same way),
 * so this is non-invasive for the owner's terminal.
 *
 * Runs detached; exits by itself after --ttl-hours (default 12) or when the
 * port is already held (idempotent).
 * ============================================================================
 */

import net from 'node:net';

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const PORT = Number(flag('port', 3000));
const TTL = Number(flag('ttl-hours', 12)) * 3600000;

const srv = net.createServer((sock) => sock.destroy());
srv.on('error', (e) => {
  if (e.code === 'EADDRINUSE') process.exit(0); // already guarded (or agent active) — nothing to do
  console.error(`port-guard: ${e.message}`);
  process.exit(1);
});
srv.listen(PORT, '127.0.0.1', () => {
  console.log(`port-guard: holding 127.0.0.1:${PORT} for ${TTL / 3600000}h`);
  setTimeout(() => process.exit(0), TTL).unref();
  // keep the event loop alive for the TTL
  setInterval(() => {}, 1 << 30);
});
