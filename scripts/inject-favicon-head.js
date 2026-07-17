import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildFaviconDataUrl } from '../lib/faviconSvg.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const site = JSON.parse(readFileSync(join(root, 'data', 'site.json'), 'utf8'));
const liveHref = buildFaviconDataUrl(site.favicon);

const START = '<!-- FAVICON:AUTO:START -->';
const END = '<!-- FAVICON:AUTO:END -->';
const MARKER = '<!-- FAVICON:AUTO -->';

function faviconBlock(scriptPrefix) {
  return [
    `<script src="${scriptPrefix}favicon-boot.js"></script>`,
    `<script src="${scriptPrefix}favicon.js"></script>`,
    `<link rel="icon" type="image/svg+xml" href="${liveHref}" id="site-favicon-link" data-site-favicon="live">`,
    '<script>Favicon.bootSync();</script>'
  ];
}

const targets = [
  { file: join(root, 'index.html'), lines: faviconBlock('js/') },
  { file: join(root, 'admin', 'index.html'), lines: faviconBlock('/js/') },
  { file: join(root, 'download', 'index.html'), lines: faviconBlock('/js/') }
];

const blockRegex = new RegExp(`${START}[\\s\\S]*?${END}`, 'm');

for (const { file, lines } of targets) {
  const block = `${START}\n  ${lines.join('\n  ')}\n  ${END}`;
  let html = readFileSync(file, 'utf8');

  if (blockRegex.test(html)) {
    html = html.replace(blockRegex, block);
  } else if (html.includes(MARKER)) {
    html = html.replace(MARKER, block);
  } else {
    console.warn(`⚠️  No favicon slot found in ${file}`);
    continue;
  }

  writeFileSync(file, html, 'utf8');
  console.log(`✔️  Injected favicon head into ${file.replace(root, '').replace(/^\\/, '')}`);
}
