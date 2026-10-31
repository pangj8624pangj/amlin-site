/* Home page motion. Two things move, both because of wind:
   the pinwheel in the bar turns with the speed of your scroll and coasts to a
   stop, and the hero's ink strokes are drawn in once when the page opens.
   Nothing else animates, and with reduced motion neither does this. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ---- the strokes ink themselves in, in the order a hand would draw them ----
  var gust = document.querySelector('.gust');
  if (gust) {
    var strokes = Array.prototype.slice.call(gust.querySelectorAll('.g'));
    var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var jobs = strokes.map(function (p) {
      var m = document.getElementById(p.getAttribute('data-mask'));
      var line = m && m.querySelector('path');
      if (!line) return null;
      p.setAttribute('mask', 'url(#' + m.id + ')');
      return { p: p, line: line, delay: +p.getAttribute('data-delay') * 1000, dur: +p.getAttribute('data-dur') * 1000 };
    }).filter(Boolean);
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
    // the strokes lean a few pixels downwind while the hero is moving past
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
