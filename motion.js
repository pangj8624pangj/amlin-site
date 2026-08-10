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

  // ── Ambience: breathing waveform behind the hero ──
  if (hero) {
    const cv = document.createElement('canvas')
    cv.className = 'hero-wave'
    cv.setAttribute('aria-hidden', 'true')
    hero.appendChild(cv)
    const ctx = cv.getContext('2d')
    let W, H
    const dpr = Math.min(devicePixelRatio || 1, 2)
    function size() {
      const r = hero.getBoundingClientRect()
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
    ;(function draw(t) {
      ctx.clearRect(0, 0, W, H)
      const mid = H * 0.86
      const breathe = 0.55 + 0.45 * Math.sin(t / 2600)
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
      requestAnimationFrame(draw)
    })(0)
  }

  // ── Ambience: mic pulse on the primary CTAs ──
  document.querySelectorAll('.hero .btn-primary, .close-cta .btn-primary').forEach((btn) => {
    const dot = document.createElement('span')
    dot.className = 'mic-dot'
    btn.prepend(dot)
  })
})()
