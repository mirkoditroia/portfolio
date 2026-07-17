/**
 * Site-wide SEO meta tags + cache version for favicon/asset busting.
 */
(function (global) {
  'use strict';

  const SEO_DEFAULTS = {
    title: 'Mirko Ditroia (Meirks) — Creative Coder, VFX, 3D & Interactive Art',
    description: 'Portfolio ufficiale di Mirko Ditroia, in arte Meirks: creative coder italiano specializzato in VFX, 3D, motion graphics e arte interattiva. Esplora progetti, esperimenti generativi e collaborazioni.',
    keywords: 'Mirko Ditroia, Meirks, mêirks, creative coder, creative coding, portfolio, VFX, motion graphics, 3D artist, arte digitale, interactive art, generative art, TouchDesigner, Houdini, Cinema 4D, Italia',
    ogTitle: '',
    ogDescription: '',
    ogImage: 'https://meirks.xyz/images/og-cover.jpg',
    ogSiteName: 'Meirks — Mirko Ditroia',
    twitterTitle: '',
    twitterDescription: '',
    canonicalUrl: 'https://meirks.xyz/'
  };

  function pickString(value, fallback) {
    const v = String(value ?? '').trim();
    return v || fallback;
  }

  function normalizeSeo(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const title = pickString(src.title, SEO_DEFAULTS.title);
    const description = pickString(src.description, SEO_DEFAULTS.description);
    return {
      title,
      description,
      keywords: pickString(src.keywords, SEO_DEFAULTS.keywords),
      ogTitle: pickString(src.ogTitle, title),
      ogDescription: pickString(src.ogDescription, description),
      ogImage: pickString(src.ogImage, SEO_DEFAULTS.ogImage),
      ogSiteName: pickString(src.ogSiteName, SEO_DEFAULTS.ogSiteName),
      twitterTitle: pickString(src.twitterTitle, pickString(src.ogTitle, title)),
      twitterDescription: pickString(src.twitterDescription, pickString(src.ogDescription, description)),
      canonicalUrl: pickString(src.canonicalUrl, SEO_DEFAULTS.canonicalUrl)
    };
  }

  function setMeta(attr, key, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"][data-site-meta]`);
    if (!el) {
      el = document.querySelector(`meta[${attr}="${key}"]`);
    }
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      el.setAttribute('data-site-meta', 'true');
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setLink(rel, href) {
    if (!href) return;
    let el = document.querySelector(`link[rel="${rel}"][data-site-meta]`);
    if (!el) {
      el = document.querySelector(`link[rel="${rel}"]`);
    }
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      el.setAttribute('data-site-meta', 'true');
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  function updateJsonLd(seo) {
    const node = document.getElementById('site-jsonld');
    if (!node) return;
    try {
      const data = JSON.parse(node.textContent);
      const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
      graph.forEach((entry) => {
        if (entry['@type'] === 'Person') {
          entry.description = seo.description;
        }
        if (entry['@type'] === 'WebSite') {
          entry.name = seo.ogSiteName;
          entry.description = seo.description;
        }
      });
      node.textContent = JSON.stringify(data, null, 2);
    } catch (_) { /* keep static fallback */ }
  }

  function getCacheVersion(site) {
    const v = site?.cacheVersion;
    if (v === 0 || v) return String(v);
    return null;
  }

  function bumpCacheVersion() {
    return Date.now();
  }

  function applySeo(site) {
    const seo = normalizeSeo(site?.seo);
    document.title = seo.title;

    setMeta('name', 'description', seo.description);
    setMeta('name', 'keywords', seo.keywords);
    setMeta('property', 'og:site_name', seo.ogSiteName);
    setMeta('property', 'og:title', seo.ogTitle);
    setMeta('property', 'og:description', seo.ogDescription);
    setMeta('property', 'og:image', seo.ogImage);
    setMeta('property', 'og:url', seo.canonicalUrl);
    setMeta('name', 'twitter:title', seo.twitterTitle);
    setMeta('name', 'twitter:description', seo.twitterDescription);
    setMeta('name', 'twitter:image', seo.ogImage);
    setLink('canonical', seo.canonicalUrl);

    updateJsonLd(seo);

    if (global.Favicon) {
      Favicon.apply(site?.favicon, getCacheVersion(site));
    }

    return seo;
  }

  async function loadAndApply(fetchUrl) {
    try {
      const url = fetchUrl || '/data/site.json';
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error('site fetch failed');
      const site = await res.json();
      applySeo(site);
    } catch {
      applySeo({});
    }
  }

  global.SiteMeta = {
    SEO_DEFAULTS,
    normalizeSeo,
    apply: applySeo,
    getCacheVersion,
    bumpCacheVersion,
    loadAndApply
  };
})(typeof window !== 'undefined' ? window : globalThis);
