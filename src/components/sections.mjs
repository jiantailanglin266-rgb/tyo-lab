import { html, raw, when, splitWords } from '../lib/html.mjs';
import { formatNumber } from '../lib/i18n.mjs';
import { STATS, COMMUNITY } from '../site.config.mjs';
import { GRID, project } from '../lib/worldmap.mjs';

/**
 * Background decoration. Purely visual, so every element is aria-hidden and
 * nothing here carries meaning a screen reader would miss.
 *
 *   aurora  — slow spectrum bloom (CSS, transform-only)
 *   lattice — engineering grid + sweeping spectrum hairline (CSS)
 *   hud     — corner brackets (CSS)
 *
 * All three are dropped under prefers-reduced-motion.
 */
export function Decor({ aurora = true, lattice = true, hud = false, soft = false } = {}) {
  return html`
    ${when(aurora, () => html`<div class="aurora${raw(soft ? ' aurora--soft' : '')}" aria-hidden="true"></div>`)}
    ${when(lattice, () => html`<div class="lattice" aria-hidden="true"></div>`)}
    ${when(hud, () => html`<div class="hud" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`)}
  `;
}

/** Small monospace label above a headline. */
export const Eyebrow = (text, n) =>
  html`<p class="eyebrow" data-reveal>${when(n, () => html`<span class="eyebrow__n">${n}</span>`)}<span>${text}</span></p>`;

/** Standard page hero used by every non-home page. */
export function PageHero({ eyebrow, h1, h2, lead, children }) {
  return html`
    <section class="phero" data-reveal-root>
      <div class="phero__inner">
        ${Eyebrow(eyebrow)}
        <h1 class="phero__title" data-reveal>
          <span class="phero__l1">${h1}</span>
          ${when(h2, () => html`<span class="phero__l2">${h2}</span>`)}
        </h1>
        ${when(lead, () => html`<p class="phero__lead" data-reveal>${lead}</p>`)}
        ${children || ''}
      </div>
      ${Decor({ hud: true })}
      <canvas class="phero__particles" data-particles="spectrum" aria-hidden="true"></canvas>
    </section>
  `;
}

/** Section heading block used inside content pages. */
export function SectionHead({ eyebrow, title, title2, lead, align = 'left' }) {
  return html`
    <header class="shead shead--${raw(align)}">
      ${when(eyebrow, () => Eyebrow(eyebrow))}
      <h2 class="shead__title" data-reveal>
        <span>${title}</span>${when(title2, () => html`<span class="shead__title2">${title2}</span>`)}
      </h2>
      ${when(lead, () => html`<p class="shead__lead" data-reveal>${lead}</p>`)}
    </header>
  `;
}

/** Primary / secondary call-to-action link. */
export function Button({ href, label, variant = 'primary', external = false, srNote = '' }) {
  return html`<a
    class="btn btn--${raw(variant)}"
    href="${href}"
    ${raw(external ? 'target="_blank" rel="noopener noreferrer"' : '')}
  >
    <span class="btn__label">${label}</span>
    <span class="btn__arrow" aria-hidden="true">${raw(external ? '↗' : '→')}</span>
    ${when(external && srNote, () => html`<span class="sr">${srNote}</span>`)}
  </a>`;
}

/** Key/value list rendered as a grid of small cards. */
export function KeyValueGrid(items, { cols = 3, mono = true } = {}) {
  return html`
    <ul class="kv kv--${raw(cols)}${raw(mono ? ' kv--mono' : '')}">
      ${items.map(
        (it, i) => html`<li class="kv__item" data-reveal style="--d:${i}">
          <span class="kv__k">${it.k}</span>
          <span class="kv__v">${it.v}</span>
        </li>`
      )}
    </ul>
  `;
}

/** Numbered pipeline (market data → … → EA). */
export function Steps(steps) {
  return html`
    <ol class="steps">
      ${steps.map(
        (s, i) => html`<li class="steps__item" data-reveal style="--d:${i}">
          <span class="steps__n">${s.n}</span>
          <span class="steps__body">
            <span class="steps__k">${s.k}</span>
            <span class="steps__v">${s.v}</span>
          </span>
        </li>`
      )}
    </ol>
  `;
}

/** Oversized word wall — CS / technology vocabulary. */
export function WordWall(words) {
  return html`
    <div class="wall" aria-hidden="true">
      ${words.map((w, i) => html`<span class="wall__w" data-reveal style="--d:${i}">${w}</span>`)}
    </div>
  `;
}

/**
 * Trust numbers. Anything with show:false or value:null never reaches the DOM,
 * so the site can never display a figure that has not been verified.
 */
export function Stats({ t, locale }) {
  const visible = STATS.filter((s) => s.show && s.value !== null && s.value !== undefined);
  if (!visible.length) return '';
  return html`
    <ul class="stats">
      ${visible.map(
        (s, i) => html`<li class="stats__item" data-reveal style="--d:${i}">
          <span class="stats__v" data-count="${s.value}" data-suffix="${s.suffix || ''}" data-locale="${locale}"
            >${formatNumber(s.value, locale)}${s.suffix || ''}</span
          >
          <span class="stats__k">${t.home.stats.labels[s.key] || s.key}</span>
        </li>`
      )}
    </ul>
  `;
}

/**
 * Dot-matrix world map. The canvas receives:
 *   data-mask  — base64 landmask generated at build time
 *   data-grid  — "cols,rows"
 *   data-points— "x,y,weight,home|…" in grid coordinates
 * A visually hidden list carries the same information for assistive tech.
 */
export function GlobalMap({ t, mask }) {
  const pts = COMMUNITY.map((c) => {
    const p = project(c.lon, c.lat);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)},${c.weight},${c.home ? 1 : 0}`;
  }).join(';');

  return html`
    <div class="map" data-reveal>
      <div class="map__canvas-wrap">
        <canvas
          class="map__canvas"
          data-worldmap
          data-mask="${mask}"
          data-grid="${GRID.cols},${GRID.rows}"
          data-points="${pts}"
          role="img"
          aria-label="${t.home.global.legend}"
        ></canvas>
      </div>
      <ul class="map__legend">
        ${COMMUNITY.filter((c) => c.weight >= 0.6).map(
          (c) => html`<li class="map__legend-item${raw(c.home ? ' is-home' : '')}">
            <span class="map__dot" aria-hidden="true"></span>${c.name}
          </li>`
        )}
      </ul>
    </div>
  `;
}

/** Development timeline (also used, trimmed, on EA detail pages). */
export function Timeline({ stages, locale, t, compact = false }) {
  return html`
    <ol class="tl${raw(compact ? ' tl--compact' : '')}">
      ${stages.map((s, i) => {
        const c = s[locale] || s.en;
        return html`<li class="tl__item" data-reveal style="--d:${i % 4}">
          <div class="tl__rail" aria-hidden="true"><span class="tl__node"></span></div>
          <div class="tl__body">
            <p class="tl__meta"><span class="tl__n">${s.n}</span><span class="tl__key">${s.key}</span></p>
            <h3 class="tl__title">${c.title}</h3>
            <p class="tl__text">${c.body}</p>
          </div>
        </li>`;
      })}
    </ol>
  `;
}

/** Full-width closing call to action. */
export function CTABlock({ title, body, primary, secondary }) {
  return html`
    <section class="cta" data-reveal-root>
      ${Decor({ soft: true })}
      <div class="cta__inner">
        <h2 class="cta__title" data-reveal>${splitWords(title, 'cta__w')}</h2>
        ${when(body, () => html`<p class="cta__body" data-reveal>${body}</p>`)}
        <div class="cta__actions" data-reveal>
          ${primary ? Button(primary) : ''}${secondary ? Button({ ...secondary, variant: 'ghost' }) : ''}
        </div>
      </div>
    </section>
  `;
}

/** Visible notice for content still carrying placeholder copy. */
export function PlaceholderNotice({ locale }) {
  const msg = {
    en: 'Sample content — this description is structural placeholder copy and will be replaced with the finalised product documentation.',
    ja: 'サンプル内容 — この説明は構成確認用のプレースホルダーであり、確定版のドキュメントに差し替えられます。',
    zh: '示例内容 — 此说明为结构占位文本，将由最终产品文档替换。',
    th: 'เนื้อหาตัวอย่าง — คำอธิบายนี้เป็นข้อความตัวอย่างเชิงโครงสร้าง และจะถูกแทนที่ด้วยเอกสารฉบับสมบูรณ์',
    id: 'Konten contoh — deskripsi ini adalah teks placeholder struktural dan akan diganti dengan dokumentasi final.',
    vi: 'Nội dung mẫu — phần mô tả này là văn bản tạm thời và sẽ được thay bằng tài liệu chính thức.',
    hi: 'नमूना सामग्री — यह विवरण संरचनात्मक प्लेसहोल्डर है और अंतिम दस्तावेज़ से बदला जाएगा।',
  };
  return html`<p class="notice" role="note"><span class="notice__tag">PLACEHOLDER</span>${msg[locale] || msg.en}</p>`;
}
