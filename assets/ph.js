/* Amlin site analytics (2026-08-15) — PostHog, content-free by construction.
 *
 * Purpose: the ONE funnel gap left after the app + server telemetry work was
 * the top: visits and download starts on amlin.ai. This captures exactly
 * $pageview and download_clicked, nothing else:
 *   - autocapture OFF: no clicks, no form values, no element text.
 *   - session recording OFF.
 *   - person_profiles identified_only: anonymous visitors never become
 *     person profiles.
 * The token below is the public project write key — the same value already
 * shipped inside every desktop build; it can only ingest, never read.
 *
 * help.html deliberately does NOT load this file: it renders inside the Mac
 * app's Get help panel, and in-app surfaces are governed by the app's own
 * telemetry disclosure and Settings toggle, not by website analytics.
 */
!(function (t, e) {
  var o, n, p, r;
  e.__SV ||
    ((window.posthog = e),
    (e._i = []),
    (e.init = function (i, s, a) {
      function g(t, e) {
        var o = e.split(".");
        2 == o.length && ((t = t[o[0]]), (e = o[1])),
          (t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          });
      }
      ((p = t.createElement("script")).type = "text/javascript"),
        (p.crossOrigin = "anonymous"),
        (p.async = !0),
        (p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js"),
        (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r);
      var u = e;
      for (
        void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
          u.people = u.people || [],
          u.toString = function (t) {
            var e = "posthog";
            return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e;
          },
          u.people.toString = function () {
            return u.toString(1) + ".people (stub)";
          },
          o =
            "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(
              " "
            ),
          n = 0;
        n < o.length;
        n++
      )
        g(u, o[n]);
      e._i.push([i, s, a]);
    }),
    (e.__SV = 1));
})(document, window.posthog || []);

posthog.init("phc_wGpaRh2SCxAxyDbPH3sBd3ConnZ2rbdsDHLXUYGbzjKc", {
  api_host: "https://eu.i.posthog.com",
  autocapture: false,
  // Explicit pageview below instead of the library's automatic one: verified
  // 2026-08-15 that the automatic capture never fired on these pages, so the
  // pageview is sent by our own line — one code path, deterministic in every
  // browser, and it cannot double-count because automatic capture is off.
  capture_pageview: false,
  disable_session_recording: true,
  disable_surveys: true,
  person_profiles: "identified_only",
});
posthog.capture("$pageview");

/* Tiny guarded helper so page scripts never depend on load order or break if
 * the CDN is blocked: the stub above queues calls made before array.js lands. */
window.amlinTrack = function (name, props) {
  try {
    window.posthog && window.posthog.capture(name, props || {});
  } catch (e) {
    /* analytics must never break the page */
  }
};
