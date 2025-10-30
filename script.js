// ---------------- Global helper to load JSON with fallback ----------------
let galleries = {};
const canvasVideoRenderers = new Map();

function fetchJson(primaryUrl, fallbackUrl) {
  return fetch(primaryUrl).then(res => {
    if (res.ok) return res.json();
    return fetch(fallbackUrl).then(r => r.json());
  }).catch(() => fetch(fallbackUrl).then(r => r.json()));
}

// ============ SISTEMA DI BUFFERING E PRELOADING OTTIMIZZATO ============

// Cache per media files con TTL (Time To Live)
const mediaCache = new Map();
const preloadQueue = new Set();

// Configurazione performance
const PERFORMANCE_CONFIG = {
  // Lazy loading threshold (quando iniziare a caricare)
  lazyThreshold: 0.1,
  // FPS limit per canvas video
  maxFPS: 5,
  // Batch size per preloading
  batchSize: 2,
  // Timeout per caricamento media
  mediaTimeout: 15000,
  // Cache TTL (5 minuti)
  cacheTTL: 5 * 60 * 1000,
  // Debounce delay per scroll events
  scrollDebounce: 100
};

// Preload intelligente con priorità e throttling ottimizzato
function preloadMedia(urls, priority = 'normal') {
  if (!Array.isArray(urls) || urls.length === 0) return;
  
  // Filtra URL validi e non già in cache/coda
  const validUrls = urls.filter(url => {
    if (!url || typeof url !== 'string') return false;
    if (mediaCache.has(url) || preloadQueue.has(url)) return false;
    return url.startsWith('http') || url.startsWith('/');
  });
  
  if (validUrls.length === 0) return;
  
  console.log(`🚀 Starting preload of ${validUrls.length} media files (${priority} priority)`);
  
  // Throttling: max 2 richieste simultanee per evitare rate limiting Firebase
  const maxConcurrent = priority === 'high' ? 3 : 2;
  const chunks = [];
  for (let i = 0; i < validUrls.length; i += maxConcurrent) {
    chunks.push(validUrls.slice(i, i + maxConcurrent));
  }
  
  // Processa chunk per chunk con delay maggiore per Firebase
  chunks.forEach((chunk, chunkIndex) => {
    setTimeout(() => {
      const promises = chunk.map(url => {
        preloadQueue.add(url);
        
        // Controlla se è un video (sia URL locale che Firebase Storage)
        const isVideo = url.includes('.mp4') || url.includes('videos%2F') || url.includes('/videos/');
        
        console.log('🔍 Preloading media type:', { url, isVideo });
        
        const preloadPromise = isVideo
          ? preloadVideo(url, priority)
          : preloadImage(url, priority);
        
        // Gestione errori silenziosa per evitare Uncaught Promise
        return preloadPromise.catch(error => {
          console.warn(`⚠️ Preload failed (final): ${url}`, error.message);
          return null; // Return null invece di reject per non bloccare Promise.all
        });
      });
      
      // Aspetta che questo chunk sia completato
      Promise.allSettled(promises).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        const failed = results.length - successful;
        
        if (failed > 0) {
          console.warn(`⚠️ Chunk ${chunkIndex + 1}: ${successful} success, ${failed} failed`);
        } else {
          console.log(`✅ Chunk ${chunkIndex + 1}: ${successful} media preloaded successfully`);
        }
      });
      
    }, chunkIndex * (priority === 'high' ? 500 : 1000)); // Delay ridotto per priorità alta
  });
}

// Preload video con buffering e retry ottimizzato
function preloadVideo(url, priority = 'normal', retryCount = 0) {
  const maxRetries = priority === 'high' ? 2 : 1;
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    
    // Timeout più lungo per Firebase Storage
    const timeoutDuration = priority === 'high' ? 20000 : PERFORMANCE_CONFIG.mediaTimeout;
    const timeout = setTimeout(() => {
      console.warn(`⚠️ Video preload timeout (attempt ${retryCount + 1}):`, url);
      if (retryCount < maxRetries) {
        // Retry con delay exponenziale + random jitter
        const baseDelay = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        setTimeout(() => {
          console.log(`🔄 Retrying video preload (${retryCount + 1}/${maxRetries}):`, url);
          preloadVideo(url, priority, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, delay);
      } else {
        preloadQueue.delete(url);
        reject(new Error('Video preload timeout after retries'));
      }
    }, timeoutDuration);
    
    video.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      mediaCache.set(url, {
        type: 'video',
        element: video,
        loaded: Date.now()
      });
      preloadQueue.delete(url);
      console.log('✅ Video preloaded:', url);
      resolve(video);
    });
    
    video.addEventListener('error', (e) => {
      clearTimeout(timeout);
      console.error(`❌ Video preload failed (attempt ${retryCount + 1}):`, url, e);
      
      if (retryCount < maxRetries) {
        // Retry con delay exponenziale + random jitter
        const baseDelay = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        setTimeout(() => {
          console.log(`🔄 Retrying video preload (${retryCount + 1}/${maxRetries}):`, url);
          preloadVideo(url, priority, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, delay);
      } else {
        preloadQueue.delete(url);
        reject(e);
      }
    });
    
    video.src = url;
  });
}

// Preload immagini con retry ottimizzato
function preloadImage(url, priority = 'normal', retryCount = 0) {
  const maxRetries = priority === 'high' ? 2 : 1;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Timeout più lungo per Firebase Storage
    const timeoutDuration = priority === 'high' ? 15000 : PERFORMANCE_CONFIG.mediaTimeout;
    const timeout = setTimeout(() => {
      console.warn(`⚠️ Image preload timeout (attempt ${retryCount + 1}):`, url);
      if (retryCount < maxRetries) {
        // Retry con delay exponenziale + random jitter
        const baseDelay = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        setTimeout(() => {
          console.log(`🔄 Retrying image preload (${retryCount + 1}/${maxRetries}):`, url);
          preloadImage(url, priority, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, delay);
      } else {
        preloadQueue.delete(url);
        reject(new Error('Image preload timeout after retries'));
      }
    }, timeoutDuration);
    
    img.addEventListener('load', () => {
      clearTimeout(timeout);
      mediaCache.set(url, {
        type: 'image',
        element: img,
        loaded: Date.now()
      });
      preloadQueue.delete(url);
      console.log('✅ Image preloaded:', url);
      resolve(img);
    });
    
    img.addEventListener('error', (e) => {
      clearTimeout(timeout);
      console.error(`❌ Image preload failed (attempt ${retryCount + 1}):`, url, e);
      
      if (retryCount < maxRetries) {
        // Retry con delay exponenziale + random jitter
        const baseDelay = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        setTimeout(() => {
          console.log(`🔄 Retrying image preload (${retryCount + 1}/${maxRetries}):`, url);
          preloadImage(url, priority, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, delay);
      } else {
        preloadQueue.delete(url);
        reject(e);
      }
    });
    
    img.src = url;
  });
}

// Ottieni media dalla cache (versione ottimizzata)
function getMediaFromCache(url) {
  const cached = mediaCache.get(url);
  if (cached) {
    // Controlla se la cache è ancora valida
    const now = Date.now();
    if (now - cached.loaded < PERFORMANCE_CONFIG.cacheTTL) {
      console.log('📦 Media from cache:', url);
      return cached.element;
    } else {
      // Cache scaduta, rimuovi
      mediaCache.delete(url);
    }
  }
  return null;
}

// Pulizia cache ottimizzata
function cleanupMediaCache() {
  const now = Date.now();
  const maxAge = PERFORMANCE_CONFIG.cacheTTL;
  
  for (const [url, cached] of mediaCache.entries()) {
    if (now - cached.loaded > maxAge) {
      console.log('🗑️ Removing old cached media:', url);
      mediaCache.delete(url);
    }
  }
  
  // Pulizia anche dei renderer dei canvas
  for (const [id, renderer] of canvasVideoRenderers.entries()) {
    if (renderer && !renderer.isVisible) {
      renderer.destroy();
      canvasVideoRenderers.delete(id);
    }
  }
}

// Cleanup automatico ogni 5 minuti
setInterval(cleanupMediaCache, 5 * 60 * 1000);

// Preload intelligente delle immagini visibili all'avvio (OTTIMIZZATO)
function startInitialPreload() {
  // 1. Preload solo immagini visibili nel DOM (non lazy)
  const visibleImages = document.querySelectorAll('img[src]:not([data-lazy])');
  const domImages = Array.from(visibleImages).map(img => img.src);
  
  // 2. Preload solo le prime 3 immagini di anteprima dei canvas (priorità alta)
  const canvasThumbnails = [];
  
  // PATCH: Usa i dati delle gallery appena caricate invece di currentSiteData
  if (galleries && typeof galleries === 'object') {
    console.log('🔍 Raccogliendo anteprime canvas dalle gallerie...');
    
    let thumbnailCount = 0;
    const maxThumbnails = 3; // Limita a 3 thumbnail per performance
    
    // Itera attraverso tutte le gallerie nei dati
    Object.keys(galleries).forEach(galleryKey => {
      if (thumbnailCount >= maxThumbnails) return; // Stop dopo 3 thumbnail
      
      const gallery = galleries[galleryKey];
      
      if (Array.isArray(gallery)) {
        gallery.forEach(item => {
          if (thumbnailCount >= maxThumbnails) return; // Stop dopo 3 thumbnail
          
          // Raccogli solo immagini di anteprima (src) per canvas
          if (item.canvas && item.src) {
            canvasThumbnails.push(item.src);
            thumbnailCount++;
            console.log(`📸 Canvas thumbnail trovata: ${item.title || 'Untitled'} -> ${item.src}`);
          }
        });
      }
    });
  }
  
  // 3. Combina tutte le immagini da precaricare
  const allImages = [...domImages, ...canvasThumbnails];
  const uniqueImages = [...new Set(allImages)]; // Rimuovi duplicati
  
  if (uniqueImages.length > 0) {
    console.log(`🚀 Initial preload: ${domImages.length} DOM images + ${canvasThumbnails.length} canvas thumbnails = ${uniqueImages.length} total`);
    preloadMedia(uniqueImages, 'high');
  } else {
    console.log('📭 Nessuna immagine da precaricare trovata');
  }
}

// ========= SISTEMA DI LAZY LOADING INTELLIGENTE PER CANVAS =========

// Intersection Observer per lazy loading dei canvas
let canvasObserver = null;

function initCanvasObserver() {
  if (canvasObserver) return;
  
  canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const canvas = entry.target;
        loadCanvasContent(canvas);
        canvasObserver.unobserve(canvas); // Carica una sola volta
      }
    });
  }, { 
    threshold: PERFORMANCE_CONFIG.lazyThreshold,
    rootMargin: '50px' // Inizia a caricare 50px prima che sia visibile
  });
  
  console.log('👁️ Canvas observer inizializzato');
}

// Funzione per reinizializzare gli observer dopo cambio scheda
function reinitializeCanvasObserver() {
  // Rimuovi observer esistente se presente
  if (canvasObserver) {
    canvasObserver.disconnect();
    canvasObserver = null;
  }
  
  // Reinizializza l'observer
  initCanvasObserver();
  
  // Trova tutti i canvas che non sono stati caricati o sono in stato inconsistente
  const allCanvas = document.querySelectorAll('.gallery-canvas');
  let reObservedCount = 0;
  
  allCanvas.forEach(canvas => {
    // Reset dei flag se necessario
    if (canvas.dataset.loaded === 'true' && canvas.dataset.contentLoaded !== 'true') {
      console.log('🔧 Reset canvas flags per:', canvas.id);
      canvas.dataset.loaded = 'false';
      canvas.dataset.contentLoaded = 'false';
    }
    
    // Se il canvas non è caricato, osservalo di nuovo
    if (canvas.dataset.loaded !== 'true') {
      canvasObserver.observe(canvas);
      reObservedCount++;
    }
  });
  
  console.log(`🔄 Canvas observer reinizializzato - ${reObservedCount} canvas riosservati`);
}

// Event listener per cambio scheda - reinizializza gli observer quando si torna alla scheda
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // La scheda è diventata visibile - reinizializza gli observer dopo un breve delay
    setTimeout(() => {
      console.log('🔄 Scheda tornata visibile - reinizializzazione observer canvas');
      reinitializeCanvasObserver();
    }, 100);
  }
});

// Event listener per focus della finestra - backup per il cambio scheda
window.addEventListener('focus', () => {
  setTimeout(() => {
    console.log('🔄 Finestra tornata in focus - reinizializzazione observer canvas');
    reinitializeCanvasObserver();
  }, 100);
});

// Funzione di utilità per forzare il ricaricamento di tutti i canvas visibili
function forceReloadVisibleCanvas() {
  const allCanvas = document.querySelectorAll('.gallery-canvas');
  let reloadedCount = 0;
  
  allCanvas.forEach(canvas => {
    // Controlla se il canvas è visibile
    const rect = canvas.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isVisible) {
      // Reset dei flag
      canvas.dataset.loaded = 'false';
      canvas.dataset.contentLoaded = 'false';
      
      // Forza il caricamento
      loadCanvasContent(canvas);
      reloadedCount++;
    }
  });
  
  console.log(`🔄 Forzato ricaricamento di ${reloadedCount} canvas visibili`);
}

// Funzione di debug per testare il fix del cambio scheda
function debugCanvasStates() {
  const allCanvas = document.querySelectorAll('.gallery-canvas');
  console.log('🔍 Debug stati canvas:');
  
  allCanvas.forEach(canvas => {
    const loaded = canvas.dataset.loaded;
    const contentLoaded = canvas.dataset.contentLoaded;
    const imageSrc = canvas.dataset.imageSrc;
    
    console.log(`Canvas ${canvas.id}:`, {
      loaded,
      contentLoaded,
      hasImageSrc: !!imageSrc,
      isVisible: canvas.getBoundingClientRect().top < window.innerHeight
    });
  });
}

// Esponi le funzioni di debug globalmente per test
window.debugCanvasStates = debugCanvasStates;
window.forceReloadVisibleCanvas = forceReloadVisibleCanvas;
window.reinitializeCanvasObserver = reinitializeCanvasObserver;

// Funzione per caricare il contenuto del canvas quando diventa visibile
function loadCanvasContent(canvas) {
  const canvasId = canvas.id;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.warn('❌ Context 2D non disponibile per canvas:', canvasId);
    return;
  }
  
  // Controlla se è già stato caricato completamente
  if (canvas.dataset.loaded === 'true' && canvas.dataset.contentLoaded === 'true') {
    console.log('✅ Canvas già caricato completamente:', canvasId);
    return;
  }
  
  // Se è marcato come caricato ma il contenuto non è caricato, reset
  if (canvas.dataset.loaded === 'true' && canvas.dataset.contentLoaded !== 'true') {
    console.log('🔧 Canvas in stato inconsistente, reset:', canvasId);
    canvas.dataset.loaded = 'false';
    canvas.dataset.contentLoaded = 'false';
  }
  
  // Indicatore di caricamento cyberpunk
  const drawCyberpunkLoader = (ctx, canvasW, canvasH) => {
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;
    
    // Background scuro con gradiente
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(canvasW, canvasH) * 0.8);
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0.9)');
    gradient.addColorStop(1, 'rgba(20, 30, 48, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
    
    // Punti pulsanti cyberpunk
    const time = Date.now() * 0.003;
    const dotCount = 3;
    const radius = Math.min(canvasW, canvasH) * 0.08;
    const spacing = radius * 3;
    
    for (let i = 0; i < dotCount; i++) {
      const x = centerX + (i - 1) * spacing;
      const y = centerY;
      
      // Effetto pulsante con timing sfalsato
      const pulse = Math.sin(time + i * 0.8) * 0.5 + 0.5;
      const size = radius * (0.6 + pulse * 0.4);
      const alpha = 0.3 + pulse * 0.7;
      
      // Glow effect
      ctx.shadowColor = '#40e0d0';
      ctx.shadowBlur = 15 * pulse;
      
      // Punto principale
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(64, 224, 208, ${alpha})`;
      ctx.fill();
      
      // Bordo luminoso
      ctx.strokeStyle = `rgba(64, 224, 208, ${alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Testo "LOADING" con effetto flicker
    const flicker = Math.sin(time * 2) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(64, 224, 208, ${flicker * 0.6})`;
    ctx.font = 'bold 12px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOADING', centerX, centerY + radius * 2.5);
  };
  
  // Flag per tracciare se il contenuto è stato caricato
  if (!canvas.dataset.contentLoaded) {
    canvas.dataset.contentLoaded = 'false';
  }
  
  // Mostra loader cyberpunk e anima finché il contenuto non è caricato
  const animateCyberpunkLoader = () => {
    if (canvas.dataset.contentLoaded === 'true') return; // Stop se caricato
    drawCyberpunkLoader(ctx, canvas.width, canvas.height);
    requestAnimationFrame(animateCyberpunkLoader);
  };
  
  // Avvia l'animazione se il contenuto non è caricato
  if (canvas.dataset.contentLoaded === 'false') {
    animateCyberpunkLoader();
  }
  
  // Marca come caricato
  canvas.dataset.loaded = 'true';
  console.log('🔄 Caricamento contenuto canvas:', canvasId);
  
  // Se c'è un'immagine da caricare (canvas statico)
  if (canvas.dataset.imageSrc) {
    console.log('🖼️ Caricamento immagine per canvas:', canvasId, canvas.dataset.imageSrc);
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Importante per Firebase Storage
    
    img.onload = function() {
      console.log('✅ Immagine caricata con successo:', canvasId);
      drawImageToCanvas(ctx, img, canvas.width, canvas.height);
      canvas.dataset.contentLoaded = 'true'; // Marca contenuto come caricato
    };
    
    img.onerror = function(e) {
      console.error('❌ Errore caricamento immagine:', canvasId, e);
      createCanvasContent(ctx, 'Canvas', canvas.width, canvas.height);
    };
    
    img.src = canvas.dataset.imageSrc;
    return;
  }
  
  // Canvas video - usa il renderer esistente
  if (canvasId && canvasVideoRenderers.has(canvasId)) {
    const renderer = canvasVideoRenderers.get(canvasId);
    if (renderer) {
      renderer.onVisible();
      // Marca come caricato dopo un breve delay per permettere al video di caricarsi
      setTimeout(() => {
        canvas.dataset.contentLoaded = 'true';
      }, 500);
      console.log(`🎬 Canvas video lazy loaded: ${canvasId}`);
    }
    return;
  }
  
  // Canvas procedurale - crea contenuto immediatamente
  createCanvasContent(ctx, 'Canvas', canvas.width, canvas.height);
  canvas.dataset.contentLoaded = 'true'; // Marca contenuto come caricato
  console.log(`🎨 Procedural canvas lazy loaded: ${canvasId}`);
}



// Funzione helper per disegnare immagine su canvas
function drawImageToCanvas(ctx, img, canvasW, canvasH) {
  const imgW = img.width;
  const imgH = img.height;
  
  let scale;
  if (imgH > imgW) {
    scale = Math.min((canvasW * 0.6) / imgW, canvasH / imgH);
  } else {
    scale = Math.min(canvasW / imgW, canvasH / imgH);
  }
  
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const offsetX = (canvasW - drawW) / 2;
  const offsetY = (canvasH - drawH) / 2;
  
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  
  // Marca il contenuto come caricato se il canvas ha un dataset
  if (ctx.canvas && ctx.canvas.dataset) {
    ctx.canvas.dataset.contentLoaded = 'true';
  }
}

// ========= FINE SISTEMA LAZY LOADING =========

// ========= SISTEMA DI FEEDBACK UTENTE OTTIMIZZATO =========
let loadingIndicatorTimeout;

// Mostra indicatore di caricamento per operazioni lunghe
function showLoadingFeedback(message = 'Caricamento...') {
  clearTimeout(loadingIndicatorTimeout);
  
  // Mostra indicatore solo se il caricamento richiede più di 1.5 secondi (ridotto da 2s)
  loadingIndicatorTimeout = setTimeout(() => {
    const existing = document.getElementById('media-loading-indicator');
    if (existing) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'media-loading-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: 'Montserrat', Arial, sans-serif;
      font-size: 0.9rem;
      z-index: 10000;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(64, 224, 208, 0.3);
    `;
    indicator.textContent = message;
    document.body.appendChild(indicator);
    
    // Rimuovi automaticamente dopo 8 secondi (ridotto da 10s)
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 8000);
  }, 1500);
}

// Nascondi indicatore di caricamento
function hideLoadingFeedback() {
  clearTimeout(loadingIndicatorTimeout);
  const indicator = document.getElementById('media-loading-indicator');
  if (indicator && indicator.parentNode) {
    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 300);
  }
}

// Aggiungi feedback globale per preloading
window.addEventListener('beforeunload', hideLoadingFeedback);

// ========= FINE FEEDBACK UTENTE =========

// ========= MONITORAGGIO RETE E ADATTIVO OTTIMIZZATO =========
let networkQuality = 'good'; // good, slow, poor
let preloadingEnabled = true;

// Monitora la qualità della connessione
function assessNetworkQuality() {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    
    if (effectiveType === '4g') {
      networkQuality = 'good';
      preloadingEnabled = true;
    } else if (effectiveType === '3g') {
      networkQuality = 'slow';
      preloadingEnabled = true; // Mantieni attivo ma con throttling più alto
    } else {
      networkQuality = 'poor';
      preloadingEnabled = false; // Disabilita preloading
    }
    
    console.log(`📡 Network quality: ${networkQuality} (${effectiveType}) - Preloading: ${preloadingEnabled}`);
  }
}

// Controlla la qualità di rete ogni 30 secondi
if ('connection' in navigator) {
  assessNetworkQuality();
  navigator.connection.addEventListener('change', assessNetworkQuality);
  setInterval(assessNetworkQuality, 30000);
}

// Wrapper per preloadMedia che considera la qualità di rete
const smartPreloadMedia = function(urls, priority = 'normal') {
  if (!preloadingEnabled && priority !== 'high') {
    console.log('⚠️ Preloading skipped due to poor network quality');
    return;
  }
  
  // Riduci il caricamento simultaneo se la rete è lenta
  if (networkQuality === 'slow') {
    console.log('🐌 Slow network detected, reducing concurrent loads');
  }
  
  // Chiama la funzione originale di preloading
  preloadMedia(urls, priority);
};

// Sostituisci le chiamate a preloadMedia nelle gallery con smartPreloadMedia
window.smartPreloadMedia = smartPreloadMedia;

// ========= FINE MONITORAGGIO RETE =========

// ============ FINE SISTEMA BUFFERING OTTIMIZZATO ============

// ========= SISTEMA AUDIO SITE-NAME =========
let siteNameAudio = null;
let audioContext = null;
let isAudioPlaying = false;
let currentPlayingAudio = null;

// Lista dei file audio disponibili con fallback per Firebase
const audioFiles = [
  '/assets/meirks.mp3',
  '/assets/meirks2.mp3', 
  '/assets/meirks3.mp3',
  '/assets/meirks4.mp3'
];

// Preload degli audio per Firebase
const audioCache = new Map();

function preloadAudioFiles() {
  audioFiles.forEach(audioFile => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous'; // Importante per Firebase
    
    audio.addEventListener('canplaythrough', () => {
      console.log(`🎵 Audio preloadato: ${audioFile.split('/').pop()}`);
    });
    
    audio.addEventListener('error', (e) => {
      console.warn(`⚠️ Errore preload audio ${audioFile}:`, e);
    });
    
    audio.src = audioFile;
    audioCache.set(audioFile, audio);
  });
}

function initSiteNameAudio() {
  const siteNameElement = document.getElementById('site-name');
  if (!siteNameElement) return;
  
  // Preload degli audio files
  preloadAudioFiles();
  
  // Crea elemento audio principale
  siteNameAudio = document.createElement('audio');
  siteNameAudio.preload = 'auto';
  siteNameAudio.volume = 0.7;
  siteNameAudio.crossOrigin = 'anonymous'; // Importante per Firebase
  siteNameAudio.style.display = 'none';
  document.body.appendChild(siteNameAudio);
  
  // Aggiungi stile hover per indicare che è cliccabile
  siteNameElement.style.cursor = 'pointer';
  siteNameElement.style.transition = 'all 0.3s ease';
  
  // Effetto hover (solo desktop)
  if (window.innerWidth > 768) {
    siteNameElement.addEventListener('mouseenter', () => {
      if (!isAudioPlaying) {
        siteNameElement.style.textShadow = '0 0 20px #40e0d0, 0 0 40px #40e0d0';
        siteNameElement.style.transform = 'scale(1.05)';
      }
    });
    
    siteNameElement.addEventListener('mouseleave', () => {
      siteNameElement.style.textShadow = '';
      siteNameElement.style.transform = 'scale(1)';
    });
  }
  
  // Gestione click per audio con fallback
  siteNameElement.addEventListener('click', playSiteNameAudio);
  siteNameElement.addEventListener('touchstart', playSiteNameAudio);
  
  console.log('🎵 Audio site-name inizializzato con selezione casuale (Firebase-ready)');
}

function playSiteNameAudio() {
  if (!siteNameAudio || isAudioPlaying) {
    console.log('🎵 Audio già in riproduzione, ignoro il click');
    return;
  }
  
  const siteNameElement = document.getElementById('site-name');
  if (!siteNameElement) return;
  
  // Seleziona casualmente un file audio
  const randomAudioFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
  const fileName = randomAudioFile.split('/').pop();
  
  // Marca come in riproduzione
  isAudioPlaying = true;
  
  // Effetto visivo durante la riproduzione (mobile)
  if (window.innerWidth <= 768) {
            siteNameElement.style.textShadow = '0 0 20px #40e0d0, 0 0 40px #40e0d0';
    siteNameElement.style.transform = 'scale(0.95)';
  }
  
  // Prova prima con l'audio preloadato dalla cache
  const cachedAudio = audioCache.get(randomAudioFile);
  if (cachedAudio && cachedAudio.readyState >= 2) {
    // Usa l'audio dalla cache
    currentPlayingAudio = cachedAudio;
    cachedAudio.currentTime = 0;
    cachedAudio.volume = 0.7;
    
    // Aggiungi event listener per la fine
    cachedAudio.addEventListener('ended', handleAudioEnd, { once: true });
    
    const playPromise = cachedAudio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`🎵 Audio riprodotto dalla cache: ${fileName}`);
        })
        .catch((error) => {
          console.log(`🎵 Audio dalla cache fallito (${fileName}):`, error.message);
          handleAudioEnd(); // Reset stato
          // Fallback all'audio principale
          playWithMainAudio(randomAudioFile, fileName);
        });
    }
  } else {
    // Fallback all'audio principale
    playWithMainAudio(randomAudioFile, fileName);
  }
}

function handleAudioEnd() {
  isAudioPlaying = false;
  currentPlayingAudio = null;
  
  const siteNameElement = document.getElementById('site-name');
  if (siteNameElement) {
    // Reset effetti visivi
    siteNameElement.style.textShadow = '';
    siteNameElement.style.transform = 'scale(1)';
    
    // Deseleziona su mobile (rimuove focus/selection)
    if (window.innerWidth <= 768) {
      siteNameElement.blur();
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      if (document.selection) {
        document.selection.empty();
      }
    }
  }
  
  console.log('🎵 Audio terminato, stato resettato');
}

function playWithMainAudio(audioFile, fileName) {
  // Imposta il nuovo file audio
  siteNameAudio.src = audioFile;
  currentPlayingAudio = siteNameAudio;
  
  // Aggiungi event listener per la fine
  siteNameAudio.addEventListener('ended', handleAudioEnd, { once: true });
  
  const playPromise = siteNameAudio.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log(`🎵 Audio riprodotto: ${fileName}`);
      })
      .catch((error) => {
        console.log(`🎵 Audio non può essere riprodotto (${fileName}):`, error.message);
        handleAudioEnd(); // Reset stato
        // Log aggiuntivo per debug Firebase
        console.warn('🔍 Debug Firebase audio:', {
          audioFile,
          error: error.message,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
      });
  }
}

// ========= FINE SISTEMA AUDIO SITE-NAME =========

// Ensure APP_ENV is available immediately (may load env script async)
(function () {
  if (window.APP_ENV) return; // already set by env.*.js
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('local')) {
    window.APP_ENV = 'local';
  } else if (host.includes('preprod') || host.includes('pre-prod')) {
    window.APP_ENV = 'preprod';
  } else {
    window.APP_ENV = 'prod';
  }
})();

let savedScrollY = 0;

function lockScroll() {
  // Salva la posizione corrente
  savedScrollY = window.scrollY || document.documentElement.scrollTop;
  
  // Blocca lo scroll e compensa lo spostamento
  document.body.classList.add('lock-scroll');
  document.body.style.top = `-${savedScrollY}px`;
  
  console.log('🔒 Scroll bloccato a', savedScrollY);
}

function unlockScroll() {
  // Rimuove il blocco
  document.body.classList.remove('lock-scroll');
  
  // Calcola di nuovo la posizione in cui tornare
  const toY = Math.abs(parseInt(document.body.style.top || '0'));
  
  // Pulisce lo stile
  document.body.style.top = '';
  
  // Ripristina lo scroll ESATTAMENTE al punto salvato
  window.scrollTo({
    top: toY,
    left: 0,
    behavior: 'auto'  // forza lo "jump" istantaneo
  });
  
  console.log('🔓 Scroll ripristinato a', toY);
}
// JS per multiple gallery sections
document.addEventListener('DOMContentLoaded', function () {

  // Debug console per tracking errori
  console.log('🚀 Portfolio: Inizializzazione...');

  // Scroll progress indicator (OTTIMIZZATO)
  function initScrollIndicator() {
    try {
      // Crea l'indicatore di scroll
      const scrollIndicator = document.createElement('div');
      scrollIndicator.className = 'scroll-indicator';
      scrollIndicator.innerHTML = '<div></div>';
      document.body.appendChild(scrollIndicator);

      const progressBar = scrollIndicator.querySelector('div');

      function updateScrollProgress() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
      }

      // Usa debounce per ottimizzare le performance
      const debouncedUpdateScrollProgress = debounce(updateScrollProgress, PERFORMANCE_CONFIG.scrollDebounce);
      window.addEventListener('scroll', debouncedUpdateScrollProgress, { passive: true });
      updateScrollProgress();
      console.log('✅ Scroll indicator inizializzato (ottimizzato)');
    } catch (error) {
      console.error('❌ Errore scroll indicator:', error);
    }
  }

  // Funzione debounce per ottimizzare gli eventi di scroll
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Scroll spy per evidenziare sezione attiva (OTTIMIZZATO)
  function initScrollSpy() {
    try {
      const sections = document.querySelectorAll('.section');
      const navLinks = document.querySelectorAll('.menu a');

      if (sections.length === 0 || navLinks.length === 0) {
        console.warn('⚠️ Sezioni o link menu non trovati');
        return;
      }

      function updateActiveSection() {
        let currentSection = '';

        sections.forEach(section => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.clientHeight;

          if (window.scrollY >= sectionTop - 150) {
            currentSection = section.getAttribute('id');
          }
        });

        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
          }
        });
      }

      // Usa debounce per ottimizzare le performance
      const debouncedUpdateActiveSection = debounce(updateActiveSection, PERFORMANCE_CONFIG.scrollDebounce);
      window.addEventListener('scroll', debouncedUpdateActiveSection, { passive: true });
      updateActiveSection();
      console.log('✅ Scroll spy inizializzato (ottimizzato)');
    } catch (error) {
      console.error('❌ Errore scroll spy:', error);
    }
  }

  // Miglioramenti accessibilità
  function initAccessibility() {
    try {
      // Aggiungi ARIA labels ai pulsanti carousel
      const carouselBtns = document.querySelectorAll('.carousel-btn');
      carouselBtns.forEach(btn => {
        if (btn.classList.contains('prev')) {
          btn.setAttribute('aria-label', 'Elemento precedente');
        } else if (btn.classList.contains('next')) {
          btn.setAttribute('aria-label', 'Elemento successivo');
        }
        btn.setAttribute('tabindex', '0');
      });

      // Aggiungi keyboard navigation
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
          closeModalFunction();
          unlockScroll();

        }
      });

      // Gestione focus per gallery items
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          const focusedElement = document.activeElement;
          if (focusedElement.classList.contains('gallery-item')) {
            e.preventDefault();
            focusedElement.click();
          }
        }
      });
      console.log('✅ Accessibilità inizializzata');
    } catch (error) {
      console.error('❌ Errore accessibilità:', error);
    }
  }

  // Stato di caricamento per gallery items
  function showLoadingState(item) {
    try {
      item.classList.add('loading');
      setTimeout(() => {
        item.classList.remove('loading');
      }, 1000);
    } catch (error) {
      console.error('❌ Errore loading state:', error);
    }
  }

  // === NAVBAR: CODICE SEMPLICE E FUNZIONANTE ===

  // Inizializza tutto quando il DOM è pronto
  document.addEventListener('DOMContentLoaded', function () {
    initNavbar();
    initSmoothScroll();
  });

  function initNavbar() {
    // 1. Menu toggle (hamburger) per mobile
    const menuToggle = document.getElementById('menuToggle');
    const menu = document.querySelector('.menu');

    if (menuToggle && menu) {
      // ARIA & focus management
      menuToggle.setAttribute('aria-haspopup','true');
      menuToggle.setAttribute('aria-expanded','false');
      menuToggle.setAttribute('aria-controls','primary-menu');
      menu.setAttribute('id','primary-menu');
      menu.setAttribute('role','navigation');

      function openMenu(){
        menu.classList.add('active');
        menuToggle.setAttribute('aria-expanded','true');
        trapFocus(menu);
      }
      function closeMenu(){
        menu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded','false');
        releaseFocus();
        menuToggle.focus();
      }

      menuToggle.addEventListener('click', function () {
        const isOpen = menu.classList.contains('active');
        isOpen ? closeMenu() : openMenu();
      });

      // Close on ESC
      document.addEventListener('keydown', (e)=>{
        if(e.key==='Escape' && menu.classList.contains('active')) closeMenu();
      });
    }
  }

  // Simple focus trap helpers
  let previousFocus = null;
  function trapFocus(container){
    previousFocus = document.activeElement;
    const focusable = container.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])');
    if(focusable.length===0) return;
    const first = focusable[0];
    const last = focusable[focusable.length-1];
    function handleTab(e){
      if(e.key!=='Tab') return;
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', handleTab);
    container.__trapHandler = handleTab;
    first.focus();
  }
  function releaseFocus(){
    const container = document.getElementById('primary-menu');
    if(container && container.__trapHandler){ container.removeEventListener('keydown', container.__trapHandler); delete container.__trapHandler; }
    if(previousFocus) previousFocus.focus();
  }

  function initSmoothScroll() {
    const menuLinks = document.querySelectorAll('.menu a[href^="#"]');

    menuLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        console.log('Link cliccato:', targetId);
        console.log('Elemento trovato:', targetElement);

        if (targetElement) {
          // Calcola offset per il banner fisso
          const banner = document.querySelector('.banner');
          const bannerHeight = banner ? banner.offsetHeight : 0;

          // Scroll alla sezione
          const targetPosition = targetElement.offsetTop - bannerHeight - 20;

          console.log('Scrolling to position:', targetPosition);

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // 🔥 Aggiorna l'URL con hash
          history.pushState(null, null, '#' + targetId);

          // Chiudi menu mobile
          if (window.innerWidth <= 900) {
            const menu = document.querySelector('.menu');
            if (menu) menu.classList.remove('active');
          }
        } else {
          console.log('Target element not found:', targetId);
        }
      });
    });

    console.log('Smooth scroll initialized for', menuLinks.length, 'links');
  }

  // Mobile hamburger menu toggle
  function initMobileMenu() {
    try {
      const toggleBtn = document.getElementById('menuToggle');
      const menuEl = document.querySelector('.menu');
      if (!toggleBtn || !menuEl) return;
      toggleBtn.addEventListener('click', () => {
        menuEl.classList.toggle('active');
      });
      console.log('✅ Mobile menu inizializzato');
    } catch (error) {
      console.error('❌ Errore mobile menu:', error);
    }
  }

  // Inizializza tutti i miglioramenti
  initScrollIndicator();
  initScrollSpy();
  initAccessibility();
  initSmoothScroll();
  initMobileMenu();
  manageFocus();

  // ---------- Mobile hero parallax (pointer follows aura) ----------
  (function () {
    if (window.innerWidth > 900) return; // only mobile/tablet
    const hero = document.querySelector('.hero');
    if (!hero) return;
    let rafId = null;
    function updateVars(xPct, yPct) {
      hero.style.setProperty('--x', xPct + '%');
      hero.style.setProperty('--y', yPct + '%');
    }
    function handleMove(e) {
      const touch = e.touches ? e.touches[0] : e;
      const xPct = (touch.clientX / window.innerWidth) * 100;
      const yPct = (touch.clientY / window.innerHeight) * 100;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateVars(xPct, yPct);
      });
    }
    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
  })();

  /* ---------------- Shader resolution tweak for mobile ---------------- */
  (function () {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const shaderIframe = document.getElementById('shader-iframe');
    if (shaderIframe && isMobile) {
      try {
        const url = new URL(shaderIframe.src);
        url.searchParams.set('res', '0.5'); // render at 50% resolution
        shaderIframe.src = url.toString();
        console.log('📱 Shader resolution reduced for mobile');
      } catch (err) { console.warn('Shader URL adjust error', err); }
    }
  })();

  // --- Shader iframe desktop: rispetta il valore paused da admin ---
  (function () {
    const iframe = document.getElementById('shader-iframe');
    if (!iframe) return;
    
    // Wait for site config to be loaded
    const applyShaderConfig = () => {
      if (!window.currentSiteConfig) {
        // Retry after a short delay if config not loaded yet
        setTimeout(applyShaderConfig, 100);
        return;
      }
      
      // Recupera la configurazione dal backend/admin
      let paused = false;
      if (window.currentSiteConfig && typeof window.currentSiteConfig.shaderPaused !== 'undefined') {
        paused = !!window.currentSiteConfig.shaderPaused;
      } else {
        // fallback: controlla se l'URL contiene paused
        try {
          const u = new URL(iframe.src);
          paused = u.searchParams.get('paused') === 'true';
        } catch (err) { paused = false; }
      }
      
      try {
        const u = new URL(iframe.src);
        u.searchParams.set('paused', paused ? 'true' : 'false');
        iframe.src = u.toString();
        console.log('[GLSL] Shader iframe desktop: paused =', paused);
      } catch (err) { console.warn('shader url', err); }
    };
    
    // Apply config when ready
    applyShaderConfig();
  })();



  // Funzione per creare canvas con stili personalizzati
  function createCanvasContent(ctx, title, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (title.includes('Generative')) {
      // Canvas generativo con pattern
      ctx.fillStyle = '#8A2BE2';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(Math.random() * width, Math.random() * height, 8, 8);
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('GEN', centerX, centerY);
    } else if (title.includes('Interactive')) {
      // Canvas interattivo con cerchi
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('INT', centerX, centerY);
    } else if (title.includes('VFX') || title.includes('Motion')) {
      // Canvas VFX con gradiente
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#FF0080');
      gradient.addColorStop(1, '#00FFFF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('VFX', centerX, centerY);
    } else if (title.includes('AI') || title.includes('Neural')) {
      // Canvas AI con pattern neurale
      ctx.fillStyle = '#1E1E1E';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
      }
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('AI', centerX, centerY);
    } else if (title.includes('Motion')) {
      // Canvas Motion Graphics
      ctx.fillStyle = '#4B0082';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(20, 20, width - 40, 20);
      ctx.fillRect(20, centerY - 10, width - 40, 20);
      ctx.fillRect(20, height - 40, width - 40, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('MOT', centerX, centerY);
    } else if (title.includes('Creative') || title.includes('Coding') || title.includes('Algoritmic')) {
      // Canvas Creative Coding
      ctx.fillStyle = '#2E8B57';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFB6C1';
      for (let i = 0; i < 10; i++) {
        ctx.fillRect(i * 20, i * 15, 15, 15);
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('CODE', centerX, centerY);
    } else {
      // Default canvas style
      ctx.fillStyle = '#40e0d0';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Montserrat, Arial';
      ctx.fillText('Canvas', centerX, centerY);
    }
  }

  // 🎬 CANVAS VIDEO SYSTEM - Lightweight video textures (OTTIMIZZATO)
  class CanvasVideoRenderer {
    constructor(canvas, videoSrc, fallbackImageSrc, immediateInit = false) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.videoSrc = videoSrc;
      this.fallbackImageSrc = fallbackImageSrc;
      this.video = null;
      this.isPlaying = false;
      this.isVisible = false;
      this.animationId = null;
      this.observer = null;
      this.lastFrameTime = 0;
      this.targetFPS = PERFORMANCE_CONFIG.maxFPS; // FPS ridotto per performance
      this.frameInterval = 1000 / this.targetFPS;
      this.isLoaded = false; // Flag per evitare caricamenti multipli

      if (immediateInit) {
        this.initImmediate();
      } else {
        this.init();
      }
    }

    init() {
      // Setup intersection observer for lazy loading and auto-pause
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.onVisible();
          } else {
            this.onHidden();
          }
        });
      }, { threshold: PERFORMANCE_CONFIG.lazyThreshold });

      this.observer.observe(this.canvas);

      // Load fallback image first (sempre caricato per placeholder)
      if (this.fallbackImageSrc) {
        this.loadFallbackImage();
      }

      // Video caricato solo quando diventa visibile (lazy loading)
      // Non caricare immediatamente per migliorare le performance
    }

    // Funzione per inizializzazione immediata (senza lazy loading)
    initImmediate() {
      // Setup intersection observer solo per auto-pause
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.onVisible();
          } else {
            this.onHidden();
          }
        });
      }, { threshold: 0.1 });

      this.observer.observe(this.canvas);

      // Load fallback image first
      if (this.fallbackImageSrc) {
        this.loadFallbackImage();
      }

      // Start loading video immediately
      if (this.videoSrc) {
        this.loadVideo();
        // Inizializza immediatamente come visibile
        this.isVisible = true;
        setTimeout(() => {
          if (this.video && this.video.readyState >= 2) {
            this.startVideo();
          }
        }, 100);
      }
    }

    loadFallbackImage() {
      const img = new Image();
      img.onload = () => {
        this.drawImageToCanvas(img);
      };
      img.onerror = () => {
        // If fallback image fails, create procedural content
        // createCanvasContent(this.ctx, 'Canvas', this.canvas.width, this.canvas.height);
      };
      img.src = this.fallbackImageSrc;
    }

    drawImageToCanvas(img) {
      const canvasW = this.canvas.width;
      const canvasH = this.canvas.height;
      const imgW = img.width;
      const imgH = img.height;

      // Calculate scale to FILL canvas while maintaining aspect ratio (like object-fit: cover)
      const scale = Math.max(canvasW / imgW, canvasH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const offsetX = (canvasW - drawW) / 2;
      const offsetY = (canvasH - drawH) / 2;

      this.ctx.clearRect(0, 0, canvasW, canvasH);

      // Add subtle background
      this.ctx.fillStyle = '#1a1a2e';
      this.ctx.fillRect(0, 0, canvasW, canvasH);

      // Draw image
      this.ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // Add subtle overlay effect
      this.ctx.fillStyle = 'rgba(64, 224, 208, 0.1)';
      this.ctx.fillRect(0, 0, canvasW, canvasH);
    }

    onVisible() {
      this.isVisible = true;
      
      // Carica il video solo se non è già stato caricato
      if (!this.isLoaded && this.videoSrc) {
        this.loadVideo();
        this.isLoaded = true;
      } else if (this.video && !this.isPlaying) {
        // Resume video if it was paused
        this.startVideo();
      }
    }

    onHidden() {
      this.isVisible = false;
      // Pause video to save resources when not visible
      this.pauseVideo();
    }

    loadVideo() {
      if (!this.videoSrc) return;

      this.video = document.createElement('video');
      this.video.src = this.videoSrc;
      this.video.loop = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.preload = 'metadata';

      // Use very low resolution for performance
      this.video.style.width = '240px';
      this.video.style.height = '135px';

      this.video.addEventListener('loadeddata', () => {
        // Start video immediately when loaded, regardless of visibility
        this.startVideo();
      });

      this.video.addEventListener('error', () => {
        console.warn('⚠️ Canvas video failed to load:', this.videoSrc);
        // Fallback to static image
        if (this.fallbackImageSrc) {
          this.loadFallbackImage();
        }
      });
    }

    startVideo() {
      if (!this.video || this.isPlaying) return;

      this.video.play().then(() => {
        this.isPlaying = true;
        this.render();
      }).catch(err => {
        console.warn('⚠️ Canvas video play failed:', err);
        // Keep fallback image
      });
    }

    pauseVideo() {
      if (this.video && this.isPlaying) {
        this.video.pause();
        this.isPlaying = false;
      }

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    render(currentTime = 0) {
      if (!this.isPlaying) return;

      // Throttle FPS for performance
      if (currentTime - this.lastFrameTime >= this.frameInterval) {
        this.drawVideoFrame();
        this.lastFrameTime = currentTime;
      }

      this.animationId = requestAnimationFrame((time) => this.render(time));
    }

    drawVideoFrame() {
      if (!this.video || this.video.readyState < 2) return;

      const canvasW = this.canvas.width;
      const canvasH = this.canvas.height;
      const videoW = this.video.videoWidth;
      const videoH = this.video.videoHeight;

      if (videoW === 0 || videoH === 0) return;

      // Calculate scale to FILL canvas (like object-fit: cover)
      const scale = Math.max(canvasW / videoW, canvasH / videoH);
      const drawW = videoW * scale;
      const drawH = videoH * scale;
      const offsetX = (canvasW - drawW) / 2;
      const offsetY = (canvasH - drawH) / 2;

      this.ctx.clearRect(0, 0, canvasW, canvasH);

      // Add background
      this.ctx.fillStyle = '#0a0a0a';
      this.ctx.fillRect(0, 0, canvasW, canvasH);

      // Draw video frame
      this.ctx.drawImage(this.video, offsetX, offsetY, drawW, drawH);

      // Add subtle video overlay effect
      this.ctx.fillStyle = 'rgba(64, 224, 208, 0.05)';
      this.ctx.fillRect(0, 0, canvasW, canvasH);
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }

      this.pauseVideo();

      if (this.video) {
        this.video.src = '';
        this.video.load();
      }
    }
  }

  // Funzione per inizializzare una gallery
  function initGallery(sectionId, images) {
    const track = document.querySelector(`#${sectionId}-track`);
    if (!track) {
      console.warn(`⚠️ Track non trovato per sezione: ${sectionId}`);
      return;
    }

    const section = track.closest('.section');

    // 1. Calcola slidesPerView reale in base alla larghezza corrente
    let realSPV;
    const w = window.innerWidth;
    if (w <= 320) realSPV = 1;
    else if (w <= 480) realSPV = 1;
    else if (w <= 600) realSPV = 1.5;
    else if (w <= 900) realSPV = 2;
    else if (w <= 1200) realSPV = 2.5;
    else realSPV = 3;

    // 2. Crea copia dell'array immagini e aggiungi placeholder se necessario
    const slidesData = [...images];
    const remainder = slidesData.length % Math.ceil(realSPV);
    const fillersNeeded = remainder === 0 ? 0 : Math.ceil(realSPV) - remainder;
    for (let i = 0; i < fillersNeeded; i++) {
      slidesData.push({ placeholder: true, title: `placeholder-${i}` });
    }

    console.log(`📊 [${sectionId}] SPV=${realSPV}, Slide reali=${images.length}, placeholder=${fillersNeeded}, totali=${slidesData.length}`);

    // ========= PRELOADING INTELLIGENTE =========
    // Raccoglie tutti i media da precaricare
    const mediaToPreload = [];
    images.forEach(img => {
      // Preload immagini principali
      if (img.src) mediaToPreload.push(img.src);
      if (img.modalImage) mediaToPreload.push(img.modalImage);
      
      // Preload video dei canvas
      if (img.video) mediaToPreload.push(img.video);
      
      // Preload gallery modal
      if (img.modalGallery && Array.isArray(img.modalGallery)) {
        mediaToPreload.push(...img.modalGallery);
      }
    });
    
    // Avvia preloading con priorità normale (usa smart preloading se disponibile)
    if (mediaToPreload.length > 0) {
      console.log(`🚀 [${sectionId}] Preloading ${mediaToPreload.length} media files...`);
      if (window.smartPreloadMedia) {
        window.smartPreloadMedia(mediaToPreload, 'normal');
      } else {
        preloadMedia(mediaToPreload, 'normal');
      }
    }
    // ========= FINE PRELOADING =========

    // Genera dinamicamente gli item con Swiper slide
    slidesData.forEach((img, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item swiper-slide';
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      // --- AGGIUNTA: Attributi per la modern modal gallery ---
      if (img.modalGallery) {
        item.setAttribute('data-modal-gallery', JSON.stringify(img.modalGallery));
      }
      if (img.description) {
        item.setAttribute('data-description', img.description);
      }
      if (img.detailDescription || (img.detail && img.detail.description)) {
        const detailed = img.detailDescription || (img.detail && img.detail.description);
        if (detailed) {
          item.setAttribute('data-detail-description', detailed);
        }
      }
      if (img.detailTitle || (img.detail && img.detail.title)) {
        const detailTitle = img.detailTitle || (img.detail && img.detail.title);
        if (detailTitle) {
          item.setAttribute('data-detail-title', detailTitle);
        }
      }
      const rawSoftware = img.softwareUsed ?? img.software ?? (img.detail && (img.detail.software || img.detail.tools));
      const softwareList = normalizeSoftwareList(rawSoftware);
      if (softwareList.length) {
        item.setAttribute('data-software', JSON.stringify(softwareList));
      }
      if (img.placeholder) {
        item.classList.add('placeholder-slide');
        track.appendChild(item);
        return;
      }

      if (img.video) item.setAttribute('data-video', img.video);

      let mediaEl;
      if (img.canvas) {
        mediaEl = document.createElement('canvas');
        mediaEl.className = 'gallery-canvas';
        // Dimensioni canvas responsive
        mediaEl.width = 300;
        mediaEl.height = 210;
        if (window.innerWidth <= 600) {
          // Mobile: canvas verticale 3:4 per un design moderno e coerente
          mediaEl.width = 270;
          mediaEl.height = 360;
        }

        const ctx = mediaEl.getContext('2d');

        // 🎬 OTTIMIZZATO: Lazy loading per tutti i tipi di canvas
        if (img.canvasVideo && img.video) {
          // Canvas video con lazy loading
          const canvasId = `${sectionId}-canvas-${index}`;
          mediaEl.id = canvasId;

          const renderer = new CanvasVideoRenderer(mediaEl, img.video, img.src, false); // false = lazy loading
          canvasVideoRenderers.set(canvasId, renderer);

          console.log(`🎬 Canvas video created with lazy loading: ${canvasId} (${img.video})`);
        } else if (img.src || img.modalImage) {
          // Canvas statico con immagine - lazy loading
          const canvasId = `${sectionId}-static-canvas-${index}`;
          mediaEl.id = canvasId;
          mediaEl.dataset.imageSrc = img.src || img.modalImage; // Salva l'URL per il lazy loading
          
          // Crea placeholder iniziale
          createCanvasContent(ctx, img.title, mediaEl.width, mediaEl.height);
          console.log(`🖼️ Static canvas placeholder created: ${canvasId}`);
        } else {
          // Canvas procedurale - lazy loading
          const canvasId = `${sectionId}-procedural-canvas-${index}`;
          mediaEl.id = canvasId;
          console.log(`🎨 Procedural canvas created: ${canvasId}`);
        }
      } else {
        /* Utilizza ImageOptimizer per immagini responsive e lazy */
        const imgFilename = (img.src || '').split('/').pop(); // es. "boccioni.png"
        if (window.createResponsiveImage) {
          // Crea <img> con placeholder base64, attributi data-* e classe "lazy-image"
          mediaEl = window.createResponsiveImage(imgFilename, img.title, 'gallery-img');
          mediaEl.loading = 'lazy';
          mediaEl.decoding = 'async';
          // Marca automaticamente thumbnail 16:9
          mediaEl.addEventListener('load', () => {
            try {
              const ratio = mediaEl.naturalWidth / mediaEl.naturalHeight;
              if (Math.abs(ratio - (16/9)) < 0.05) {
                mediaEl.classList.add('is-16x9');
              }
            } catch(e) {}
          }, { once: true });
        } else {
          // Fallback: comportamento precedente
          mediaEl = document.createElement('img');
          mediaEl.className = 'gallery-img';
          mediaEl.src = img.src;
          mediaEl.alt = img.title;
          mediaEl.addEventListener('load', () => {
            try {
              const ratio = mediaEl.naturalWidth / mediaEl.naturalHeight;
              if (Math.abs(ratio - (16/9)) < 0.05) {
                mediaEl.classList.add('is-16x9');
              }
            } catch(e) {}
          }, { once: true });
          mediaEl.onerror = () => {
            mediaEl.style.display = 'none';
            console.log('Immagine non trovata:', mediaEl.src);
          };
        }
      }

      const titleEl = document.createElement('div');
      titleEl.className = 'gallery-title';
      titleEl.textContent = img.title;

      item.appendChild(mediaEl);
      item.appendChild(titleEl);
      track.appendChild(item);
    });

    // Inizializza Swiper per questa gallery
    const swiperContainer = section.querySelector('.gallery-carousel');
    const totalSlides = slidesData.length;

    // Funzione di blocco preventiva: evita di superare l'ultima slide (mobile: una prima)
    const dynamicBlock = (sw) => {
      const realSPV = (typeof sw.params.slidesPerView === 'number') ? sw.params.slidesPerView : sw.slidesPerViewDynamic();
      const baseLimit = totalSlides - Math.ceil(realSPV);
      // Se visualizzi solo 1 slide (spv ~1) blocca una slide prima per evitare ultima singola
      const extraOffset = realSPV <= 1.05 ? 1 : 0;
      const maxAllowedIndex = Math.max(0, baseLimit - extraOffset);

      if (sw.activeIndex >= maxAllowedIndex) {
        sw.allowSlideNext = false;
      } else {
        sw.allowSlideNext = true;
      }

      if (sw.activeIndex <= 0) {
        sw.allowSlidePrev = false;
      } else {
        sw.allowSlidePrev = true;
      }
    };

    console.log(`🔍 [${sectionId}] Inizializzo Swiper - BLOCCO MANUALE`);

    // -------------------- CLAMP BASED ON TRANSFORM --------------------
    // Funzione che calcola la translate massima consentita e la salva su swiper
    const updateClamp = (sw) => {
      const perView = (typeof sw.params.slidesPerView === 'number') ? sw.params.slidesPerView : sw.slidesPerViewDynamic();
      const space = sw.params.spaceBetween || 0;
      const slideW = sw.slides[0] ? sw.slides[0].offsetWidth + space : 0;
      
      // Calcolo corretto per slidesPerView frazionari (es. 1.5, 2.5)
      const effectiveSlidesPerView = Math.ceil(perView);
      const maxIndex = Math.max(0, sw.slides.length - effectiveSlidesPerView);
      
      // Per mobile con slidesPerView frazionari, aggiungi un offset per evitare vuoto
      const mobileOffset = (perView < 2 && perView > 1) ? 1 : 0;
      const adjustedMaxIndex = Math.max(0, maxIndex - mobileOffset);
      
      // Su mobile fisico, riduci leggermente il limite per evitare problemi di precisione
      const finalMaxIndex = isRealMobile ? Math.max(0, adjustedMaxIndex - 0.1) : adjustedMaxIndex;
      
      sw.__maxTranslate = -slideW * finalMaxIndex; // valore negativo
      console.log(`🔧 [${sectionId}] Clamp: perView=${perView}, maxIndex=${finalMaxIndex}, maxTranslate=${sw.__maxTranslate}, mobile=${isRealMobile}`);
    };

    // Funzione che forza il transform a non superare il limite
    const clampTranslate = (sw) => {
      if (typeof sw.__maxTranslate === 'undefined') updateClamp(sw);
      const tx = sw.getTranslate(); // valore negativo attuale

      // Evita ricorsione infinita usando un semplice lock
      if (sw.__clampLock) return;

      // Controllo limite superiore (fine carosello)
      if (tx < sw.__maxTranslate) {
        sw.__clampLock = true;
        sw.setTranslate(sw.__maxTranslate);
        sw.__clampLock = false;
        sw.allowSlideNext = false;
      } else {
        sw.allowSlideNext = true;
      }
      
      // Controllo limite inferiore (inizio carosello)
      if (tx >= 0) {
        sw.allowSlidePrev = false;
      } else {
        sw.allowSlidePrev = true;
      }
    };

    // Rileva se siamo su dispositivo mobile fisico
    const isRealMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && 
                        ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    console.log(`📱 [${sectionId}] Dispositivo mobile fisico: ${isRealMobile}`);

    const swiper = new Swiper(swiperContainer, {
      slidesPerView: 3,
      spaceBetween: 40,
      grabCursor: true,
      passiveListeners: true,
      threshold: isRealMobile ? 10 : 5,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      // Configurazioni ottimizzate per mobile fisico
      resistance: isRealMobile ? false : true, // Disabilita resistenza su mobile fisico
      resistanceRatio: isRealMobile ? 0 : 0.85,
      touchRatio: isRealMobile ? 1 : 1,
      // Angolo più stretto per evitare conflitti con lo scroll verticale
      touchAngle: 30,
      grabCursor: true,
      // Miglioramenti per touch su mobile fisico
      touchStartPreventDefault: false,
      touchMoveStopPropagation: false,
      iOSEdgeSwipeDetection: true,
      iOSEdgeSwipeThreshold: 20,
      breakpoints: {
        320: {
          slidesPerView: 1,
          spaceBetween: 16,
          resistanceRatio: isRealMobile ? 0 : 0.7,
          touchRatio: isRealMobile ? 1 : 0.8,
          touchAngle: 30,
          touchStartPreventDefault: false,
          touchMoveStopPropagation: false
        },
        480: {
          slidesPerView: 1,
          spaceBetween: 16,
          resistanceRatio: isRealMobile ? 0 : 0.9,
          touchRatio: isRealMobile ? 1 : 0.9,
          touchAngle: 30,
          touchStartPreventDefault: false,
          touchMoveStopPropagation: false
        },
        600: {
          slidesPerView: 2,
          spaceBetween: 20,
          resistanceRatio: isRealMobile ? 0 : 0.9,
          touchRatio: isRealMobile ? 1 : 0.95,
          touchAngle: 35,
          touchStartPreventDefault: false,
          touchMoveStopPropagation: false
        },
        900: {
          slidesPerView: 2,
          spaceBetween: 30,
          resistanceRatio: isRealMobile ? 0 : 1,
          touchRatio: isRealMobile ? 1 : 1,
          touchStartPreventDefault: false,
          touchMoveStopPropagation: false
        },
        1200: {
          slidesPerView: 3,
          spaceBetween: 40,
          resistanceRatio: isRealMobile ? 0 : 0.85,
          touchRatio: isRealMobile ? 1 : 1,
          touchStartPreventDefault: false,
          touchMoveStopPropagation: false
        }
      },
      speed: 300,
      on: {
        init() {
          updateClamp(this);
          dynamicBlock(this);
        },
        resize() {
          updateClamp(this);
          clampTranslate(this);
          dynamicBlock(this);
        },
        slideChange() {
          clampTranslate(this);
          dynamicBlock(this);
        },
        setTranslate(sw, translate) {
          clampTranslate(sw);
        }
      }
    });

    // Aggiorna clamp su resize esterno (backup)
    window.addEventListener('resize', () => setTimeout(() => {
      updateClamp(swiper);
      clampTranslate(swiper);
      dynamicBlock(swiper);
    }, 120));

    // Controllo aggiuntivo per le frecce di navigazione
    const updateNavigationButtons = () => {
      const prevBtn = swiperContainer.querySelector('.swiper-button-prev');
      const nextBtn = swiperContainer.querySelector('.swiper-button-next');
      
      if (prevBtn) {
        prevBtn.style.opacity = swiper.allowSlidePrev ? '1' : '0.3';
        prevBtn.style.pointerEvents = swiper.allowSlidePrev ? 'auto' : 'none';
      }
      
      if (nextBtn) {
        nextBtn.style.opacity = swiper.allowSlideNext ? '1' : '0.3';
        nextBtn.style.pointerEvents = swiper.allowSlideNext ? 'auto' : 'none';
      }
    };

    // Aggiorna i pulsanti dopo ogni cambio di slide
    swiper.on('slideChange', updateNavigationButtons);
    swiper.on('init', updateNavigationButtons);

    // Gestione specifica per mobile fisico
    if (isRealMobile) {
      // Disabilita controlli troppo restrittivi su mobile fisico
      swiper.on('touchEnd', () => {
        setTimeout(() => {
          // Controllo più permissivo su mobile fisico
          const currentTranslate = swiper.getTranslate();
          if (currentTranslate < swiper.__maxTranslate - 10) { // Tolleranza di 10px
            swiper.setTranslate(swiper.__maxTranslate);
          }
          if (currentTranslate > 10) { // Tolleranza di 10px
            swiper.setTranslate(0);
          }
          dynamicBlock(swiper);
          updateNavigationButtons();
        }, 100); // Delay maggiore per mobile fisico
      });

      // Gestione touch migliorata per mobile fisico
      swiper.on('touchStart', () => {
        console.log(`📱 [${sectionId}] Touch start su mobile fisico`);
      });

      swiper.on('touchMove', () => {
        // Permetti movimento più fluido su mobile fisico
      });

    } else {
      // Controllo standard per desktop/simulazione
      swiper.on('touchEnd', () => {
        setTimeout(() => {
          clampTranslate(swiper);
          dynamicBlock(swiper);
          updateNavigationButtons();
        }, 50);
      });
    }

    // Controllo su slideChange per assicurarsi che non si superino i limiti
    swiper.on('slideChange', () => {
      const currentTranslate = swiper.getTranslate();
      if (currentTranslate < swiper.__maxTranslate) {
        swiper.setTranslate(swiper.__maxTranslate);
      }
      if (currentTranslate > 0) {
        swiper.setTranslate(0);
      }
    });

    return swiper;
  }

  // Modal functionality
  const modal = document.getElementById('modalVideo');
  const modalPlayer = document.getElementById('modalVideoPlayer');
  const modalDescription = document.getElementById('modalDescription');
  const closeModalBtn = document.getElementById('closeModal');

  // Debug controlli modal
  console.log('🔍 Modal elements:', {
    modal: !!modal,
    modalPlayer: !!modalPlayer,
    modalDescription: !!modalDescription,
    closeModalBtn: !!closeModalBtn
  });

  // Funzione per chiudere il modal
  function closeModalFunction() {
    try {
      if (modal) {
        modal.style.display = 'none';
        if (modalPlayer) {
          modalPlayer.pause();
          modalPlayer.src = '';
        }
        // Unlock scroll when modal closes
        unlockScroll();
        console.log('✅ Modal chiuso');
      }
    } catch (error) {
      console.error('❌ Errore chiusura modal:', error);
    }
  }

  // Event listeners per chiudere il modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModalFunction);
    // Add keyboard support for close button
    closeModalBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeModalFunction();
      }
    });
    console.log('✅ Event listener close modal aggiunto');
  } else {
    console.warn('⚠️ Pulsante close modal non trovato');
  }

  // Chiudi modal cliccando fuori
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModalFunction();
      }
    });
    
    // Add keyboard support for ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
        closeModalFunction();
      }
    });
    
    console.log('✅ Click fuori modal handler aggiunto');
  }

  // Gestione focus per rimuovere focus dai canvas quando necessario
  function manageFocus() {
    // Rimuovi focus dai canvas quando si clicca altrove
    document.addEventListener('click', function (e) {
      const focusedElement = document.activeElement;
      const clickedElement = e.target;

      // Se c'è un canvas focalizzato e si clicca fuori da esso
      if (focusedElement && focusedElement.closest('.gallery-item') &&
        !clickedElement.closest('.gallery-item')) {
        focusedElement.blur();
      }
    });

    // Rimuovi focus dai canvas quando si fa swipe o scroll
    document.addEventListener('touchstart', function (e) {
      const focusedElement = document.activeElement;
      if (focusedElement && focusedElement.closest('.gallery-item') &&
        !e.target.closest('.gallery-item')) {
        focusedElement.blur();
      }
    });

    // Gestione Escape per rimuovere focus
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.closest('.gallery-item')) {
          focusedElement.blur();
        }
      }
    });
  }

      // Gestione click semplificata per mobile
    function addClickHandler(element, handler) {
      let touchStartTime = 0;
      let touchMoved = false;
      let touchStartX = 0;
      let touchStartY = 0;

      // Gestione touch per mobile
      element.addEventListener('touchstart', function (e) {
        touchStartTime = Date.now();
        touchMoved = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        element.style.opacity = '0.8';
      }, { passive: true });

      element.addEventListener('touchmove', function (e) {
        if (e.touches.length > 0) {
          const touchX = e.touches[0].clientX;
          const touchY = e.touches[0].clientY;
          const deltaX = Math.abs(touchX - touchStartX);
          const deltaY = Math.abs(touchY - touchStartY);
          
          // Considera movimento se si muove più di 10px in qualsiasi direzione
          if (deltaX > 10 || deltaY > 10) {
            touchMoved = true;
          }
        }
      }, { passive: true });

      element.addEventListener('touchend', function (e) {
        element.style.opacity = '1';
        const touchDuration = Date.now() - touchStartTime;

        // Su mobile fisico, aumenta la tolleranza per il movimento
        const moveThreshold = isRealMobile ? 15 : 10;
        const timeThreshold = isRealMobile ? 400 : 300;

        // Solo se è un tap veloce e non c'è stato movimento significativo
        if (!touchMoved && touchDuration < timeThreshold) {
          e.preventDefault();
          e.stopPropagation();
          // Rimuovi focus prima di eseguire il handler
          if (document.activeElement && document.activeElement !== element) {
            document.activeElement.blur();
          }
          setTimeout(() => handler(e), isRealMobile ? 100 : 50); // Delay maggiore per mobile fisico
        }
      }, { passive: false });

      // Fallback per desktop
      element.addEventListener('click', function (e) {
        if (e.isTrusted) {
          e.preventDefault();
          e.stopPropagation();
          handler(e);
        }
      });
    }

  // Carica dati dinamici e inizializza
  console.log('🌍 Environment:', window.APP_ENV);

  // Caricamento ottimizzato delle galleries con timeout ridotto
  const loadGalleriesOptimized = async () => {
    try {
      let data;
      if (window.APP_ENV === 'prod' && window.listGalleries) {
        // Produzione: Firestore con timeout di 5 secondi
        data = await Promise.race([
          window.listGalleries(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 5000))
        ]);
      } else {
        // Sviluppo/Preprod: file statico
        data = await window.fetchJson('/api/galleries', 'data/galleries.json');
      }
      
      console.log('📁 Galleries loaded:', Object.keys(data));
      galleries = data;
      
      // Inizializza galleries in batch per performance
      const galleryEntries = Object.entries(data);
      const batchSize = 3; // Processa 3 gallery alla volta
      
      for (let i = 0; i < galleryEntries.length; i += batchSize) {
        const batch = galleryEntries.slice(i, i + batchSize);
        batch.forEach(([k, v]) => initGallery(k, v));
        
        // Yield al browser tra i batch
        if (i + batchSize < galleryEntries.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      afterGalleryInit();
      
      // Avvia preloading con delay ridotto
      setTimeout(() => {
        startInitialPreload();
      }, 200);
    
      // Inizializza l'observer per il lazy loading dei canvas
      setTimeout(() => {
        initCanvasObserver();
        
        // Osserva tutti i canvas per il lazy loading
        const allCanvas = document.querySelectorAll('.gallery-canvas');
        allCanvas.forEach(canvas => {
          if (canvasObserver) {
            canvasObserver.observe(canvas);
          }
          
          // PATCH: Forza il caricamento dei canvas che hanno data-loaded="true" ma non mostrano contenuto
          if (canvas.dataset.loaded === 'true' && canvas.dataset.imageSrc) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Controlla se il canvas è vuoto (solo background)
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const isEmpty = imageData.data.every(pixel => pixel === 0);
              
              if (isEmpty || canvas.dataset.contentLoaded !== 'true') {
                console.log('🔧 Forzando caricamento immagine per canvas in stato inconsistente:', canvas.id);
                canvas.dataset.loaded = 'false'; // Reset per permettere il caricamento
                canvas.dataset.contentLoaded = 'false';
                loadCanvasContent(canvas);
              }
            }
          }
        });
        console.log(`👁️ Observer attivo per ${allCanvas.length} canvas`);
      }, 100);
      
      if (window.innerWidth <= 900 && typeof enableModernMobileCanvasGallery === 'function') {
        console.log('[MODERN MODAL] enableModernMobileCanvasGallery chiamata DOPO tutte le gallery');
        enableModernMobileCanvasGallery();
      }
      
    } catch (err) {
      console.error('❌ Errore fetch galleries:', err);
      // Fallback immediato
      try {
        const response = await fetch('data/galleries.json');
        const data = await response.json();
        console.log('📁 Galleries loaded from fallback:', Object.keys(data));
        galleries = data;
        Object.entries(data).forEach(([k, v]) => initGallery(k, v));
        afterGalleryInit();
      } catch (err2) {
        console.error('❌ Errore fetch galleries fallback:', err2);
      }
    }
  };

  // Avvia il caricamento ottimizzato
  loadGalleriesOptimized();

  function afterGalleryInit() {
    // Lazy-loading: inizializza ImageOptimizer una sola volta
    if (window.ImageOptimizer && !window.imageOptimizer) {
      window.imageOptimizer = new ImageOptimizer({
        rootMargin: '300px',
        threshold: 0.1,
        enableWebP: true,
        enableAVIF: true
      });
      console.log('🖼️ ImageOptimizer avviato (gallerie)');
    }

    // Aggiungi click handlers dopo che tutte le gallery sono pronte
    console.log('🔗 Aggiunta click handlers...');
    const galleryItems = document.querySelectorAll('.gallery-item');
    console.log(`📱 Trovati ${galleryItems.length} gallery items`);

    galleryItems.forEach((item, index) => {
      if (item.classList.contains('placeholder-slide')) return; // skip filler slides
      const videoSrc = item.getAttribute('data-video');
      const description = item.getAttribute('data-description') || '';

      // Trova l'immagine corrispondente nell'array
      const titleEl = item.querySelector('.gallery-title');
      if (!titleEl) return;
      const title = titleEl.textContent;
      let imgData = null;

      // Cerca nei dati delle gallery
      Object.values(galleries).forEach(gallery => {
        const found = gallery.find(img => img.title === title);
        if (found) imgData = found;
      });

      // RIMOSSO hint overlay "TAP"
      // const hint=document.createElement('div');
      // hint.className='overlay-hint';
      // hint.textContent='TAP';
      // item.appendChild(hint);

      if (modal) {
        item.style.cursor = 'pointer';
        console.log(`🖱️ Aggiungendo click handler per item ${index + 1}`);
        addClickHandler(item, e => {
          const canvas = item.querySelector('.gallery-canvas');

          // Gestione unificata dei canvas - tutti usano showModernModalGallery
          const detailPayload = createDetailPayload({
            itemElement: item,
            data: imgData,
            fallbackDescription: description,
            fallbackTitle: title
          });

          if (canvas && imgData) {
            // Controllo se il canvas ha contenuto valido (multimediale o procedurale)
            const hasMediaContent = imgData.modalImage || imgData.modalGallery || imgData.video || videoSrc;
            const hasProceduralContent = imgData.canvas && imgData.title; // Canvas procedurale con titolo
            
            if (!hasMediaContent && !hasProceduralContent) {
              // Canvas vuoto - mostra avviso
              alert('⚠️ Questo canvas non ha contenuto da visualizzare.\nAggiungi immagini, video o gallerie tramite il pannello admin.');
              return;
            }
            
            if (imgData.modalImage) {
              // Converte immagine singola in gallery per UI unificata
              const singleImageGallery = [imgData.modalImage];
              showModernModalGallery(singleImageGallery, 0, detailPayload);
            } else if (imgData.modalGallery) {
              // Mostra carosello immagini (comportamento esistente)
              showModernModalGallery(imgData.modalGallery, 0, detailPayload);
            }
            else if (imgData.video || videoSrc) {
              // Converte video singolo in gallery per UI unificata
              const src = videoSrc || imgData.video;
              const singleVideoGallery = [src];
              showModernModalGallery(singleVideoGallery, 0, detailPayload);
            }
            else if (hasProceduralContent) {
              // Canvas procedurale - usa il contenuto del canvas stesso
              try {
                const placeholderGallery = [canvas.toDataURL()];
                const proceduralDetail = {
                  ...detailPayload,
                  description: detailPayload.description || 'Canvas procedurale',
                  detailDescription: detailPayload.detailDescription || detailPayload.description || 'Canvas procedurale'
                };
                showModernModalGallery(placeholderGallery, 0, proceduralDetail);
              } catch (error) {
                // Errore di sicurezza con canvas "tainted" (contenuto da domini esterni)
                console.warn('🚫 Canvas contiene contenuto da domini esterni, impossibile esportare:', error.message);
                alert('⚠️ Questo canvas contiene contenuto da domini esterni.\nAggiungi immagini o video alla modalGallery tramite il pannello admin per visualizzarli correttamente.');
              }
            }
          } else if (canvas && !imgData) {
            // Canvas senza dati - potrebbe essere procedurale, controlla se ha contenuto visivo
            try {
              const canvasData = canvas.toDataURL();
              // Controlla se il canvas ha contenuto (non è completamente vuoto)
              if (canvasData && canvasData.length > 1000) { // Un canvas vuoto ha circa 100-200 caratteri
                const placeholderGallery = [canvasData];
                const fallbackDetail = {
                  ...detailPayload,
                  description: detailPayload.description || 'Canvas interattivo',
                  detailDescription: detailPayload.detailDescription || detailPayload.description || 'Canvas interattivo'
                };
                showModernModalGallery(placeholderGallery, 0, fallbackDetail);
              } else {
                // Canvas realmente vuoto
                alert('⚠️ Questo canvas non ha contenuto da visualizzare.\nAggiungi immagini, video o gallerie tramite il pannello admin.');
                return;
              }
            } catch (error) {
              // Errore di sicurezza con canvas "tainted" (contenuto da domini esterni)
              if (error.name === 'SecurityError') {
                console.warn('🚫 Canvas contiene contenuto da domini esterni, impossibile esportare:', error.message);
                alert('⚠️ Questo canvas contiene contenuto da domini esterni.\nAggiungi immagini o video alla modalGallery tramite il pannello admin per visualizzarli correttamente.');
              } else {
                console.warn('Errore nel controllo canvas:', error);
                alert('⚠️ Questo canvas non ha contenuto da visualizzare.\nAggiungi immagini, video o gallerie tramite il pannello admin.');
              }
              return;
            }
          } else if (videoSrc && modalPlayer) {
            // Default: video per immagini normali - usa UI unificata
            const singleVideoGallery = [videoSrc];
            showModernModalGallery(singleVideoGallery, 0, detailPayload);
          }

          // Descrizione gestita ora direttamente da showModernModalGallery

        });
      }
    });
  }

  console.log('🎉 Portfolio: Inizializzazione completata con successo!');
});


const loadSiteData = async () => {
  try {
    let siteData;
    if (window.APP_ENV === 'prod') {
      // Wait max 15s for Firebase helpers
      if (!window.getSiteData) {
        await new Promise(res => {
          const t = setTimeout(res, 30000);
          window.addEventListener('firebase-ready', () => { clearTimeout(t); res(); }, { once: true });
        });
      }
      if (!window.getSiteData) throw new Error('Firebase not ready');
      siteData = await window.getSiteData();
      console.log('[Site] Data from Firestore', siteData);
    } else {
      // dev/local
      const resp = await fetch('data/site.json');
      siteData = await resp.json();
      console.log('[Site] Data from local file', siteData);
    }
    return siteData;
  } catch (err) {
    console.error('[Site] loadSiteData error', err);
    return { heroText: 'MÊIRKS', bio: 'Portfolio', version: 'v1.0.0', contacts: [] };
  }
};

// Legacy function - kept for compatibility
const loadSiteConfig = async () => {
  return await loadSiteData();
};

// Legacy function - kept for compatibility
const applySiteConfig = (site) => {
  return applySiteData(site);
};

// Legacy variable - kept for compatibility
let currentSiteConfig = null;

// Check for site config updates






// Initial load - use direct Firestore in production
const initialLoad = async () => {
  try {
    // Debug environment and available functions
    console.log('🔍 Environment check:', {
      APP_ENV: window.APP_ENV,
      getSiteProd: typeof window.getSiteProd,
      fetchJson: typeof window.fetchJson,
      db: typeof window.db
    });

    let site;
    if (window.APP_ENV === 'prod' && window.getSiteProd) {
      try {
        console.log('🔥 Initial load: Loading site data DIRECTLY from Firestore...');
        site = await window.getSiteProd();
        console.log('🔥 Initial Firestore data loaded:', site);
      } catch (firebaseError) {
        console.warn('🔥 Firestore failed, falling back to local data:', firebaseError);
        // Fallback to local JSON if Firestore fails
        site = await loadSiteConfig();
      }
    } else {
      console.log('🔥 Initial load: Loading site data from local/dev environment...');
      site = await loadSiteConfig();
    }

    currentSiteConfig = site;
    applySiteConfig(site);

  } catch (err) {
    console.error('❌ Errore initial site load:', err);

    // Final fallback: try to load local data
    try {
      console.log('🔄 Final fallback: loading local site data...');
      const site = await loadSiteConfig();
      currentSiteConfig = site;
      applySiteConfig(site);
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError);
    }
  }
};

initialLoad();

document.addEventListener('DOMContentLoaded', () => {
  // Apply pulse animation to gallery cards until first interaction
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach(item => {
    item.classList.add('pulse');
    const clearPulse = () => { item.classList.remove('pulse'); item.removeEventListener('pointerdown', clearPulse); };
    item.addEventListener('pointerdown', clearPulse, { once: true });
  });

  // Inizializza l'observer per i canvas già presenti nel DOM
  setTimeout(() => {
    if (canvasObserver) {
      const existingCanvas = document.querySelectorAll('.gallery-canvas');
      existingCanvas.forEach(canvas => {
        canvasObserver.observe(canvas);
        
        // PATCH: Forza il caricamento dei canvas che hanno data-loaded="true" ma non mostrano contenuto
        if (canvas.dataset.loaded === 'true' && canvas.dataset.imageSrc) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Controlla se il canvas è vuoto (solo background)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const isEmpty = imageData.data.every(pixel => pixel === 0);
            
            if (isEmpty || canvas.dataset.contentLoaded !== 'true') {
              console.log('🔧 Forzando caricamento immagine per canvas esistente in stato inconsistente:', canvas.id);
              canvas.dataset.loaded = 'false'; // Reset per permettere il caricamento
              canvas.dataset.contentLoaded = 'false';
              loadCanvasContent(canvas);
            }
          }
        }
      });
      console.log(`👁️ Observer attivo per ${existingCanvas.length} canvas esistenti`);
    }
  }, 500);

  // Arrow scroll hint for horizontal carousels
  const carousels = document.querySelectorAll('.gallery-carousel');
  carousels.forEach(carousel => {
    if (carousel.scrollWidth <= carousel.clientWidth) return; // no overflow
    const hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.textContent = '›';
    carousel.style.position = 'relative';
    carousel.appendChild(hint);
    let removed = false;
    function removeHint() {
      if (removed) return; removed = true; hint.remove();
      carousel.removeEventListener('scroll', onScroll);
    }
    function onScroll() { if (Math.abs(carousel.scrollLeft) > 8) { removeHint(); } }
    carousel.addEventListener('scroll', onScroll);
    // Fallback: rimuovi comunque dopo 4s
    setTimeout(removeHint, 4000);
  });

  // Fade-in shader iframe after load
  const shader = document.getElementById('shader-iframe');
  const logoEl = document.querySelector('.center-logo');
  const shaderLoader = document.getElementById('shaderLoader');
  const hideShaderLoader = () => { if (shaderLoader) shaderLoader.classList.add('hide'); };
  
  // Track shader loading for both desktop and mobile
  let desktopShaderLoaded = false;
  let mobileShaderLoaded = false;
  let iframeLoaded = false;
  
  const checkAllShadersLoaded = () => {
    const isDesktop = window.innerWidth > 900;
    const isMobile = window.innerWidth <= 900;
    
    if (isDesktop && desktopShaderLoaded) {
      if (logoEl) logoEl.classList.add('loaded');
      hideShaderLoader();
    } else if (isMobile && mobileShaderLoaded) {
      if (logoEl) logoEl.classList.add('loaded');
      hideShaderLoader();
    } else if (iframeLoaded) {
      if (logoEl) logoEl.classList.add('loaded');
      hideShaderLoader();
    }
  };
  
  if (shader) {
    shader.addEventListener('load', () => {
      shader.classList.add('loaded');
      iframeLoaded = true;
      checkAllShadersLoaded();
    });
  }
  
  // Fallback if no shaders load
  setTimeout(() => {
    if (logoEl) logoEl.classList.add('loaded');
    hideShaderLoader();
  }, 5000);

  /* Desktop GLSL shader */
  (async function () {
    if (window.innerWidth <= 900) return; // only desktop
    const canvas = document.getElementById('desktop-shader');
    if (!canvas) { console.warn('[DesktopShader] canvas not found'); return; }
    const hasGL = typeof GlslCanvas !== 'undefined';
    const loadShaderText = async () => {
      // In production, try Firestore first
      if (window.APP_ENV === 'prod' && window.getSiteProd) {
        try {
          const site = await window.getSiteProd();
          if (site.desktopShader) {
            console.log('🖥️ Desktop shader loaded from Firestore');
            return site.desktopShader;
          }
        } catch (e) {
          console.warn('Firestore desktopShader failed, trying local file:', e);
        }
      }

      // Try to load from local file (for development or fallback)
      try {
        const res = await fetch('data/desktop_shader.glsl');
        if (res.ok) {
          const shaderText = await res.text();
          console.log('🖥️ Desktop shader loaded from local file');
          return shaderText;
        }
      } catch (e) {
        console.warn('Local desktop shader file failed, trying other sources:', e);
      }

      // Fallback to API endpoint
      try {
        const res = await fetch('/api/desktopShader');
        if (res.ok) {
          console.log('🖥️ Desktop shader loaded from API');
          return await res.text();
        }
      } catch (e) { console.warn('fetch desktopShader API failed', e); }

      // Final fallback to inline shader
      const fragEl = document.getElementById('desktop-shader-code');
      if (fragEl && fragEl.textContent) {
        console.log('🖥️ Desktop shader loaded from inline script');
        return fragEl.textContent;
      }

      console.error('❌ No desktop shader source available');
      return null;
    };

    if (hasGL) {
      const shaderText = await loadShaderText();
      if (!shaderText) { console.error('No shader text available'); return; }
      const sandbox = new GlslCanvas(canvas);
      sandbox.load(shaderText);
      console.log('[DesktopShader] GLSL initialized');
      desktopShaderLoaded = true;
      checkAllShadersLoaded();
      const resize = () => { 
        const ratio = window.devicePixelRatio || 1; 
        canvas.width = canvas.clientWidth * ratio; 
        canvas.height = canvas.clientHeight * ratio; 
      };
      resize(); 
      window.addEventListener('resize', resize);
    } else {
      console.warn('[DesktopShader] GlslCanvas undefined – trying dynamic import');
      import('https://cdn.skypack.dev/glslCanvas').then(mod => {
        const Glsl = mod.default || mod.GlslCanvas || window.GlslCanvas;
        if (!Glsl) { throw new Error('glslCanvas not resolved'); }
        return loadShaderText().then(text => {
          const sandbox = new Glsl(canvas);
          sandbox.load(text);
          console.log('[DesktopShader] GLSL initialized (dynamic)');
          desktopShaderLoaded = true;
          checkAllShadersLoaded();
          const resize = () => { 
            const ratio = window.devicePixelRatio || 1; 
            canvas.width = canvas.clientWidth * ratio; 
            canvas.height = canvas.clientHeight * ratio; 
          };
          resize(); 
          window.addEventListener('resize', resize);
        });
      }).catch(err => {
        console.error('glslCanvas dynamic import failed', err);
        // Fallback 2D gradient
        const ctx = canvas.getContext('2d');
        function resize2d() { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
        resize2d(); window.addEventListener('resize', resize2d);
        function draw(t) { 
          requestAnimationFrame(draw); 
          const w = canvas.width, h = canvas.height; 
          const time = t * 0.0004; 
          const grd = ctx.createRadialGradient(w * 0.5 + Math.sin(time) * w * 0.2, h * 0.4 + Math.cos(time * 1.3) * h * 0.2, 0, w / 2, h / 2, Math.max(w, h) * 0.7); 
          const hue = (time * 40) % 360; 
          grd.addColorStop(0, `hsl(${hue},70%,55%)`); 
          grd.addColorStop(1, '#001820'); 
          ctx.fillStyle = grd; 
          ctx.fillRect(0, 0, w, h); 
        } 
        draw();
        desktopShaderLoaded = true;
        checkAllShadersLoaded();
      });
    }
  })();

  /* Mobile GLSL shader fetched from API */
  (async function () {
    if (window.innerWidth > 900) return; // only mobile
    const canvas = document.getElementById('mobile-shader');
    if (!canvas) { console.warn('[MobileShader] canvas not found'); return; }
    const hasGL = typeof GlslCanvas !== 'undefined';
    const loadShaderText = async () => {
      // In production, try Firestore first
      if (window.APP_ENV === 'prod' && window.getSiteProd) {
        try {
          const site = await window.getSiteProd();
          if (site.mobileShader) {
            return site.mobileShader;
          }
        } catch (e) {
          // On mobile, if Firestore fails, try local file immediately
          const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (isMobile) {
            try {
              const res = await fetch('data/mobile_shader.glsl');
              if (res.ok) {
                return await res.text();
              }
            } catch (localError) {
              // Continue to next fallback
            }
          }
        }
      }

      // Try to load from local file (for development or fallback)
      try {
        const res = await fetch('data/mobile_shader.glsl');
        if (res.ok) {
          return await res.text();
        }
      } catch (e) {
        // Continue to next fallback
      }

      // Fallback to API endpoint
      try {
        const res = await fetch('/api/mobileShader');
        if (res.ok) {
          return await res.text();
        }
      } catch (e) { 
        // Continue to next fallback
      }

      // Final fallback to inline shader
      const fragEl = document.getElementById('mobile-shader-code');
      if (fragEl && fragEl.textContent && fragEl.textContent.trim()) {
        return fragEl.textContent;
      }

      return null;
    };

    if (hasGL) {
      const shaderText = await loadShaderText();
      if (!shaderText) { console.error('No shader text available'); return; }
      const sandbox = new GlslCanvas(canvas);
      sandbox.load(shaderText);
      console.log('[MobileShader] GLSL initialized');
      mobileShaderLoaded = true;
      checkAllShadersLoaded();
      const resize = () => { const ratio = window.devicePixelRatio || 1; const scale = 0.5; canvas.width = canvas.clientWidth * scale * ratio; canvas.height = canvas.clientHeight * scale * ratio; };
      resize(); window.addEventListener('resize', resize);
    } else {
      console.warn('[MobileShader] GlslCanvas undefined – trying dynamic import');
      import('https://cdn.skypack.dev/glslCanvas').then(mod => {
        const Glsl = mod.default || mod.GlslCanvas || window.GlslCanvas;
        if (!Glsl) { throw new Error('glslCanvas not resolved'); }
        return loadShaderText().then(text => {
          const sandbox = new Glsl(canvas);
          sandbox.load(text);
          console.log('[MobileShader] GLSL initialized (dynamic)');
          mobileShaderLoaded = true;
          checkAllShadersLoaded();
          const resize = () => { const ratio = window.devicePixelRatio || 1; const scale = 0.5; canvas.width = canvas.clientWidth * scale * ratio; canvas.height = canvas.clientHeight * scale * ratio; };
          resize(); window.addEventListener('resize', resize);
        });
      }).catch(err => {
        console.error('glslCanvas dynamic import failed', err);
        // Fallback 2D gradient
        const ctx = canvas.getContext('2d');
        function resize2d() { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
        resize2d(); window.addEventListener('resize', resize2d);
        function draw(t) { requestAnimationFrame(draw); const w = canvas.width, h = canvas.height; const time = t * 0.0004; const grd = ctx.createRadialGradient(w * 0.5 + Math.sin(time) * w * 0.2, h * 0.4 + Math.cos(time * 1.3) * h * 0.2, 0, w / 2, h / 2, Math.max(w, h) * 0.7); const hue = (time * 40) % 360; grd.addColorStop(0, `hsl(${hue},70%,55%)`); grd.addColorStop(1, '#001820'); ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h); } draw();
        mobileShaderLoaded = true;
        checkAllShadersLoaded();
      });
    }
  })();

  /* Mobile 3D model removed: fallback to lightweight CSS aura */
});

// Update footer with environment info
document.addEventListener('DOMContentLoaded', () => {
  const envSpan = document.getElementById('environment');
  if (envSpan) {
    const env = window.APP_ENV || 'local';
    const envColors = {
      local: '#28a745',     // green
      preprod: '#ffc107',   // yellow
      prod: '#dc3545'       // red
    };

    const envNames = {
      local: 'LOCAL',
      preprod: 'PRE-PROD',
      prod: 'PRODUCTION'
    };

    envSpan.innerHTML = `ENV: <span style="color: ${envColors[env] || '#6c757d'}; font-weight: bold;">${envNames[env] || env.toUpperCase()}</span>`;
  }
});

// Performance warning functions
function showPerformanceWarning(severity, issues, metrics) {
  // Crea indicatore performance se non esiste
  let indicator = document.getElementById('performance-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'performance-indicator';
    indicator.className = 'performance-indicator';
    document.body.appendChild(indicator);
  }
  
  // Aggiorna contenuto e stile
  const fps = metrics.fps || 0;
  const frameTime = metrics.frameTime || 0;
  
  indicator.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px;">
      ${severity === 'critical' ? '🚨 CRITICO' : '⚠️ ATTENZIONE'}
    </div>
    <div>FPS: ${fps}</div>
    <div>Frame: ${frameTime.toFixed(1)}ms</div>
    <div style="font-size: 10px; opacity: 0.8;">
      ${issues.slice(0, 2).join(', ')}
    </div>
  `;
  
  indicator.className = `performance-indicator show ${severity}`;
  
  // Auto-hide dopo 5 secondi se non critico
  if (severity !== 'critical') {
    setTimeout(() => {
      if (indicator.classList.contains('show')) {
        indicator.classList.remove('show');
      }
    }, 5000);
  }
}

function hidePerformanceWarning() {
  const indicator = document.getElementById('performance-indicator');
  if (indicator) {
    indicator.classList.remove('show');
  }
}

// Debug performance (solo in development)
if (window.APP_ENV === 'local' && window.location.search.includes('debug=performance')) {
  window.debugPerformance = () => {
    if (window.performanceMonitor) {
      const metrics = window.performanceMonitor.getMetrics();
      const lagState = window.performanceMonitor.getLagState();
      console.log('📊 Performance Metrics:', metrics);
      console.log('🚨 Lag State:', lagState);
      
      // Test performance manuale
      window.performanceMonitor.testPerformance().then(result => {
        console.log('🧪 Manual Performance Test:', result);
      });
    }
  };
  
  // Log performance ogni 5 secondi in debug mode
  setInterval(() => {
    if (window.performanceMonitor) {
      const metrics = window.performanceMonitor.getMetrics();
      if (metrics.fps > 0) {
        console.log(`📊 FPS: ${metrics.fps}, Frame Time: ${metrics.frameTime.toFixed(1)}ms`);
      }
    }
  }, 5000);
}

console.log('Portfolio script loaded');



// Cleanup function for canvas video renderers
function cleanupCanvasVideos() {
  canvasVideoRenderers.forEach((renderer, id) => {
    renderer.destroy();
  });
  canvasVideoRenderers.clear();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupCanvasVideos);
window.addEventListener('beforeunload', cleanupCanvasVideos);

// Simple site data loading


// Apply site data to the page
const applySiteData = (site) => {
  try {
    // Store current site config globally for shader access
    window.currentSiteConfig = site;
    
    // Hero text
    if (site.heroText) {
      document.querySelectorAll('.fa3io-text').forEach(el => {
        el.textContent = site.heroText;
        el.classList.remove('preload');
      });
    }

    // Bio
    const aboutTextEl = document.querySelector('.about-text');
    if (aboutTextEl && site.bio) {
      aboutTextEl.textContent = site.bio;
    }

    // Version
    const versionEl = document.getElementById('version');
    if (versionEl && site.version) {
      versionEl.textContent = site.version;
    }

    // Shader URL - Apply to iframe if provided
    if (site.shaderUrl) {
      const iframe = document.getElementById('shader-iframe');
      if (iframe) {
        try {
          // Parse the URL to preserve existing parameters
          const url = new URL(site.shaderUrl);
          
          // Preserve important parameters if not already set
          if (!url.searchParams.has('gui')) url.searchParams.set('gui', 'false');
          if (!url.searchParams.has('t')) url.searchParams.set('t', '10');
          if (!url.searchParams.has('muted')) url.searchParams.set('muted', 'true');
          
          // Apply the new URL
          iframe.src = url.toString();
          console.log('🎨 Shader URL applied:', url.toString());
        } catch (err) {
          console.warn('❌ Invalid shader URL:', site.shaderUrl, err);
        }
      }
    }

    // Contacts
    const contactSection = document.getElementById('contact');
    if (contactSection && Array.isArray(site.contacts)) {
      const contactsContainer = document.createElement('div');
      contactsContainer.className = 'contacts-container';
      site.contacts.forEach(c => {
        if (c.visible === false) return;
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        let valueElement;
        if (c.value.includes('@')) {
          valueElement = `<a href="mailto:${c.value}" class="contact-link">${c.value}</a>`;
        } else if (c.value.includes('http')) {
          valueElement = `<a href="${c.value}" target="_blank" rel="noopener noreferrer" class="contact-link">${c.value}</a>`;
        } else {
          valueElement = `<span class="contact-text">${c.value}</span>`;
        }
        contactItem.innerHTML = `
          <div class="contact-info">
            <div class="contact-label">${c.label}</div>
            <div class="contact-value">${valueElement}</div>
          </div>
        `;
        contactsContainer.appendChild(contactItem);
      });
      contactSection.innerHTML = '<h2 id="contact-heading">CONTACT</h2>';
      contactSection.appendChild(contactsContainer);
    }

    // --- Hide/show sections based on status ---
    if (Array.isArray(site.sections)) {
      site.sections.forEach(s => {
        const sectionEl = document.getElementById(s.key);
        if (sectionEl) {
          if (s.status === 'hide') {
            sectionEl.style.display = 'none';
            console.log(`[HIDE] Section #${s.key} hidden (status: ${s.status})`);
          } else if (s.status === 'soon') {
            sectionEl.style.display = '';
            // Replace content with Coming Soon placeholder
            sectionEl.innerHTML = `<h2 style="color:var(--accent-color,#40e0d0);margin-bottom:32px;">${s.label || s.key} <span style='font-size:0.7em;opacity:0.7;'>(Coming Soon)</span></h2><div style='padding:48px 0;text-align:center;font-size:1.3em;color:#fff;opacity:0.7;'>🚧 Questa sezione sarà disponibile a breve!</div>`;
            console.log(`[SOON] Section #${s.key} shows Coming Soon placeholder`);
          } else {
            sectionEl.style.display = '';
            console.log(`[SHOW] Section #${s.key} shown (status: ${s.status})`);
          }
        }
        // Hide/show nav menu links
        const navLink = document.querySelector(`.menu a[href="#${s.key}"]`);
        if (navLink) {
          if (s.status === 'hide') {
            navLink.style.display = 'none';
          } else {
            navLink.style.display = '';
          }
        }
      });
      setTimeout(() => {
        site.sections.forEach(s => {
          const sectionEl = document.getElementById(s.key);
          if (sectionEl && s.status === 'hide') {
            sectionEl.style.display = 'none';
            console.log(`[FORCE HIDE] Section #${s.key} forcibly hidden (status: ${s.status})`);
          }
        });
      }, 500);
    }

  } catch (err) {
    console.error('❌ Error applying site data:', err);
  }
};

// Store current site data
let currentSiteData = null;

// Check for updates
const checkForUpdates = async () => {
  try {
    const newSiteData = await loadSiteData();

    if (currentSiteData) {
      // Simple comparison
      const hasChanges = (
        currentSiteData.heroText !== newSiteData.heroText ||
        currentSiteData.bio !== newSiteData.bio ||
        currentSiteData.version !== newSiteData.version ||
        JSON.stringify(currentSiteData.contacts) !== JSON.stringify(newSiteData.contacts)
      );

      if (hasChanges) {
        console.log('🔄 Changes detected, updating site...');
        applySiteData(newSiteData);

        // Precarica nuove anteprime canvas se ce ne sono
        setTimeout(startInitialPreload, 100);

        // Show notification
        if (currentSiteData.version !== newSiteData.version) {
          showUpdateNotification(newSiteData.version);
        } else {
          showUpdateNotification('Contenuto aggiornato');
        }
      }
      
      // Check for shader URL changes specifically
      if (currentSiteData && newSiteData && currentSiteData.shaderUrl !== newSiteData.shaderUrl) {
        console.log('🎨 Shader URL changed, updating iframe...');
        const iframe = document.getElementById('shader-iframe');
        if (iframe && newSiteData.shaderUrl) {
          try {
            const url = new URL(newSiteData.shaderUrl);
            if (!url.searchParams.has('gui')) url.searchParams.set('gui', 'false');
            if (!url.searchParams.has('t')) url.searchParams.set('t', '10');
            if (!url.searchParams.has('muted')) url.searchParams.set('muted', 'true');
            iframe.src = url.toString();
            console.log('🎨 Shader URL updated:', url.toString());
          } catch (err) {
            console.warn('❌ Invalid shader URL update:', newSiteData.shaderUrl, err);
          }
        }
      }
    }

    currentSiteData = newSiteData;

  } catch (error) {
    console.error('❌ Error checking for updates:', error);
  }
};

// Listen for admin updates
const listenForUpdates = () => {
  window.addEventListener('storage', (e) => {
    if (e.key === 'site-updated') {
      console.log('🔄 Admin update detected');
      setTimeout(checkForUpdates, 1000);
    }
  });
};

// Initialize everything
const init = async () => {
  try {
    console.log('🚀 Initializing site...');

    // Initialize Performance Monitor (versione semplificata)
    if (window.PerformanceMonitor) {
      window.performanceMonitor = new PerformanceMonitor();
      console.log('🚀 Performance Monitor inizializzato (versione semplificata)');
    }

    // Load initial data
    const siteData = await loadSiteData();
    currentSiteData = siteData;
    applySiteData(siteData);

    // Listen for updates
    listenForUpdates();

    // Check for updates once per day (24h)
    setInterval(checkForUpdates, 86400000);
    
    // Apply shader URL after initialization
    if (siteData.shaderUrl) {
      setTimeout(() => {
        const iframe = document.getElementById('shader-iframe');
        if (iframe) {
          try {
            const url = new URL(siteData.shaderUrl);
            if (!url.searchParams.has('gui')) url.searchParams.set('gui', 'false');
            if (!url.searchParams.has('t')) url.searchParams.set('t', '10');
            if (!url.searchParams.has('muted')) url.searchParams.set('muted', 'true');
            iframe.src = url.toString();
            console.log('🎨 Shader URL applied on init:', url.toString());
          } catch (err) {
            console.warn('❌ Invalid shader URL on init:', siteData.shaderUrl, err);
          }
        }
      }, 500);
    }

    // Inizializza l'observer per i canvas esistenti
    setTimeout(() => {
      if (canvasObserver) {
        const existingCanvas = document.querySelectorAll('.gallery-canvas');
        existingCanvas.forEach(canvas => {
          canvasObserver.observe(canvas);
        });
        console.log(`👁️ Observer attivo per ${existingCanvas.length} canvas esistenti`);
      }
    }, 1000);

    console.log('✅ Site initialized successfully');

  } catch (error) {
    console.error('❌ Error initializing site:', error);
  }
};

// Start initialization
init();

function normalizeSoftwareList(input) {
  if (input === undefined || input === null || input === '') {
    return [];
  }

  let raw = [];

  if (Array.isArray(input)) {
    raw = input;
  } else if (typeof input === 'string') {
    raw = input.split(/[\n,;|]/g);
  } else if (typeof input === 'number') {
    raw = [String(input)];
  } else if (typeof input === 'object') {
    if (Array.isArray(input.items)) {
      raw = input.items;
    } else if (Array.isArray(input.values)) {
      raw = input.values;
    } else if (Array.isArray(input.list)) {
      raw = input.list;
    } else {
      raw = Object.values(input);
    }
  }

  return raw
    .map(value => {
      if (value === undefined || value === null) return '';
      return String(value).trim();
    })
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index);
}

function createDetailPayload({ itemElement, data, fallbackDescription = '', fallbackTitle = '' } = {}) {
  const element = itemElement || null;
  const descriptionFromElement = element?.getAttribute?.('data-description') || '';
  const detailDescriptionFromElement = element?.getAttribute?.('data-detail-description') || '';
  const titleFromElement = element?.getAttribute?.('data-detail-title') || '';
  const softwareAttr = element?.getAttribute?.('data-software');

  const descriptionCandidates = [fallbackDescription, data?.description, descriptionFromElement].filter(value => typeof value === 'string' && value.trim().length);
  const baseDescription = descriptionCandidates.length ? descriptionCandidates[0].trim() : '';

  const detailDescriptionCandidates = [
    data?.detailDescription,
    data?.detail?.description,
    detailDescriptionFromElement
  ].filter(value => typeof value === 'string' && value.trim().length);
  const detailedText = detailDescriptionCandidates.length ? detailDescriptionCandidates[0].trim() : '';

  const softwareCandidates = [
    data?.softwareUsed ?? data?.software ?? data?.tools,
    data?.detail?.software ?? data?.detail?.tools,
    (() => {
      if (!softwareAttr) return undefined;
      try {
        return JSON.parse(softwareAttr);
      } catch (err) {
        return softwareAttr;
      }
    })()
  ];

  let softwareList = [];
  for (const candidate of softwareCandidates) {
    if (candidate === undefined) continue;
    const normalized = normalizeSoftwareList(candidate);
    if (normalized.length) {
      softwareList = normalized;
      break;
    }
  }

  const titleCandidates = [data?.detailTitle, data?.title, titleFromElement, fallbackTitle].filter(value => typeof value === 'string' && value.trim().length);
  const title = titleCandidates.length ? titleCandidates[0].trim() : '';

  const descriptionForPreview = (baseDescription || detailedText || '').trim();
  const detailText = (detailedText || descriptionForPreview).trim();

  const payload = {
    title,
    description: descriptionForPreview
  };

  if (detailText) {
    payload.detailDescription = detailText;
  }

  payload.softwareUsed = softwareList;

  return payload;
}

// --- MODERN MOBILE MODAL GALLERY LOGIC ---
function showModernModalGallery(slides, startIndex = 0, detailInput = '') {
  const removeAllDetailOverlays = () => {
    document.querySelectorAll('.description-overlay').forEach(el => {
      if (el._escHandler) {
        document.removeEventListener('keydown', el._escHandler);
      }
      el.remove();
    });
  };

  // Remove any existing modal
  document.querySelectorAll('.modern-modal-gallery').forEach(el => el.remove());
  // Remove lingering description overlays from previous openings
  removeAllDetailOverlays();

  const modal = document.createElement('div');
  modal.className = 'modern-modal-gallery';

  // Lock scroll when modal opens
  lockScroll();

  const baseDetail = typeof detailInput === 'string' ? { description: detailInput } : (detailInput || {});
  const normalizedDetail = {
    title: (baseDetail.title || '').trim(),
    description: (baseDetail.description || '').trim(),
    detailDescription: (baseDetail.detailDescription || baseDetail.fullDescription || baseDetail.description || '').trim(),
    softwareUsed: Array.isArray(baseDetail.softwareUsed)
      ? normalizeSoftwareList(baseDetail.softwareUsed)
      : normalizeSoftwareList(baseDetail.softwareUsed || baseDetail.software || baseDetail.tools)
  };

  if (!normalizedDetail.description && normalizedDetail.detailDescription) {
    normalizedDetail.description = normalizedDetail.detailDescription;
  }

  if (!normalizedDetail.detailDescription && normalizedDetail.description) {
    normalizedDetail.detailDescription = normalizedDetail.description;
  }

  // Header (solo per il pulsante di chiusura)
  const header = document.createElement('div');
  header.className = 'modern-modal-header';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modern-modal-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => {
    unlockScroll();
    removeAllDetailOverlays();
    modal.remove();
  };
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Indicators (separati e indipendenti)
  const indicators = document.createElement('div');
  indicators.className = 'modern-modal-indicators';
  modal.appendChild(indicators);

  // Carousel
  const carousel = document.createElement('div');
  carousel.className = 'modern-modal-carousel';
  modal.appendChild(carousel);

  // Footer (nascosto se solo un elemento)
  const footer = document.createElement('div');
  footer.className = 'modern-modal-footer';
  const prevBtn = document.createElement('button');
  prevBtn.className = 'modern-modal-arrow prev';
  prevBtn.innerHTML = '&#8592;';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'modern-modal-arrow next';
  nextBtn.innerHTML = '&#8594;';
  footer.appendChild(prevBtn);
  footer.appendChild(nextBtn);
  modal.appendChild(footer);

  // Se c'è solo un elemento, nascondi i controlli di navigazione
  const isSingleItem = slides.length === 1;
  if (isSingleItem) {
    footer.style.display = 'none';
  }

  document.body.appendChild(modal);

  // Slides
  let current = startIndex;
  function renderSlides() {
    carousel.innerHTML = '';
    const slide = document.createElement('div');
    slide.className = 'modern-modal-slide';
    
    // Media container
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'modern-modal-media';
    
    let el;
    const src = slides[current];
    
    // Preload del contenuto attuale e di quello successivo
    const currentAndNext = [src];
    if (slides.length > 1) {
      const nextIndex = (current + 1) % slides.length;
      currentAndNext.push(slides[nextIndex]);
    }
    // Usa sempre priority alta per i media della modal (necessari subito)
    preloadMedia(currentAndNext, 'high');
    
    // Controlla se è un video (sia URL locale che Firebase Storage)
    const isVideo = src.includes('.mp4') || src.includes('videos%2F') || src.includes('/videos/');
    
    console.log('🔍 Detecting media type:', { src, isVideo });
    
    if (isVideo) {
      // Prova a ottenere video dalla cache
      const cachedVideo = getMediaFromCache(src);
      
      if (cachedVideo) {
        // Usa video dalla cache
        el = cachedVideo.cloneNode();
        el.currentTime = 0;
        console.log('📦 Video dalla cache:', src);
      } else {
        // Crea nuovo video
        el = document.createElement('video');
        el.src = src;
        console.log('🎬 Caricamento video:', src);
      }
      
      // Configurazione video ottimizzata
      el.controls = true;
      el.muted = true; // Necessario per autoplay
      el.autoplay = true;
      el.playsInline = true;
      el.preload = 'auto';
      el.crossOrigin = 'anonymous';
      el.style.background = '#000';
      el.style.maxWidth = '100%';
      el.style.maxHeight = '100%';
      
      // Gestione errori video con retry semplificato
      let retryAttempt = 0;
      const maxRetries = 3;
      
      const handleVideoError = (e) => {
        console.error(`❌ Errore video (attempt ${retryAttempt + 1}):`, src, e);
        
        if (retryAttempt < maxRetries) {
          retryAttempt++;
          const baseDelay = Math.pow(2, retryAttempt) * 1000;
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          setTimeout(() => {
            console.log(`🔄 Retry video loading (${retryAttempt}/${maxRetries}):`, src);
            el.src = src; // Ricarica il video
          }, delay);
        } else {
          // Fallback finale
          const fallback = document.createElement('div');
          fallback.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e, #2d1b45);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 20px;
            border-radius: 8px;
            max-width: 100%;
            max-height: 100%;
            font-family: 'Montserrat', Arial, sans-serif;
          `;
          fallback.innerHTML = `
            <div>
              <div style="font-size: 3em; margin-bottom: 16px;">🎬</div>
              <div style="font-size: 1.2em; margin-bottom: 8px;">Video non disponibile</div>
              <div style="font-size: 0.9em; opacity: 0.7;">Riprova più tardi</div>
            </div>
          `;
          el.parentNode.replaceChild(fallback, el);
        }
      };
      
      el.addEventListener('error', handleVideoError);
      
      // Tentativo di play automatico con gestione errori
      el.addEventListener('loadedmetadata', () => {
        el.play().catch(err => {
          console.warn('⚠️ Autoplay fallito (normale su alcuni browser):', err);
          // Aggiungi un pulsante play se l'autoplay fallisce
          if (!el.controls) {
            el.controls = true;
            console.log('🎮 Controls abilitati per il video');
          }
        });
      });
      
    } else {
      // Gestione immagini con lazy loading
      const cachedImage = getMediaFromCache(src);
      
      if (cachedImage) {
        // Usa immagine dalla cache
        el = cachedImage.cloneNode();
        console.log('📦 Immagine dalla cache:', src);
      } else {
        // Crea nuova immagine
        el = document.createElement('img');
        el.src = src;
        console.log('🖼️ Caricamento immagine:', src);
      }
      
      el.alt = '';
      el.style.background = '#000';
      el.style.maxWidth = '100%';
      el.style.maxHeight = '100%';
      el.style.objectFit = 'contain';
      
      // Gestione errori immagine con retry semplificato
      let imageRetryAttempt = 0;
      const maxImageRetries = 3;
      
      const handleImageError = (e) => {
        console.error(`❌ Errore immagine (attempt ${imageRetryAttempt + 1}):`, src, e);
        
        if (imageRetryAttempt < maxImageRetries) {
          imageRetryAttempt++;
          const baseDelay = Math.pow(2, imageRetryAttempt) * 1000;
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          setTimeout(() => {
            console.log(`🔄 Retry image loading (${imageRetryAttempt}/${maxImageRetries}):`, src);
            el.src = src; // Ricarica l'immagine
          }, delay);
        } else {
          // Fallback finale per immagini
          const fallback = document.createElement('div');
          fallback.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e, #2d1b45);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 20px;
            border-radius: 8px;
            max-width: 100%;
            max-height: 100%;
            font-family: 'Montserrat', Arial, sans-serif;
          `;
          fallback.innerHTML = `
            <div>
              <div style="font-size: 3em; margin-bottom: 16px;">🖼️</div>
              <div style="font-size: 1.2em; margin-bottom: 8px;">Immagine non disponibile</div>
              <div style="font-size: 0.9em; opacity: 0.7;">Riprova più tardi</div>
            </div>
          `;
          el.parentNode.replaceChild(fallback, el);
        }
      };
      
      el.addEventListener('error', handleImageError);
    }
    mediaContainer.appendChild(el);
    slide.appendChild(mediaContainer);
    
    const previewSourceText = normalizedDetail.description || '';
    const fullDetailText = normalizedDetail.detailDescription || '';
    const hasSoftware = Array.isArray(normalizedDetail.softwareUsed) && normalizedDetail.softwareUsed.length > 0;
    const combinedPreviewText = (previewSourceText || fullDetailText || '').trim();
    const hasPanelContent = Boolean(fullDetailText) || hasSoftware;
    const maxPreviewLength = 120;
    const isLongPreview = combinedPreviewText.length > maxPreviewLength;
    const previewText = combinedPreviewText
      ? (isLongPreview ? `${combinedPreviewText.substring(0, maxPreviewLength).trimEnd()}…` : combinedPreviewText)
      : '';

    const showPreviewSection = Boolean(previewText) || hasPanelContent;

    const openDetailPanel = () => {
      if (!hasPanelContent && !combinedPreviewText) return;

      removeAllDetailOverlays();

      const overlay = document.createElement('div');
      overlay.className = 'description-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      const panel = document.createElement('div');
      panel.className = 'description-panel';
      panel.setAttribute('role', 'document');
      panel.setAttribute('tabindex', '-1');

      const panelHeader = document.createElement('div');
      panelHeader.className = 'description-panel-header';

      const panelTitle = document.createElement('h3');
      panelTitle.className = 'description-panel-title';
      panelTitle.textContent = normalizedDetail.title || 'Scheda progetto';

      const closePanelBtn = document.createElement('button');
      closePanelBtn.className = 'description-panel-close';
      closePanelBtn.innerHTML = '&times;';
      closePanelBtn.setAttribute('aria-label', 'Chiudi scheda di dettaglio');

      panelHeader.appendChild(panelTitle);
      panelHeader.appendChild(closePanelBtn);
      panel.appendChild(panelHeader);

      const panelContent = document.createElement('div');
      panelContent.className = 'description-panel-content';

      if (fullDetailText && fullDetailText.trim().length) {
        const textBlock = document.createElement('div');
        textBlock.className = 'description-panel-text';

        const paragraphs = fullDetailText.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);
        const lines = paragraphs.length ? paragraphs : [fullDetailText.trim()];

        lines.forEach(paragraphText => {
          const paragraph = document.createElement('p');
          paragraph.textContent = paragraphText;
          textBlock.appendChild(paragraph);
        });

        panelContent.appendChild(textBlock);
      }

      if (hasSoftware) {
        const softwareSection = document.createElement('div');
        softwareSection.className = 'description-panel-software';

        const softwareTitle = document.createElement('h4');
        softwareTitle.className = 'description-panel-subtitle';
        softwareTitle.textContent = 'Software utilizzati';

        const softwareListEl = document.createElement('ul');
        softwareListEl.className = 'software-chip-list';

        normalizedDetail.softwareUsed.forEach(tool => {
          const chip = document.createElement('li');
          chip.className = 'software-chip';
          chip.textContent = tool;
          softwareListEl.appendChild(chip);
        });

        softwareSection.appendChild(softwareTitle);
        softwareSection.appendChild(softwareListEl);
        panelContent.appendChild(softwareSection);
      }

      if (!panelContent.childElementCount && combinedPreviewText) {
        const fallbackText = document.createElement('p');
        fallbackText.className = 'description-panel-text';
        fallbackText.textContent = combinedPreviewText;
        panelContent.appendChild(fallbackText);
      }

      panel.appendChild(panelContent);
      overlay.appendChild(panel);

      const previouslyFocused = document.activeElement;

      const closePanel = () => {
        overlay.classList.add('closing');
        document.removeEventListener('keydown', handleEsc);
        overlay._escHandler = null;
        setTimeout(() => {
          overlay.remove();
          if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            previouslyFocused.focus();
          }
        }, 220);
      };

      const handleEsc = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closePanel();
        }
      };

      closePanelBtn.addEventListener('click', closePanel);
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          closePanel();
        }
      });

      document.addEventListener('keydown', handleEsc);
      overlay._escHandler = handleEsc;
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.classList.add('active');
        panel.focus({ preventScroll: true });
      });
    };

    if (showPreviewSection) {
      const descriptionElement = document.createElement('div');
      descriptionElement.className = 'modern-modal-description';

      const textElement = document.createElement('span');
      textElement.className = 'description-text';
      if (previewText) {
        textElement.textContent = previewText;
      } else {
        textElement.textContent = 'Scopri i dettagli del progetto';
        textElement.classList.add('description-text--placeholder');
      }
      descriptionElement.appendChild(textElement);

      if (hasPanelContent) {
        const expandButton = document.createElement('button');
        expandButton.type = 'button';
        expandButton.className = 'description-expand-btn';
        expandButton.textContent = 'Leggi di più';
        expandButton.setAttribute('aria-label', 'Apri scheda dettagli progetto');
        expandButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          openDetailPanel();
        });
        descriptionElement.appendChild(expandButton);
      }

      slide.appendChild(descriptionElement);
    }
    
    carousel.appendChild(slide);
    // Update indicators (solo se più di un elemento)
    indicators.innerHTML = '';
    if (!isSingleItem) {
      for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === current ? ' active' : '');
        indicators.appendChild(dot);
      }
    }
    // Update arrows
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === slides.length - 1;
  }

  function goTo(idx) {
    if (idx < 0 || idx >= slides.length) return;
    current = idx;
    renderSlides();
  }
  prevBtn.onclick = () => goTo(current - 1);
  nextBtn.onclick = () => goTo(current + 1);

  // Swipe support (solo se più di un elemento)
  if (!isSingleItem) {
    let touchStartX = null;
    carousel.addEventListener('touchstart', e => {
      if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
    });
    carousel.addEventListener('touchend', e => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx > 40) goTo(current - 1);
      else if (dx < -40) goTo(current + 1);
      touchStartX = null;
    });
  }

  // Keyboard navigation
  modal.tabIndex = -1;
  modal.focus();
  modal.addEventListener('keydown', e => {
    if (!isSingleItem && e.key === 'ArrowLeft') goTo(current - 1);
    if (!isSingleItem && e.key === 'ArrowRight') goTo(current + 1);
    if (e.key === 'Escape') {
      removeAllDetailOverlays();
      unlockScroll();
      modal.remove();
    }
  });

  renderSlides();
}

// --- Collega la moderna modal gallery ai canvas con galleria su mobile ---
// Cerca i canvas che aprono una galleria (modalGallery) e collega l'handler mobile
function enableModernMobileCanvasGallery() {
  if (window.innerWidth > 900) return; // solo mobile/tablet
  document.querySelectorAll('.gallery-item').forEach(item => {
    if (item._modernModalBound) return;
    item._modernModalBound = true;
    item.addEventListener('click', function (e) {
      if (!item.hasAttribute('data-modal-gallery')) return;
      console.log('[MODERN MODAL] Click intercettato su mobile, nuova UI attiva!');
      e.preventDefault();
      e.stopImmediatePropagation(); // BLOCCA TUTTI GLI ALTRI HANDLER
      const slides = JSON.parse(item.getAttribute('data-modal-gallery'));
      const fallbackTitle = item.getAttribute('data-detail-title') || item.querySelector('.gallery-title')?.textContent || '';
      const detail = createDetailPayload({
        itemElement: item,
        data: null,
        fallbackDescription: item.getAttribute('data-description') || '',
        fallbackTitle
      });
      showModernModalGallery(slides, 0, detail);
    }, true); // true = capture mode
  });
}

document.addEventListener('DOMContentLoaded', enableModernMobileCanvasGallery);

// Carica immediatamente le sezioni navbar per evitare lag
(function() {
  // Funzione helper per aggiornare label e heading
  function updateSectionLabels(sections) {
    if (Array.isArray(sections)) {
      sections.forEach(sec => {
        // Aggiorna il testo del link di navigazione
        const navLink = document.querySelector(`.menu a[data-section-key="${sec.key}"]`);
        if (navLink) {
          navLink.textContent = sec.label;
          navLink.setAttribute('aria-label', `Vai alla sezione ${sec.label}`);
        }
        // Aggiorna il testo dell'heading della sezione
        const heading = document.querySelector(`#${sec.key}-heading[data-section-key="${sec.key}"]`);
        if (heading) {
          heading.textContent = sec.label;
        }
      });
    }
  }

  // Carica immediatamente i dati delle sezioni (non aspettare DOMContentLoaded)
  const loadSiteData = async () => {
    try {
      let siteData;
      if (window.APP_ENV === 'prod' && typeof window.getSiteProd === 'function') {
        // Produzione: Firestore con timeout ridotto
        siteData = await Promise.race([
          window.getSiteProd(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
      } else {
        // Sviluppo/Preprod: file statico
        const response = await fetch('/data/site.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        siteData = await response.json();
      }
      updateSectionLabels(siteData.sections);
      console.log('✅ Sezioni navbar caricate immediatamente');
    } catch (err) {
      console.warn('⚠️ Fallback sezioni navbar:', err);
      // Fallback con sezioni predefinite
      const fallbackSections = [
        { key: 'vfx', label: 'VFX' },
        { key: 'art3d', label: '3D artworks' },
        { key: 'interactive', label: 'Interactive' }
      ];
      updateSectionLabels(fallbackSections);
    }
  };

  // Avvia il caricamento immediatamente
  loadSiteData();
})();

document.addEventListener('DOMContentLoaded', () => {
  // Inizializza audio site-name
  initSiteNameAudio();
});

// Funzioni di test per qualità GLSL
window.testGLSLHigh = function() {
  if (window.performanceMonitor) {
    window.performanceMonitor.testGLSLQuality('high');
  }
};

window.testGLSLMedium = function() {
  if (window.performanceMonitor) {
    window.performanceMonitor.testGLSLQuality('medium');
  }
};

window.testGLSLLow = function() {
  if (window.performanceMonitor) {
    window.performanceMonitor.testGLSLQuality('low');
  }
};

// Debug: mostra stato performance
window.showPerformanceStatus = function() {
  if (window.performanceMonitor) {
    console.log('📊 Stato Performance:', window.performanceMonitor.getStatus());
  }
};