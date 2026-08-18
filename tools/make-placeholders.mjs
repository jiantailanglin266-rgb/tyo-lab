/**
 * Generates the placeholder brand + media assets so the site is visually
 * complete before any real artwork or footage exists.
 *
 *   node tools/make-placeholders.mjs
 *
 * Everything it writes is safe to overwrite with the real thing — the file
 * NAMES are the contract, referenced from src/site.config.mjs.
 * Existing files are never clobbered unless you pass --force.
 */

import { writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const FORCE = process.argv.includes('--force');

const SPECTRUM = ['#FF3B30', '#FF9F0A', '#FFD60A', '#32D74B', '#40E0D0', '#0A84FF', '#BF5AF2'];

const exists = (p) => access(p, constants.F_OK).then(() => true, () => false);

async function put(rel, data) {
  const full = join(PUBLIC, rel);
  if (!FORCE && (await exists(full))) {
    console.log(`  · kept    ${rel} (already exists)`);
    return;
  }
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, data);
  console.log(`  · wrote   ${rel}`);
}

/* ------------------------------------------------------------------ *
 * Deterministic pseudo-random so rebuilds produce identical files.
 * ------------------------------------------------------------------ */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const gradientStops = (id, angle = 0) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="${angle ? 1 : 0}">${SPECTRUM.map(
    (c, i) => `<stop offset="${((i / (SPECTRUM.length - 1)) * 100).toFixed(1)}%" stop-color="${c}"/>`
  ).join('')}</linearGradient>`;

/* ------------------------------------------------------------------ *
 * Logo — full wordmark
 * ------------------------------------------------------------------ */

const logoFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 128" width="440" height="128" role="img" aria-label="TYO">
  <defs>${gradientStops('g')}</defs>
  <g fill="none" stroke="url(#g)" stroke-width="7" stroke-linecap="square">
    <!-- T -->
    <path d="M18 26h84M60 26v72"/>
    <!-- Y -->
    <path d="M130 26l32 38 32-38M162 64v34"/>
    <!-- O -->
    <circle cx="268" cy="62" r="36"/>
  </g>
  <circle cx="268" cy="62" r="7" fill="url(#g)"/>
  <text x="330" y="52" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" letter-spacing="3.2" fill="#8A8A8E">POWERED</text>
  <text x="330" y="70" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11" letter-spacing="3.2" fill="#8A8A8E">BY TYO</text>
  <rect x="330" y="82" width="92" height="2" fill="url(#g)"/>
</svg>
`;

const logoMark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="TYO">
  <defs>${gradientStops('gm', 1)}</defs>
  <rect x="1" y="1" width="62" height="62" rx="3" fill="none" stroke="url(#gm)" stroke-width="2"/>
  <g fill="none" stroke="url(#gm)" stroke-width="3.2" stroke-linecap="square">
    <path d="M16 20h32M32 20v26"/>
  </g>
  <circle cx="32" cy="46" r="4.5" fill="url(#gm)"/>
</svg>
`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>${gradientStops('gf', 1)}</defs>
  <rect width="64" height="64" rx="10" fill="#050505"/>
  <g fill="none" stroke="url(#gf)" stroke-width="4" stroke-linecap="square">
    <path d="M17 21h30M32 21v24"/>
  </g>
  <circle cx="32" cy="46" r="4" fill="url(#gf)"/>
</svg>
`;

/* ------------------------------------------------------------------ *
 * Video posters — one per slot, tinted to the slot's theme.
 * ------------------------------------------------------------------ */

const THEMES = {
  spectrum: ['#0A84FF', '#BF5AF2', '#FF3B30'],
  cyan: ['#40E0D0', '#0A84FF', '#7EE8DD'],
  violet: ['#BF5AF2', '#0A84FF', '#E0A8FF'],
  amber: ['#FF9F0A', '#FFD60A', '#FF3B30'],
  blue: ['#0A84FF', '#40E0D0', '#8EC5FF'],
};

function poster(id, theme, caption) {
  const cols = THEMES[theme] || THEMES.spectrum;
  const r = rng(id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 7));

  const dots = Array.from({ length: 130 }, () => {
    const x = (r() * 1920).toFixed(0);
    const y = (r() * 1080).toFixed(0);
    const rad = (0.8 + r() * 2.8).toFixed(2);
    const c = cols[(r() * cols.length) | 0];
    const o = (0.16 + r() * 0.5).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${rad}" fill="${c}" opacity="${o}"/>`;
  }).join('');

  const lines = Array.from({ length: 16 }, () => {
    const x1 = (r() * 1920).toFixed(0);
    const y1 = (r() * 1080).toFixed(0);
    const x2 = (Number(x1) + (r() - 0.5) * 420).toFixed(0);
    const y2 = (Number(y1) + (r() - 0.5) * 300).toFixed(0);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFFFFF" stroke-width="0.6" opacity="0.07"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" role="img" aria-label="${caption}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="78%">
      <stop offset="0%" stop-color="${cols[0]}" stop-opacity="0.20"/>
      <stop offset="46%" stop-color="${cols[1]}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#050505" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      ${SPECTRUM.map((c, i) => `<stop offset="${((i / 6) * 100).toFixed(0)}%" stop-color="${c}"/>`).join('')}
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="#050505"/>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  ${lines}
  ${dots}
  <rect x="120" y="906" width="220" height="2" fill="url(#bar)" opacity="0.9"/>
  <text x="120" y="962" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="26" letter-spacing="9" fill="#67686D">${id}</text>
  <text x="120" y="1004" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="19" letter-spacing="5" fill="#3A3B40">PLACEHOLDER POSTER — REPLACE WITH FRAME EXPORT</text>
</svg>
`;
}

/* ------------------------------------------------------------------ *
 * Minimal PNG writer (node:zlib only) for the OG image + touch icon.
 * ------------------------------------------------------------------ */

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** rgba: Uint8Array of w*h*4 */
function png(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** 5×7 bitmap glyphs — enough for the wordmark on the OG card. */
const GLYPHS = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
};

function ogImage() {
  const W = 1200;
  const H = 630;
  const buf = new Uint8Array(W * H * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    const al = a / 255;
    buf[i] = Math.round(buf[i] * (1 - al) + r * al);
    buf[i + 1] = Math.round(buf[i + 1] * (1 - al) + g * al);
    buf[i + 2] = Math.round(buf[i + 2] * (1 - al) + b * al);
    buf[i + 3] = 255;
  };

  // Background: near-black with a soft violet/blue bloom.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - W * 0.5) / (W * 0.62);
      const dy = (y - H * 0.42) / (H * 0.72);
      const d = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      const glow = Math.pow(d, 2.4);
      const i = (y * W + x) * 4;
      buf[i] = Math.round(5 + glow * 22);
      buf[i + 1] = Math.round(5 + glow * 16);
      buf[i + 2] = Math.round(5 + glow * 48);
      buf[i + 3] = 255;
    }
  }

  // Probability-cloud dots.
  const r = rng(20240101);
  for (let n = 0; n < 240; n++) {
    const x = (r() * W) | 0;
    const y = (r() * H) | 0;
    const rad = 0.8 + r() * 2.4;
    const [cr, cg, cb] = hex(SPECTRUM[(r() * SPECTRUM.length) | 0]);
    const a = 40 + r() * 150;
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        if (dx * dx + dy * dy > rad * rad) continue;
        set(x + Math.round(dx), y + Math.round(dy), cr, cg, cb, a);
      }
    }
  }

  // "TYO" in spectrum-tinted blocks.
  const scale = 26;
  const word = 'TYO';
  const totalW = word.length * 5 * scale + (word.length - 1) * scale;
  let px = Math.round((W - totalW) / 2);
  const py = Math.round(H * 0.34);
  word.split('').forEach((ch, gi) => {
    const g = GLYPHS[ch];
    for (let ry = 0; ry < g.length; ry++) {
      for (let rx = 0; rx < 5; rx++) {
        if (g[ry][rx] !== '1') continue;
        const [cr, cg, cb] = hex(SPECTRUM[(gi * 2 + Math.floor(rx / 2)) % SPECTRUM.length]);
        for (let y = 0; y < scale; y++) for (let x = 0; x < scale; x++) set(px + rx * scale + x, py + ry * scale + y, cr, cg, cb, 255);
      }
    }
    px += 6 * scale;
  });

  // Spectrum rule beneath the wordmark.
  const barY = py + 7 * scale + 44;
  const barW = 520;
  const barX = Math.round((W - barW) / 2);
  for (let x = 0; x < barW; x++) {
    const f = (x / barW) * (SPECTRUM.length - 1);
    const i0 = Math.floor(f);
    const tt = f - i0;
    const a = hex(SPECTRUM[i0]);
    const b = hex(SPECTRUM[Math.min(SPECTRUM.length - 1, i0 + 1)]);
    const col = [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * tt));
    for (let y = 0; y < 4; y++) set(barX + x, barY + y, col[0], col[1], col[2], 255);
  }

  return png(W, H, buf);
}

function touchIcon() {
  const S = 180;
  const buf = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      buf[i] = 5;
      buf[i + 1] = 5;
      buf[i + 2] = 5;
      buf[i + 3] = 255;
    }
  }
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = (y * S + x) * 4;
    buf[i] = c[0];
    buf[i + 1] = c[1];
    buf[i + 2] = c[2];
    buf[i + 3] = 255;
  };
  // Stylised T over a dot — same mark as the SVG favicon.
  const bar = hex('#40E0D0');
  for (let x = 46; x < 134; x++) for (let y = 52; y < 62; y++) set(x, y, hex(SPECTRUM[Math.floor(((x - 46) / 88) * SPECTRUM.length) % SPECTRUM.length]));
  for (let y = 52; y < 122; y++) for (let x = 85; x < 95; x++) set(x, y, bar);
  for (let y = -14; y <= 14; y++)
    for (let x = -14; x <= 14; x++) if (x * x + y * y <= 196) set(90 + x, 136 + y, hex('#BF5AF2'));
  return png(S, S, buf);
}

/* ------------------------------------------------------------------ *
 * run
 * ------------------------------------------------------------------ */

console.log('\n  TYO — placeholder assets\n');

await put('assets/logo/tyo-logo.svg', logoFull);
await put('assets/logo/tyo-mark.svg', logoMark);
await put('assets/logo/favicon.svg', favicon);
await put('assets/logo/apple-touch-icon.png', touchIcon());
await put('assets/og/og-default.png', ogImage());

const SLOTS = [
  ['VIDEO_01_HERO', 'spectrum', 'Hero'],
  ['VIDEO_02_AI', 'cyan', 'AI'],
  ['VIDEO_03_ALGORITHM', 'violet', 'Algorithm'],
  ['VIDEO_04_BACKTEST', 'amber', 'Backtest'],
  ['VIDEO_05_GLOBAL', 'blue', 'Global'],
  ['VIDEO_06_FINAL', 'spectrum', 'Final'],
];
for (const [id, theme, caption] of SLOTS) {
  await put(`assets/posters/${id}.svg`, poster(id, theme, caption));
}

console.log('\n  ✓ placeholders ready — replace any of these with the real asset at the same path.\n');
