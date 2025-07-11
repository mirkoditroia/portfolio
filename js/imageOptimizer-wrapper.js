// Image Optimizer Wrapper Module
// Provides responsive image loading with fallbacks

// Check if imageOptimizer.js exists and load it
async function loadImageOptimizer() {
  try {
    const { createResponsiveImage, initLazyLoading } = await import('./imageOptimizer.js');
    
    // Make functions globally available
    window.createResponsiveImage = createResponsiveImage;
    window.initLazyLoading = initLazyLoading;
    
    // Initialize lazy loading
    if (typeof initLazyLoading === 'function') {
      initLazyLoading();
    }
    
    console.log('✅ Image optimizer loaded successfully');
  } catch (error) {
    console.warn('⚠️ Image optimizer not available, using fallback:', error.message);
    
    // Provide fallback functions
    window.createResponsiveImage = function(filename, alt, className = 'gallery-img') {
      const img = document.createElement('img');
      img.className = className;
      img.src = `images/${filename}`;
      img.alt = alt;
      img.loading = 'lazy';
      
      img.onerror = () => {
        img.style.display = 'none';
        console.warn('Image not found:', img.src);
      };
      
      return img;
    };
    
    window.initLazyLoading = function() {
      // Simple fallback lazy loading
      const images = document.querySelectorAll('img[loading="lazy"]');
      images.forEach(img => {
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                }
                observer.unobserve(img);
              }
            });
          });
          observer.observe(img);
        }
      });
    };
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadImageOptimizer);
} else {
  loadImageOptimizer();
}

export { loadImageOptimizer }; 