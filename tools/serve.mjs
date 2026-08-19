/**
 * Static preview server for dist/ — development only.
 *   node tools/serve.mjs [port]
 *
 * Serves clean URLs the way a static host does: /en/ea/ → dist/en/ea/index.html,
 * and falls back to 404.html so the not-found page can be checked locally.
 */

import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.argv[2]) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const isFile = (p) => stat(p).then((s) => s.isFile(), () => false);

/**
 * Dev-only: POST a data: URL to /__shot to write it next to the server as a
 * file. Used to eyeball canvas output when the browser's own screenshot path
 * is unavailable. Never shipped — this file is not part of dist/.
 */
async function handleShot(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString('utf8');
  const m = body.match(/^data:image\/(png|jpeg);base64,(.+)$/s);
  if (!m) {
    res.writeHead(400).end('expected a data:image/... URL');
    return;
  }
  const file = join(ROOT, '..', `__shot.${m[1] === 'jpeg' ? 'jpg' : 'png'}`);
  await writeFile(file, Buffer.from(m[2], 'base64'));
  res.writeHead(200, { 'Content-Type': 'text/plain' }).end(file);
}

createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/__shot') return handleShot(req, res);
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let rel = normalize(url).replace(/^(\.\.[/\\])+/, '');
    let file = join(ROOT, rel);

    if (rel.endsWith('/')) file = join(file, 'index.html');
    if (!(await isFile(file)) && !extname(file)) file = join(ROOT, rel, 'index.html');

    if (!(await isFile(file))) {
      const nf = join(ROOT, '404.html');
      const body = (await isFile(nf)) ? await readFile(nf) : Buffer.from('404');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(body);
    }

    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(err && err.message));
  }
}).listen(PORT, () => {
  console.log(`\n  TYO preview → http://localhost:${PORT}/\n`);
});
