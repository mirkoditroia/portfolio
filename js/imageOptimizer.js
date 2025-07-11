// Image Optimizer Module
// Provides responsive image loading and optimization

// Check if image manifest exists
let imageManifest = null;

async function loadImageManifest() {
  try {
    const response = await fetch('images/optimized/image-manifest.json');
    if (response.ok) {
      imageManifest = await response.json();
      console.log('✅ Image manifest loaded');
    }
  } catch (error) {
    console.warn('⚠️ Image manifest not available:', error.message);
  }
}

// Create responsive image with multiple sources
export function createResponsiveImage(filename, alt, className = 'gallery-img') {
  const img = document.createElement('img');
  img.className = className;
  img.alt = alt;
  img.loading = 'lazy';
  
  // Check if optimized versions exist
  if (imageManifest && imageManifest[filename]) {
    const optimized = imageManifest[filename];
    
    // Create picture element for responsive images
    const picture = document.createElement('picture');
    
    // Add WebP sources
    if (optimized.webp) {
      Object.entries(optimized.webp).forEach(([size, src]) => {
        const source = document.createElement('source');
        source.type = 'image/webp';
        source.srcset = src;
        source.media = getSizeMediaQuery(size);
        picture.appendChild(source);
      });
    }
    
    // Add AVIF sources (if available)
    if (optimized.avif) {
      Object.entries(optimized.avif).forEach(([size, src]) => {
        const source = document.createElement('source');
        source.type = 'image/avif';
        source.srcset = src;
        source.media = getSizeMediaQuery(size);
        picture.appendChild(source);
      });
    }
    
    // Fallback to original or JPEG
    img.src = optimized.jpeg?.medium || optimized.jpeg?.large || `images/${filename}`;
    picture.appendChild(img);
    
    return picture;
  }
  
  // Fallback to original image
  img.src = `images/${filename}`;
  
  img.onerror = () => {
    img.style.display = 'none';
    console.warn('Image not found:', img.src);
  };
  
  return img;
}

// Get media query for image size
function getSizeMediaQuery(size) {
  switch (size) {
    case 'small': return '(max-width: 480px)';
    case 'medium': return '(max-width: 768px)';
    case 'large': return '(max-width: 1024px)';
    case 'xlarge': return '(min-width: 1025px)';
    default: return '';
  }
}

// Initialize lazy loading with intersection observer
export function initLazyLoading() {
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported, skipping lazy loading');
    return;
  }
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // Load the image if it has a data-src attribute
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        
        // Stop observing this image
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });
  
  // Observe all images with loading="lazy"
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    imageObserver.observe(img);
  });
  
  console.log('✅ Lazy loading initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadImageManifest();
    initLazyLoading();
  });
} else {
  loadImageManifest();
  initLazyLoading();
} 