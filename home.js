/* Home page motion. Two things move, both because of wind:
   the pinwheel in the bar turns with the speed of your scroll and coasts to a
   stop, and the ink strokes after the first and last headlines are drawn in
   once, in the order a hand would draw them: the top ones when the page
   opens, the closing ones when you reach them. Nothing else animates, and
   with reduced motion neither does this. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  // mask every stroke of one drawing; return a function that inks it in
  function prepare(svg) {
    var jobs = Array.prototype.slice.call(svg.querySelectorAll('.g')).map(function (p) {
      var m = document.getElementById(p.getAttribute('data-mask'));
      var line = m && m.querySelector('path');
      if (!line) return null;
      line.setAttribute('stroke-dashoffset', '1');
      p.setAttribute('mask', 'url(#' + m.id + ')');
      return { p: p, line: line, delay: +p.getAttribute('data-delay') * 1000, dur: +p.getAttribute('data-dur') * 1000 };
    }).filter(Boolean);
    return function () {
      var t0 = performance.now();
      var draw = function (now) {
        var busy = false;
        jobs.forEach(function (j) {
          if (j.done) return;
          var u = (now - t0 - j.delay) / j.dur;
          if (u >= 1) { j.p.removeAttribute('mask'); j.done = true; return; }
          busy = true;
          j.line.setAttribute('stroke-dashoffset', (1 - ease(Math.max(0, u))).toFixed(4));
        });
        if (busy) requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    };
  }

  var gust = document.querySelector('.hero .gust');
  if (gust) prepare(gust)();

  var late = document.querySelector('.gust--late');
  if (late && 'IntersectionObserver' in window) {
    var inkIn = prepare(late);
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      inkIn();
    }, { threshold: 0.6 });
    io.observe(late);
  }

  // ---- the pinwheel catches the wind of the scroll ----
  var blades = document.querySelector('.pinwheel .pw-blades');
  var hero = document.querySelector('.hero');
  if (!blades && !gust) return;
  var angle = 0, spin = 0, drift = 0, lastY = scrollY, lastT = 0, running = false;
  function frame(now) {
    var dt = lastT ? Math.min(now - lastT, 64) : 16;
    lastT = now;
    var dy = scrollY - lastY;
    lastY = scrollY;
    var v = dy / dt;                                   // px per ms
    // a gust pushes the blades up to speed; friction lets them coast down
    var push = Math.max(-1.6, Math.min(1.6, v * 0.9)); // degrees per ms
    if (Math.abs(push) > Math.abs(spin)) spin += (push - spin) * 0.18;
    else {
      // air drag, plus a little bearing friction so it actually comes to rest
      var slow = Math.abs(spin) * Math.pow(0.955, dt / 16.7) - 0.0005 * dt / 16.7;
      spin = slow > 0 ? (spin > 0 ? slow : -slow) : 0;
    }
    angle = (angle + spin * dt) % 360;
    if (blades) blades.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 512 512)');
    // the top strokes lean a few pixels downwind while the hero is moving past
    if (gust && hero) {
      var inHero = scrollY < hero.offsetHeight;
      drift += ((inHero ? Math.max(-10, Math.min(10, v * 14)) : 0) - drift) * 0.12;
      if (Math.abs(drift) < 0.05) drift = 0;
      gust.style.transform = drift ? 'translateX(' + drift.toFixed(2) + 'px)' : '';
    }
    if (spin !== 0 || drift !== 0 || dy !== 0) requestAnimationFrame(frame);
    else { running = false; lastT = 0; }
  }
  addEventListener('scroll', function () {
    if (running) return;
    // lastY still holds where the last gust left off, so a single jump of the
    // wheel registers as wind on the very first frame
    running = true; lastT = 0;
    requestAnimationFrame(frame);
  }, { passive: true });
})();

/* Dictation demo: the raw words arrive as they were spoken, the filler is
   struck out, then the cleaned text types itself into the email. Loops while
   on screen. Without JS or with reduced motion it shows the finished state. */
(function () {
  'use strict';
  var fig = document.getElementById('dictDemo');
  if (!fig || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var raw = fig.querySelector('.dd-raw'), out = fig.querySelector('.dd-out');
  var finalHTML = out.innerHTML;
  // split raw text into word spans, keeping filler / command classes
  var words = [];
  Array.prototype.slice.call(raw.childNodes).forEach(function (n) {
    if (n.nodeType === 3) {
      n.textContent.split(/(\s+)/).forEach(function (t) {
        if (!t) return;
        if (/^\s+$/.test(t)) { raw.insertBefore(document.createTextNode(t), n); return; }
        var s = document.createElement('span'); s.className = 'w'; s.textContent = t;
        raw.insertBefore(s, n); words.push(s);
      });
      raw.removeChild(n);
    } else { n.classList.add('w'); words.push(n); }
  });
  // the cleaned text as a list of tokens: characters and line breaks
  var tmp = document.createElement('div'); tmp.innerHTML = finalHTML;
  var tokens = [];
  Array.prototype.slice.call(tmp.childNodes).forEach(function (n) {
    if (n.nodeType === 3) Array.from(n.textContent).forEach(function (ch) { tokens.push(ch); });
    else tokens.push('\n');
  });
  var caret = document.createElement('span'); caret.className = 'dd-caret';
  var timers = [], running = false;
  var at = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    words.forEach(function (w) { w.classList.remove('on', 'gone'); });
    out.innerHTML = ''; out.appendChild(caret);
  }
  function play() {
    reset(); fig.classList.add('listening');
    var t = 300;
    words.forEach(function (w) { at(t, function () { w.classList.add('on'); }); t += /^(um|uh|so)$/.test(w.textContent) ? 260 : 170; });
    t += 350;
    at(t, function () { fig.classList.remove('listening'); fig.querySelectorAll('.dd-raw .f').forEach(function (f) { f.classList.add('gone'); }); });
    t += 650;
    tokens.forEach(function (ch) {
      at(t, function () {
        out.insertBefore(ch === '\n' ? document.createElement('br') : document.createTextNode(ch), caret);
      });
      t += ch === '\n' ? 60 : 22;
    });
    at(t + 3800, function () { if (running) play(); });
  }
  new IntersectionObserver(function (e) {
    if (e[0].isIntersecting && !running) { running = true; play(); }
    else if (!e[0].isIntersecting && running) { running = false; timers.forEach(clearTimeout); timers = []; fig.classList.remove('listening'); words.forEach(function (w) { w.classList.add('on'); }); out.innerHTML = finalHTML; }
  }, { threshold: 0.4 }).observe(fig);
})();
