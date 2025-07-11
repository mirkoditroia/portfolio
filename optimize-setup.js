#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix per __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PORTFOLIO OPTIMIZATION SETUP');
console.log('=================================\n');

// Funzione per eseguire comandi con output
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completato\n`);
    return true;
  } catch (error) {
    console.error(`❌ Errore durante: ${description}`);
    console.error(error.message);
    return false;
  }
}

// Controlla se Sharp è installato
async function checkSharpInstallation() {
  try {
    await import('sharp');
    console.log('✅ Sharp già installato\n');
    return true;
  } catch (error) {
    console.log('⚠️ Sharp non trovato, installazione in corso...\n');
    return false;
  }
}

// Crea directory necessarie
function createDirectories() {
  const dirs = [
    path.join(__dirname, 'images/optimized'),
    path.join(__dirname, 'scripts'),
    path.join(__dirname, 'css')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Directory creata: ${path.relative(__dirname, dir)}`);
    }
  });
  console.log('');
}

// Controlla se le immagini esistono
function checkImagesExist() {
  const imageDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imageDir)) {
    console.log(`❌ Directory images non trovata: ${imageDir}`);
    return false;
  }
  
  const images = fs.readdirSync(imageDir).filter(file => {
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase());
  });
  
  if (images.length === 0) {
    console.log(`⚠️ Nessuna immagine trovata in ${imageDir}`);
    return false;
  }
  
  console.log(`🖼️ Trovate ${images.length} immagini da ottimizzare:`);
  images.forEach(img => console.log(`   - ${img}`));
  console.log('');
  return true;
}

// Funzione principale
async function main() {
  console.log('🔍 Controllo prerequisiti...\n');
  
  // 1. Crea directory necessarie
  createDirectories();
  
  // 2. Controlla se le immagini esistono
  if (!checkImagesExist()) {
    console.log('💡 Aggiungi le tue immagini nella cartella ./images e riprova');
    process.exit(1);
  }
  
  // 3. Installa Sharp se necessario
  if (!(await checkSharpInstallation())) {
    if (!runCommand('npm install sharp', 'Installazione Sharp')) {
      console.log('❌ Installazione Sharp fallita');
      process.exit(1);
    }
  }
  
  // 4. Verifica che gli script esistano
  const compressScript = path.join(__dirname, 'scripts/compress-images.js');
  if (!fs.existsSync(compressScript)) {
    console.log('❌ Script di compressione non trovato');
    console.log(`💡 Assicurati che ${compressScript} esista`);
    process.exit(1);
  }
  
  // 5. Esegui compressione
  console.log('🎯 Avvio compressione immagini...\n');
  if (!runCommand('node scripts/compress-images.js', 'Compressione immagini')) {
    console.log('❌ Compressione fallita');
    process.exit(1);
  }
  
  // 6. Verifica risultati
  const optimizedDir = path.join(__dirname, 'images/optimized');
  if (fs.existsSync(optimizedDir)) {
    const optimizedImages = fs.readdirSync(optimizedDir).filter(file => 
      ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(path.extname(file).toLowerCase())
    );
    
    console.log(`🎉 Ottimizzazione completata!`);
    console.log(`📊 Generate ${optimizedImages.length} immagini ottimizzate`);
    console.log(`📁 Risultati salvati in: ${optimizedDir}\n`);
  }
  
  // 7. Mostra prossimi passi
  console.log('🔄 PROSSIMI PASSI:');
  console.log('==================');
  console.log('1. ✅ Immagini ottimizzate generate');
  console.log('2. ✅ Sistema lazy loading configurato');
  console.log('3. 🚀 Testa il sito per verificare i miglioramenti');
  console.log('4. 📊 Usa performance-test.html per misurare i risultati');
  console.log('5. 🌐 Deploy del sito con le ottimizzazioni\n');
  
  console.log('💡 CONSIGLI:');
  console.log('- Controlla la console del browser per log del lazy loading');
  console.log('- Usa Chrome DevTools per monitorare le performance');
  console.log('- Testa su mobile per verificare i miglioramenti');
  console.log('- Considera l\'uso di un CDN per ulteriori performance\n');
  
  console.log('🎯 PERFORMANCE ATTESE:');
  console.log('- Riduzione peso immagini: 60-80%');
  console.log('- Miglioramento First Contentful Paint: 40-60%');
  console.log('- Riduzione tempo caricamento mobile: 50-70%');
  console.log('- Miglioramento Lighthouse score: +20-40 punti\n');
  
  console.log('✨ Ottimizzazione completata con successo!');
}

// Gestione errori
process.on('uncaughtException', (error) => {
  console.error('❌ Errore non gestito:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rifiutata:', reason);
  process.exit(1);
});

// Avvia il processo
main().catch(error => {
  console.error('❌ Errore durante l\'ottimizzazione:', error);
  process.exit(1);
}); 