/* ============================================
   APP - Main Application Entry Point
   ============================================ */

import { CONFIG, isMobile, debounce } from './config.js';
import { populateGallery, refreshCarousels } from './carouselModule.js';
import { openModal, closeModal, setupHistoryListener, openModalFromSlug } from './modalModule.js';
import { initShaders } from './shaderModule.js';

// App state
let siteData = null;
let galleriesData = null;

/**
 * Initialize the application
 */
async function init() {
  console.log('[App] Initializing...');
  
  const startTime = performance.now();
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }
  
  // Load data
  await loadData();
  
  // Initialize components
  // Note: Gallery population is handled by legacy script.js
  // We only provide the modal API for URL support
  initMobileMenu();
  initScrollSpy();
  // await initGalleries(); // DISABLED - conflicts with legacy script.js
  initShaders();
  
  // Apply site config
  applySiteConfig();
  
  // Setup history listener for deep linking
  if (galleriesData?.galleries) {
    setupHistoryListener(galleriesData.galleries);
  }
  
  // Check if page loaded with a slug (deep link)
  checkDeepLink();
  
  // Ensure minimum loader display time (500ms) for smooth UX
  const elapsed = performance.now() - startTime;
  const minDisplayTime = 500;
  if (elapsed < minDisplayTime) {
    await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
  }
  
  // Hide loader with smooth transition
  hideLoader();
  
  console.log('[App] Initialized');
}

/**
 * Load site and gallery data
 */
async function loadData() {
  try {
    // Try Firestore first (production)
    if (window.APP_ENV === 'prod' && window.firebaseReady) {
      await waitForFirebase();
      siteData = await window.getSiteData?.();
      galleriesData = await loadGalleriesFromFirestore();
    }
    
    // Fallback to local JSON
    if (!siteData) {
      const res = await fetch('/data/site.json');
      siteData = await res.json();
    }
    
    if (!galleriesData) {
      const res = await fetch('/data/galleries.json');
      galleriesData = await res.json();
    }
    
    console.log('[App] Data loaded');
  } catch (error) {
    console.error('[App] Data loading failed:', error);
    // Use minimal fallback
    siteData = { heroText: 'MÊIRKS', bio: 'Portfolio' };
    galleriesData = { galleries: {} };
  }
}

/**
 * Wait for Firebase to be ready
 */
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebaseReady) {
      resolve();
    } else {
      window.addEventListener('firebase-ready', resolve, { once: true });
      // Timeout fallback
      setTimeout(resolve, 3000);
    }
  });
}

/**
 * Load galleries from Firestore
 */
async function loadGalleriesFromFirestore() {
  try {
    if (!window.db) return null;
    
    const snap = await window.db.collection('config').doc('galleries').get();
    if (snap.exists) {
      return snap.data();
    }
  } catch (e) {
    console.warn('[App] Firestore galleries failed:', e);
  }
  return null;
}

/**
 * Initialize all gallery sections
 */
async function initGalleries() {
  const sections = ['vfx', 'art3d', 'interactive', 'creativecoding', 'ai'];
  
  for (const sectionId of sections) {
    const items = galleriesData?.galleries?.[sectionId] || [];
    
    if (items.length > 0) {
      populateGallery(sectionId, items, (item, index, section) => {
        // Get all items for this section for modal navigation
        console.log('[App] Gallery item callback triggered:', { item: item.title, index, section });
        const allItems = galleriesData.galleries[section] || [];
        console.log('[App] Opening modal with', allItems.length, 'items, startIndex:', index);
        openModal(allItems, index, { section });
      });
    }
  }
}

/**
 * Check for deep link in URL and open corresponding modal
 */
function checkDeepLink() {
  const pathname = window.location.pathname;
  
  // Skip if we're on homepage or admin
  if (pathname === '/' || pathname.startsWith('/admin')) {
    return;
  }
  
  // Extract slug from pathname (remove leading slash)
  const slug = pathname.substring(1);
  
  if (slug && galleriesData?.galleries) {
    console.log('[App] Deep link detected:', slug);
    const opened = openModalFromSlug(slug, galleriesData.galleries);
    
    if (!opened) {
      // Slug not found, redirect to homepage
      console.warn('[App] Content not found for slug:', slug);
      history.replaceState(null, '', '/');
    }
  }
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('primary-menu');
  
  if (!toggle || !menu) return;
  
  toggle.addEventListener('click', () => {
    menu.classList.toggle('active');
    const isOpen = menu.classList.contains('active');
    toggle.setAttribute('aria-expanded', isOpen);
  });
  
  // Close on link click
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Initialize scroll spy for navigation highlighting
 */
function initScrollSpy() {
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.menu a[href^="#"]');
  
  if (!sections.length || !navLinks.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.3 });
  
  sections.forEach(section => observer.observe(section));
}

/**
 * Hide the loading overlay with smooth transition
 */
function hideLoader() {
  const loader = document.getElementById('app-loader');
  if (!loader) return;
  
  // Add loaded class to trigger CSS transition
  requestAnimationFrame(() => {
    loader.classList.add('loaded');
    loader.setAttribute('aria-busy', 'false');
  });
  
  // Remove from DOM after transition completes
  setTimeout(() => {
    loader.remove();
  }, 600); // Match CSS transition duration
}

/**
 * Apply site configuration to DOM
 */
function applySiteConfig() {
  if (!siteData) return;
  
  // Hero text
  const heroEl = document.getElementById('hero-title');
  if (heroEl && siteData.heroText) {
    heroEl.textContent = siteData.heroText;
  }
  
  // Site name
  const siteNameEl = document.getElementById('site-name');
  if (siteNameEl && siteData.siteName) {
    siteNameEl.textContent = siteData.siteName;
  }
  
  // Section titles
  document.querySelectorAll('[data-section-key]').forEach(el => {
    const key = el.dataset.sectionKey;
    const title = siteData.sections?.[key]?.title;
    if (title) {
      el.textContent = title;
    }
  });
  
  // Contacts
  if (siteData.contacts?.length) {
    const container = document.querySelector('.contacts-container') || 
                      document.querySelector('#contact .section');
    
    if (container) {
      const html = siteData.contacts.map(c => `
        <div class="contact-item">
          <span class="contact-label">${c.label}</span>
          ${c.link 
            ? `<a href="${c.link}" class="contact-value contact-link" target="_blank" rel="noopener">${c.value}</a>`
            : `<span class="contact-value">${c.value}</span>`
          }
        </div>
      `).join('');
      
      // Check if contacts-container exists, otherwise create it
      let contactsContainer = container.querySelector('.contacts-container');
      if (!contactsContainer) {
        contactsContainer = document.createElement('div');
        contactsContainer.className = 'contacts-container';
        container.appendChild(contactsContainer);
      }
      contactsContainer.innerHTML = html;
    }
  }
}

/**
 * Handle visibility change (tab switch)
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause heavy operations
  } else {
    // Resume and refresh
    refreshCarousels();
  }
});

/**
 * Handle resize
 */
window.addEventListener('resize', debounce(() => {
  refreshCarousels();
}, 250));

// Expose API immediately for legacy code
window.__app = { 
  openModal, 
  closeModal,
  get siteData() { return siteData; },
  get galleriesData() { return galleriesData; }
};

// Start the app
init().catch(console.error);
