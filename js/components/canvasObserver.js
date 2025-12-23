import { PERFORMANCE_CONFIG } from './performanceConfig.js';

let canvasObserver = null;

// Funzione per caricare il contenuto del canvas quando diventa visibile
// NOTA: Deve essere definita o importata dove serve. Per ora la passiamo come callback o la assumiamo globale.
// In un refactoring completo, `loadCanvasContent` dovrebbe essere esportata da un modulo `canvasRenderer.js`
// Per questo step intermedio, useremo un approccio a callback.

export function initCanvasObserver(loadCallback) {
  if (canvasObserver) return;
  
  canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const canvas = entry.target;
        if (loadCallback) loadCallback(canvas);
        canvasObserver.unobserve(canvas); // Carica una sola volta
      }
    });
  }, { 
    threshold: PERFORMANCE_CONFIG.lazyThreshold,
    rootMargin: '50px' // Inizia a caricare 50px prima che sia visibile
  });
  
  console.log('👁️ Canvas observer inizializzato');
}

export function reinitializeCanvasObserver(loadCallback) {
  // Rimuovi observer esistente se presente
  if (canvasObserver) {
    canvasObserver.disconnect();
    canvasObserver = null;
  }
  
  // Reinizializza l'observer
  initCanvasObserver(loadCallback);
  
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

export function forceReloadVisibleCanvas(loadCallback) {
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
      if (loadCallback) loadCallback(canvas);
      reloadedCount++;
    }
  });
  
  console.log(`🔄 Forzato ricaricamento di ${reloadedCount} canvas visibili`);
}

export function setupVisibilityListeners(loadCallback) {
  // Event listener per cambio scheda - reinizializza gli observer quando si torna alla scheda
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // La scheda è diventata visibile - reinizializza gli observer dopo un breve delay
      setTimeout(() => {
        console.log('🔄 Scheda tornata visibile - reinizializzazione observer canvas');
        reinitializeCanvasObserver(loadCallback);
      }, 100);
    }
  });

  // Event listener per focus della finestra - backup per il cambio scheda
  window.addEventListener('focus', () => {
    setTimeout(() => {
      console.log('🔄 Finestra tornata in focus - reinizializzazione observer canvas');
      reinitializeCanvasObserver(loadCallback);
    }, 100);
  });
}
