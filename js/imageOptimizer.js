/**
 * Image Optimizer - Lazy Loading con supporto WebP/AVIF e responsive images
 * Gestisce il caricamento ottimizzato delle immagini con fallback
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      lazyClass: 'lazy-image',
      loadingClass: 'loading',
      loadedClass: 'loaded',
      errorClass: 'error',
      enableWebP: true,
      enableAVIF: true,
      ...options
    };
    
    this.observer = null;
    this.formatSupport = {
      webp: false,
      avif: false
    };
    
    this.init();
  }

  async init() {
    // Controlla supporto formati
    await this.checkFormatSupport();
    
    // Inizializza Intersection Observer
    this.initObserver();
    
    // Trova e osserva immagini lazy
    this.observeImages();
    
    console.log('🖼️ ImageOptimizer inizializzato');
    console.log('📊 Supporto WebP:', this.formatSupport.webp);
    console.log('📊 Supporto AVIF:', this.formatSupport.avif);
  }

  async checkFormatSupport() {
    // Controlla supporto WebP
    if (this.options.enableWebP) {
      this.formatSupport.webp = await this.canUseFormat('webp');
    }
    
    // Controlla supporto AVIF
    if (this.options.enableAVIF) {
      this.formatSupport.avif = await this.canUseFormat('avif');
    }
  }

  canUseFormat(format) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      // Data URL per test formato
      const testImages = {
        webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      };
      
      img.src = testImages[format];
    });
  }

  initObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback per browser non supportati
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold
    });
  }

  observeImages() {
    const lazyImages = document.querySelectorAll(`.${this.options.lazyClass}`);
    
    lazyImages.forEach(img => {
      if (this.observer) {
        this.observer.observe(img);
      } else {
        // Fallback immediato se Observer non disponibile
        this.loadImage(img);
      }
    });
    
    console.log(`🔍 Osservando ${lazyImages.length} immagini lazy`);
  }

  async loadImage(img) {
    img.classList.add(this.options.loadingClass);
    
    try {
      const optimizedSrc = await this.getOptimizedSrc(img);
      
      // Precarica immagine
      const preloader = new Image();
      
      preloader.onload = () => {
        img.src = optimizedSrc;
        img.classList.remove(this.options.loadingClass);
        img.classList.add(this.options.loadedClass);

        /* Se l'immagine fa parte di una slide Swiper, aggiorna il layout per evitare tagli */
        const swiperContainer = img.closest('.swiper');
        if (swiperContainer && swiperContainer.swiper) {
          swiperContainer.swiper.update();
        }
        
        // Rimuovi attributi lazy
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        
        console.log(`✅ Immagine caricata: ${optimizedSrc}`);
      };
      
      preloader.onerror = () => {
        this.handleImageError(img);
      };
      
      preloader.src = optimizedSrc;
      
    } catch (error) {
      console.error('❌ Errore caricamento immagine:', error);
      this.handleImageError(img);
    }
  }

  async getOptimizedSrc(img) {
    const dataSrc = img.getAttribute('data-src');
    const imageName = this.extractImageName(dataSrc);

    // Seleziona formato in ordine di preferenza disponibile
    const formatPriorities = [];
    if (this.formatSupport.avif) formatPriorities.push('avif');
    if (this.formatSupport.webp) formatPriorities.push('webp');
    formatPriorities.push('jpeg');

    const size = this.getOptimalSize(img);

    for (const fmt of formatPriorities) {
      const candidate = `images/optimized/${imageName}-${size}.${fmt}`;
      if (await this.imageExists(candidate)) {
        return candidate;
      }
    }

    // Fallback all'originale senza ulteriori tentativi
    return dataSrc;
  }

  extractImageName(src) {
    // Ottieni il nome file (senza path) e rimuovi SOLTANTO l'ultima estensione
    // Esempio: rhythm_v004.karmarendersettings.1052.png → rhythm_v004.karmarendersettings.1052
    const filename = src.split('/').pop();
    return filename.replace(/\.[^/.]+$/, '');
  }

  getOptimalSize(img) {
    const containerWidth = img.parentElement.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = containerWidth * dpr;
    
    // Scegli dimensione più vicina
    if (targetWidth <= 400) return 'small';
    if (targetWidth <= 800) return 'medium';
    if (targetWidth <= 1200) return 'large';
    return 'xlarge';
  }

  getBestFormat() {
    // Priorità: AVIF > WebP > JPEG
    if (this.formatSupport.avif) return 'avif';
    if (this.formatSupport.webp) return 'webp';
    return 'jpeg';
  }

  imageExists(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  // requestServerGeneration rimosso – mantenuto solo se servirà in futuro

  handleImageError(img) {
    img.classList.remove(this.options.loadingClass);
    img.classList.add(this.options.errorClass);
    
    // Fallback all'immagine originale
    const originalSrc = img.getAttribute('data-src');
    if (originalSrc && img.src !== originalSrc) {
      img.src = originalSrc;
      console.log(`🔄 Fallback all'originale: ${originalSrc}`);
    }
  }

  loadAllImages() {
    // Carica tutte le immagini immediatamente (fallback)
    const lazyImages = document.querySelectorAll(`.${this.options.lazyClass}`);
    lazyImages.forEach(img => this.loadImage(img));
  }

  // Metodo per aggiungere nuove immagini dinamicamente
  addImages(images) {
    images.forEach(img => {
      if (this.observer) {
        this.observer.observe(img);
      } else {
        this.loadImage(img);
      }
    });
  }

  // Cleanup
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Utility per creare immagini responsive
function createResponsiveImage(imageName, alt = '', className = '') {
  const img = document.createElement('img');
  
  // Attributi base
  img.className = `lazy-image ${className}`.trim();
  img.alt = alt;
  img.loading = 'lazy'; // Lazy loading nativo come fallback
  
  // Placeholder durante caricamento
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD4KICA8L3N2Zz4=';
  
  // Data attributes per lazy loading
  img.setAttribute('data-src', `images/${imageName}`);
  
  return img;
}

// Utility per creare picture element con più formati
function createPictureElement(imageName, alt = '', sizes = '(max-width: 768px) 100vw, 50vw') {
  const picture = document.createElement('picture');
  
  // Source per AVIF
  const avifSource = document.createElement('source');
  avifSource.type = 'image/avif';
  avifSource.setAttribute('data-srcset', `
    images/optimized/${imageName}-small.avif 400w,
    images/optimized/${imageName}-medium.avif 800w,
    images/optimized/${imageName}-large.avif 1200w,
    images/optimized/${imageName}-xlarge.avif 1920w
  `);
  avifSource.sizes = sizes;
  
  // Source per WebP
  const webpSource = document.createElement('source');
  webpSource.type = 'image/webp';
  webpSource.setAttribute('data-srcset', `
    images/optimized/${imageName}-small.webp 400w,
    images/optimized/${imageName}-medium.webp 800w,
    images/optimized/${imageName}-large.webp 1200w,
    images/optimized/${imageName}-xlarge.webp 1920w
  `);
  webpSource.sizes = sizes;
  
  // Img fallback
  const img = createResponsiveImage(`${imageName}.jpg`, alt);
  img.setAttribute('data-srcset', `
    images/optimized/${imageName}-small.jpeg 400w,
    images/optimized/${imageName}-medium.jpeg 800w,
    images/optimized/${imageName}-large.jpeg 1200w,
    images/optimized/${imageName}-xlarge.jpeg 1920w
  `);
  img.sizes = sizes;
  
  picture.appendChild(avifSource);
  picture.appendChild(webpSource);
  picture.appendChild(img);
  
  return picture;
}

// Esporta per uso globale
window.ImageOptimizer = ImageOptimizer;
window.createResponsiveImage = createResponsiveImage;
window.createPictureElement = createPictureElement;

export { ImageOptimizer, createResponsiveImage, createPictureElement }; 