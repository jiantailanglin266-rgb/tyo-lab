import { html, raw, when } from '../lib/html.mjs';
import { asset } from '../lib/url.mjs';

/**
 * Cinematic background video.
 *
 * The build passes `available` after checking whether any encoded file for the
 * slot actually exists on disk. When nothing is there we render the poster
 * layer alone — no <video>, no failing requests, and the section still looks
 * finished. Drop a file into public/assets/videos/ and the next build wires it
 * up with no template change.
 *
 * Loading strategy:
 *   priority slot (hero) → sources inline, preload="metadata", autoplay
 *   every other slot     → sources in data-* attributes, attached by
 *                          IntersectionObserver in main.js
 */
export function CinematicVideo({ video, available, priority = false, label = '' }) {
  const poster = asset(video.poster);
  const cls = `vid vid--${video.theme || 'spectrum'}${priority ? ' vid--priority' : ''}`;
  // `available` is the per-encoding map computed by the build
  // ({webm, mp4, webmMobile, mp4Mobile, any}); a bare boolean still works.
  const av = typeof available === 'object' && available !== null ? available : { any: !!available };

  if (!av.any) {
    return html`
      <div class="${raw(cls)} vid--poster-only" data-video-fallback>
        <img class="vid__poster" src="${poster}" alt="" width="1920" height="1080" ${raw(priority ? 'fetchpriority="high"' : 'loading="lazy"')} decoding="async" />
        <canvas class="vid__particles" data-particles="${video.theme || 'spectrum'}" aria-hidden="true"></canvas>
        <div class="vid__scrim"></div>
      </div>
    `;
  }

  if (priority) {
    return html`
      <div class="${raw(cls)}" data-video data-video-id="${video.id}">
        <video
          class="vid__el"
          poster="${poster}"
          muted
          loop
          playsinline
          autoplay
          preload="metadata"
          aria-label="${label}"
          disablepictureinpicture
        >
          ${when(av.webm, () => html`<source src="${asset(video.webm)}" type="video/webm" />`)}
          ${when(av.mp4, () => html`<source src="${asset(video.mp4)}" type="video/mp4" />`)}
        </video>
        <div class="vid__scrim"></div>
      </div>
    `;
  }

  return html`
    <div class="${raw(cls)}" data-video data-video-id="${video.id}" data-lazy-video>
      <video
        class="vid__el"
        poster="${poster}"
        muted
        loop
        playsinline
        preload="none"
        aria-label="${label}"
        disablepictureinpicture
        ${when(av.webm, () => raw(`data-webm="${asset(video.webm)}"`))}
        ${when(av.mp4, () => raw(`data-mp4="${asset(video.mp4)}"`))}
        ${when(av.webmMobile, () => raw(`data-webm-mobile="${asset(video.webmMobile)}"`))}
        ${when(av.mp4Mobile, () => raw(`data-mp4-mobile="${asset(video.mp4Mobile)}"`))}
      ></video>
      <div class="vid__scrim"></div>
    </div>
  `;
}

/**
 * Backtest video for an EA / lab article.
 * YouTube uses a click-to-load facade so no third-party script loads until the
 * visitor asks for it.
 */
export function VideoEmbed({ video, t, title = '' }) {
  if (!video || !video.type) return '';

  if (video.type === 'youtube' && video.id) {
    const thumb = video.poster ? asset(video.poster) : `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`;
    return html`
      <div class="embed" data-youtube="${video.id}">
        <button class="embed__play" type="button" aria-label="${t.ui.playVideo}">
          <img src="${thumb}" alt="" loading="lazy" decoding="async" width="1280" height="720" />
          <span class="embed__btn" aria-hidden="true"></span>
        </button>
      </div>
    `;
  }

  if (video.src) {
    return html`
      <div class="embed embed--file">
        <video controls playsinline preload="none" poster="${video.poster ? asset(video.poster) : ''}" aria-label="${title}">
          <source src="${asset(video.src)}" type="video/mp4" />
        </video>
      </div>
    `;
  }
  return '';
}

/** Section that pairs a full-bleed video with an overlaid copy block. */
export function CinematicSection({ id, video, available, priority, children, align = 'center', height = 'full', label = '' }) {
  return html`
    <section class="cine cine--${raw(align)} cine--${raw(height)}"${raw(id ? ` id="${id}"` : '')} data-reveal-root>
      ${CinematicVideo({ video, available, priority, label })}
      <div class="cine__inner">${children}</div>
      ${when(
        priority,
        () => html`<div class="cine__scroll" aria-hidden="true"><span></span></div>`
      )}
    </section>
  `;
}
