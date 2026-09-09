/* amlin-air: the page's own layer over the unedited scrollcraft engine.
   One wind model drives everything: the pinwheel's torque, the field's pace,
   the streak length, the Beaufort readout. The mark is rebuilt per-blade from
   assets/icon.svg and lives its whole life as one object: full screen, docked
   chrome, catch instrument, menu-bar size. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var sstep = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  ScrollCraft.mount(document);
  function relayout() { dispatchEvent(new Event('resize')); }
  addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  // ---- track geometry (mirrors the data-sc-w weights) ----------------------
  var W = [1.4, 1.4, 2.6, 1.4, 1.6, 1.4, 1.2];
  var C0 = [0]; W.forEach(function (w, i) { C0.push(C0[i] + w); });
  var TOTAL = C0[W.length];
  var legLocal = function (t, i) { return clamp((t - C0[i]) / W[i], 0, 1); };
  // a value interpolated across leg midpoints, so regimes blend at seams
  function valAt(t, arr) {
    var mids = W.map(function (w, i) { return C0[i] + w / 2; });
    if (t <= mids[0]) return arr[0];
    for (var i = 0; i < mids.length - 1; i++) {
      if (t <= mids[i + 1]) return lerp(arr[i], arr[i + 1], sstep((t - mids[i]) / (mids[i + 1] - mids[i])));
    }
    return arr[arr.length - 1];
  }

  // ---- the mark, rebuilt per-blade from the icon ---------------------------
  var BLADE_BIG = 'M512 512 C372 442 407 260 547 260 C505 358 547 456 512 512 Z';
  var BLADE_SMALL = 'M512 512 C414 456 442 316 554 316 C519 386 554 456 512 512 Z';
  var ARC_R = 520, ARC_C = 2 * Math.PI * ARC_R;
  var markEl = document.getElementById('mark');
  var markBtn = document.getElementById('markBtn');
  var svg = '<svg viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">' +
    '<circle class="mark__arc" cx="512" cy="512" r="' + ARC_R + '" fill="none" stroke="#9fc1b8" stroke-width="16" stroke-linecap="round" stroke-dasharray="' + ARC_C + '" stroke-dashoffset="' + ARC_C + '" transform="rotate(-90 512 512)"/>' +
    '<rect x="100" y="100" width="824" height="824" rx="180" fill="#146b62" stroke="#0e544d" stroke-width="3"/>' +
    '<g class="mark__rotor">';
  for (var bi = 0; bi < 4; bi++) svg += '<g class="blade" data-base="' + (bi * 90) + '" transform="rotate(' + (bi * 90) + ' 512 512)"><path d="' + BLADE_BIG + '" fill="#9fc1b8"/></g>';
  for (bi = 0; bi < 4; bi++) svg += '<g class="blade blade--s" data-base="' + (45 + bi * 90) + '" transform="rotate(' + (45 + bi * 90) + ' 512 512)"><path d="' + BLADE_SMALL + '" fill="#fbf7ec"/></g>';
  svg += '</g><circle cx="512" cy="512" r="42" fill="#146b62"/></svg>';
  markBtn.innerHTML = svg;
  var rotor = markBtn.querySelector('.mark__rotor');
  var arc = markBtn.querySelector('.mark__arc');
  var blades = Array.prototype.slice.call(markBtn.querySelectorAll('.blade'));

  // ---- chrome: waypoint label, Beaufort readout, the map -------------------
  var meta = document.getElementById('markMeta');
  var wpLabel = document.getElementById('wpLabel');
  var forceEl = document.getElementById('force');
  var map = document.getElementById('map');
  var segEls = document.querySelectorAll('[data-sc-segment]');
  var names = Array.prototype.map.call(segEls, function (s) { return s.getAttribute('data-sc-waypoint'); });
  names.forEach(function (n, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = n; b.dataset.leg = i;
    b.addEventListener('click', function () {
      closeMap();
      scrollTo({ top: Math.round((C0[i] + W[i] * 0.45) * innerHeight), behavior: reduce ? 'auto' : 'smooth' });
    });
    map.insertBefore(b, map.querySelector('hr'));
  });
  function openMap() { map.hidden = false; markBtn.setAttribute('aria-expanded', 'true'); }
  function closeMap() { map.hidden = true; markBtn.setAttribute('aria-expanded', 'false'); }
  markBtn.addEventListener('click', function () { map.hidden ? openMap() : closeMap(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !map.hidden) { closeMap(); markBtn.focus(); } });
  document.addEventListener('pointerdown', function (e) {
    if (!map.hidden && !map.contains(e.target) && !markBtn.contains(e.target)) closeMap();
  });
  addEventListener('sc:waypoint', function (e) {
    wpLabel.textContent = e.detail.label;
    map.querySelectorAll('button[data-leg]').forEach(function (b) {
      b.setAttribute('aria-current', String(+b.dataset.leg === e.detail.index));
    });
  });

  // Focus inside a faded copy window: bring the window to its open position.
  document.addEventListener('focusin', function (e) {
    var b = e.target.closest && e.target.closest('[data-sc-copy]');
    if (!b || parseFloat(getComputedStyle(b).opacity || '1') > 0.85) return;
    var spec = b.getAttribute('data-sc-window'), frac;
    if (spec === 'hero') frac = 0.02 / TOTAL;
    else if (spec === 'finale') frac = (TOTAL - 0.4) / TOTAL;
    else { var n = spec.split(/\s+/).map(parseFloat); frac = (n[0] + (n[1] || n[0])) / 2; }
    scrollTo({ top: Math.round(frac * TOTAL * innerHeight), behavior: 'instant' });
  });

  // ---- shared state --------------------------------------------------------
  var worldEl = document.querySelector('[data-sc-world]');
  var copyEl = document.querySelector('[data-sc-world-copy]');
  var plates = {
    note: document.getElementById('plateNote'),
    dict: document.getElementById('plateDict'),
    todo: document.getElementById('plateTodo')
  };
  var slot = document.getElementById('markSlot');
  var canvas = document.getElementById('air');
  var ctx = canvas.getContext('2d');
  var vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 1.5);
  var RAKE = 7.9 * Math.PI / 180;             // the mark's blade rake: the page's one angle
  var DIRX = Math.cos(RAKE), DIRY = -Math.sin(RAKE);   // the current rises toward the dock
  var noteRect = null;

  function sizeCanvas() {
    vw = innerWidth; vh = innerHeight;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    var r = plates.note.getBoundingClientRect();
    noteRect = { x0: r.left / vw, x1: r.right / vw, y0: r.top / vh, y1: r.bottom / vh };
  }
  sizeCanvas();
  addEventListener('resize', sizeCanvas, { passive: true });

  // ---- reduced motion: still paper, same story -----------------------------
  if (reduce) {
    arc.style.strokeDashoffset = '0';
    meta.classList.add('is-on');
    // one static breath of wind on the paper, then nothing moves
    (function still() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(159,193,184,0.28)'; ctx.lineWidth = dpr;
      for (var i = 0; i < 12; i++) {
        var y = (0.12 + 0.75 * (i / 11)) * canvas.height, x = (0.06 + (i % 4) * 0.22) * canvas.width;
        var L = (60 + (i * 37) % 120) * dpr;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L * DIRX, y + L * DIRY); ctx.stroke();
      }
    })();
    addEventListener('resize', function () { sizeCanvas(); }, { passive: true });
    return;
  }
  document.documentElement.classList.add('js-flight');

  // ---- the wind ------------------------------------------------------------
  var wind = { v: 0, dir: 1 };
  var lastY = scrollY, lastT = performance.now();
  var angle = 0, spinV = 0.05, lastFlex = 99, learned = 0;

  // ---- the field -----------------------------------------------------------
  var COUNT = matchMedia('(max-width: 860px)').matches ? 90 : 220;
  var TINTS = ['rgba(20,107,98,', 'rgba(159,193,184,', 'rgba(14,84,77,'];
  var P = [];
  for (var i = 0; i < COUNT; i++) {
    P.push({
      x: Math.random(), y: 0.06 + Math.random() * 0.88,
      s: 0.6 + Math.random() * 0.9, r: 1.1 + Math.random() * 1.5,
      k: i % 3, ph: Math.random() * 6.28, caught: 0, dead: false
    });
  }
  var SPEED = [0.55, 2.4, 1.5, 0.8, 1.2, 0.45, 0.35];
  var DENSITY = [0.6, 0.95, 1, 0.8, 1, 0.12, 0.05];
  var BANDS = [0.30, 0.50, 0.70];

  var lastState = '', lastLabelT = -1;

  function frame(now) {
    var dt = Math.max(now - lastT, 1);
    var dy = scrollY - lastY;
    lastY = scrollY; lastT = now;
    var ty = scrollY / vh;                       // raw track position, unclamped
    var t = clamp(ty, 0, TOTAL);

    // wind: gusts arrive fast, die slowly, carry direction
    var target = Math.min(Math.abs(dy) / dt * 16 / 24, 1);
    if (target > wind.v) wind.v += (target - wind.v) * 0.25;
    else wind.v *= 0.965;
    if (dy !== 0) wind.dir = dy > 0 ? 1 : -1;

    // regime weights
    var catchW = sstep((t - (C0[2] - 0.3)) / 0.5) * (1 - sstep((t - (C0[3] + 0.2)) / 0.5));
    var learnW = sstep((t - C0[3]) / 0.5) * (1 - sstep((t - C0[4]) / 0.4));
    var triW = sstep((t - C0[4]) / 0.5) * (1 - sstep((t - (C0[5] + 0.2)) / 0.4));
    var costW = sstep((t - C0[1]) / 0.5) * (1 - sstep((t - C0[2]) / 0.4));
    learned = Math.max(learned, sstep(legLocal(t, 3)));   // the wheel keeps what it learns

    // ---- the wheel: torque against inertia --------------------------------
    var idle = 0.05 * (1 + 0.35 * Math.sin(now / 4300)) * (1 + 0.6 * learned);
    var drive = idle + catchW * 1.5 + wind.v * wind.v * 22 * wind.dir;
    spinV += (drive - spinV) * 0.06;
    angle = (angle + spinV * dt / 16.7) % 360;
    if (angle < 0) angle += 360;
    rotor.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 512 512)');
    var flex = clamp(-spinV * 1.1, -7, 7);
    if (Math.abs(flex - lastFlex) > 0.06) {
      lastFlex = flex;
      blades.forEach(function (b) {
        var f = b.classList.contains('blade--s') ? flex * 1.35 : flex;
        b.setAttribute('transform', 'rotate(' + (+b.dataset.base + f).toFixed(2) + ' 512 512)');
      });
    }

    // ---- the mark's flight path -------------------------------------------
    var mob = vw <= 860;
    var S0 = mob ? Math.min(vw * 0.62, vh * 0.5, 460) : Math.min(vw * 0.36, vh * 0.62, 560);
    var u = sstep((t - 1.0) / 0.9);              // full screen -> dock
    var u2 = sstep((t - 9.9) / 0.7);             // dock -> menu-bar slot
    var cx = lerp(mob ? vw * 0.5 : vw * 0.68, vw - 40, u);
    var cy = lerp(mob ? vh * 0.26 : vh * 0.40, 40, u);
    var size = lerp(S0, 48, u);
    if (u2 > 0) {
      var sr = slot.getBoundingClientRect();
      cx = lerp(cx, sr.left + sr.width / 2, u2);
      cy = lerp(cy, sr.top + sr.height / 2, u2);
      size = lerp(size, 20, u2);
    }
    var scale = size / 640;
    markEl.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + scale.toFixed(4) + ')';
    markEl.classList.toggle('is-docked', u > 0.85 && u2 < 0.5);
    meta.classList.toggle('is-on', u > 0.9 && u2 < 0.2);
    var blur = Math.max(0, Math.abs(spinV) - 2.5) * 0.09;
    rotor.style.filter = blur > 0.05 ? 'blur(' + Math.min(blur / scale, 2 / scale).toFixed(1) + 'px)' : '';
    arc.style.strokeDashoffset = (ARC_C * (1 - t / TOTAL)).toFixed(0);
    var F = Math.min(9, Math.round(wind.v * 9));
    if (forceEl.textContent !== 'F' + F) forceEl.textContent = 'F' + F;

    // ---- plate reveals: written from the top down -------------------------
    var rNote = sstep((legLocal(t, 2) - 0.16) / 0.5);
    var rDict = sstep((legLocal(t, 4) - 0.05) / 0.4);
    var rTodo = sstep((legLocal(t, 4) - 0.28) / 0.4);
    plates.note.style.clipPath = 'inset(0 0 ' + ((1 - rNote) * 100).toFixed(1) + '% 0 round 14px)';
    plates.dict.style.clipPath = 'inset(0 0 ' + ((1 - rDict) * 100).toFixed(1) + '% 0 round 14px)';
    plates.todo.style.clipPath = 'inset(0 0 ' + ((1 - rTodo) * 100).toFixed(1) + '% 0 round 14px)';

    // ---- the field --------------------------------------------------------
    var spd = valAt(t, SPEED) * (1 + wind.v * 2.2);
    var dens = valAt(t, DENSITY);
    var Dx = cx / vw, Dy = cy / vh;              // the wheel is wherever the mark is
    var aspect = vw / vh;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dens > 0.02) {
      var streak = 2 + wind.v * 14 + spd * 2.4;
      for (i = 0; i < COUNT; i++) {
        var p = P[i];
        if (p.dead) {
          if (dens > 0.15 && Math.random() < 0.02) { p.dead = false; p.x = -0.02; p.y = 0.06 + Math.random() * 0.88; p.caught = 0; }
          else continue;
        }
        var step = p.s * spd * 0.0035;
        if (p.caught) {
          // the caught line falls at the blade rake: 7.9 degrees off vertical
          var V = (7 + wind.v * 8) * (vh / 900);
          p.x += (-0.139 * V) / vw; p.y += (0.985 * V) / vh;
          var die = noteRect ? sstep((p.y - noteRect.y1 + 0.06) / 0.1) : sstep((p.y - 0.85) / 0.1);
          var la = (1 - die) * dens;
          if (la <= 0.02 || p.y > 1.04) { p.x = -0.02; p.y = 0.06 + Math.random() * 0.88; p.caught = 0; continue; }
          var TL = 22 * dpr;
          ctx.strokeStyle = TINTS[2] + (0.5 * la).toFixed(3) + ')';
          ctx.lineWidth = 1.1 * dpr;
          ctx.beginPath();
          ctx.moveTo(p.x * canvas.width, p.y * canvas.height);
          ctx.lineTo(p.x * canvas.width + 0.139 * TL, p.y * canvas.height - 0.985 * TL);
          ctx.stroke();
          continue;
        }
        p.x += DIRX * step;
        p.y += DIRY * step * aspect + Math.sin(now / 900 + p.ph) * 0.00025;
        if (triW > 0) p.y += (BANDS[p.k] - p.y) * 0.05 * triW;
        if (catchW > 0) {
          var ddx = Dx - p.x, ddy = Dy - p.y;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < 0.05) { p.caught = 1; continue; }
          p.x += ddx * 0.05 * catchW; p.y += ddy * 0.05 * catchW;
        }
        if (learnW > 0 && p.k === 0) {
          var rx = p.x - Dx, ry = p.y - Dy;
          var d2 = Math.sqrt(rx * rx + ry * ry);
          p.x -= (rx * 0.028 + ry * 0.05) * learnW;
          p.y -= (ry * 0.028 - rx * 0.05) * learnW;
          if (d2 < 0.025) { p.x = -0.02; p.y = 0.06 + Math.random() * 0.88; continue; }
        }
        if (p.x > 1.03 || p.y < -0.06 || p.y > 1.06) {
          if (dens > 0.15) { p.x = -0.02; p.y = 0.06 + Math.random() * 0.88; }
          else { p.dead = true; }
          continue;
        }
        var a = 0.55 * dens * (p.k === 1 ? 1.15 : 1) * (0.7 + 0.3 * Math.sin(now / 1400 + p.ph));
        if (costW > 0) a *= 1 - sstep((p.x - 0.5) / 0.45) * costW;   // blows past, uncaught, and fades
        if (a <= 0.01) continue;
        if (streak > 3.5) {
          ctx.strokeStyle = TINTS[p.k] + a.toFixed(3) + ')';
          ctx.lineWidth = p.r * dpr;
          ctx.beginPath();
          ctx.moveTo(p.x * canvas.width, p.y * canvas.height);
          ctx.lineTo(p.x * canvas.width - DIRX * streak * dpr, p.y * canvas.height - DIRY * streak * dpr);
          ctx.stroke();
        } else {
          ctx.fillStyle = TINTS[p.k] + a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r * dpr, 0, 6.283);
          ctx.fill();
        }
      }
    }

    // ---- the flight ends on the same paper the appendix is printed on -----
    var fade = 1 - clamp((ty - (TOTAL + 0.15)) / 0.55, 0, 1);
    worldEl.style.opacity = fade;
    copyEl.style.opacity = fade;
    markEl.style.opacity = fade;
    var hid = fade < 0.03 ? 'hidden' : '';
    worldEl.style.visibility = hid; copyEl.style.visibility = hid; markEl.style.visibility = hid;

    // ---- honest state for the verification harness ------------------------
    var sig = [Math.round(angle / 4), Math.round(t * 20), Math.round(rNote * 20),
               Math.round((rDict + rTodo) * 10), Math.round(u * 10 + u2 * 10),
               Math.round(wind.v * 10), F].join('|');
    if (sig !== lastState) { lastState = sig; markEl.setAttribute('data-sc-verify-state', sig); }
    var hold = t > C0[5] + 0.45 && t < C0[6];    // the authored stillness of Nothing kept
    markEl.setAttribute('data-sc-verify-hold', hold ? 'true' : 'false');

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
