import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import {
  buildFaviconSvg,
  buildSearchFaviconSvg,
  FAVICON_DEFAULTS
} from '../lib/faviconSvg.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const siteFile = join(root, 'data', 'site.json');

async function writeRaster(svg, outPath, size) {
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
}

async function main() {
  let faviconRaw = FAVICON_DEFAULTS;
  try {
    const site = JSON.parse(readFileSync(siteFile, 'utf8'));
    faviconRaw = site.favicon || FAVICON_DEFAULTS;
  } catch (err) {
    console.warn('⚠️  Using favicon defaults:', err.message);
  }

  const svg = buildFaviconSvg(faviconRaw);
  const searchSvg = buildSearchFaviconSvg(faviconRaw);
  const appleSvg = buildFaviconSvg(faviconRaw, 180);

  writeFileSync(join(root, 'favicon.svg'), svg, 'utf8');
  await writeRaster(searchSvg, join(root, 'favicon-48.png'), 48);
  await writeRaster(appleSvg, join(root, 'apple-touch-icon.png'), 180);
  writeFileSync(join(root, 'favicon.ico'), readFileSync(join(root, 'favicon-48.png')));

  console.log('✔️  Generated favicon.svg');
  console.log('✔️  Generated favicon-48.png (Google Search)');
  console.log('✔️  Generated apple-touch-icon.png');
}

main().catch((err) => {
  console.error('Failed to generate favicons:', err);
  process.exit(1);
});
