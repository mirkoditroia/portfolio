import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const root = join(__dirname, '..');
const outDir = join(root, 'config');

mkdirSync(outDir, { recursive: true });

const cfg = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MSG_SENDER || '',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
};

const envName = process.env.APP_ENV || (process.env.NODE_ENV === 'production' ? 'prod' : 'local');
const content = `window.APP_ENV = "${envName}";
window.FIREBASE_CONFIG = ${JSON.stringify(cfg, null, 2)};`;

writeFileSync(join(outDir, 'env.local.js'), content);
console.log(`✔️  Generated config/env.local.js for environment: ${envName}`); 