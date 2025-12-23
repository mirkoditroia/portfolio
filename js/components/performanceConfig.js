export const PERFORMANCE_CONFIG = {
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

// Cache per media files con TTL (Time To Live)
export const mediaCache = new Map();
export const preloadQueue = new Set();

export function getMediaFromCache(url) {
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

export function cleanupMediaCache(canvasVideoRenderers) {
  const now = Date.now();
  const maxAge = PERFORMANCE_CONFIG.cacheTTL;
  
  for (const [url, cached] of mediaCache.entries()) {
    if (now - cached.loaded > maxAge) {
      console.log('🗑️ Removing old cached media:', url);
      mediaCache.delete(url);
    }
  }
  
  // Pulizia anche dei renderer dei canvas
  if (canvasVideoRenderers) {
    for (const [id, renderer] of canvasVideoRenderers.entries()) {
      if (renderer && !renderer.isVisible) {
        renderer.destroy();
        canvasVideoRenderers.delete(id);
      }
    }
  }
}
