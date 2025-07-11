import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix per __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione delle dimensioni responsive
const SIZES = {
  small: 400,
  medium: 800,
  large: 1200,
  xlarge: 1920
};

// Cartelle di input e output
const INPUT_DIR = path.join(__dirname, '../images');
const OUTPUT_DIR = path.join(__dirname, '../images/optimized');

// Qualità per diversi formati
const QUALITY = {
  jpeg: 80,
  webp: 85,
  avif: 60
};

async function createOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log('📁 Cartella output creata:', OUTPUT_DIR);
  } catch (error) {
    console.error('❌ Errore creazione cartella:', error);
  }
}

async function getImageFiles() {
  try {
    const files = await fs.readdir(INPUT_DIR);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });
  } catch (error) {
    console.error('❌ Errore lettura cartella immagini:', error);
    return [];
  }
}

async function compressImage(filename, format, size, quality) {
  const inputPath = path.join(INPUT_DIR, filename);
  const name = path.parse(filename).name;
  const outputPath = path.join(OUTPUT_DIR, `${name}-${size}.${format}`);
  
  try {
    const startTime = Date.now();
    
    await sharp(inputPath)
      .resize(SIZES[size], null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toFormat(format, { quality })
      .toFile(outputPath);
    
    const endTime = Date.now();
    const stats = await fs.stat(outputPath);
    const originalStats = await fs.stat(inputPath);
    
    const reduction = ((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1);
    
    console.log(`✅ ${filename} → ${path.basename(outputPath)}`);
    console.log(`   📊 ${formatBytes(originalStats.size)} → ${formatBytes(stats.size)} (-${reduction}%)`);
    console.log(`   ⏱️ ${endTime - startTime}ms`);
    
    return {
      original: originalStats.size,
      compressed: stats.size,
      reduction: parseFloat(reduction),
      time: endTime - startTime
    };
  } catch (error) {
    console.error(`❌ Errore compressione ${filename}:`, error);
    return null;
  }
}

async function generateResponsiveImages(filename) {
  console.log(`\n🖼️ Processando: ${filename}`);
  
  const results = [];
  
  // Genera versioni in diversi formati e dimensioni
  for (const format of ['jpeg', 'webp', 'avif']) {
    for (const size of Object.keys(SIZES)) {
      const result = await compressImage(filename, format, size, QUALITY[format] || QUALITY.jpeg);
      if (result) {
        results.push({
          format,
          size,
          ...result
        });
      }
    }
  }
  
  return results;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function generateSummaryReport(allResults) {
  const totalOriginal = allResults.reduce((sum, result) => sum + result.original, 0);
  const totalCompressed = allResults.reduce((sum, result) => sum + result.compressed, 0);
  const totalReduction = ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1);
  const totalTime = allResults.reduce((sum, result) => sum + result.time, 0);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 REPORT COMPRESSIONE IMMAGINI');
  console.log('='.repeat(50));
  console.log(`🔢 Immagini processate: ${allResults.length}`);
  console.log(`📦 Dimensione originale: ${formatBytes(totalOriginal)}`);
  console.log(`📦 Dimensione compressa: ${formatBytes(totalCompressed)}`);
  console.log(`💾 Risparmio totale: ${formatBytes(totalOriginal - totalCompressed)} (-${totalReduction}%)`);
  console.log(`⏱️ Tempo totale: ${(totalTime / 1000).toFixed(2)}s`);
  
  // Migliori riduzioni
  const bestReductions = allResults
    .sort((a, b) => b.reduction - a.reduction)
    .slice(0, 5);
  
  console.log('\n🏆 TOP 5 RIDUZIONI:');
  bestReductions.forEach((result, index) => {
    console.log(`${index + 1}. ${result.format.toUpperCase()} ${result.size}: -${result.reduction}%`);
  });
  
  // Statistiche per formato
  const formatStats = {};
  allResults.forEach(result => {
    if (!formatStats[result.format]) {
      formatStats[result.format] = {
        count: 0,
        original: 0,
        compressed: 0
      };
    }
    formatStats[result.format].count++;
    formatStats[result.format].original += result.original;
    formatStats[result.format].compressed += result.compressed;
  });
  
  console.log('\n📊 STATISTICHE PER FORMATO:');
  Object.entries(formatStats).forEach(([format, stats]) => {
    const reduction = ((stats.original - stats.compressed) / stats.original * 100).toFixed(1);
    console.log(`${format.toUpperCase()}: ${stats.count} immagini, -${reduction}% media`);
  });
}

async function generateImageManifest(imageFiles) {
  const manifest = {};
  
  for (const filename of imageFiles) {
    const name = path.parse(filename).name;
    manifest[name] = {
      original: filename,
      optimized: {}
    };
    
    // Genera oggetto con tutte le varianti
    for (const format of ['jpeg', 'webp', 'avif']) {
      manifest[name].optimized[format] = {};
      for (const size of Object.keys(SIZES)) {
        manifest[name].optimized[format][size] = `${name}-${size}.${format}`;
      }
    }
  }
  
  const manifestPath = path.join(OUTPUT_DIR, 'image-manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`📄 Manifest salvato: ${manifestPath}`);
  
  return manifest;
}

async function main() {
  console.log('🚀 Avvio compressione immagini...\n');
  
  const startTime = Date.now();
  
  // Crea cartella output
  await createOutputDir();
  
  // Ottieni lista immagini
  const imageFiles = await getImageFiles();
  
  if (imageFiles.length === 0) {
    console.log('❌ Nessuna immagine trovata in:', INPUT_DIR);
    return;
  }
  
  console.log(`🔍 Trovate ${imageFiles.length} immagini da processare`);
  
  // Processa ogni immagine
  const allResults = [];
  for (const filename of imageFiles) {
    const results = await generateResponsiveImages(filename);
    allResults.push(...results);
  }
  
  // Genera report
  await generateSummaryReport(allResults);
  
  // Genera manifest
  await generateImageManifest(imageFiles);
  
  const endTime = Date.now();
  console.log(`\n🎉 Compressione completata in ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`📁 Immagini ottimizzate salvate in: ${OUTPUT_DIR}`);
}

// Esegui script se chiamato direttamente
if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main().catch(console.error);
}

// Fallback: esegui sempre se non esportato come modulo
if (import.meta.url.endsWith('compress-images.js')) {
  main().catch(console.error);
}

export {
  compressImage,
  generateResponsiveImages,
  SIZES,
  QUALITY
}; 