/* ============================================
   CONFIG - Application Configuration
   ============================================ */

export const CONFIG = {
  // Performance settings
  lazyThreshold: 0.1,
  preloadBatchSize: 3,
  maxRetries: 3,
  
  // Animation durations (ms)
  transitionFast: 150,
  transitionBase: 300,
  transitionSlow: 500,
  
  // Breakpoints
  breakpoints: {
    mobile: 600,
    tablet: 900,
    desktop: 1200
  },
  
  // Swiper default config
  swiper: {
    slidesPerView: 'auto',
    spaceBetween: 24,
    grabCursor: true,
    freeMode: {
      enabled: true,
      sticky: false,
      momentumRatio: 0.5,
      momentumVelocityRatio: 0.5
    },
    navigation: {
      enabled: true
    },
    breakpoints: {
      0: { spaceBetween: 12 },
      600: { spaceBetween: 16 },
      900: { spaceBetween: 24 }
    },
    // Touch settings for better vertical scroll on mobile
    touchEventsTarget: 'container',
    touchRatio: 1,
    touchAngle: 45, // Tolleranza angolo: swipe orizzontale solo se < 45°
    resistanceRatio: 0.85,
    // Allow vertical scroll when swiping vertically
    touchStartPreventDefault: false,
    touchMoveStopPropagation: false,
    simulateTouch: true,
    // Only prevent default on horizontal swipe
    preventInteractionOnTransition: false
  }
};

// Check if device is mobile
export const isMobile = () => window.innerWidth <= CONFIG.breakpoints.tablet;

// Check if device prefers reduced motion
export const prefersReducedMotion = () => 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Debounce utility
export const debounce = (fn, delay = 250) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttle utility
export const throttle = (fn, limit = 250) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
