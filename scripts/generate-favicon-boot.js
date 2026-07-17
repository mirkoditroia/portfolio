import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { normalizeFavicon } from '../lib/faviconSvg.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const siteFile = join(root, 'data', 'site.json');
const bootFile = join(root, 'js', 'favicon-boot.js');

const site = JSON.parse(readFileSync(siteFile, 'utf8'));
const favicon = normalizeFavicon(site.favicon);
const cacheVersion = site.cacheVersion ?? null;
const versionQuery = cacheVersion ? `?v=${encodeURIComponent(String(cacheVersion))}` : '';

const payload = {
  favicon,
  cacheVersion,
  urls: {
    svg: `/favicon.svg${versionQuery}`,
    png48: `/favicon-48.png${versionQuery}`,
    apple: `/apple-touch-icon.png${versionQuery}`,
    ico: `/favicon.ico${versionQuery}`
  }
};

writeFileSync(
  bootFile,
  `window.__FAVICON_BOOT__=${JSON.stringify(payload)};\n`,
  'utf8'
);

console.log('✔️  Generated js/favicon-boot.js');
