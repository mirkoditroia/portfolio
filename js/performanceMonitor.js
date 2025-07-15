// 🚀 Performance Monitor - Versione Semplificata
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      lastFrameTime: 0,
      frameCount: 0
    };
    
    this.thresholds = {
      fpsWarning: 25,      // FPS sotto cui avvisare
      fpsCritical: 15,     // FPS critico
      frameTimeWarning: 40 // Tempo frame > 40ms = lag
    };
    
    this.isMonitoring = false;
    this.isDesktop = !window.matchMedia('(max-width: 768px)').matches;
    this.currentGLSLQuality = 'high'; // 'high', 'medium', 'low'
    
    this.init();
  }
  
  init() {
    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      this.startMonitoring();
      
      // Gestisci cambio orientamento/dispositivo
      window.addEventListener('resize', () => {
        this.isDesktop = !window.matchMedia('(max-width: 768px)').matches;
      });
    }
  }
  
  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.monitorFPS();
    console.log('🚀 Performance Monitor attivato (versione semplificata)');
  }
  
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('⏹️ Performance Monitor disattivato');
  }
  
  // Monitor FPS e frame time
  monitorFPS() {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = (currentTime) => {
      if (!this.isMonitoring) return;
      
      frames++;
      const deltaTime = currentTime - lastTime;
      
      // Calcola FPS ogni secondo
      if (deltaTime >= 1000) {
        this.metrics.fps = Math.round((frames * 1000) / deltaTime);
        this.metrics.frameTime = deltaTime / frames;
        
        frames = 0;
        lastTime = currentTime;
        
        // Valuta performance
        this.evaluatePerformance();
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  // Monitor memoria (se disponibile)
  monitorMemory() {
    if (!performance.memory) return;
    
    setInterval(() => {
      if (!this.isMonitoring) return;
      
      const memory = performance.memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }, 5000);
  }
  
  evaluatePerformance() {
    let severity = 'none';
    let issues = [];
    
    // Controlla FPS
    if (this.metrics.fps < this.thresholds.fpsCritical) {
      severity = 'critical';
      issues.push(`FPS critico: ${this.metrics.fps}`);
    } else if (this.metrics.fps < this.thresholds.fpsWarning) {
      severity = 'warning';
      issues.push(`FPS basso: ${this.metrics.fps}`);
    }
    
    // Controlla frame time
    if (this.metrics.frameTime > this.thresholds.frameTimeWarning) {
      severity = severity === 'none' ? 'warning' : severity;
      issues.push(`Frame time alto: ${this.metrics.frameTime.toFixed(1)}ms`);
    }
    
    // Controlla memoria (se disponibile)
    if (performance.memory && this.metrics.memoryUsage > 0.8) {
      severity = severity === 'none' ? 'warning' : severity;
      issues.push(`Memoria alta: ${(this.metrics.memoryUsage * 100).toFixed(1)}%`);
    }
    
    // Applica ottimizzazioni automatiche
    this.applyAutomaticOptimizations(severity);
    
    // Log per debug
    if (severity !== 'none') {
      console.log(`⚠️ Performance ${severity}:`, issues.join(', '));
    }
  }
  
  // Ottimizzazioni automatiche
  applyAutomaticOptimizations(severity) {
    if (severity === 'critical') {
      this.applyCriticalOptimizations();
    } else if (severity === 'warning') {
      this.applyWarningOptimizations();
    } else {
      this.removeOptimizations();
    }
  }
  
  // Ottimizzazioni critiche
  applyCriticalOptimizations() {
    document.body.classList.add('performance-mode');
    document.body.classList.add('critical-performance-mode');
    this.setGLSLQuality('low');
  }
  
  // Ottimizzazioni di warning
  applyWarningOptimizations() {
    document.body.classList.add('performance-mode');
    this.setGLSLQuality('medium');
  }
  
  // Rimuovi ottimizzazioni
  removeOptimizations() {
    document.body.classList.remove('performance-mode');
    document.body.classList.remove('critical-performance-mode');
    this.setGLSLQuality('high');
  }
  
  // Imposta qualità GLSL automaticamente
  setGLSLQuality(quality) {
    if (!this.isDesktop) return;
    if (this.currentGLSLQuality === quality) return;
    
    this.currentGLSLQuality = quality;
    console.log(`🎨 Impostando qualità GLSL: ${quality}`);
    
    const desktopShaderCanvas = document.getElementById('desktop-shader-canvas');
    if (!desktopShaderCanvas) return;
    
    // Applica riduzione qualità tramite CSS transform scale
    switch (quality) {
      case 'high':
        desktopShaderCanvas.style.transform = 'scale(1)';
        desktopShaderCanvas.style.imageRendering = 'auto';
        break;
      case 'medium':
        desktopShaderCanvas.style.transform = 'scale(0.75)';
        desktopShaderCanvas.style.imageRendering = 'pixelated';
        break;
      case 'low':
        desktopShaderCanvas.style.transform = 'scale(0.5)';
        desktopShaderCanvas.style.imageRendering = 'pixelated';
        break;
    }
    
    // Aggiungi filtro blur per qualità più bassa
    if (quality === 'low') {
      desktopShaderCanvas.style.filter = 'blur(1px)';
    } else {
      desktopShaderCanvas.style.filter = 'none';
    }
  }
  
  // Funzioni di utilità
  getMetrics() {
    return { ...this.metrics };
  }
  
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      isDesktop: this.isDesktop,
      metrics: this.getMetrics(),
      thresholds: { ...this.thresholds },
      glslQuality: this.currentGLSLQuality
    };
  }
  
  // Test performance manuale
  testPerformance() {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let frames = 0;
      
      const testFrame = () => {
        frames++;
        const currentTime = performance.now();
        
        if (currentTime - startTime >= 1000) {
          const fps = Math.round((frames * 1000) / (currentTime - startTime));
          resolve({
            fps,
            frameTime: (currentTime - startTime) / frames,
            memoryUsage: performance.memory ? performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit : 0
          });
        } else {
          requestAnimationFrame(testFrame);
        }
      };
      
      requestAnimationFrame(testFrame);
    });
  }
  
  // Funzioni di test per qualità GLSL
  testGLSLQuality(quality) {
    console.log(`🧪 Test qualità GLSL: ${quality}`);
    this.setGLSLQuality(quality);
  }
}

// Esporta per uso globale
window.PerformanceMonitor = PerformanceMonitor;

// Funzioni globali di utilità
window.testPerformance = function() {
  if (window.performanceMonitor) {
    return window.performanceMonitor.testPerformance();
  }
};

// Funzioni di test per qualità GLSL
window.testGLSLHigh = function() {
  if (window.performanceMonitor) {
    window.performanceMonitor.testGLSLQuality('high');
  }
};

window.testGLSLMedium = function() {
  if (window.performanceMonitor) {
    window.performanceMonitor.testGLSLQuality('medium');
  }
};

window.testGLSLLow = function() {
  if (window.performanceMonitor) {
    window.performanceMonitor.testGLSLQuality('low');
  }
};

// Debug: mostra stato performance
window.showPerformanceStatus = function() {
  if (window.performanceMonitor) {
    console.log('📊 Stato Performance:', window.performanceMonitor.getStatus());
  }
}; 