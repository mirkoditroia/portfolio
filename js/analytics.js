/* Analytics Module - Tracks page views, content interactions, and downloads.
   GDPR/ePrivacy compliant: no tracking until the user gives explicit consent. */
(function () {
  'use strict';

  const CONSENT_KEY = 'meirks_analytics_consent';
  const SESSION_KEY = 'meirks_session_id';
  const VIEWED_KEY = 'meirks_page_viewed';
  const GEO_CACHE_KEY = 'meirks_geo';

  /* ═══════════════════════════════════════════
     Consent management
     ═══════════════════════════════════════════ */
  function getConsent() {
    return localStorage.getItem(CONSENT_KEY);
  }

  function hasConsent() {
    return getConsent() === 'granted';
  }

  function setConsent(value) {
    localStorage.setItem(CONSENT_KEY, value);
  }

  /* ═══════════════════════════════════════════
     Consent banner (injected via JS so it works
     on every page without duplicating HTML)
     ═══════════════════════════════════════════ */
  function injectBannerCSS() {
    if (document.getElementById('meirks-consent-css')) return;
    const style = document.createElement('style');
    style.id = 'meirks-consent-css';
    style.textContent = `
      .consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 999999;
        background: rgba(10, 10, 18, 0.97);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-top: 1px solid rgba(64, 224, 208, 0.2);
        padding: 20px 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
        font-family: 'Montserrat', Arial, sans-serif;
        animation: consent-slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      }
      @keyframes consent-slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
      .consent-banner__text {
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.85rem;
        line-height: 1.5;
        max-width: 640px;
        flex: 1 1 320px;
      }
      .consent-banner__text a {
        color: #40e0d0;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .consent-banner__actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
      }
      .consent-banner__btn {
        padding: 10px 22px;
        border-radius: 6px;
        font-family: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: background 0.2s, transform 0.15s;
        letter-spacing: 0.3px;
      }
      .consent-banner__btn:active {
        transform: scale(0.97);
      }
      .consent-banner__btn--accept {
        background: #40e0d0;
        color: #0a0a12;
      }
      .consent-banner__btn--accept:hover {
        background: #5af0e0;
      }
      .consent-banner__btn--reject {
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .consent-banner__btn--reject:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
      }
      @media (max-width: 600px) {
        .consent-banner {
          flex-direction: row;
          flex-wrap: wrap;
          padding: 10px 12px;
          gap: 8px;
          align-items: center;
        }
        .consent-banner__text {
          font-size: 0.7rem;
          line-height: 1.35;
          flex: 1 1 0;
          min-width: 0;
        }
        .consent-banner__actions {
          flex-shrink: 0;
          gap: 6px;
        }
        .consent-banner__btn {
          padding: 7px 14px;
          font-size: 0.72rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function showConsentBanner() {
    if (document.getElementById('consent-banner')) return;
    injectBannerCSS();

    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie & Privacy');
    banner.innerHTML =
      '<div class="consent-banner__text">' +
        'We use anonymous analytics (visits, interactions, approximate location) ' +
        'to improve this site. No third-party profiling cookies.' +
      '</div>' +
      '<div class="consent-banner__actions">' +
        '<button class="consent-banner__btn consent-banner__btn--reject" id="consent-reject">Decline</button>' +
        '<button class="consent-banner__btn consent-banner__btn--accept" id="consent-accept">Accept</button>' +
      '</div>';

    document.body.appendChild(banner);

    document.getElementById('consent-accept').addEventListener('click', function () {
      setConsent('granted');
      banner.remove();
      onConsentGranted();
    });

    document.getElementById('consent-reject').addEventListener('click', function () {
      setConsent('denied');
      banner.remove();
    });
  }

  /* ═══════════════════════════════════════════
     Helpers
     ═══════════════════════════════════════════ */
  function getSessionId() {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  function getTodayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function getDeviceType() {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }

  async function waitForFirestore(timeoutMs) {
    if (window.db) return true;
    return new Promise(resolve => {
      let elapsed = 0;
      const iv = setInterval(() => {
        elapsed += 50;
        if (window.db) { clearInterval(iv); resolve(true); }
        else if (elapsed >= timeoutMs) { clearInterval(iv); resolve(false); }
      }, 50);
    });
  }

  /* ───── Geolocation via IP (cached per session) ───── */
  let geoDataPromise = null;

  function fetchGeoData() {
    if (!hasConsent()) return Promise.resolve({ country: null, countryCode: null, region: null, city: null });
    if (geoDataPromise) return geoDataPromise;

    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      geoDataPromise = Promise.resolve(JSON.parse(cached));
      return geoDataPromise;
    }

    geoDataPromise = fetch('https://ipapi.co/json/')
      .then(r => {
        if (!r.ok) throw new Error('Geo API error');
        return r.json();
      })
      .then(data => {
        const geo = {
          country: data.country_name || null,
          countryCode: data.country_code || null,
          region: data.region || null,
          city: data.city || null
        };
        sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo));
        return geo;
      })
      .catch(() => {
        return { country: null, countryCode: null, region: null, city: null };
      });

    return geoDataPromise;
  }

  /* ───── Core tracking function ───── */
  async function trackEvent(eventType, data) {
    if (!hasConsent()) return;

    if (window.APP_ENV !== 'prod') {
      console.log('[Analytics][dev]', eventType, data);
      return;
    }

    const ready = await waitForFirestore(8000);
    if (!ready || !window.db) {
      console.warn('[Analytics] Firestore not available');
      return;
    }

    const db = window.db;
    const today = getTodayStr();
    const sessionId = getSessionId();

    try {
      const geo = await fetchGeoData();

      const eventDoc = {
        type: eventType,
        page: data.page || 'home',
        section: data.section || null,
        itemTitle: data.itemTitle || null,
        downloadTitle: data.downloadTitle || null,
        sessionId: sessionId,
        date: today,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        device: getDeviceType(),
        referrer: document.referrer || null,
        country: geo.country || null,
        countryCode: geo.countryCode || null,
        region: geo.region || null,
        city: geo.city || null
      };

      Object.keys(eventDoc).forEach(k => {
        if (eventDoc[k] === null || eventDoc[k] === undefined) delete eventDoc[k];
      });

      await db.collection('analytics_events').add(eventDoc);

      const counterRef = db.collection('analytics').doc('counters');
      const dailyRef = db.collection('analytics').doc('daily_' + today);
      const inc = firebase.firestore.FieldValue.increment(1);

      const countryField = geo.countryCode ? { ['country_' + geo.countryCode]: inc } : {};

      if (eventType === 'pageview') {
        counterRef.set({ totalPageViews: inc }, { merge: true });
        const dailyField = data.page === 'download' ? 'downloadPageViews' : 'homeViews';
        dailyRef.set({ date: today, pageViews: inc, [dailyField]: inc, ...countryField }, { merge: true });
      } else if (eventType === 'interaction') {
        counterRef.set({ totalInteractions: inc }, { merge: true });
        dailyRef.set({ date: today, interactions: inc, ...countryField }, { merge: true });
        if (data.section) {
          dailyRef.set({ ['section_' + data.section]: inc }, { merge: true });
        }
      } else if (eventType === 'download') {
        counterRef.set({ totalDownloads: inc }, { merge: true });
        dailyRef.set({ date: today, downloads: inc, ...countryField }, { merge: true });
      }

    } catch (err) {
      console.warn('[Analytics] Track error:', err.message);
    }
  }

  /* ───── Content view timer ───── */
  let _viewStart = null;
  let _viewSection = null;
  let _viewTitle = null;

  function startContentTimer(section, itemTitle) {
    _viewStart = Date.now();
    _viewSection = section;
    _viewTitle = itemTitle;
  }

  function stopContentTimer() {
    if (!_viewStart) return;
    const durationMs = Date.now() - _viewStart;
    const durationSec = Math.round(durationMs / 1000);
    const section = _viewSection;
    const title = _viewTitle;

    _viewStart = null;
    _viewSection = null;
    _viewTitle = null;

    if (durationSec < 1) return;

    trackEventExtended('content_view', {
      section: section,
      itemTitle: title,
      durationSec: durationSec
    });
  }

  /* ───── Extended trackEvent for duration ───── */
  async function trackEventExtended(eventType, data) {
    if (!hasConsent()) return;

    if (window.APP_ENV !== 'prod') {
      console.log('[Analytics][dev]', eventType, data);
      return;
    }

    const ready = await waitForFirestore(8000);
    if (!ready || !window.db) return;

    const db = window.db;
    const today = getTodayStr();
    const sessionId = getSessionId();
    const geo = await fetchGeoData();

    try {
      const eventDoc = {
        type: eventType,
        page: data.page || 'home',
        section: data.section || null,
        itemTitle: data.itemTitle || null,
        downloadTitle: data.downloadTitle || null,
        durationSec: data.durationSec || null,
        sessionId: sessionId,
        date: today,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        device: getDeviceType(),
        referrer: document.referrer || null,
        country: geo.country || null,
        countryCode: geo.countryCode || null,
        region: geo.region || null,
        city: geo.city || null
      };

      Object.keys(eventDoc).forEach(k => {
        if (eventDoc[k] === null || eventDoc[k] === undefined) delete eventDoc[k];
      });

      await db.collection('analytics_events').add(eventDoc);

      if (eventType === 'content_view') {
        const inc = firebase.firestore.FieldValue.increment(1);
        const incDur = firebase.firestore.FieldValue.increment(data.durationSec || 0);
        const counterRef = db.collection('analytics').doc('counters');
        counterRef.set({
          totalContentViews: inc,
          totalViewDurationSec: incDur
        }, { merge: true });
      }
    } catch (err) {
      console.warn('[Analytics] Track error:', err.message);
    }
  }

  /* ═══════════════════════════════════════════
     Public API (always exposed so callers
     never get "undefined is not a function")
     ═══════════════════════════════════════════ */
  window.MeirksAnalytics = {
    trackPageView: function (page) {
      if (!hasConsent()) return;
      const viewedKey = VIEWED_KEY + '_' + (page || 'home');
      if (sessionStorage.getItem(viewedKey)) return;
      sessionStorage.setItem(viewedKey, '1');
      trackEvent('pageview', { page: page || 'home' });
    },

    trackInteraction: function (section, itemTitle) {
      trackEvent('interaction', { section: section, itemTitle: itemTitle });
    },

    trackSectionView: function (section) {
      trackEvent('interaction', { section: section, itemTitle: '__section_view__' });
    },

    trackDownload: function (downloadTitle) {
      trackEvent('download', { page: 'download', downloadTitle: downloadTitle });
    },

    startContentView: function (section, itemTitle) {
      startContentTimer(section, itemTitle);
    },

    endContentView: function () {
      stopContentTimer();
    }
  };

  /* ═══════════════════════════════════════════
     Bootstrap: fired when consent is already
     granted (returning visitor) or right after
     the user clicks "Accept".
     ═══════════════════════════════════════════ */
  function onConsentGranted() {
    fetchGeoData();

    const page = window.location.pathname.startsWith('/download') ? 'download' : 'home';
    window.MeirksAnalytics.trackPageView(page);

    if (page === 'home' && 'IntersectionObserver' in window) {
      const tracked = new Set();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !tracked.has(entry.target.id)) {
            tracked.add(entry.target.id);
            window.MeirksAnalytics.trackSectionView(entry.target.id);
          }
        });
      }, { threshold: 0.3 });

      const initSectionTracking = () => {
        document.querySelectorAll('section[id]').forEach(section => {
          if (section.id && section.id !== 'about') {
            observer.observe(section);
          }
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSectionTracking);
      } else {
        setTimeout(initSectionTracking, 1000);
      }
    }
  }

  /* ═══════════════════════════════════════════
     Init: decide whether to show the banner
     or start tracking right away.
     ═══════════════════════════════════════════ */
  const consent = getConsent();

  if (consent === 'granted') {
    onConsentGranted();
  } else if (consent !== 'denied') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showConsentBanner);
    } else {
      showConsentBanner();
    }
  }
})();
