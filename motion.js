// Motion layer — "the transcript is alive" (kinetic hero + dictation demo,
// word reveals) with the sound-thread ambience (hero waveform, mic-pulse CTAs).
// Progressive enhancement only: without JS, or with prefers-reduced-motion,
// the page is exactly the static site. The hero performs once per session.
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    document.documentElement.classList.remove('kinetic')
    return
  }

  // ── Scroll is wind. One model with gust inertia and slow decay drives the
  //    pinwheel marks (real angular momentum), the ribbon surge, the paper
  //    motes, and the direction headlines settle in from. Meaning over motion:
  //    Amlin turns moving air into text; the mark is what makes air visible. ──
  document.documentElement.classList.add('windy')
  const wind = { v: 0, dir: 1 }
  {
    const pins = document.querySelectorAll('.nav .brand-mark, .footer .brand-mark')
    const shotWrap = document.querySelector('.hero-shot')
    const planes = shotWrap && matchMedia('(min-width: 821px)').matches
      ? [
          [shotWrap.querySelector('.shot-caption'), -9],
          [shotWrap.querySelector('.strip'), 13]
        ].filter((p) => p[0])
      : []
    let lastY = scrollY
    let lastT = performance.now()
    let angle = 0
    let spinV = 0.05
    ;(function windTick(now) {
      const dt = Math.max(now - lastT, 1)
      const dy = scrollY - lastY
      lastY = scrollY
      lastT = now
      const target = Math.min(Math.abs(dy) / dt * 16 / 24, 1)
      if (target > wind.v) wind.v += (target - wind.v) * 0.25 // gusts arrive fast
      else wind.v *= 0.965 // and die slowly
      if (dy !== 0) wind.dir = dy > 0 ? 1 : -1
      // pinwheels: wind torque against rotational inertia, so a flick spins
      // them up and they coast back down to an idle drift
      const drive = 0.05 + wind.v * wind.v * 16 * wind.dir
      spinV += (drive - spinV) * 0.06
      angle = (angle + spinV) % 360
      pins.forEach((p) => { p.style.transform = 'rotate(' + angle + 'deg)' })
      // notepad scene: planes drift apart slightly as the scene passes center
      if (planes.length) {
        const r = shotWrap.getBoundingClientRect()
        const p = Math.min(Math.max(1 - (r.top + r.height / 2) / innerHeight, 0), 1) * 2 - 1
        planes.forEach((pl) => { pl[0].style.transform = 'translateY(' + (p * pl[1]).toFixed(1) + 'px)' })
      }
      requestAnimationFrame(windTick)
    })(lastT)
  }

  // ── Kinetic hero: raw speech types itself, Enhance lands, headline resolves ──
  const hero = document.querySelector('.hero')
  const h1 = hero ? hero.querySelector('h1') : null
  if (h1 && document.documentElement.classList.contains('kinetic')) {
    try { sessionStorage.setItem('amlin-hero-played', '1') } catch (e) {}
    const FINAL = h1.innerHTML
    const RAW = 'um so basically it listens to the call and, uh, writes everything down while you just… talk'
    const lines = FINAL.split(/<br\s*\/?>/i).map((s) =>
      s.trim().split(/\s+/).filter(Boolean)
    )

    h1.style.minHeight = h1.offsetHeight + 'px'
    h1.classList.add('kin-run', 'kin-raw')
    h1.innerHTML = '<span class="kin-txt"></span><span class="kin-caret"></span><br /><span class="kin-chip">✦ Enhance</span>'
    const txt = h1.querySelector('.kin-txt')
    const chip = h1.querySelector('.kin-chip')

    let i = 0
    ;(function type() {
      if (i <= RAW.length) {
        txt.textContent = RAW.slice(0, i)
        const ch = RAW[i]
        i += 1
        setTimeout(type, ch === ',' || ch === '…' ? 140 : 24)
      } else {
        setTimeout(() => chip.classList.add('on'), 420)
        setTimeout(() => h1.classList.add('kin-off'), 1250)
        setTimeout(reveal, 1650)
      }
    })()

    function reveal() {
      h1.classList.remove('kin-raw', 'kin-off')
      h1.innerHTML = lines
        .map((ws) => ws.map((w) => '<span class="kw">' + w + '</span>').join(' '))
        .join('<br />')
      const words = h1.querySelectorAll('.kw')
      words.forEach((w, n) => setTimeout(() => w.classList.add('on'), 90 * n))
      setTimeout(() => {
        h1.innerHTML = FINAL
        h1.style.minHeight = ''
        h1.classList.remove('kin-run')
        document.documentElement.classList.remove('kinetic')
      }, 90 * words.length + 900)
    }
  }

  // ── Word-by-word reveals for section headlines (same voice, lower volume) ──
  const heads = document.querySelectorAll('.section-head h2, .ftext h2, .band .inner h2, .close-cta h2')
  heads.forEach((h) => {
    if (h.querySelector('*')) return // only wrap plain-text headlines
    h.innerHTML = h.textContent
      .split(/\s+/)
      .filter(Boolean)
      .map((w, n) => '<span class="rw" style="transition-delay:' + n * 45 + 'ms">' + w + '</span>')
      .join(' ')
  })
  const headIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        // words settle in from the direction the wind is blowing right now
        e.target.style.setProperty('--rw-x', (wind.dir * (6 + wind.v * 26)).toFixed(1) + 'px')
        e.target.classList.add('rv-in')
        headIO.unobserve(e.target)
      }
    })
  }, { threshold: 0.4 })
  heads.forEach((h) => headIO.observe(h))

  // ── Dictation demo performs itself when scrolled into view ──
  const demo = document.querySelector('.dict-demo')
  if (demo) {
    const saidSpan = demo.querySelector('.dict-said span:last-child')
    const out = demo.querySelector('.dict-out')
    if (saidSpan && out) {
      const SAID = saidSpan.textContent
      const OUT = out.textContent
      demo.classList.add('pending')
      saidSpan.textContent = ''
      const demoIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          demoIO.unobserve(demo)
          let i = 0
          ;(function type() {
            if (i <= SAID.length) {
              saidSpan.textContent = SAID.slice(0, i)
              i += 1
              setTimeout(type, 18)
            } else {
              setTimeout(() => {
                demo.classList.remove('pending')
                out.innerHTML = OUT.split(/\s+/).filter(Boolean)
                  .map((w) => '<span class="kw">' + w + '</span>').join(' ')
                out.querySelectorAll('.kw').forEach((w, n) =>
                  setTimeout(() => w.classList.add('on'), 45 * n))
              }, 350)
            }
          })()
        })
      }, { threshold: 0.5 })
      demoIO.observe(demo)
    }
  }

  // ── Ink accents draw themselves on scroll (direction 2) ──
  const inks = document.querySelectorAll('.has-ink')
  const inkIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('ink-in')
        inkIO.unobserve(e.target)
      }
    })
  }, { threshold: 0.6 })
  inks.forEach((el) => inkIO.observe(el))

  // ── Value band: three arcs converge into the pinwheel (plays once) ──
  const mark = document.querySelector('.band .mark')
  if (mark) {
    const markIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          mark.classList.add('play')
          markIO.unobserve(mark)
        }
      })
    }, { threshold: 0.9 })
    markIO.observe(mark)
  }

  // ── Ambience: breathing waveform ribbons (hero + closing CTA) ──
  function mountWave(host, midFraction) {
    const cv = document.createElement('canvas')
    cv.className = 'wave-ribbon'
    cv.setAttribute('aria-hidden', 'true')
    host.appendChild(cv)
    const ctx = cv.getContext('2d')
    let W, H
    const dpr = Math.min(devicePixelRatio || 1, 2)
    function size() {
      const r = host.getBoundingClientRect()
      W = cv.width = r.width * dpr
      H = cv.height = r.height * dpr
    }
    size()
    addEventListener('resize', size)
    const layers = [
      { amp: 20, speed: 1.0, hue: 'rgba(20,107,98,0.20)', w: 2 },
      { amp: 12, speed: 1.6, hue: 'rgba(20,107,98,0.11)', w: 1.4 },
      { amp: 28, speed: 0.6, hue: 'rgba(206,75,60,0.09)', w: 1.4 }
    ]
    // paper motes ride the same wind as everything else
    const motes = Array.from({ length: 9 }, (_, i) => ({
      x: Math.random(), y: 0.15 + Math.random() * 0.7,
      r: 0.9 + Math.random() * 1.3, s: 0.25 + Math.random() * 0.5,
      ph: Math.random() * 6.28,
      hue: i % 3 === 2 ? 'rgba(206,75,60,0.15)' : 'rgba(20,107,98,0.16)'
    }))
    ;(function draw(t) {
      ctx.clearRect(0, 0, W, H)
      const mid = H * midFraction
      const gust = 1 + wind.v * 1.6
      const breathe = (0.55 + 0.45 * Math.sin(t / 2600)) * gust
      for (const L of layers) {
        ctx.beginPath()
        for (let x = 0; x <= W; x += 6 * dpr) {
          const p = x / W
          const env = Math.sin(p * Math.PI)
          const y = mid
            + Math.sin(p * 14 + t / (700 / L.speed)) * L.amp * env * breathe * dpr
            + Math.sin(p * 31 - t / (1100 / L.speed)) * L.amp * 0.35 * env * breathe * dpr
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = L.hue
        ctx.lineWidth = L.w * dpr
        ctx.stroke()
      }
      for (const m of motes) {
        m.x += m.s * 0.0004 + wind.v * 0.005
        if (m.x > 1.02) m.x -= 1.04
        const my = (m.y + Math.sin(t / 1900 + m.ph) * 0.03 - wind.v * 0.05) * H
        ctx.beginPath()
        ctx.arc(m.x * W, my, m.r * dpr, 0, 6.283)
        ctx.fillStyle = m.hue
        ctx.fill()
      }
      requestAnimationFrame(draw)
    })(0)
  }
  if (hero) mountWave(hero, 0.86)
  const closer = document.querySelector('.close-cta')
  if (closer) mountWave(closer, 0.88)

  // ── Dictation flow: re-enact the real capture (HUD pops in, records,
  //    processes, and the whole email lands line by line) on a loop while visible ──
  const dg = document.querySelector('.dg')
  if (dg) {
    const timeEl = dg.querySelector('.dg-time')
    let playing = false
    const play = () => {
      if (playing) return
      playing = true
      // reset instantly: whole email covered again with no visible wipe
      dg.classList.add('snap')
      dg.classList.remove('r1', 'r2', 'r3')
      dg.classList.add('covered')
      void dg.offsetWidth
      dg.classList.remove('snap')
      let s = 0
      timeEl.textContent = '0:00'
      dg.classList.add('rec')
      const tick = setInterval(() => { s += 1; timeEl.textContent = '0:0' + Math.min(s, 9) }, 750)
      setTimeout(() => {
        clearInterval(tick)
        dg.classList.remove('rec')
        dg.classList.add('proc')
      }, 4500)
      setTimeout(() => { dg.classList.remove('proc'); dg.classList.add('ok') }, 5200)
      setTimeout(() => { dg.classList.remove('ok'); dg.classList.add('r1') }, 5600)
      setTimeout(() => { dg.classList.add('r2') }, 5850)
      setTimeout(() => { dg.classList.add('r3') }, 6280)
      setTimeout(() => { playing = false; play() }, 9700)
    }
    const dgIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { play(); dgIO.disconnect() }
      })
    }, { threshold: 0.35 })
    dgIO.observe(dg)
  }

  // ── Ambience: mic pulse on the primary CTAs ──
  document.querySelectorAll('.hero .btn-primary, .close-cta .btn-primary').forEach((btn) => {
    const dot = document.createElement('span')
    dot.className = 'mic-dot'
    btn.prepend(dot)
  })
})()
