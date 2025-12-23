/* ============================================
   MODAL MODULE - Gallery Modal Viewer
   ============================================ */

import { CONFIG } from './config.js';

let currentModal = null;
let currentGallery = null;
let currentIndex = 0;
let gallerySection = null; // Track which section the gallery belongs to

/**
 * Open the gallery modal
 * @param {Array} gallery - Array of media items
 * @param {number} startIndex - Initial slide index
 * @param {Object} options - Additional options (section, skipHistoryPush)
 */
export function openModal(gallery, startIndex = 0, options = {}) {
  console.log('[ModalModule] openModal called:', { 
    galleryLength: gallery?.length, 
    startIndex, 
    section: options.section,
    skipHistoryPush: options.skipHistoryPush,
    itemTitle: gallery?.[startIndex]?.title
  });
  
  if (!gallery?.length) {
    console.warn('[ModalModule] No gallery items!');
    return;
  }
  
  currentGallery = gallery;
  currentIndex = startIndex;
  gallerySection = options.section || null;
  
  // Create modal if it doesn't exist
  if (!currentModal) {
    currentModal = createModalElement();
    document.body.appendChild(currentModal);
  }
  
  // Update content
  updateModalContent(gallery[startIndex]);
  updateIndicators(gallery.length, startIndex);
  
  // Show modal
  currentModal.style.display = 'flex';
  document.body.classList.add('lock-scroll');
  
  // Update URL history (unless we're restoring from history)
  if (!options.skipHistoryPush) {
    const item = gallery[startIndex];
    if (item && item.title) {
      const slug = slugify(item.title);
      const newUrl = `/${slug}`;
      console.log('[ModalModule] Updating URL:', { currentPath: location.pathname, newUrl, slug });
      if (location.pathname !== newUrl) {
        history.pushState({ 
          modalOpen: true, 
          index: startIndex, 
          slug: slug,
          section: gallerySection 
        }, '', newUrl);
        console.log('[ModalModule] ✅ URL updated to:', newUrl);
        
        // Update meta tags for social sharing
        updateMetaTags(item);
      } else {
        console.log('[ModalModule] URL already correct');
      }
    } else {
      console.warn('[ModalModule] Cannot update URL - no item or title');
    }
  } else {
    console.log('[ModalModule] Skipping URL update (skipHistoryPush)');
  }
  
  // Focus trap
  currentModal.focus();
  
  // Trigger callback
  options.onOpen?.(gallery[startIndex], startIndex);
}

/**
 * Close the modal
 */
export function closeModal() {
  if (!currentModal) return;
  
  currentModal.style.display = 'none';
  document.body.classList.remove('lock-scroll');
  
  // Pause any playing video
  const video = currentModal.querySelector('video');
  if (video) video.pause();
  
  // Reset meta tags
  resetMetaTags();
  
  // Revert URL if needed
  if (history.state?.modalOpen) {
    // If we pushed a state, go back
    history.back();
  } else if (location.pathname !== '/') {
    // If loaded directly with slug, replace state to root
    history.replaceState(null, '', '/');
  }

  currentGallery = null;
  currentIndex = 0;
  gallerySection = null;
}

/**
 * Helper to slugify title
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // decompose accents
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w\-]+/g, '') // remove non-word chars
    .replace(/\-\-+/g, '-'); // replace multiple -
}

/**
 * Update meta tags for social sharing
 */
function updateMetaTags(item) {
  const baseUrl = window.location.origin;
  const title = item.title || 'MÊIRKS Portfolio';
  const description = item.description || 'Visual Effects, 3D Art & Creative Coding';
  const image = item.src || item.modalImage || `${baseUrl}/assets/logo.png`;
  
  // Update document title
  document.title = `${title} - MÊIRKS`;
  
  // Helper to update or create meta tag
  const updateMeta = (property, content, isName = false) => {
    const attr = isName ? 'name' : 'property';
    let meta = document.querySelector(`meta[${attr}="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };
  
  // Open Graph tags
  updateMeta('og:title', title);
  updateMeta('og:description', description);
  updateMeta('og:image', image.startsWith('http') ? image : `${baseUrl}${image}`);
  updateMeta('og:url', window.location.href);
  updateMeta('og:type', 'website');
  
  // Twitter Card tags
  updateMeta('twitter:card', 'summary_large_image', true);
  updateMeta('twitter:title', title, true);
  updateMeta('twitter:description', description, true);
  updateMeta('twitter:image', image.startsWith('http') ? image : `${baseUrl}${image}`, true);
  
  // Standard meta description
  updateMeta('description', description, true);
  
  // Update canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', window.location.href);
}

/**
 * Reset meta tags to default
 */
function resetMetaTags() {
  document.title = 'MÊIRKS - Visual Effects, 3D Art & Creative Coding';
  
  const updateMeta = (property, content, isName = false) => {
    const attr = isName ? 'name' : 'property';
    const meta = document.querySelector(`meta[${attr}="${property}"]`);
    if (meta) {
      meta.setAttribute('content', content);
    }
  };
  
  updateMeta('og:title', 'MÊIRKS');
  updateMeta('og:description', 'Visual Effects, 3D Art & Creative Coding Portfolio');
  updateMeta('twitter:title', 'MÊIRKS', true);
  updateMeta('twitter:description', 'Visual Effects, 3D Art & Creative Coding Portfolio', true);
  
  // Reset canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', window.location.origin + '/');
  }
}

/**
 * Navigate to next/previous slide
 */
export function navigateModal(direction) {
  if (!currentGallery) return;
  
  const newIndex = currentIndex + direction;
  
  if (newIndex >= 0 && newIndex < currentGallery.length) {
    currentIndex = newIndex;
    updateModalContent(currentGallery[currentIndex]);
    updateIndicators(currentGallery.length, currentIndex);
    
    // Update URL without creating new history entry
    const item = currentGallery[currentIndex];
    if (item && item.title) {
      const slug = slugify(item.title);
      const newUrl = `/${slug}`;
      history.replaceState({ 
        modalOpen: true, 
        index: currentIndex, 
        slug: slug,
        section: gallerySection 
      }, '', newUrl);
      
      // Update meta tags
      updateMetaTags(item);
    }
  }
}

/**
 * Create the modal DOM element
 */
function createModalElement() {
  const modal = document.createElement('div');
  modal.className = 'modern-modal-gallery';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('tabindex', '-1');
  modal.style.display = 'none';
  
  modal.innerHTML = `
    <div class="modern-modal-header">
      <button class="modern-modal-close" aria-label="Close modal">&times;</button>
    </div>
    
    <div class="modern-modal-indicators"></div>
    
    <div class="modern-modal-carousel">
      <div class="modern-modal-slide">
        <div class="modern-modal-media"></div>
        <div class="modern-modal-description"></div>
      </div>
    </div>
    
    <div class="modern-modal-footer">
      <button class="modern-modal-arrow prev" aria-label="Previous">&larr;</button>
      <button class="modern-modal-arrow next" aria-label="Next">&rarr;</button>
    </div>
  `;
  
  // Event listeners
  modal.querySelector('.modern-modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modern-modal-arrow.prev').addEventListener('click', () => navigateModal(-1));
  modal.querySelector('.modern-modal-arrow.next').addEventListener('click', () => navigateModal(1));
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modern-modal-carousel')) {
      closeModal();
    }
  });
  
  // Keyboard navigation
  modal.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Escape':
        closeModal();
        break;
      case 'ArrowLeft':
        navigateModal(-1);
        break;
      case 'ArrowRight':
        navigateModal(1);
        break;
    }
  });
  
  // Touch swipe support
  let touchStartX = 0;
  modal.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  
  modal.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > 50) {
      navigateModal(diff > 0 ? 1 : -1);
    }
  }, { passive: true });
  
  return modal;
}

/**
 * Update modal content for current item
 */
function updateModalContent(item) {
  if (!currentModal || !item) return;
  
  const mediaContainer = currentModal.querySelector('.modern-modal-media');
  const descContainer = currentModal.querySelector('.modern-modal-description');
  
  // Clear previous content
  mediaContainer.innerHTML = '';
  descContainer.innerHTML = '';
  
  // Create media element
  if (item.video) {
    const video = document.createElement('video');
    video.src = item.video;
    video.controls = true;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    mediaContainer.appendChild(video);
  } else if (item.modalGallery?.length) {
    // Image gallery
    const img = document.createElement('img');
    img.src = item.modalGallery[0];
    img.alt = item.title || 'Gallery image';
    mediaContainer.appendChild(img);
  } else {
    const img = document.createElement('img');
    img.src = item.modalImage || item.src;
    img.alt = item.title || 'Gallery image';
    mediaContainer.appendChild(img);
  }
  
  // Description
  if (item.description) {
    const truncated = item.description.length > 150 
      ? item.description.substring(0, 150) + '...'
      : item.description;
    
    descContainer.innerHTML = `
      <p class="description-text">${truncated}</p>
      ${item.description.length > 150 ? `
        <button class="description-expand-btn" data-full="${encodeURIComponent(item.description)}">
          Leggi di più
        </button>
      ` : ''}
    `;
    
    // Expand button handler
    const expandBtn = descContainer.querySelector('.description-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        openDescriptionPanel(item);
      });
    }
  }
  
  // Update navigation state
  updateNavigationState();
}

/**
 * Update navigation button states
 */
function updateNavigationState() {
  if (!currentModal || !currentGallery) return;
  
  const prevBtn = currentModal.querySelector('.modern-modal-arrow.prev');
  const nextBtn = currentModal.querySelector('.modern-modal-arrow.next');
  
  prevBtn.style.visibility = currentIndex > 0 ? 'visible' : 'hidden';
  nextBtn.style.visibility = currentIndex < currentGallery.length - 1 ? 'visible' : 'hidden';
}

/**
 * Update indicator dots
 */
function updateIndicators(total, active) {
  if (!currentModal) return;
  
  const container = currentModal.querySelector('.modern-modal-indicators');
  
  // Don't show indicators for single items or too many
  if (total <= 1 || total > 10) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  container.innerHTML = Array.from({ length: total }, (_, i) => 
    `<span class="dot ${i === active ? 'active' : ''}"></span>`
  ).join('');
}

/**
 * Open full description panel
 */
function openDescriptionPanel(item) {
  let overlay = document.querySelector('.description-overlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'description-overlay';
    overlay.innerHTML = `
      <div class="description-panel">
        <div class="description-panel-header">
          <h3 class="description-panel-title">Dettagli</h3>
          <button class="description-panel-close">&times;</button>
        </div>
        <div class="description-panel-content"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Close handlers
    overlay.querySelector('.description-panel-close').addEventListener('click', closeDescriptionPanel);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDescriptionPanel();
    });
  }
  
  // Update content
  const content = overlay.querySelector('.description-panel-content');
  content.innerHTML = `
    <div class="description-panel-text">
      ${item.description.split('\n').map(p => `<p>${p}</p>`).join('')}
    </div>
    ${item.software?.length ? `
      <div class="description-panel-software">
        <h4 class="description-panel-subtitle">Software</h4>
        <ul class="software-chip-list">
          ${item.software.map(s => `<li class="software-chip">${s}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;
  
  // Show
  overlay.classList.add('active');
}

/**
 * Close description panel
 */
function closeDescriptionPanel() {
  const overlay = document.querySelector('.description-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

/**
 * Open modal from URL slug (deep linking)
 * @param {string} slug - URL slug
 * @param {Object} galleriesData - All gallery data
 * @returns {boolean} - True if modal opened successfully
 */
export function openModalFromSlug(slug, galleriesData) {
  if (!slug || !galleriesData) return false;
  
  // Search all sections for matching slug
  for (const [sectionKey, items] of Object.entries(galleriesData)) {
    if (!Array.isArray(items)) continue;
    
    const index = items.findIndex(item => slugify(item.title) === slug);
    
    if (index !== -1) {
      // Found! Open modal without pushing to history
      openModal(items, index, { section: sectionKey, skipHistoryPush: true });
      console.log(`[Modal] Opened from slug: ${slug} (section: ${sectionKey}, index: ${index})`);
      return true;
    }
  }
  
  console.warn(`[Modal] No content found for slug: ${slug}`);
  return false;
}

/**
 * Setup browser history listener
 * @param {Object} galleriesData - All gallery data
 */
export function setupHistoryListener(galleriesData) {
  window.addEventListener('popstate', (event) => {
    if (event.state?.modalOpen) {
      // Restore modal state
      const { slug, section, index } = event.state;
      
      if (section && galleriesData[section]) {
        openModal(galleriesData[section], index || 0, { 
          section, 
          skipHistoryPush: true 
        });
      } else if (slug) {
        openModalFromSlug(slug, galleriesData);
      }
    } else {
      // Close modal when going back to main page
      if (currentModal && currentModal.style.display !== 'none') {
        currentModal.style.display = 'none';
        document.body.classList.remove('lock-scroll');
        
        // Pause any playing video
        const video = currentModal.querySelector('video');
        if (video) video.pause();
        
        currentGallery = null;
        currentIndex = 0;
        gallerySection = null;
      }
    }
  });
  
  console.log('[Modal] History listener setup complete');
}

// Export for external use
export { currentModal, currentGallery, currentIndex };
