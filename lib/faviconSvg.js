export const FAVICON_DEFAULTS = {
  symbol: '⥀',
  color: '#40e0d0',
  bg: '#0f2027',
  size: 32,
  radius: 22,
  bgOpacity: 100,
  symbolOpacity: 100
};

export function isValidHex(color) {
  return typeof color === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim());
}

function clampPercent(value, fallback) {
  let n = parseInt(value, 10);
  if (!Number.isFinite(n)) n = fallback;
  return Math.max(0, Math.min(100, n));
}

export function normalizeFavicon(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  let size = parseInt(src.size ?? src.width, 10);
  if (!Number.isFinite(size) || size < 16) size = FAVICON_DEFAULTS.size;
  if (size > 256) size = 256;

  return {
    symbol: String(src.symbol ?? FAVICON_DEFAULTS.symbol).trim() || FAVICON_DEFAULTS.symbol,
    color: isValidHex(src.color) ? src.color.trim() : FAVICON_DEFAULTS.color,
    bg: isValidHex(src.bg) ? src.bg.trim() : FAVICON_DEFAULTS.bg,
    size,
    radius: clampPercent(src.radius, FAVICON_DEFAULTS.radius),
    bgOpacity: clampPercent(src.bgOpacity, FAVICON_DEFAULTS.bgOpacity),
    symbolOpacity: clampPercent(src.symbolOpacity, FAVICON_DEFAULTS.symbolOpacity)
  };
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

export function buildFaviconSvg(raw, forcedSize) {
  const c = normalizeFavicon(raw);
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

/** Google Search recommends at least 48×48 for favicon indexing. */
export function buildSearchFaviconSvg(raw) {
  const c = normalizeFavicon(raw);
  const size = Math.max(48, c.size);
  return buildFaviconSvg(raw, size);
}

export function buildFaviconDataUrl(raw) {
  return `data:image/svg+xml,${encodeURIComponent(buildFaviconSvg(raw))}`;
}
