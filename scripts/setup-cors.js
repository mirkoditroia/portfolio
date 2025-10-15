#!/usr/bin/env node

/**
 * Script per configurare CORS su Firebase Storage
 * Risolve il problema del dominio personalizzato meirks.xyz
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Configurazione CORS per Firebase Storage...');

// Verifica se gsutil è disponibile
function checkGsutil() {
  try {
    execSync('gsutil version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Applica configurazione CORS
function applyCorsConfig() {
  const corsFile = path.join(__dirname, '..', 'storage-cors.json');
  const bucket = 'gs://portfolio-eb526.appspot.com';
  
  try {
    console.log('📁 Applicando configurazione CORS...');
    execSync(`gsutil cors set ${corsFile} ${bucket}`, { stdio: 'inherit' });
    console.log('✅ Configurazione CORS applicata con successo!');
    
    // Verifica la configurazione
    console.log('🔍 Verificando configurazione...');
    execSync(`gsutil cors get ${bucket}`, { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ Errore durante l\'applicazione della configurazione CORS:', error.message);
    console.log('\n📋 Istruzioni manuali:');
    console.log('1. Installa Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
    console.log('2. Esegui: gcloud auth login');
    console.log('3. Esegui: gcloud config set project portfolio-eb526');
    console.log(`4. Esegui: gsutil cors set ${corsFile} ${bucket}`);
  }
}

// Main
if (checkGsutil()) {
  applyCorsConfig();
} else {
  console.log('⚠️  gsutil non trovato. Segui le istruzioni in FIREBASE_CORS_SETUP.md');
  console.log('\n📋 Configurazione CORS richiesta per:');
  console.log('- https://meirks.xyz');
  console.log('- https://www.meirks.xyz');
  console.log('- https://portfolio-eb526.web.app');
  console.log('- https://portfolio-eb526.firebaseapp.com');
}
