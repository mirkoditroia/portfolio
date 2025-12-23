/* ============================================
   SHADER MODULE - GLSL Shader Management
   ============================================ */

import { isMobile } from './config.js';

let desktopShader = null;
let mobileShader = null;
let shaderObserver = null;

/**
 * Initialize shaders based on device type
 */
export async function initShaders() {
  const isDesktop = !isMobile();
  
  if (isDesktop) {
    await initDesktopShader();
  } else {
    await initMobileShader();
  }
  
  // Setup visibility observer to pause when not visible
  setupVisibilityObserver();
  
  return { desktopShader, mobileShader };
}

/**
 * Initialize desktop GLSL shader
 */
async function initDesktopShader() {
  const canvas = document.getElementById('desktop-shader');
  if (!canvas) return null;
  
  try {
    // Load shader text
    const shaderText = await loadShaderText('desktop');
    if (!shaderText) throw new Error('No shader text available');
    
    // Initialize GlslCanvas
    if (typeof GlslCanvas !== 'undefined') {
      desktopShader = new GlslCanvas(canvas);
      desktopShader.load(shaderText);
      
      // Handle resize
      const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = canvas.clientWidth * ratio;
        canvas.height = canvas.clientHeight * ratio;
      };
      
      resize();
      window.addEventListener('resize', resize);
      
      console.log('[Shader] Desktop shader initialized');
      onShaderReady('desktop');
    }
  } catch (error) {
    console.error('[Shader] Desktop initialization failed:', error);
    initFallbackShader(canvas);
  }
  
  return desktopShader;
}

/**
 * Initialize mobile GLSL shader
 */
async function initMobileShader() {
  const canvas = document.getElementById('mobile-shader');
  if (!canvas) return null;
  
  try {
    const shaderText = await loadShaderText('mobile');
    if (!shaderText) throw new Error('No shader text available');
    
    if (typeof GlslCanvas !== 'undefined') {
      mobileShader = new GlslCanvas(canvas);
      mobileShader.load(shaderText);
      
      console.log('[Shader] Mobile shader initialized');
      onShaderReady('mobile');
    }
  } catch (error) {
    console.error('[Shader] Mobile initialization failed:', error);
    // Mobile can just show gradient background
  }
  
  return mobileShader;
}

/**
 * Load shader text from various sources
 */
async function loadShaderText(type) {
  const sources = [
    // Try Firestore first (production)
    async () => {
      if (window.APP_ENV === 'prod' && window.getSiteProd) {
        const site = await window.getSiteProd();
        return type === 'desktop' ? site.desktopShader : site.mobileShader;
      }
      return null;
    },
    // Try local file
    async () => {
      const res = await fetch(`data/${type}_shader.glsl`);
      if (res.ok) return res.text();
      return null;
    },
    // Try inline script
    () => {
      const el = document.getElementById(`${type}-shader-code`);
      return el?.textContent?.trim() || null;
    }
  ];
  
  for (const source of sources) {
    try {
      const text = await source();
      if (text) {
        console.log(`[Shader] ${type} shader loaded`);
        return text;
      }
    } catch (e) {
      // Continue to next source
    }
  }
  
  return null;
}

/**
 * Simple 2D gradient fallback
 */
function initFallbackShader(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  
  resize();
  window.addEventListener('resize', resize);
  
  let animationId;
  
  function draw(t = 0) {
    animationId = requestAnimationFrame(draw);
    
    const w = canvas.width;
    const h = canvas.height;
    const time = t * 0.0003;
    
    const grd = ctx.createRadialGradient(
      w * 0.5 + Math.sin(time) * w * 0.2,
      h * 0.4 + Math.cos(time * 1.3) * h * 0.2,
      0,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.7
    );
    
    const hue = (time * 30) % 360;
    grd.addColorStop(0, `hsl(${hue}, 60%, 50%)`);
    grd.addColorStop(1, '#0a0e14');
    
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }
  
  draw();
  console.log('[Shader] Fallback gradient initialized');
  
  // Store cleanup function
  canvas._stopFallback = () => {
    cancelAnimationFrame(animationId);
  };
}

/**
 * Setup IntersectionObserver to pause shader when not visible
 */
function setupVisibilityObserver() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  shaderObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const isPaused = !entry.isIntersecting;
      
      if (desktopShader) {
        desktopShader.paused = isPaused;
      }
      if (mobileShader) {
        mobileShader.paused = isPaused;
      }
    });
  }, { threshold: 0.1 });
  
  shaderObserver.observe(hero);
}

/**
 * Called when shader is ready
 */
function onShaderReady(type) {
  // Hide loader
  const loader = document.getElementById('shaderLoader');
  if (loader) {
    loader.classList.add('hide');
  }
  
  // Show logo
  const logo = document.querySelector('.center-logo');
  if (logo) {
    logo.classList.add('loaded');
  }
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('shader-ready', { detail: { type } }));
}

/**
 * Pause all shaders
 */
export function pauseShaders() {
  if (desktopShader) desktopShader.paused = true;
  if (mobileShader) mobileShader.paused = true;
}

/**
 * Resume all shaders
 */
export function resumeShaders() {
  if (desktopShader) desktopShader.paused = false;
  if (mobileShader) mobileShader.paused = false;
}

/**
 * Cleanup shaders
 */
export function destroyShaders() {
  if (shaderObserver) {
    shaderObserver.disconnect();
    shaderObserver = null;
  }
  
  const desktopCanvas = document.getElementById('desktop-shader');
  if (desktopCanvas?._stopFallback) {
    desktopCanvas._stopFallback();
  }
  
  desktopShader = null;
  mobileShader = null;
}
