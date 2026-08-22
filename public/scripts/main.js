/* ==========================================================================
   TYO — runtime
   No framework, no dependencies. Everything is progressive enhancement:
   the page is complete and readable with this file blocked.

   01 boot
   02 header (stick / hide / progress)
   03 menu + language dropdown
   04 reveal on scroll
   05 lazy video
   06 number counters
   07 quantum field   (wave-interference background)
   08 world map
   09 youtube facade
   10 EA browse (filter / sort / search)
   11 EA compare selection
   12 Compare table narrowing
   13 Tab switcher (lab)
   14 Portfolio builder
   ========================================================================== */

(function () {
  'use strict';

  /* 01 ─ boot ───────────────────────────────────────────────────────── */

  // The `js` class is already set by the inline head script — reveal styles
  // depend on it, so it must not wait for this deferred file.
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isReduced = function () {
    return reduced.matches;
  };
  var isCoarse = window.matchMedia('(max-width: 768px)');

  var raf = window.requestAnimationFrame.bind(window);
  var on = function (el, ev, fn, opts) {
    el.addEventListener(ev, fn, opts || false);
  };
  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /** Remember the visitor's language so the root redirect can honour it. */
  $$('a[hreflang]').forEach(function (a) {
    on(a, 'click', function () {
      try {
        localStorage.setItem('tyo-locale', a.getAttribute('hreflang').split('-')[0]);
      } catch (e) {}
    });
  });

  /* 02 ─ header ─────────────────────────────────────────────────────── */

  (function header() {
    var hdr = $('[data-header]');
    var bar = $('[data-scroll-progress]');
    if (!hdr) return;

    var last = 0;
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;
      hdr.classList.toggle('is-stuck', y > 24);

      // Hide on downward scroll once past the first viewport, but never while
      // the fullscreen menu is open.
      var menuOpen = document.body.classList.contains('is-locked');
      hdr.classList.toggle('is-hidden', !menuOpen && y > window.innerHeight * 0.9 && y > last + 4);
      last = y;

      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.setProperty('--p', h > 0 ? Math.min(1, y / h).toFixed(4) : '0');
      }
      ticking = false;
    }

    on(
      window,
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          raf(update);
        }
      },
      { passive: true }
    );
    update();
  })();

  /* 03 ─ menu + language dropdown ───────────────────────────────────── */

  (function menu() {
    var toggle = $('[data-menu-toggle]');
    var panel = $('[data-menu]');
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      document.body.classList.toggle('is-locked', open);
    }

    on(toggle, 'click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    $$('a', panel).forEach(function (a) {
      on(a, 'click', function () {
        setOpen(false);
      });
    });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close the menu when the layout grows past the mobile breakpoint.
    on(window, 'resize', function () {
      if (window.innerWidth >= 900) setOpen(false);
    });
  })();

  (function langDropdown() {
    var boxes = $$('[data-lang-switcher]');
    if (!boxes.length) return;

    on(document, 'click', function (e) {
      boxes.forEach(function (d) {
        if (d.open && !d.contains(e.target)) d.open = false;
      });
    });
    on(document, 'keydown', function (e) {
      if (e.key !== 'Escape') return;
      boxes.forEach(function (d) {
        if (d.open) {
          d.open = false;
          var s = $('summary', d);
          if (s) s.focus();
        }
      });
    });
  })();

  /* 04 ─ reveal on scroll ───────────────────────────────────────────── */

  (function reveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (isReduced() || !('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.classList.add('is-in');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  })();

  /* 05 ─ lazy video ─────────────────────────────────────────────────── */

  (function video() {
    var slots = $$('[data-video]');
    if (!slots.length) return;

    var mobile = isCoarse.matches;

    function attach(slot) {
      var v = $('video', slot);
      if (!v || v.dataset.wired) return;
      v.dataset.wired = '1';

      var webm = mobile && v.dataset.webmMobile ? v.dataset.webmMobile : v.dataset.webm;
      var mp4 = mobile && v.dataset.mp4Mobile ? v.dataset.mp4Mobile : v.dataset.mp4;

      [
        [webm, 'video/webm'],
        [mp4, 'video/mp4'],
      ].forEach(function (pair) {
        if (!pair[0]) return;
        var s = document.createElement('source');
        s.src = pair[0];
        s.type = pair[1];
        v.appendChild(s);
      });

      v.load();
    }

    function ready(v) {
      v.classList.add('is-ready');
    }

    slots.forEach(function (slot) {
      var v = $('video', slot);
      if (!v) return;
      if (v.readyState >= 2) ready(v);
      on(v, 'loadeddata', function () {
        ready(v);
      });
      // A missing or unplayable file leaves the poster in place — no error UI.
      on(v, 'error', function () {
        slot.classList.add('vid--poster-only');
      });
    });

    if (!('IntersectionObserver' in window)) {
      slots.forEach(function (slot) {
        attach(slot);
        var v = $('video', slot);
        if (v && !isReduced()) v.play().catch(function () {});
      });
      return;
    }

    var inView = new Set();

    function playSlot(slot) {
      var v = $('video', slot);
      if (!v || isReduced() || document.hidden) return;
      if (slot.hasAttribute('data-lazy-video')) attach(slot); // idempotent
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var slot = entry.target;
          var v = $('video', slot);
          if (!v) return;

          if (entry.isIntersecting) {
            inView.add(slot);
            if (slot.hasAttribute('data-lazy-video')) attach(slot);
            playSlot(slot);
          } else {
            inView.delete(slot);
            if (!v.paused) v.pause(); // never decode a video the visitor cannot see
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );

    slots.forEach(function (slot) {
      io.observe(slot);
    });

    // Pause everything when the tab hides; resume the in-view slots when it
    // returns — without this, backgrounding the tab freezes the film for good.
    on(document, 'visibilitychange', function () {
      if (document.hidden) {
        $$('video', document).forEach(function (v) {
          if (!v.controls && !v.paused) v.pause();
        });
      } else {
        inView.forEach(playSlot);
      }
    });

    // Autoplay can be rejected before the first user gesture in some browsers;
    // retry the visible slots on that first gesture.
    var kick = function () {
      inView.forEach(playSlot);
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('scroll', kick);
    };
    on(window, 'pointerdown', kick, { passive: true, once: true });
    on(window, 'scroll', kick, { passive: true, once: true });
  })();

  /* 06 ─ number counters ────────────────────────────────────────────── */

  (function counters() {
    var els = $$('[data-count]');
    if (!els.length || !('IntersectionObserver' in window)) return;

    function format(n, locale) {
      var tags = { en: 'en-GB', ja: 'ja-JP', zh: 'zh-CN', th: 'th-TH', id: 'id-ID', vi: 'vi-VN', hi: 'en-IN' };
      try {
        return new Intl.NumberFormat(tags[locale] || 'en-GB').format(n);
      } catch (e) {
        return String(n);
      }
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          io.unobserve(el);

          var target = parseFloat(el.dataset.count);
          var suffix = el.dataset.suffix || '';
          var locale = el.dataset.locale || 'en';
          if (!isFinite(target) || isReduced()) {
            el.textContent = format(target, locale) + suffix;
            return;
          }

          var dur = 1600;
          var start = performance.now();
          (function step(now) {
            var p = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - p, 4);
            el.textContent = format(Math.round(target * eased), locale) + suffix;
            if (p < 1) raf(step);
          })(start);
        });
      },
      { threshold: 0.4 }
    );

    els.forEach(function (el) {
      io.observe(el);
    });
  })();

  /* 07 ─ quantum field ──────────────────────────────────────────────── */
  /* The background is an interference field, not a starfield. A handful of
     slow-moving emitters send out waves; every particle sits in the summed
     amplitude of those waves and brightens only where they interfere
     constructively. Hue runs along the spectrum with position and phase, so
     the rainbow is produced by the geometry of the scene rather than painted
     on top of it — "markets exist in probability" as something the page
     shows rather than only states.

     Cost is O(points x emitters): three emitters and ~190 points is a few
     hundred multiply-adds per frame. Bloom is gated to the bright crests
     because that is the expensive draw. Everything stops when the canvas
     leaves the viewport or the tab hides, and the whole engine is skipped
     under prefers-reduced-motion.                                          */

  (function quantumField() {
    var canvases = $$('[data-particles]');
    if (!canvases.length || isReduced()) return;

    /* Spectrum stops as RGB triplets, sampled by a 0..1 position. */
    var SPECTRUM = [
      [255, 59, 48],
      [255, 159, 10],
      [255, 214, 10],
      [50, 215, 75],
      [64, 224, 208],
      [10, 132, 255],
      [191, 90, 242],
    ];

    /* A theme is a window onto the spectrum, so a "cyan" section stays
       cyan-ish while still shimmering across neighbouring hues. */
    var THEMES = {
      spectrum: { from: 0.0, to: 1.0 },
      cyan: { from: 0.48, to: 0.8 },
      violet: { from: 0.7, to: 1.0 },
      amber: { from: 0.0, to: 0.32 },
      blue: { from: 0.58, to: 0.92 },
    };

    function sample(t) {
      var x = (t % 1 + 1) % 1;
      x *= SPECTRUM.length - 1;
      var i = x | 0;
      var f = x - i;
      var a = SPECTRUM[i];
      var b = SPECTRUM[Math.min(SPECTRUM.length - 1, i + 1)];
      return [(a[0] + (b[0] - a[0]) * f) | 0, (a[1] + (b[1] - a[1]) * f) | 0, (a[2] + (b[2] - a[2]) * f) | 0];
    }

    canvases.forEach(function (canvas) {
      var ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      var theme = THEMES[canvas.dataset.particles] || THEMES.spectrum;
      var span = theme.to - theme.from;
      var dense = canvas.classList.contains('sec__particles--dense');

      var w = 0;
      var h = 0;
      var pts = [];
      var emitters = [];
      var k = 0.05;
      var running = false;
      var t0 = performance.now();

      function size() {
        var r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = r.width;
        h = r.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return true;
      }

      function seed() {
        /* Jittered grid rather than pure random: even coverage keeps the
           interference bands legible instead of clumping into noise. */
        var target = Math.round((w * h) / (dense ? 2600 : 3600));
        var n = Math.max(90, Math.min(dense ? 520 : 380, target));
        var cols = Math.max(4, Math.round(Math.sqrt((n * w) / h)));
        var rows = Math.max(3, Math.round(n / cols));
        var cw = w / cols;
        var ch = h / rows;

        pts = [];
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            pts.push({
              x: (c + 0.5 + (Math.random() - 0.5) * 0.7) * cw,
              y: (r + 0.5 + (Math.random() - 0.5) * 0.7) * ch,
              ax: Math.random() * Math.PI * 2,
              ay: Math.random() * Math.PI * 2,
              amp: 3 + Math.random() * 7,
              /* Only a sliver of per-point randomness. Anything more and
                 neighbours stop sharing a hue, which destroys the fringes —
                 the field reads as coloured dust instead of interference. */
              hue: Math.random() * 0.07,
              base: 0.86 + Math.random() * 0.14,
            });
          }
        }

        emitters = [
          { cx: w * 0.22, cy: h * 0.35, rx: w * 0.16, ry: h * 0.2, sp: 0.00013, ph: 0 },
          { cx: w * 0.78, cy: h * 0.55, rx: w * 0.14, ry: h * 0.24, sp: -0.00009, ph: 2.1 },
          { cx: w * 0.5, cy: h * 0.86, rx: w * 0.2, ry: h * 0.14, sp: 0.00017, ph: 4.2 },
        ];
        /* Wavelength scales with the canvas so the fringe count stays constant
           whatever the viewport — about eight bands across the diagonal. */
        k = 58 / Math.sqrt(w * w + h * h);
      }

      var ex = [];
      var ey = [];

      function draw(now) {
        var t = now - t0;
        ctx.clearRect(0, 0, w, h);

        var i;
        var j;
        ex.length = 0;
        ey.length = 0;
        for (i = 0; i < emitters.length; i++) {
          var e = emitters[i];
          ex.push(e.cx + Math.cos(t * e.sp + e.ph) * e.rx);
          ey.push(e.cy + Math.sin(t * e.sp * 1.3 + e.ph) * e.ry);
        }

        var wt = t * 0.0016;
        var inv = 1 / ex.length;

        /* Additive blending is what makes overlapping waves read as light. */
        ctx.globalCompositeOperation = 'lighter';

        for (i = 0; i < pts.length; i++) {
          var p = pts[i];
          var px = p.x + Math.cos(t * 0.00021 + p.ax) * p.amp;
          var py = p.y + Math.sin(t * 0.00017 + p.ay) * p.amp;

          var sum = 0;
          for (j = 0; j < ex.length; j++) {
            var dx = px - ex[j];
            var dy = py - ey[j];
            var d = Math.sqrt(dx * dx + dy * dy);
            /* Gentle falloff on purpose: real interference needs the sources
               to arrive with comparable amplitude. A steep 1/d lets the
               nearest emitter dominate and you get concentric rings instead
               of fringes. */
            sum += Math.sin(d * k - wt) / (1 + d * 0.0018);
          }

          /* Superposing three sources rarely reaches full swing, so normalise
             before shaping — otherwise the whole field sits in the dim half
             of the curve and nothing lights up. */
          var a = sum * inv * 1.55;
          if (a > 1) a = 1;
          else if (a < -1) a = -1;

          /* Squared bias keeps troughs dark so the fringes read as bands
             rather than an even haze. Cubing crushes the mid-range entirely. */
          var lum = a * 0.5 + 0.5;
          lum *= lum;

          var alpha = (0.05 + lum * 0.95) * p.base;
          if (alpha < 0.02) continue;

          /* Hue sweeps the full spectrum diagonally across the canvas and is
             then pushed further by the amplitude, so a fringe is a band of
             colour and not only a band of brightness. The rainbow is produced
             by the interference rather than applied over the top of it. */
          var col = sample(theme.from + span * (p.hue + (px / w) * 0.85 + (py / h) * 0.22 + lum * 0.45));
          var rgb = col[0] + ',' + col[1] + ',' + col[2];
          var rad = 0.8 + lum * 3.4;

          ctx.fillStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.fill();

          /* Bloom is the expensive draw, so it is gated to the crests. */
          if (lum > 0.45) {
            ctx.fillStyle = 'rgba(' + rgb + ',' + (alpha * 0.14).toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(px, py, rad * 6.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        /* Wavefronts, so the interference has a visible cause. */
        for (i = 0; i < ex.length; i++) {
          for (var ring = 0; ring < 3; ring++) {
            var phase = ((wt / 6.2831853 + ring / 3) % 1 + 1) % 1;
            var fade = (1 - phase) * 0.09;
            if (fade <= 0.004) continue;
            var rc = sample(theme.from + span * (i / ex.length + phase));
            ctx.strokeStyle = 'rgba(' + rc[0] + ',' + rc[1] + ',' + rc[2] + ',' + fade.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(ex[i], ey[i], phase * Math.max(w, h) * 0.75, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        ctx.globalCompositeOperation = 'source-over';
        if (running) raf(draw);
      }

      function start() {
        if (running) return;
        if (!size()) return;
        if (!pts.length) seed();
        running = true;
        raf(draw);
      }

      function stop() {
        running = false;
      }

      var io = new IntersectionObserver(
        function (entries) {
          entries[0].isIntersecting ? start() : stop();
        },
        { rootMargin: '120px' }
      );
      io.observe(canvas);

      var rt;
      on(window, 'resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
          if (size()) seed();
        }, 200);
      });

      on(document, 'visibilitychange', function () {
        document.hidden ? stop() : start();
      });

      /* Exposed so a frame can be timed directly rather than inferred from
         requestAnimationFrame cadence, which throttles in hidden tabs. */
      canvas.__qf = {
        frame: function (ms) {
          if (!w) size();
          if (!pts.length) seed();
          draw(t0 + (ms || 0));
        },
        points: function () {
          return pts.length;
        },
      };
    });
  })();

  /* 08 ─ world map ──────────────────────────────────────────────────── */

  (function worldmap() {
    var canvases = $$('[data-worldmap]');
    if (!canvases.length) return;

    function decode(b64) {
      var bin = atob(b64);
      var out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }

    canvases.forEach(function (canvas) {
      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var grid = (canvas.dataset.grid || '220,84').split(',').map(Number);
      var cols = grid[0];
      var rows = grid[1];
      var bits = decode(canvas.dataset.mask || '');
      var land = function (c, r) {
        var b = r * cols + c;
        return (bits[b >> 3] >> (7 - (b & 7))) & 1;
      };

      var points = (canvas.dataset.points || '')
        .split(';')
        .filter(Boolean)
        .map(function (s) {
          var p = s.split(',').map(Number);
          return { gx: p[0], gy: p[1], w: p[2], home: !!p[3] };
        });
      var home = points.filter(function (p) {
        return p.home;
      })[0];

      var w = 0;
      var h = 0;
      var cell = 0;
      var running = false;
      var t0 = performance.now();

      function size() {
        var r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = r.width;
        h = r.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cell = w / cols;
        return true;
      }

      function px(p) {
        return { x: p.gx * cell, y: p.gy * (h / rows) };
      }

      function draw(now) {
        if (!running) return;
        var el = (now - t0) / 1000;
        ctx.clearRect(0, 0, w, h);

        // Landmask
        var rowH = h / rows;
        var r0 = Math.max(0.6, cell * 0.28);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            if (!land(c, r)) continue;
            ctx.beginPath();
            ctx.arc((c + 0.5) * cell, (r + 0.5) * rowH, r0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Arcs from the home node outwards, drawn progressively.
        if (home && !isReduced()) {
          var hp = px(home);
          points.forEach(function (p, i) {
            if (p.home) return;
            var q = px(p);
            var cycle = 4.2;
            var phase = ((el + i * 0.55) % cycle) / cycle;
            if (phase > 0.72) return;
            var prog = Math.min(1, phase / 0.62);
            var mx = (hp.x + q.x) / 2;
            var my = (hp.y + q.y) / 2 - Math.abs(q.x - hp.x) * 0.22 - 12;

            ctx.strokeStyle = 'rgba(64,224,208,' + (0.34 * (1 - Math.abs(prog - 0.5) * 1.1)).toFixed(3) + ')';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(hp.x, hp.y);
            // Quadratic curve sampled up to `prog` so the line grows outward.
            for (var s = 0; s <= 24; s++) {
              var tt = (s / 24) * prog;
              var u = 1 - tt;
              ctx.lineTo(u * u * hp.x + 2 * u * tt * mx + tt * tt * q.x, u * u * hp.y + 2 * u * tt * my + tt * tt * q.y);
            }
            ctx.stroke();
          });
        }

        // Community nodes
        points.forEach(function (p, i) {
          var q = px(p);
          var pulse = 0.6 + 0.4 * Math.sin(el * 1.6 + i);
          var base = p.home ? 3.1 : 1.9 + p.w * 1.5;
          var col = p.home ? '255,214,10' : '64,224,208';

          ctx.fillStyle = 'rgba(' + col + ',' + (0.1 * pulse).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(q.x, q.y, base * (4 + pulse * 2.4), 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(' + col + ',' + (0.34 + 0.3 * pulse).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(q.x, q.y, base * 1.9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.beginPath();
          ctx.arc(q.x, q.y, base * 0.62, 0, Math.PI * 2);
          ctx.fill();
        });

        if (isReduced()) {
          running = false;
          return;
        }
        raf(draw);
      }

      function start() {
        if (running) return;
        if (!size()) return;
        running = true;
        raf(draw);
      }

      function stop() {
        running = false;
      }

      var io = new IntersectionObserver(
        function (entries) {
          entries[0].isIntersecting ? start() : stop();
        },
        { rootMargin: '150px' }
      );
      io.observe(canvas);

      var rt;
      on(window, 'resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
          if (size() && !running) raf(draw);
        }, 200);
      });
    });
  })();

  /* 09 ─ youtube facade ─────────────────────────────────────────────── */

  (function youtube() {
    $$('[data-youtube]').forEach(function (box) {
      var btn = $('.embed__play', box);
      if (!btn) return;
      on(btn, 'click', function () {
        var id = box.dataset.youtube;
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
        iframe.title = 'Backtest video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        box.innerHTML = '';
        box.appendChild(iframe);
      });
    });
  })();

  /* 10 ─ EA browse: filter / sort / search ──────────────────────────── */
  /* Operates on the cards already in the document. Nothing is fetched and
     nothing is re-rendered — filtering toggles `hidden`, sorting reorders the
     existing nodes. That keeps the full catalogue in the HTML for crawlers and
     for anyone with scripting off, where the toolbar simply stays hidden.   */

  (function eaBrowse() {
    var root = $('[data-browse]');
    var grid = $('[data-ea-grid]');
    if (!root || !grid) return;

    root.hidden = false; // only usable with JS, so it ships hidden

    var cards = $$('.eacard', grid);
    var search = $('[data-browse-search]', root);
    var sort = $('[data-browse-sort]', root);
    var reset = $('[data-browse-reset]', root);
    var count = $('[data-browse-count]', root);
    var none = $('[data-browse-none]', root);
    var countTpl = count ? count.dataset.tpl || count.textContent.trim() : '';

    var state = { market: '', tag: '', risk: '', access: '', q: '', sort: 'score' };

    /* Original order, so "catalogue order" can always be restored. */
    cards.forEach(function (c, i) {
      c.dataset.order = String(i);
    });

    var numOf = function (c, key) {
      var v = c.dataset[key];
      if (v === undefined || v === '') return null;
      var n = Number(v);
      return isFinite(n) ? n : null;
    };

    var SORTS = {
      score: { key: 'score', dir: -1 },
      pf: { key: 'pf', dir: -1 },
      dd: { key: 'dd', dir: 1 },
      trades: { key: 'trades', dir: -1 },
      win: { key: 'win', dir: -1 },
      years: { key: 'years', dir: -1 },
      number: { key: 'number', dir: 1 },
    };

    function matches(card) {
      if (state.market && card.dataset.market !== state.market) return false;
      if (state.tag && (' ' + (card.dataset.tags || '') + ' ').indexOf(' ' + state.tag + ' ') < 0) return false;
      if (state.risk && card.dataset.risk !== state.risk) return false;
      if (state.access && card.dataset.access !== state.access) return false;
      if (state.q && (card.dataset.name || '').indexOf(state.q) < 0) return false;
      return true;
    }

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var ok = matches(c);
        c.hidden = !ok;
        if (ok) shown++;
      });

      var s = SORTS[state.sort] || SORTS.score;
      var ordered = cards.slice().sort(function (a, b) {
        var av = numOf(a, s.key);
        var bv = numOf(b, s.key);
        // Cards with no value for the active metric sink, whichever way the
        // sort runs — an unknown is not a good result.
        if (av === null && bv === null) return Number(a.dataset.order) - Number(b.dataset.order);
        if (av === null) return 1;
        if (bv === null) return -1;
        if (av === bv) return Number(a.dataset.order) - Number(b.dataset.order);
        return (av - bv) * s.dir;
      });
      ordered.forEach(function (c) {
        grid.appendChild(c);
      });

      if (count) count.textContent = countTpl.replace('{n}', shown).replace('{total}', cards.length);
      if (none) none.hidden = shown !== 0;
    }

    $$('.chip', root).forEach(function (chip) {
      on(chip, 'click', function () {
        var facet = chip.dataset.facet;
        state[facet] = chip.dataset.value;
        $$('.chip[data-facet="' + facet + '"]', root).forEach(function (o) {
          o.classList.toggle('is-on', o === chip);
        });
        apply();
      });
    });

    if (search) {
      var st;
      on(search, 'input', function () {
        clearTimeout(st);
        st = setTimeout(function () {
          state.q = search.value.trim().toLowerCase();
          apply();
        }, 120);
      });
    }

    if (sort) {
      on(sort, 'change', function () {
        state.sort = sort.value;
        apply();
      });
    }

    if (reset) {
      on(reset, 'click', function () {
        state = { market: '', tag: '', risk: '', q: '', sort: 'score' };
        if (search) search.value = '';
        if (sort) sort.value = 'score';
        $$('.chip', root).forEach(function (o) {
          o.classList.toggle('is-on', o.dataset.value === '');
        });
        apply();
      });
    }

    apply();
  })();

  /* 11 ─ EA compare selection ──────────────────────────────────────── */

  (function eaCompare() {
    var MAX = 4;
    var tray = $('[data-compare-tray]');
    var picks = $$('[data-compare-pick]');
    if (!tray || !picks.length) return;

    var items = $('[data-compare-items]', tray);
    var counter = $('[data-compare-count]', tray);
    var go = $('[data-compare-go]', tray);
    var clear = $('[data-compare-clear]', tray);
    var base = go ? go.getAttribute('href') : '';
    var chosen = [];

    function nameOf(slug) {
      var el = $('.eacard[data-slug="' + slug + '"] .eacard__name');
      return el ? el.textContent.trim() : slug;
    }

    function render() {
      tray.hidden = chosen.length === 0;
      if (counter) counter.textContent = String(chosen.length);
      if (go) go.href = base + (chosen.length ? '?ea=' + chosen.join(',') : '');
      if (!items) return;
      items.innerHTML = '';
      chosen.forEach(function (slug) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = nameOf(slug);
        b.setAttribute('aria-label', nameOf(slug));
        on(b, 'click', function () {
          var box = $('[data-compare-pick][value="' + slug + '"]');
          if (box) box.checked = false;
          chosen = chosen.filter(function (s) {
            return s !== slug;
          });
          syncDisabled();
          render();
        });
        li.appendChild(b);
        items.appendChild(li);
      });
    }

    /* At the cap, unchecked boxes are disabled rather than silently ignoring
       the click. */
    function syncDisabled() {
      var full = chosen.length >= MAX;
      picks.forEach(function (p) {
        p.disabled = full && !p.checked;
        var label = p.closest('.eacard__pick');
        if (label) label.classList.toggle('is-disabled', p.disabled);
      });
    }

    picks.forEach(function (p) {
      on(p, 'change', function () {
        if (p.checked) {
          if (chosen.length >= MAX) {
            p.checked = false;
            return;
          }
          chosen.push(p.value);
        } else {
          chosen = chosen.filter(function (s) {
            return s !== p.value;
          });
        }
        syncDisabled();
        render();
      });
    });

    if (clear) {
      on(clear, 'click', function () {
        chosen = [];
        picks.forEach(function (p) {
          p.checked = false;
        });
        syncDisabled();
        render();
      });
    }

    render();
  })();

  /* 12 ─ Compare table: narrow to ?ea=… ────────────────────────────── */

  (function compareFilter() {
    var table = $('[data-compare-table]');
    if (!table) return;

    var status = $('[data-compare-status]');
    var wanted = (new URLSearchParams(location.search).get('ea') || '')
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);

    if (!wanted.length) return;

    var present = wanted.filter(function (slug) {
      return !!table.querySelector('[data-slug="' + slug + '"]');
    });
    if (!present.length) return;

    $$('[data-slug]', table).forEach(function (cell) {
      cell.hidden = present.indexOf(cell.dataset.slug) < 0;
    });

    /* Recompute "best in row" over what is actually on screen. The
       server-rendered highlight ranks all 14, so after narrowing to three the
       winning cell is often one of the hidden ones and no mark shows at all. */
    $$('tbody tr', table).forEach(function (tr) {
      var dir = tr.dataset.dir;
      var cells = $$('td', tr).filter(function (td) {
        return !td.hidden;
      });
      cells.forEach(function (td) {
        td.classList.remove('is-best');
        td.removeAttribute('title');
      });
      if (!dir) return;
      var vals = cells
        .map(function (td) {
          var v = td.dataset.v;
          return v === '' || v === undefined ? null : Number(v);
        })
        .filter(function (v) {
          return v !== null && isFinite(v);
        });
      if (vals.length < 2) return;
      var target = dir === 'high' ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
      cells.forEach(function (td) {
        if (td.dataset.v !== '' && Number(td.dataset.v) === target) td.classList.add('is-best');
      });
    });

    if (status) {
      status.hidden = false;
      var tpl = status.dataset.tpl || status.textContent || '';
      status.textContent = '';
      var span = document.createElement('span');
      span.textContent = (tpl || '{n}').replace('{n}', String(present.length));
      var a = document.createElement('a');
      a.href = location.pathname;
      a.className = 'cmp__showall';
      a.textContent = status.dataset.all || '';
      status.appendChild(span);
      status.appendChild(a);
    }
  })();

  /* 13 ─ tab switcher (lab equity / monthly) ───────────────────────── */
  /* Panels are all in the HTML, so the whole dataset is crawlable and works
     with scripting off — every panel simply shows in sequence. The switcher
     just hides the ones that are not selected.                            */

  (function switcher() {
    $$('[data-switch]').forEach(function (box) {
      var tabs = $$('[data-switch-tab]', box);
      var panels = $$('[data-switch-panel]', box);
      if (tabs.length < 2) return;

      function select(slug, focus) {
        tabs.forEach(function (b) {
          var on_ = b.dataset.switchTab === slug;
          b.classList.toggle('is-on', on_);
          b.setAttribute('aria-selected', String(on_));
          b.tabIndex = on_ ? 0 : -1;
        });
        panels.forEach(function (p) {
          p.hidden = p.dataset.switchPanel !== slug;
        });
        if (focus) {
          var el = box.querySelector('[data-switch-tab="' + slug + '"]');
          if (el) el.focus();
        }
      }

      tabs.forEach(function (b, i) {
        b.tabIndex = i === 0 ? 0 : -1;
        on(b, 'click', function () {
          select(b.dataset.switchTab, false);
        });
        on(b, 'keydown', function (e) {
          var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          var next = tabs[(i + d + tabs.length) % tabs.length];
          select(next.dataset.switchTab, true);
        });
      });
    });
  })();

  /* 14 ─ portfolio builder ─────────────────────────────────────────── */
  /* Arithmetic over the monthly series shipped inline as JSON. Everything is
     computed on the visitor's machine from the same numbers the page already
     shows; nothing is fetched. The section is hidden until this runs, so a
     no-JS visitor never sees a dead control.                              */

  (function portfolioBuilder() {
    var box = $('[data-portfolio]');
    var dataEl = $('[data-portfolio-data]');
    if (!box || !dataEl) return;

    var payload;
    try {
      payload = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }
    var DATA = payload.d;
    box.hidden = false;

    var MAXSEL = 4;
    var picks = $$('[data-portfolio-pick]', box);
    var modes = $$('[data-portfolio-mode]', box);
    var hint = $('[data-portfolio-hint]', box);
    var thin = $('[data-portfolio-thin]', box);
    var out = $('[data-portfolio-out]', box);
    var rowsEl = $('[data-portfolio-rows]', box);
    var rpNote = $('[data-portfolio-rpfallback]', box);
    var pairChart = $('[data-pair-chart]', box);
    var pairLegend = $('[data-pair-legend]', box);
    var pairStab = $('[data-pair-stab]', box);
    var pairOverlap = $('[data-pair-overlap]', box);
    var pairNotEnough = $('[data-pair-notenough]', box);
    var pairWindows = $$('[data-pair-window]', box);

    var field = function (k) {
      return $('[data-pf="' + k + '"]', box);
    };

    var fmtPct = function (v, digits) {
      if (v === null || !isFinite(v)) return '—';
      var d = digits === undefined ? 1 : digits;
      return (v > 0 ? '+' : '') + v.toFixed(d) + '%';
    };

    /** Stats of one monthly %-return series (chronological array of numbers). */
    function stats(series) {
      var n = series.length;
      var pos = 0;
      var worst = Infinity;
      var index = 1;
      var peak = 1;
      var maxDD = 0;
      var sum = 0;
      for (var i = 0; i < n; i++) {
        var r = series[i];
        sum += r;
        if (r > 0) pos++;
        if (r < worst) worst = r;
        index *= 1 + r / 100;
        if (index > peak) peak = index;
        var dd = (1 - index / peak) * 100;
        if (dd > maxDD) maxDD = dd;
      }
      var mean = n ? sum / n : null;
      var vs = 0;
      for (var j = 0; j < n; j++) vs += (series[j] - mean) * (series[j] - mean);
      var sd = n > 1 ? Math.sqrt(vs / (n - 1)) : null;
      var total = (index - 1) * 100;
      return {
        positive: n ? (pos / n) * 100 : null,
        worst: n ? worst : null,
        maxDD: maxDD,
        total: total,
        mean: mean,
        sd: sd,
        volAnn: sd === null ? null : sd * Math.sqrt(12),
        /* Geometric annualisation over the window — a description of this
           record, not a rate anyone is promised. */
        cagr: n >= 12 && index > 0 ? (Math.pow(index, 12 / n) - 1) * 100 : null,
        retDD: maxDD > 0.05 ? total / maxDD : null,
      };
    }

    /** Sample std-dev of a series (n−1). */
    function sdOf(series) {
      var n = series.length;
      if (n < 2) return null;
      var s = 0;
      var i;
      for (i = 0; i < n; i++) s += series[i];
      var m = s / n;
      var v = 0;
      for (i = 0; i < n; i++) v += (series[i] - m) * (series[i] - m);
      return Math.sqrt(v / (n - 1));
    }

    /** Sample covariance matrix of aligned series (n−1 denominator). */
    function covMatrix(perSeries) {
      var k = perSeries.length;
      var n = perSeries[0].length;
      var means = perSeries.map(function (s) {
        var t = 0;
        for (var i = 0; i < n; i++) t += s[i];
        return t / n;
      });
      var C = [];
      for (var a = 0; a < k; a++) {
        C.push([]);
        for (var b = 0; b < k; b++) {
          var c = 0;
          for (var i = 0; i < n; i++) c += (perSeries[a][i] - means[a]) * (perSeries[b][i] - means[b]);
          C[a].push(c / (n - 1));
        }
      }
      return C;
    }

    /** Inverse-volatility weights; null when any series has no variance. */
    function ivWeights(perSeries) {
      var sds = perSeries.map(sdOf);
      if (sds.some(function (s) { return s === null || s <= 0; })) return null;
      var inv = sds.map(function (s) { return 1 / s; });
      var tot = inv.reduce(function (a, b) { return a + b; }, 0);
      return inv.map(function (x) { return x / tot; });
    }

    /** Pearson r over a slice [from, from+len) of two aligned series. */
    function pearsonSlice(a, b, from, len) {
      var sa = 0;
      var sb = 0;
      var i;
      for (i = from; i < from + len; i++) {
        sa += a[i];
        sb += b[i];
      }
      var ma = sa / len;
      var mb = sb / len;
      var cov = 0;
      var va = 0;
      var vb = 0;
      for (i = from; i < from + len; i++) {
        var da = a[i] - ma;
        var db = b[i] - mb;
        cov += da * db;
        va += da * da;
        vb += db * db;
      }
      if (!va || !vb) return null;
      return cov / Math.sqrt(va * vb);
    }

    /** Trailing-W rolling correlation; index i holds r over months [i−W+1, i]. */
    function rollingR(a, b, W) {
      var outR = [];
      for (var i = W - 1; i < a.length; i++) outR.push(pearsonSlice(a, b, i - W + 1, W));
      return outR;
    }

    /** In-drawdown flags of a monthly series (monthly-close index vs peak). */
    function ddFlags(series) {
      var index = 1;
      var peak = 1;
      return series.map(function (r) {
        index *= 1 + r / 100;
        if (index > peak) peak = index;
        return index < peak;
      });
    }

    /**
     * Equal-risk-contribution weights by damped multiplicative iteration.
     * Returns null when it fails to converge (strong negative correlation can
     * do that) — the caller falls back to inverse volatility and says so.
     */
    function rpWeights(perSeries) {
      var C = covMatrix(perSeries);
      var k = C.length;
      var w = ivWeights(perSeries);
      if (!w) return null;

      for (var iter = 0; iter < 500; iter++) {
        /* marginal risk (Cw) and risk contributions w_i (Cw)_i */
        var cw = [];
        var i;
        var j;
        for (i = 0; i < k; i++) {
          var s = 0;
          for (j = 0; j < k; j++) s += C[i][j] * w[j];
          cw.push(s);
        }
        var rc = w.map(function (wi, idx) { return wi * cw[idx]; });
        var totalRisk = rc.reduce(function (a, b) { return a + b; }, 0);
        if (totalRisk <= 0 || rc.some(function (x) { return x <= 0; })) return null;

        var target = totalRisk / k;
        var maxErr = 0;
        for (i = 0; i < k; i++) {
          var err = Math.abs(rc[i] / target - 1);
          if (err > maxErr) maxErr = err;
        }
        if (maxErr < 1e-4) return w;

        var next = w.map(function (wi, idx) { return wi * Math.pow(target / rc[idx], 0.35); });
        var tot = next.reduce(function (a, b) { return a + b; }, 0);
        w = next.map(function (x) { return x / tot; });
      }
      return null;
    }

    /** Pearson r of two aligned series. */
    function pearson(a, b) {
      var n = a.length;
      var sa = 0;
      var sb = 0;
      var i;
      for (i = 0; i < n; i++) {
        sa += a[i];
        sb += b[i];
      }
      var ma = sa / n;
      var mb = sb / n;
      var cov = 0;
      var va = 0;
      var vb = 0;
      for (i = 0; i < n; i++) {
        var da = a[i] - ma;
        var db = b[i] - mb;
        cov += da * db;
        va += da * da;
        vb += db * db;
      }
      if (!va || !vb) return null;
      return cov / Math.sqrt(va * vb);
    }

    function recompute() {
      var chosen = picks.filter(function (x) {
        return x.checked;
      }).map(function (x) {
        return x.value;
      });

      var full = chosen.length >= MAXSEL;
      picks.forEach(function (x) {
        x.disabled = full && !x.checked;
        var l = x.closest('.pbuild__sys');
        if (l) l.classList.toggle('is-disabled', x.disabled);
      });

      if (chosen.length < 2) {
        hint.hidden = false;
        thin.hidden = true;
        out.hidden = true;
        return;
      }
      hint.hidden = true;

      /* Months every selected system traded: the honest window. */
      var maps = chosen.map(function (slug) {
        var m2 = {};
        DATA[slug].m.forEach(function (row) {
          m2[row[0]] = row[1];
        });
        return m2;
      });
      var common = Object.keys(maps[0])
        .filter(function (ym) {
          return maps.every(function (m2) {
            return ym in m2;
          });
        })
        .sort();

      if (common.length < 12) {
        thin.hidden = false;
        out.hidden = true;
        return;
      }
      thin.hidden = true;
      out.hidden = false;

      var perSeries = maps.map(function (m2) {
        return common.map(function (ym) {
          return m2[ym];
        });
      });

      /* Weights per the selected mode. IV and RP degrade gracefully: RP that
         fails to converge falls back to IV (and says so on the page); IV on a
         degenerate series falls back to equal. */
      var mode = 'equal';
      modes.forEach(function (m2) {
        if (m2.checked) mode = m2.value;
      });
      var nSel = perSeries.length;
      var weights = null;
      var rpFellBack = false;
      if (mode === 'iv') weights = ivWeights(perSeries);
      if (mode === 'rp') {
        weights = rpWeights(perSeries);
        if (!weights) {
          weights = ivWeights(perSeries);
          rpFellBack = weights !== null;
        }
      }
      if (!weights) {
        weights = perSeries.map(function () {
          return 1 / nSel;
        });
      }
      if (rpNote) rpNote.hidden = !rpFellBack;

      var blend = common.map(function (ym, i) {
        var s = 0;
        for (var k = 0; k < nSel; k++) s += weights[k] * perSeries[k][i];
        return s;
      });

      var rs = [];
      for (var a = 0; a < perSeries.length; a++)
        for (var b = a + 1; b < perSeries.length; b++) {
          var r = pearson(perSeries[a], perSeries[b]);
          if (r !== null) rs.push(r);
        }
      var avgR = rs.length ? rs.reduce(function (x, y) {
        return x + y;
      }, 0) / rs.length : null;

      var st = stats(blend);
      field('window').textContent = common[0] + ' → ' + common[common.length - 1];
      field('months').textContent = String(common.length);
      field('corr').textContent = avgR === null ? '—' : avgR.toFixed(2);
      field('positive').textContent = fmtPct(st.positive, 0).replace('+', '');
      field('mean').textContent = fmtPct(st.mean, 2);
      field('worst').textContent = fmtPct(st.worst);
      field('vol').textContent = st.volAnn === null ? '—' : st.volAnn.toFixed(1) + '%';
      field('dd').textContent = st.maxDD.toFixed(1) + '%';
      field('retdd').textContent = st.retDD === null ? '—' : st.retDD.toFixed(1) + '×';
      field('cagr').textContent = st.cagr === null ? '—' : fmtPct(st.cagr, 1);
      field('total').textContent = fmtPct(st.total, 0);

      /* Per-system table over the SAME window, blend row first. */
      rowsEl.innerHTML = '';
      var addRow = function (name, weight, s, isBlend) {
        var tr = document.createElement('tr');
        if (isBlend) tr.className = 'is-blend';
        var cells = [
          name,
          weight,
          fmtPct(s.positive, 0).replace('+', ''),
          fmtPct(s.worst),
          s.maxDD.toFixed(1) + '%',
          fmtPct(s.total, 0),
        ];
        cells.forEach(function (v, i) {
          var el = document.createElement(i === 0 ? 'th' : 'td');
          if (i === 0) el.setAttribute('scope', 'row');
          else el.className = 'dtable__num';
          el.textContent = v;
          tr.appendChild(el);
        });
        rowsEl.appendChild(tr);
      };
      var effMode = mode === 'rp' && rpFellBack ? 'iv' : mode;
      addRow(payload.blendLabels[effMode] || payload.blendLabels.equal, '100%', st, true);
      chosen.forEach(function (slug, i) {
        addRow(DATA[slug].name, (weights[i] * 100).toFixed(1) + '%', stats(perSeries[i]), false);
      });

      renderPairs(chosen, perSeries, common);
    }

    /* ---- pair analytics (7B): rolling r, stability, overlap ---------- */

    var PAIR_COLORS = ['#40e0d0', '#ff9f0a', '#bf5af2', '#32d74b', '#0a84ff', '#ff3b30'];
    var PAIR_DASH = ['', '7 4', '2 3', '9 3 2 3', '4 2', '12 4'];

    var fmtR = function (r) {
      return r === null || !isFinite(r) ? '—' : r.toFixed(2);
    };

    function pairsOf(chosen) {
      var list = [];
      for (var a = 0; a < chosen.length; a++)
        for (var b = a + 1; b < chosen.length; b++)
          list.push({ a: a, b: b, name: DATA[chosen[a]].name + ' × ' + DATA[chosen[b]].name });
      return list;
    }

    function chartSVG(lines, nPts, firstYm, lastYm) {
      var W = 640;
      var H = 240;
      var L = 38;
      var R = 10;
      var T = 10;
      var B = 26;
      var x = function (i) {
        return L + (nPts === 1 ? 0 : (i / (nPts - 1)) * (W - L - R));
      };
      var y = function (r) {
        return T + ((1 - r) / 2) * (H - T - B);
      };

      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
      [1, 0.5, 0, -0.5, -1].forEach(function (g) {
        var yy = y(g);
        s +=
          '<line x1="' + L + '" y1="' + yy + '" x2="' + (W - R) + '" y2="' + yy + '" stroke="rgba(255,255,255,' +
          (g === 0 ? 0.28 : 0.08) + ')" stroke-width="1"/>' +
          '<text x="' + (L - 6) + '" y="' + (yy + 3.5) + '" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.45)">' +
          (g > 0 ? '+' + g : g) + '</text>';
      });
      s +=
        '<text x="' + L + '" y="' + (H - 8) + '" font-size="10" fill="rgba(255,255,255,0.45)">' + firstYm + '</text>' +
        '<text x="' + (W - R) + '" y="' + (H - 8) + '" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.45)">' + lastYm + '</text>';

      lines.forEach(function (line, li) {
        var d = '';
        line.forEach(function (r, i) {
          if (r === null) return;
          d += (d ? ' L' : 'M') + x(i).toFixed(1) + ' ' + y(Math.max(-1, Math.min(1, r))).toFixed(1);
        });
        if (!d) return;
        s +=
          '<path d="' + d + '" fill="none" stroke="' + PAIR_COLORS[li % PAIR_COLORS.length] +
          '" stroke-width="1.8" opacity="0.9"' +
          (PAIR_DASH[li % PAIR_DASH.length] ? ' stroke-dasharray="' + PAIR_DASH[li % PAIR_DASH.length] + '"' : '') +
          '/>';
      });
      return s + '</svg>';
    }

    function renderPairs(chosen, perSeries, common) {
      if (!pairChart) return;
      var pairs = pairsOf(chosen);
      var n = common.length;

      var W = 24;
      pairWindows.forEach(function (r2) {
        if (r2.checked) W = Number(r2.value);
      });

      /* Rolling chart: needs at least 6 rolling points to be a line at all. */
      var nPts = n - W + 1;
      if (nPts < 6) {
        pairChart.innerHTML = '';
        pairLegend.innerHTML = '';
        pairNotEnough.hidden = false;
      } else {
        pairNotEnough.hidden = true;
        var lines = pairs.map(function (p2) {
          return rollingR(perSeries[p2.a], perSeries[p2.b], W);
        });
        pairChart.innerHTML = chartSVG(lines, nPts, common[W - 1], common[n - 1]);
        pairLegend.innerHTML = '';
        pairs.forEach(function (p2, i) {
          var li = document.createElement('li');
          var sw = document.createElement('span');
          sw.className = 'pairx__swatch';
          sw.style.background = PAIR_COLORS[i % PAIR_COLORS.length];
          li.appendChild(sw);
          li.appendChild(document.createTextNode(p2.name));
          pairLegend.appendChild(li);
        });
      }

      /* Stability table: rolling 24 fixed (the site's correlation floor). */
      pairStab.innerHTML = '';
      pairs.forEach(function (p2) {
        var full = pearsonSlice(perSeries[p2.a], perSeries[p2.b], 0, n);
        var cells;
        if (n >= 30) {
          var roll = rollingR(perSeries[p2.a], perSeries[p2.b], 24).filter(function (r2) {
            return r2 !== null;
          });
          var sum = roll.reduce(function (x2, y2) {
            return x2 + y2;
          }, 0);
          cells = [
            fmtR(full),
            roll.length ? fmtR(sum / roll.length) : '—',
            roll.length ? fmtR(Math.min.apply(null, roll)) : '—',
            roll.length ? fmtR(Math.max.apply(null, roll)) : '—',
          ];
        } else {
          cells = [fmtR(full), '—', '—', '—'];
        }
        var tr = document.createElement('tr');
        var th = document.createElement('th');
        th.setAttribute('scope', 'row');
        th.textContent = p2.name;
        tr.appendChild(th);
        cells.forEach(function (v) {
          var td = document.createElement('td');
          td.className = 'dtable__num';
          td.textContent = v;
          tr.appendChild(td);
        });
        pairStab.appendChild(tr);
      });

      /* Overlap table: joint loss months vs independence, joint drawdown. */
      pairOverlap.innerHTML = '';
      var flags = perSeries.map(ddFlags);
      pairs.forEach(function (p2) {
        var A = perSeries[p2.a];
        var B = perSeries[p2.b];
        var lossA = 0;
        var lossB = 0;
        var both = 0;
        var bothDD = 0;
        for (var i = 0; i < n; i++) {
          if (A[i] < 0) lossA++;
          if (B[i] < 0) lossB++;
          if (A[i] < 0 && B[i] < 0) both++;
          if (flags[p2.a][i] && flags[p2.b][i]) bothDD++;
        }
        var expected = (lossA / n) * (lossB / n) * 100;
        var tr = document.createElement('tr');
        var th = document.createElement('th');
        th.setAttribute('scope', 'row');
        th.textContent = p2.name;
        tr.appendChild(th);
        [
          both + ' (' + ((both / n) * 100).toFixed(1) + '%)',
          expected.toFixed(1) + '%',
          ((bothDD / n) * 100).toFixed(1) + '%',
        ].forEach(function (v) {
          var td = document.createElement('td');
          td.className = 'dtable__num';
          td.textContent = v;
          tr.appendChild(td);
        });
        pairOverlap.appendChild(tr);
      });
    }

    picks.forEach(function (x) {
      on(x, 'change', recompute);
    });
    modes.forEach(function (x) {
      on(x, 'change', recompute);
    });
    pairWindows.forEach(function (x) {
      on(x, 'change', recompute);
    });
    recompute();
  })();

  /* 15 ─ research log: filter / sort ───────────────────────────────── */
  /* Same contract as the EA browse: every experiment card is already in the
     HTML; this only toggles `hidden` and reorders nodes. The toolbar ships
     hidden and is revealed here, so a no-JS visitor gets the full log in
     newest-first order with no dead controls.                            */

  (function researchBrowse() {
    var root = $('[data-xbrowse]');
    var list = $('[data-xlist]');
    if (!root || !list) return;

    root.hidden = false;

    var cards = $$('.xcard', list);
    var eaSel = $('[data-xea]', root);
    var sortSel = $('[data-xsort]', root);
    var count = $('[data-xcount]', root);
    var none = $('[data-xnone]', root);
    var countTpl = count ? count.dataset.tpl || '' : '';

    var state = { status: '', category: '', source: '', ea: '', sort: 'newest' };

    cards.forEach(function (c, i) {
      c.dataset.order = String(i); // document order = newest first
    });

    function matches(card) {
      if (state.status && card.dataset.status !== state.status) return false;
      if (state.category && card.dataset.category !== state.category) return false;
      if (state.source && card.dataset.source !== state.source) return false;
      if (state.ea && card.dataset.ea !== state.ea) return false;
      return true;
    }

    /* Undated entries sink in both date orders: an unknown date is not the
       newest and not the oldest, it is unknown. */
    function byDate(a, b, dir) {
      var ad = a.dataset.date || '';
      var bd = b.dataset.date || '';
      if (!ad && !bd) return Number(a.dataset.order) - Number(b.dataset.order);
      if (!ad) return 1;
      if (!bd) return -1;
      if (ad === bd) return Number(a.dataset.order) - Number(b.dataset.order);
      return ad < bd ? dir : -dir;
    }

    function byStatusFirst(want) {
      return function (a, b) {
        var aw = a.dataset.status === want ? 0 : 1;
        var bw = b.dataset.status === want ? 0 : 1;
        if (aw !== bw) return aw - bw;
        return byDate(a, b, -1);
      };
    }

    var SORTS = {
      newest: function (a, b) {
        return byDate(a, b, -1);
      },
      oldest: function (a, b) {
        return byDate(a, b, 1);
      },
      accepted: byStatusFirst('ACCEPTED'),
      rejected: byStatusFirst('REJECTED'),
    };

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var ok = matches(c);
        c.hidden = !ok;
        if (ok) shown++;
      });

      cards
        .slice()
        .sort(SORTS[state.sort] || SORTS.newest)
        .forEach(function (c) {
          list.appendChild(c);
        });

      if (count) count.textContent = countTpl.replace('{n}', shown).replace('{total}', cards.length);
      if (none) none.hidden = shown !== 0;
    }

    $$('[data-xfacet]', root).forEach(function (chip) {
      on(chip, 'click', function () {
        var facet = chip.dataset.xfacet;
        state[facet] = chip.dataset.value;
        $$('[data-xfacet="' + facet + '"]', root).forEach(function (o) {
          o.classList.toggle('is-on', o === chip);
        });
        apply();
      });
    });

    if (eaSel)
      on(eaSel, 'change', function () {
        state.ea = eaSel.value;
        apply();
      });
    if (sortSel)
      on(sortSel, 'change', function () {
        state.sort = sortSel.value;
        apply();
      });

    apply();
  })();

  /* 16 ─ EA ACCESS hub: focus the strategy named in ?ea= (Phase 16 §43) ─ */
  (function accessFocus() {
    var table = $('[data-access-matrix]');
    var box = $('[data-access-focus]');
    if (!table || !box) return;
    var slug = '';
    try { slug = new URLSearchParams(location.search).get('ea') || ''; } catch (e) {}
    slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!slug) return;
    var row = $('tr[data-ea="' + slug + '"]', table);
    if (!row) return;
    row.classList.add('is-focus');
    var name = $('th a', row);
    var badge = $('.abadge', row);
    var planCell = row.cells[5]; // plan column
    var planText = planCell ? planCell.textContent.trim() : '';
    $('[data-access-focus-name]', box).textContent = name ? name.textContent : slug;
    var pl = $('[data-access-focus-plans]', box);
    pl.innerHTML = '';
    if (badge) pl.appendChild(badge.cloneNode(true));
    var body = $('[data-access-focus-body]', box);
    var assigned = planText && planText !== '—';
    body.textContent = assigned ? body.dataset.assigned.replace('{plans}', planText) : body.dataset.pending;
    box.hidden = false;
    box.classList.add('is-in');
    raf(function () { row.scrollIntoView({ block: 'center', behavior: isReduced() ? 'auto' : 'smooth' }); });
  })();

  /* 17 ─ inquiry forms: post as JSON to the configured endpoint (§87) ──── */
  (function inquiry() {
    $$('form[data-inquiry-form]').forEach(function (form) {
      if (form.classList.contains('iform--offline')) {
        on(form, 'submit', function (e) { e.preventDefault(); });
        return;
      }
      on(form, 'submit', function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });
        data.page = location.pathname;
        var btn = $('[type="submit"]', form);
        if (btn) btn.disabled = true;
        fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(String(r.status)); form.classList.add('is-sent'); form.reset(); })
          .catch(function () { form.classList.add('is-failed'); })
          .then(function () { if (btn) btn.disabled = false; });
      });
    });
  })();
})();
