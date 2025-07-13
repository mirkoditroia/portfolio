// --- Handler unico per tutti i canvas con galleria ---
function handleGalleryCanvasGalleryClick(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  const item = e.currentTarget;
  if (!item.hasAttribute('data-modal-gallery')) return;
  const slides = JSON.parse(item.getAttribute('data-modal-gallery'));
  const description = item.getAttribute('data-description') || '';
  // UI unificata per tutti i dispositivi
  showModernModalGallery(slides, 0, description);
}

// Rimuovi tutti i vecchi handler e aggiungi solo quello giusto
// (da eseguire dopo che le gallery sono state inizializzate)
document.querySelectorAll('.gallery-item').forEach(item => {
  if (item.hasAttribute('data-modal-gallery')) {
    const clone = item.cloneNode(true);
    item.parentNode.replaceChild(clone, item); // rimuove tutti i vecchi event listener
    clone.addEventListener('click', handleGalleryCanvasGalleryClick, true);
  }
});

// Funzione rimossa - ora tutti i canvas usano showModernModalGallery per UI unificata

// === NAVBAR: CODICE SEMPLICE E FUNZIONANTE ===

// Inizializza tutto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
  initNavbar();
});

function initNavbar() {
  // 1. Menu toggle (hamburger) per mobile
  const menuToggle = document.getElementById('menuToggle');
  const menu = document.querySelector('.menu');
  
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', function() {
      menu.classList.toggle('active');
      console.log('Menu toggle clicked, active:', menu.classList.contains('active'));
    });
  }
  
  // 2. Smooth scroll per i link del menu (event delegation)
  document.addEventListener('click', function(e) {
    const link = e.target.closest('.menu a[href^="#"]');
    if (!link) return;
    
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Calcola offset per il banner fisso
      const banner = document.querySelector('.banner');
      const bannerHeight = banner ? banner.offsetHeight : 0;
      
      // Scroll alla sezione
      const targetPosition = targetElement.offsetTop - bannerHeight - 20;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      console.log('Scrolling to:', targetId, 'position:', targetPosition);
      
      // Chiudi menu mobile
      if (window.innerWidth <= 900) {
        const menu = document.querySelector('.menu');
        if (menu) menu.classList.remove('active');
      }
    } else {
      console.log('Target not found:', targetId);
    }
  });
} 