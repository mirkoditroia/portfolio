/* ============================================
   CAROUSEL MODULE - Gallery Swiper Management
   ============================================ */

import { CONFIG, isMobile } from './config.js';

// Store all Swiper instances
const swiperInstances = new Map();

/**
 * Initialize a gallery carousel
 * @param {HTMLElement} container - The .gallery-carousel element
 * @param {Object} options - Additional Swiper options
 * @returns {Swiper} The Swiper instance
 */
export function initCarousel(container, options = {}) {
  if (!container) return null;
  
  const swiperContainer = container.querySelector('.swiper') || container;
  const existingSwiper = swiperInstances.get(container);
  
  if (existingSwiper) {
    existingSwiper.destroy(true, true);
  }
  
  const swiper = new Swiper(swiperContainer, {
    ...CONFIG.swiper,
    navigation: {
      nextEl: container.querySelector('.swiper-button-next'),
      prevEl: container.querySelector('.swiper-button-prev')
    },
    ...options,
    on: {
      init: (swiper) => {
        updateNavigationState(swiper);
        options.onInit?.(swiper);
      },
      slideChange: (swiper) => {
        updateNavigationState(swiper);
        options.onSlideChange?.(swiper);
      },
      ...options.on
    }
  });
  
  swiperInstances.set(container, swiper);
  return swiper;
}

/**
 * Update navigation button states
 */
function updateNavigationState(swiper) {
  const { prevEl, nextEl } = swiper.navigation;
  
  if (prevEl) {
    prevEl.classList.toggle('swiper-button-disabled', swiper.isBeginning);
  }
  
  if (nextEl) {
    nextEl.classList.toggle('swiper-button-disabled', swiper.isEnd);
  }
}

/**
 * Create gallery item HTML
 * @param {Object} item - Gallery item data
 * @param {string} sectionId - Section identifier
 * @param {number} index - Item index
 * @returns {HTMLElement} The gallery item element
 */
export function createGalleryItem(item, sectionId, index) {
  const el = document.createElement('div');
  el.className = 'gallery-item swiper-slide';
  el.setAttribute('role', 'listitem');
  el.setAttribute('tabindex', '0');
  el.dataset.index = index;
  el.dataset.section = sectionId;
  
  // Create media element (canvas for video, img for static)
  let mediaHtml;
  
  if (item.video || item.type === 'canvas') {
    const canvasId = `${sectionId}-canvas-${index}`;
    mediaHtml = `
      <canvas 
        class="gallery-canvas" 
        id="${canvasId}"
        data-video="${item.video || ''}"
        data-image-src="${item.src || item.modalImage || ''}"
        aria-label="${item.title || 'Gallery media'}"
      ></canvas>
    `;
  } else {
    mediaHtml = `
      <img 
        class="gallery-img" 
        src="${item.src || item.modalImage || ''}" 
        alt="${item.title || 'Gallery image'}"
        loading="lazy"
        decoding="async"
      />
    `;
  }
  
  el.innerHTML = `
    ${mediaHtml}
    <h3 class="gallery-title">${item.title || ''}</h3>
  `;
  
  return el;
}

/**
 * Populate a section with gallery items
 * @param {string} sectionId - Section ID (e.g., 'vfx', 'art3d')
 * @param {Array} items - Array of gallery items
 * @param {Function} onItemClick - Click handler for items
 */
export function populateGallery(sectionId, items, onItemClick) {
  const track = document.getElementById(`${sectionId}-track`);
  if (!track || !items?.length) return;
  
  // Clear existing items
  track.innerHTML = '';
  
  // Create and append items
  items.forEach((item, index) => {
    const itemEl = createGalleryItem(item, sectionId, index);
    
    // Add click handler
    itemEl.addEventListener('click', () => {
      console.log('[Carousel] Item clicked:', { item: item.title, index, sectionId });
      onItemClick?.(item, index, sectionId);
    });
    
    // Add keyboard handler
    itemEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        console.log('[Carousel] Item keyboard activated:', { item: item.title, index, sectionId });
        onItemClick?.(item, index, sectionId);
      }
    });
    
    track.appendChild(itemEl);
  });
  
  // Initialize carousel
  const container = track.closest('.gallery-carousel');
  if (container) {
    initCarousel(container);
  }
}

/**
 * Get Swiper instance for a container
 */
export function getSwiper(container) {
  return swiperInstances.get(container);
}

/**
 * Destroy all Swiper instances
 */
export function destroyAllCarousels() {
  swiperInstances.forEach((swiper) => {
    swiper.destroy(true, true);
  });
  swiperInstances.clear();
}

/**
 * Refresh all carousels (useful after resize)
 */
export function refreshCarousels() {
  swiperInstances.forEach((swiper) => {
    swiper.update();
  });
}

// Handle resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(refreshCarousels, 250);
});
