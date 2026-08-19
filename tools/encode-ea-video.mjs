/**
 * ============================================================================
 * EA video encoder
 * ============================================================================
 *   node tools/encode-ea-video.mjs <slug> <source.mp4> [--width 1280] [--crf 24]
 *
 * Turns a raw screen recording into something a web page can actually serve,
 * and writes the poster frame alongside it:
 *
 *   public/assets/videos/ea/<slug>.mp4
 *   public/assets/posters/ea/<slug>.jpg
 *
 * Then point the EA at it in src/data/ea.mjs:
 *
 *   video: { type: 'file', src: '/assets/videos/ea/<slug>.mp4',
 *            poster: '/assets/posters/ea/<slug>.jpg' }
 *
 * WHY RE-ENCODE
 *   These recordings come off the desktop at 9–10 Mbps and hundreds of MB.
 *   GitHub rejects single files over 100 MB, and no visitor should download
 *   400 MB to watch a backtest replay. Chart footage is mostly static, so it
 *   compresses to a small fraction of that with no visible loss.
 *
 * Requires ffmpeg on PATH.
 * ============================================================================
 */

import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));

const slug = positional[0];
const source = positional[1];
const WIDTH = Number(flag('width', 1280));
const CRF = Number(flag('crf', 24));
/** Seconds into the file to grab the poster from — past any fade-in. */
const POSTER_AT = Number(flag('poster-at', 3));
/** Silent screen captures carry no audio worth 96 kbps for 20 minutes. */
const MUTE = argv.includes('--mute');
/**
 * Chart replays hold still between ticks, so 24 fps looks identical to 30 and
 * costs ~20% fewer bits. Only worth forcing on long recordings.
 */
const FPS = flag('fps', null);
/** Background music survives 64k fine; dialogue would not. */
const ABR = flag('abr', '96k');

if (!slug || !source) {
  console.error(
    'usage: node tools/encode-ea-video.mjs <slug> <source.mp4>\n' +
      '       [--width 1280] [--crf 24] [--fps 24] [--abr 96k] [--mute] [--poster-at 3]'
  );
  process.exit(1);
}

const VIDEO_OUT = join(ROOT, 'public', 'assets', 'videos', 'ea', `${slug}.mp4`);
const POSTER_OUT = join(ROOT, 'public', 'assets', 'posters', 'ea', `${slug}.jpg`);

function run(args, label) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => {
      const s = d.toString();
      err += s;
      // ffmpeg prints progress on stderr; echo just the timestamp line.
      const m = s.match(/time=(\d+:\d+:\d+\.\d+)/g);
      if (m) process.stdout.write(`\r    ${label} ${m[m.length - 1].slice(5)}   `);
    });
    p.on('error', (e) =>
      reject(new Error(e.code === 'ENOENT' ? 'ffmpeg not found on PATH' : e.message))
    );
    p.on('close', (code) => {
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
      code === 0 ? resolve() : reject(new Error(err.split('\n').slice(-14).join('\n')));
    });
  });
}

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

console.log(`\n  Encoding ${slug}\n    source ${source}`);
const before = (await stat(source)).size;
console.log(`    in     ${mb(before)}  →  ${WIDTH}px wide, CRF ${CRF}\n`);

await mkdir(dirname(VIDEO_OUT), { recursive: true });
await mkdir(dirname(POSTER_OUT), { recursive: true });

await run(
  [
    '-y', '-v', 'error', '-stats',
    '-i', source,
    // -2 keeps the height even, which H.264 requires; these recordings are
    // often an odd pixel size straight off the desktop.
    '-vf', `scale=${WIDTH}:-2`,
    ...(FPS ? ['-r', String(FPS)] : []),
    '-c:v', 'libx264',
    '-crf', String(CRF),
    '-preset', 'slow',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    // Start playback before the whole file arrives.
    '-movflags', '+faststart',
    ...(MUTE ? ['-an'] : ['-c:a', 'aac', '-b:a', ABR, '-ac', '2']),
    VIDEO_OUT,
  ],
  'video'
);

await run(
  ['-y', '-v', 'error', '-ss', String(POSTER_AT), '-i', VIDEO_OUT, '-frames:v', '1', '-q:v', '4', POSTER_OUT],
  'poster'
);

const after = (await stat(VIDEO_OUT)).size;
const poster = (await stat(POSTER_OUT)).size;

console.log(`  ✓ ${mb(before)} → ${mb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`);
console.log(`    /assets/videos/ea/${slug}.mp4`);
console.log(`    /assets/posters/ea/${slug}.jpg  (${Math.round(poster / 1024)} KB)`);

if (after > 100 * 1048576)
  console.log(`\n  ! Still over GitHub's 100 MB per-file limit — re-run with a lower --width or higher --crf.\n`);
else console.log('');
