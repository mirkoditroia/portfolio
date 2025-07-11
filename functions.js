// Client-side utility functions for portfolio

// Global helper to load JSON with fallback
window.fetchJson = function(primaryUrl, fallbackUrl) {
  return fetch(primaryUrl).then(res => {
    if (res.ok) return res.json();
    return fetch(fallbackUrl).then(r => r.json());
  }).catch(() => fetch(fallbackUrl).then(r => r.json()));
};

// Environment detection
(function() {
  if (window.APP_ENV) return; // already set by env.*.js
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('local')) {
    window.APP_ENV = 'local';
  } else if (host.includes('preprod') || host.includes('pre-prod')) {
    window.APP_ENV = 'preprod';
  } else {
    window.APP_ENV = 'prod';
  }
})();

// Debug logging
window.debugLog = function(message, data) {
  if (window.APP_ENV !== 'prod') {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

// Error handling
window.handleError = function(error, context) {
  console.error(`[ERROR] ${context}:`, error);
  if (window.APP_ENV !== 'prod') {
    console.trace();
  }
};

console.log('✅ Client functions loaded successfully'); 