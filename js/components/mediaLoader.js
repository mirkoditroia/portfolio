import { PERFORMANCE_CONFIG, mediaCache, preloadQueue } from './performanceConfig.js';

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

export function preloadMedia(urls, priority = 'normal') {
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

// Preload intelligente delle immagini visibili all'avvio
export function startInitialPreload(galleries) {
  // 1. Preload solo immagini visibili nel DOM (non lazy)
  const visibleImages = document.querySelectorAll('img[src]:not([data-lazy])');
  const domImages = Array.from(visibleImages).map(img => img.src);
  
  // 2. Preload solo le prime 3 immagini di anteprima dei canvas (priorità alta)
  const canvasThumbnails = [];
  
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
