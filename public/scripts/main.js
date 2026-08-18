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
   07 particle field  (probability-cloud motif)
   08 world map
   09 youtube facade
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

  /* 07 ─ particle field ─────────────────────────────────────────────── */
  /* A probability cloud, not a starfield: each particle drifts inside its own
     small distribution and links to neighbours while they are close. It is the
     visual grammar for "outcomes live in a distribution".                    */

  (function particles() {
    var canvases = $$('[data-particles]');
    if (!canvases.length || isReduced()) return;

    var PALETTES = {
      spectrum: ['#ff3b30', '#ff9f0a', '#ffd60a', '#32d74b', '#40e0d0', '#0a84ff', '#bf5af2'],
      cyan: ['#40e0d0', '#0a84ff', '#7ee8dd'],
      violet: ['#bf5af2', '#0a84ff', '#e0a8ff'],
      amber: ['#ff9f0a', '#ffd60a', '#ff3b30'],
      blue: ['#0a84ff', '#40e0d0', '#8ec5ff'],
    };

    canvases.forEach(function (canvas) {
      var ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      var palette = PALETTES[canvas.dataset.particles] || PALETTES.spectrum;
      var dense = canvas.classList.contains('sec__particles--dense');
      var dots = [];
      var w = 0;
      var h = 0;
      var dpr = 1;
      var running = false;
      var frame = 0;

      function size() {
        var r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = r.width;
        h = r.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return true;
      }

      function seed() {
        var area = w * h;
        var target = Math.round(area / (dense ? 9000 : 15000));
        var n = Math.max(18, Math.min(dense ? 130 : 90, target));
        dots = [];
        for (var i = 0; i < n; i++) {
          var ox = Math.random() * w;
          var oy = Math.random() * h;
          dots.push({
            ox: ox,
            oy: oy,
            x: ox,
            y: oy,
            // Each particle owns a radius of uncertainty it wanders inside.
            sigma: 18 + Math.random() * 46,
            phase: Math.random() * Math.PI * 2,
            speed: 0.0016 + Math.random() * 0.0032,
            r: 0.7 + Math.random() * 1.5,
            c: palette[(Math.random() * palette.length) | 0],
            a: 0.28 + Math.random() * 0.5,
          });
        }
      }

      function draw(now) {
        if (!running) return;
        frame++;
        ctx.clearRect(0, 0, w, h);

        var i;
        for (i = 0; i < dots.length; i++) {
          var d = dots[i];
          var t = now * d.speed + d.phase;
          d.x = d.ox + Math.cos(t) * d.sigma + Math.cos(t * 0.43) * d.sigma * 0.35;
          d.y = d.oy + Math.sin(t * 0.87) * d.sigma * 0.6 + Math.sin(t * 0.31) * d.sigma * 0.3;
        }

        // Links — skipped on small screens where they read as noise.
        if (w > 640) {
          ctx.lineWidth = 0.5;
          for (i = 0; i < dots.length; i++) {
            for (var j = i + 1; j < dots.length; j++) {
              var a = dots[i];
              var b = dots[j];
              var dx = a.x - b.x;
              var dy = a.y - b.y;
              var dist2 = dx * dx + dy * dy;
              if (dist2 > 15000) continue;
              var o = (1 - dist2 / 15000) * 0.16;
              ctx.strokeStyle = 'rgba(255,255,255,' + o.toFixed(3) + ')';
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        for (i = 0; i < dots.length; i++) {
          var p = dots[i];
          var pulse = 0.72 + 0.28 * Math.sin(now * 0.0012 + p.phase);
          ctx.globalAlpha = p.a * pulse;
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          if (p.r > 1.7) {
            ctx.globalAlpha = p.a * pulse * 0.13;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        raf(draw);
      }

      function start() {
        if (running) return;
        if (!size()) return;
        if (!dots.length) seed();
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
})();
