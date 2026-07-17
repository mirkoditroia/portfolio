/**
 * Favicon: data URI live icon for the browser tab, static PNG/SVG for Google Search.
 */
(function (global) {
  'use strict';

  const CACHE_KEY = 'meirks-favicon-cache';

  const DEFAULTS = {
    symbol: '⥀',
    color: '#40e0d0',
    bg: '#0f2027',
    size: 32,
    radius: 22,
    bgOpacity: 100,
    symbolOpacity: 100
  };

  function isValidHex(color) {
    return typeof color === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim());
  }

  function clampPercent(value, fallback) {
    let n = parseInt(value, 10);
    if (!Number.isFinite(n)) n = fallback;
    return Math.max(0, Math.min(100, n));
  }

  function normalizeFavicon(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let size = parseInt(src.size ?? src.width, 10);
    if (!Number.isFinite(size) || size < 16) size = DEFAULTS.size;
    if (size > 256) size = 256;

    return {
      symbol: String(src.symbol ?? DEFAULTS.symbol).trim() || DEFAULTS.symbol,
      color: isValidHex(src.color) ? src.color.trim() : DEFAULTS.color,
      bg: isValidHex(src.bg) ? src.bg.trim() : DEFAULTS.bg,
      size,
      radius: clampPercent(src.radius, DEFAULTS.radius),
      bgOpacity: clampPercent(src.bgOpacity, DEFAULTS.bgOpacity),
      symbolOpacity: clampPercent(src.symbolOpacity, DEFAULTS.symbolOpacity)
    };
  }

  function configSignature(config, cacheVersion) {
    return JSON.stringify({ favicon: normalizeFavicon(config), cacheVersion: cacheVersion ?? null });
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function opacityAttr(value) {
    const n = clampPercent(value, 100);
    return n >= 100 ? '' : ` fill-opacity="${(n / 100).toFixed(2)}"`;
  }

  function buildSvgMarkup(config, forcedSize) {
    const c = normalizeFavicon(config);
    const size = forcedSize ? Math.max(16, Math.min(256, forcedSize)) : c.size;
    const fontSize = Math.round(size * 0.68);
    const cx = Math.round(size / 2);
    const cy = Math.round(size * 0.54);
    const corner = Math.round((size * c.radius) / 100);
    const parts = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`
    ];

    if (c.bgOpacity > 0) {
      parts.push(
        `<rect width="${size}" height="${size}" rx="${corner}" ry="${corner}"`,
        ` fill="${escapeXml(c.bg)}"${opacityAttr(c.bgOpacity)}/>`
      );
    }

    parts.push(
      `<text x="${cx}" y="${cy}" dominant-baseline="middle" text-anchor="middle"`,
      ` font-size="${fontSize}" fill="${escapeXml(c.color)}"${opacityAttr(c.symbolOpacity)}`,
      ` font-family="system-ui,Segoe UI,sans-serif">${escapeXml(c.symbol)}</text>`,
      '</svg>'
    );

    return parts.join('');
  }

  function buildSvgDataUrl(config) {
    return `data:image/svg+xml,${encodeURIComponent(buildSvgMarkup(config))}`;
  }

  function versionQuery(cacheVersion) {
    if (cacheVersion === 0 || cacheVersion) {
      return `?v=${encodeURIComponent(String(cacheVersion))}`;
    }
    return '';
  }

  function faviconUrls(cacheVersion) {
    const q = versionQuery(cacheVersion);
    return {
      svg: `/favicon.svg${q}`,
      png48: `/favicon-48.png${q}`,
      apple: `/apple-touch-icon.png${q}`,
      ico: `/favicon.ico${q}`
    };
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function persistCache(favicon, cacheVersion) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        favicon: normalizeFavicon(favicon),
        cacheVersion: cacheVersion ?? null,
        updatedAt: Date.now()
      }));
    } catch {
      /* private mode / quota */
    }
  }

  function resolveBootConfig() {
    const cached = readCache();
    const boot = global.__FAVICON_BOOT__;
    return {
      favicon: cached?.favicon || boot?.favicon || DEFAULTS,
      cacheVersion: cached?.cacheVersion ?? boot?.cacheVersion ?? null,
      fromCache: !!cached?.favicon
    };
  }

  function upsertLink(selector, createAttrs, href) {
    let link = document.querySelector(selector);
    if (!link) {
      link = document.createElement('link');
      Object.entries(createAttrs).forEach(([key, value]) => {
        if (value != null) link.setAttribute(key, value);
      });
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) {
      link.setAttribute('href', href);
    }
    return link;
  }

  function ensureLiveIconLink(dataHref, size) {
    let link = document.getElementById('site-favicon-link');
    if (!link) {
      link = document.createElement('link');
      link.id = 'site-favicon-link';
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.setAttribute('data-site-favicon', 'live');
      const anchor = document.querySelector('script[src*="favicon.js"]');
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(link, anchor.nextSibling);
      } else {
        document.head.appendChild(link);
      }
    }
    if (link.getAttribute('href') !== dataHref) {
      link.setAttribute('href', dataHref);
    }
    link.setAttribute('sizes', `${size}x${size}`);
    return link;
  }

  function bootSync() {
    const { favicon, cacheVersion } = resolveBootConfig();
    applyFavicon(favicon, cacheVersion, { boot: true });
  }

  function applyFavicon(config, cacheVersion, options) {
    const opts = options || {};
    const normalized = normalizeFavicon(config);
    const signature = configSignature(normalized, cacheVersion);

    if (!opts.force && global.__FAVICON_SIGNATURE__ === signature) {
      return normalized;
    }
    global.__FAVICON_SIGNATURE__ = signature;

    const liveHref = buildSvgDataUrl(normalized);
    ensureLiveIconLink(liveHref, normalized.size);

    document.querySelectorAll('link[data-site-favicon="png48"], link[data-site-favicon="svg"], link[data-site-favicon="shortcut"]').forEach((node) => {
      node.remove();
    });

    const urls = faviconUrls(cacheVersion);
    upsertLink(
      'link[data-site-favicon="apple"]',
      { rel: 'apple-touch-icon', sizes: '180x180', 'data-site-favicon': 'apple' },
      urls.apple
    );

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta && normalized.bgOpacity > 0) {
      themeMeta.content = normalized.bg;
    }

    persistCache(normalized, cacheVersion);

    return normalized;
  }

  async function loadAndApply(fetchUrl) {
    try {
      let site;
      if (window.fetchJson) {
        site = await window.fetchJson('/api/site', '/data/site.json');
      } else {
        const url = fetchUrl || '/data/site.json';
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('site fetch failed');
        site = await res.json();
      }
      applyFavicon(site.favicon, site.cacheVersion);
    } catch {
      bootSync();
    }
  }

  global.Favicon = {
    CACHE_KEY,
    DEFAULTS,
    isValidHex,
    normalizeFavicon,
    configSignature,
    buildSvgMarkup,
    buildSvgDataUrl,
    faviconUrls,
    readCache,
    persistCache,
    bootSync,
    apply: applyFavicon,
    loadAndApply
  };
})(typeof window !== 'undefined' ? window : globalThis);
