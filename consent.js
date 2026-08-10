(function () {
  var GA_ID = 'G-2M4FR77TBB';
  var KEY = 'amlin-cookie-consent';

  function loadGA() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  // GDPR/ePrivacy applies to the EU/EEA and UK; the browser timezone is the
  // closest signal available on a static site with no geo service.
  function needsConsent() {
    try {
      var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
      return tz.indexOf('Europe/') === 0 ||
        ['Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Faroe'].indexOf(tz) !== -1;
    } catch (e) {
      return true;
    }
  }

  function showBanner() {
    var el = document.createElement('div');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML =
      '<p>We use Google Analytics cookies to understand how visitors use this site. See our <a href="privacy.html">Privacy Policy</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-ghost" id="cookie-decline">Decline</button>' +
      '<button type="button" class="btn btn-primary" id="cookie-accept">Accept</button>' +
      '</div>';
    document.body.appendChild(el);
    document.getElementById('cookie-accept').onclick = function () {
      try { localStorage.setItem(KEY, 'granted'); } catch (e) {}
      el.remove();
      loadGA();
    };
    document.getElementById('cookie-decline').onclick = function () {
      try { localStorage.setItem(KEY, 'denied'); } catch (e) {}
      el.remove();
    };
  }

  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}

  if (choice === 'granted') {
    loadGA();
  } else if (choice !== 'denied') {
    if (!needsConsent()) {
      loadGA();
    } else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();

// ── CTA click events (fires only when GA is loaded, i.e. after consent) ────
document.addEventListener('click', function (e) {
  var a = e.target.closest ? e.target.closest('a.btn') : null
  if (!a || typeof window.gtag !== 'function') return
  var href = a.getAttribute('href') || ''
  var host = a.closest('#pricing, .close-cta, .hero, .nav, .footer, .plan')
  var placement = host ? (host.id || String(host.className).split(' ')[0]) : 'page'
  if (href.indexOf('download.html') !== -1) {
    gtag('event', 'download_click', { placement: placement })
  } else if (href.indexOf('web-checkout') !== -1) {
    gtag('event', 'get_pro_click', {
      plan: href.indexOf('plan=annual') !== -1 ? 'annual' : 'monthly',
      placement: placement
    })
  }
})
