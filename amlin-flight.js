/* amlin-air: the page's own layer over the unedited scrollcraft engine.
   Eight stops on one continuous track. The pinwheel is one object for the
   whole page: a lit, tilted 3D wheel at the open, docked chrome from the
   second stop, the catch instrument at the peak, menu-bar size at the close.
   Wind appears only where it means something: the catch. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var sstep = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  if (/nosnap/.test(location.search)) document.documentElement.style.scrollSnapType = 'none';
  ScrollCraft.mount(document);
  function relayout() { dispatchEvent(new Event('resize')); }
  addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  // ---- track geometry (mirrors the data-sc-w weights) ----------------------
  var W = [1.3, 1.3, 2.2, 1.3, 1.4, 1.4, 1.3, 1.2];
  var C0 = [0]; W.forEach(function (w, i) { C0.push(C0[i] + w); });
  var TOTAL = C0[W.length];
  // where each stop lands, as a fraction of its leg
  var STOP = [0, 0.5, 0.55, 0.5, 0.5, 0.5, 0.5, 0.5];
  var stopY = function (i) { return i === 0 ? 0 : (C0[i] + W[i] * STOP[i]) * innerHeight; };
  var legLocal = function (t, i) { return clamp((t - C0[i]) / W[i], 0, 1); };

  // ---- scroll stops: one screen you can read, then the next -----------------
  var spacer = document.querySelector('[data-sc-spacer]');
  var stops = W.map(function (_, i) {
    var m = document.createElement('i');
    m.className = 'stop';
    spacer.appendChild(m);
    return m;
  });
  function placeStops() {
    stops.forEach(function (m, i) { m.style.top = Math.round(stopY(i)) + 'px'; });
  }
  placeStops();
  addEventListener('resize', placeStops, { passive: true });

  // ---- the wheel: eight curled blades, lit from the top left ---------------
  var BIG = 'M512 512 C372 442 407 260 547 260 C505 358 547 456 512 512 Z';
  var SMALL = 'M512 512 C414 456 442 316 554 316 C519 386 554 456 512 512 Z';
  var ARC_R = 500, ARC_C = 2 * Math.PI * ARC_R;
  var UP = 'translate(512 512) scale(1.8) translate(-512 -512)';
  var markEl = document.getElementById('mark');
  var markBtn = document.getElementById('markBtn');
  function blades(cls, fillBig, fillSmall, foldBig, foldSmall) {
    var s = '';
    for (var i = 0; i < 4; i++) {
      s += '<g class="' + cls + '" data-base="' + (i * 90) + '" transform="rotate(' + (i * 90) + ' 512 512)">' +
        '<path d="' + BIG + '" fill="' + fillBig + '"/>' +
        '<path d="' + SMALL + '" fill="' + foldBig + '" transform="translate(512 512) scale(0.78) translate(-512 -512)"/></g>';
    }
    for (i = 0; i < 4; i++) {
      s += '<g class="' + cls + ' blade--s" data-base="' + (45 + i * 90) + '" transform="rotate(' + (45 + i * 90) + ' 512 512)">' +
        '<path d="' + SMALL + '" fill="' + fillSmall + '"/>' +
        '<path d="' + SMALL + '" fill="' + foldSmall + '" transform="translate(512 512) scale(0.6) translate(-512 -512)"/></g>';
    }
    return s;
  }
  var svg =
    '<svg viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">' +
    '<defs>' +
      '<linearGradient id="gTeal" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#2aa393"/><stop offset="0.55" stop-color="#146b62"/><stop offset="1" stop-color="#0b3f3a"/></linearGradient>' +
      '<linearGradient id="gTealFold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b3f3a"/><stop offset="1" stop-color="#062926"/></linearGradient>' +
      '<linearGradient id="gBrass" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#f3dc9a"/><stop offset="0.5" stop-color="#cfa54f"/><stop offset="1" stop-color="#8a6320"/></linearGradient>' +
      '<linearGradient id="gBrassFold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6320"/><stop offset="1" stop-color="#5a3f12"/></linearGradient>' +
      '<radialGradient id="gHub" cx="0.36" cy="0.32" r="0.75"><stop offset="0" stop-color="#fff4cf"/><stop offset="0.35" stop-color="#e2bd66"/><stop offset="0.8" stop-color="#8a6320"/><stop offset="1" stop-color="#4a3410"/></radialGradient>' +
      '<radialGradient id="gSheen" cx="0.36" cy="0.3" r="0.55"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="0.45" stop-color="#ffffff" stop-opacity="0.12"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>' +
      '<g id="silhouette"><g transform="' + UP + '">' + blades('sil', '#fff', '#fff', '#fff', '#fff') + '</g></g>' +
      '<mask id="rotorMask"><use id="maskUse" href="#silhouette"/></mask>' +
    '</defs>' +
    '<circle class="mark__arc" cx="512" cy="512" r="' + ARC_R + '" fill="none" stroke="#9fc1b8" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + ARC_C + '" stroke-dashoffset="' + ARC_C + '" transform="rotate(-90 512 512)"/>' +
    '<g class="mark__rotor"><g transform="' + UP + '">' + blades('blade', 'url(#gTeal)', 'url(#gBrass)', 'url(#gTealFold)', 'url(#gBrassFold)') + '</g></g>' +
    '<g mask="url(#rotorMask)"><circle cx="512" cy="512" r="520" fill="url(#gSheen)"/></g>' +
    '<circle cx="512" cy="512" r="66" fill="url(#gHub)"/>' +
    '<circle cx="512" cy="512" r="66" fill="none" stroke="#4a3410" stroke-opacity="0.45" stroke-width="3"/>' +
    '<circle cx="492" cy="492" r="13" fill="#fff8e0" fill-opacity="0.85"/>' +
    '</svg>';
  markBtn.innerHTML = svg;
  var wrap3d = markBtn;
  var rotor = markBtn.querySelector('.mark__rotor');
  var maskUse = markBtn.querySelector('#maskUse');
  var arc = markBtn.querySelector('.mark__arc');
  var bladeEls = Array.prototype.slice.call(markBtn.querySelectorAll('.blade'));

  // ---- chrome: waypoint label, readout, the map ----------------------------
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
      scrollTo({ top: Math.round(stopY(i)), behavior: reduce ? 'auto' : 'smooth' });
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

  // Focus inside a faded copy window: bring that stop into view.
  document.addEventListener('focusin', function (e) {
    var b = e.target.closest && e.target.closest('[data-sc-copy]');
    if (!b || parseFloat(getComputedStyle(b).opacity || '1') > 0.85) return;
    var leg = +b.getAttribute('data-leg') || 0;
    scrollTo({ top: Math.round(stopY(leg)), behavior: 'instant' });
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
  var RAKE = 7.9 * Math.PI / 180;
  var DIRX = Math.cos(RAKE), DIRY = -Math.sin(RAKE);
  var noteRect = null;

  function sizeCanvas() {
    vw = innerWidth; vh = innerHeight;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    var r = plates.note.getBoundingClientRect();
    noteRect = { x0: r.left / vw, x1: r.right / vw, y0: r.top / vh, y1: r.bottom / vh };
  }
  sizeCanvas();
  addEventListener('resize', sizeCanvas, { passive: true });

  if (reduce) {
    arc.style.strokeDashoffset = '0';
    meta.classList.add('is-on');
    // past the landing the appendix covers the flight; take the copy layer
    // out of the page so nothing hidden is left underneath
    var park = function () {
      var gone = scrollY / innerHeight > TOTAL + 0.7;
      copyEl.style.display = gone ? 'none' : '';
      markEl.style.visibility = gone ? 'hidden' : '';
    };
    addEventListener('scroll', park, { passive: true });
    park();
    return;
  }
  document.documentElement.classList.add('js-flight');

  // ---- the wind ------------------------------------------------------------
  var wind = { v: 0, dir: 1 };
  var lastY = scrollY, lastT = performance.now();
  var angle = 0, spinV = 0.05, lastFlex = 99, learned = 0;

  // ---- the catch stream: exists only at the peak ---------------------------
  var COUNT = matchMedia('(max-width: 860px)').matches ? 28 : 54;
  var P = [];
  for (var i = 0; i < COUNT; i++) {
    P.push({ x: Math.random() * 0.6 - 0.1, y: 0.2 + Math.random() * 0.6, s: 0.7 + Math.random() * 0.8, r: 1.1 + Math.random() * 1.2, ph: Math.random() * 6.28, caught: 0 });
  }
  var lastState = '';

  function frame(now) {
    var dt = Math.max(now - lastT, 1);
    var dy = scrollY - lastY;
    lastY = scrollY; lastT = now;
    var ty = scrollY / vh;
    var t = clamp(ty, 0, TOTAL);

    var target = Math.min(Math.abs(dy) / dt * 16 / 24, 1);
    if (target > wind.v) wind.v += (target - wind.v) * 0.25;
    else wind.v *= 0.965;
    if (dy !== 0) wind.dir = dy > 0 ? 1 : -1;

    var catchW = sstep((t - (C0[2] - 0.2)) / 0.4) * (1 - sstep((t - (C0[3] - 0.2)) / 0.3));
    learned = Math.max(learned, sstep(legLocal(t, 3)));

    // ---- torque against inertia -------------------------------------------
    var idle = 0.05 * (1 + 0.35 * Math.sin(now / 4300)) * (1 + 0.6 * learned);
    var drive = idle + catchW * 1.5 + wind.v * wind.v * 22 * wind.dir;
    spinV += (drive - spinV) * 0.06;
    angle = (angle + spinV * dt / 16.7) % 360;
    if (angle < 0) angle += 360;
    var rot = 'rotate(' + angle.toFixed(2) + ' 512 512)';
    rotor.setAttribute('transform', rot);
    maskUse.setAttribute('transform', rot);
    var flex = clamp(-spinV * 1.1, -7, 7);
    if (Math.abs(flex - lastFlex) > 0.06) {
      lastFlex = flex;
      bladeEls.forEach(function (b) {
        var f = b.classList.contains('blade--s') ? flex * 1.35 : flex;
        b.setAttribute('transform', 'rotate(' + (+b.dataset.base + f).toFixed(2) + ' 512 512)');
      });
    }

    // ---- the mark's flight path -------------------------------------------
    var mob = vw <= 860;
    var S0 = mob ? Math.min(vw * 0.72, vh * 0.42) : Math.min(vw * 0.42, vh * 0.74, 700);
    var u = sstep((t - 0.9) / 0.9);              // open -> dock
    var u2 = sstep((t - 10.0) / 0.7);            // dock -> menu-bar slot
    var cx = lerp(mob ? vw * 0.5 : vw * 0.68, vw - 44, u);
    var cy = lerp(mob ? vh * 0.25 : vh * 0.44, 44, u);
    var size = lerp(S0, 56, u);
    if (u2 > 0) {
      var sr = slot.getBoundingClientRect();
      cx = lerp(cx, sr.left + sr.width / 2, u2);
      cy = lerp(cy, sr.top + sr.height / 2, u2);
      size = lerp(size, 20, u2);
    }
    var scale = size / 640;
    markEl.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + scale.toFixed(4) + ')';
    // a lit object in perspective at the open; flat chrome once docked
    var tilt = 1 - u;
    wrap3d.style.transform = 'rotateX(' + (26 * tilt).toFixed(1) + 'deg) rotateY(' + (-16 * tilt).toFixed(1) + 'deg)';
    markEl.classList.toggle('is-docked', u > 0.85 && u2 < 0.5);
    meta.classList.toggle('is-on', u > 0.9 && u2 < 0.2);
    var blur = Math.max(0, Math.abs(spinV) - 2.5) * 0.09;
    rotor.style.filter = blur > 0.05 ? 'blur(' + Math.min(blur / scale, 2 / scale).toFixed(1) + 'px)' : '';
    arc.style.strokeDashoffset = (ARC_C * (1 - t / TOTAL)).toFixed(0);
    var F = Math.min(9, Math.round(wind.v * 9));
    if (forceEl.textContent !== 'F' + F) forceEl.textContent = 'F' + F;

    // ---- plates: written in before the stop -------------------------------
    var rNote = sstep((legLocal(t, 2) - 0.12) / 0.38);
    var rDict = sstep((legLocal(t, 4) - 0.08) / 0.36);
    var rTodo = sstep((legLocal(t, 5) - 0.08) / 0.36);
    plates.note.style.clipPath = 'inset(0 0 ' + ((1 - rNote) * 100).toFixed(1) + '% 0 round 14px)';
    plates.dict.style.clipPath = 'inset(0 0 ' + ((1 - rDict) * 100).toFixed(1) + '% 0 round 14px)';
    plates.todo.style.clipPath = 'inset(0 0 ' + ((1 - rTodo) * 100).toFixed(1) + '% 0 round 14px)';

    // ---- the catch stream -------------------------------------------------
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (catchW > 0.01) {
      var Dx = cx / vw, Dy = cy / vh;
      var spd = (1.3 + wind.v * 1.6) * 0.0035;
      for (i = 0; i < COUNT; i++) {
        var p = P[i];
        if (p.caught) {
          var V = (7 + wind.v * 8) * (vh / 900);
          p.x += (-0.139 * V) / vw; p.y += (0.985 * V) / vh;
          var die = noteRect ? sstep((p.y - noteRect.y1 + 0.06) / 0.1) : sstep((p.y - 0.85) / 0.1);
          var la = (1 - die) * catchW;
          if (la <= 0.02 || p.y > 1.04) { p.x = -0.02; p.y = 0.2 + Math.random() * 0.6; p.caught = 0; continue; }
          var TL = 22 * dpr;
          ctx.strokeStyle = 'rgba(14,84,77,' + (0.5 * la).toFixed(3) + ')';
          ctx.lineWidth = 1.1 * dpr;
          ctx.beginPath();
          ctx.moveTo(p.x * canvas.width, p.y * canvas.height);
          ctx.lineTo(p.x * canvas.width + 0.139 * TL, p.y * canvas.height - 0.985 * TL);
          ctx.stroke();
          continue;
        }
        var step = p.s * spd;
        p.x += DIRX * step;
        p.y += DIRY * step * (vw / vh) + Math.sin(now / 900 + p.ph) * 0.0002;
        var ddx = Dx - p.x, ddy = Dy - p.y;
        var dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < 0.05) { p.caught = 1; continue; }
        p.x += ddx * 0.045; p.y += ddy * 0.045;
        if (p.x > 1.03 || p.y < -0.06) { p.x = -0.02; p.y = 0.2 + Math.random() * 0.6; continue; }
        var a = 0.42 * catchW * (0.7 + 0.3 * Math.sin(now / 1400 + p.ph));
        var L = (8 + wind.v * 12) * dpr;
        ctx.strokeStyle = 'rgba(20,107,98,' + a.toFixed(3) + ')';
        ctx.lineWidth = p.r * dpr;
        ctx.beginPath();
        ctx.moveTo(p.x * canvas.width, p.y * canvas.height);
        ctx.lineTo(p.x * canvas.width - DIRX * L, p.y * canvas.height - DIRY * L);
        ctx.stroke();
      }
    }

    // ---- the flight ends on the same paper the appendix is printed on -----
    var fade = 1 - clamp((ty - (TOTAL + 0.15)) / 0.55, 0, 1);
    worldEl.style.opacity = fade;
    copyEl.style.opacity = fade;
    markEl.style.opacity = fade;
    var hid = fade < 0.03 ? 'hidden' : '';
    worldEl.style.visibility = hid; markEl.style.visibility = hid;
    copyEl.style.display = fade < 0.03 ? 'none' : '';

    // ---- honest state for the verification harness ------------------------
    var sig = [Math.round(angle / 4), Math.round(t * 20), Math.round(rNote * 20),
               Math.round((rDict + rTodo) * 10), Math.round(u * 10 + u2 * 10), F].join('|');
    if (sig !== lastState) { lastState = sig; markEl.setAttribute('data-sc-verify-state', sig); }
    var hold = t > C0[6] + 0.4 && t < C0[7];
    markEl.setAttribute('data-sc-verify-hold', hold ? 'true' : 'false');

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
