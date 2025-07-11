// ---------------- Global helper to load JSON with fallback ----------------
function fetchJson(primaryUrl, fallbackUrl){
  return fetch(primaryUrl).then(res=>{
    if(res.ok) return res.json();
    return fetch(fallbackUrl).then(r=>r.json());
  }).catch(()=> fetch(fallbackUrl).then(r=>r.json()));
}

// Ensure APP_ENV is available immediately (may load env script async)
(function(){
  if(window.APP_ENV) return; // already set by env.*.js
  const host = location.hostname;
  if(host==='localhost' || host==='127.0.0.1' || host.includes('local')){
    window.APP_ENV='local';
  }else if(host.includes('preprod') || host.includes('pre-prod')){
    window.APP_ENV='preprod';
  }else{
    window.APP_ENV='prod';
  }
})();

// JS per multiple gallery sections
document.addEventListener('DOMContentLoaded', function() {
  
  // Debug console per tracking errori
  console.log('🚀 Portfolio: Inizializzazione...');
  
  // Scroll progress indicator
  function initScrollIndicator() {
    try {
      // Crea l'indicatore di scroll
      const scrollIndicator = document.createElement('div');
      scrollIndicator.className = 'scroll-indicator';
      scrollIndicator.innerHTML = '<div></div>';
      document.body.appendChild(scrollIndicator);
      
      const progressBar = scrollIndicator.querySelector('div');
      
      function updateScrollProgress() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
      }
      
      window.addEventListener('scroll', updateScrollProgress);
      updateScrollProgress();
      console.log('✅ Scroll indicator inizializzato');
    } catch (error) {
      console.error('❌ Errore scroll indicator:', error);
    }
  }
  
  // Scroll spy per evidenziare sezione attiva
  function initScrollSpy() {
    try {
      const sections = document.querySelectorAll('.section');
      const navLinks = document.querySelectorAll('.menu a');
      
      if (sections.length === 0 || navLinks.length === 0) {
        console.warn('⚠️ Sezioni o link menu non trovati');
        return;
      }
      
      function updateActiveSection() {
        let currentSection = '';
        
        sections.forEach(section => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.clientHeight;
          
          if (window.scrollY >= sectionTop - 150) {
            currentSection = section.getAttribute('id');
          }
        });
        
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
          }
        });
      }
      
      window.addEventListener('scroll', updateActiveSection);
      updateActiveSection(); // Chiamata iniziale
      console.log('✅ Scroll spy inizializzato');
    } catch (error) {
      console.error('❌ Errore scroll spy:', error);
    }
  }
  
  // Miglioramenti accessibilità
  function initAccessibility() {
    try {
      // Aggiungi ARIA labels ai pulsanti carousel
      const carouselBtns = document.querySelectorAll('.carousel-btn');
      carouselBtns.forEach(btn => {
        if (btn.classList.contains('prev')) {
          btn.setAttribute('aria-label', 'Elemento precedente');
        } else if (btn.classList.contains('next')) {
          btn.setAttribute('aria-label', 'Elemento successivo');
        }
        btn.setAttribute('tabindex', '0');
      });
      
      // Aggiungi keyboard navigation
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
          closeModalFunction();
        }
      });
      
      // Gestione focus per gallery items
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          const focusedElement = document.activeElement;
          if (focusedElement.classList.contains('gallery-item')) {
            e.preventDefault();
            focusedElement.click();
          }
        }
      });
      console.log('✅ Accessibilità inizializzata');
    } catch (error) {
      console.error('❌ Errore accessibilità:', error);
    }
  }
  
  // Stato di caricamento per gallery items
  function showLoadingState(item) {
    try {
      item.classList.add('loading');
      setTimeout(() => {
        item.classList.remove('loading');
      }, 1000);
    } catch (error) {
      console.error('❌ Errore loading state:', error);
    }
  }
  
  // Smooth scroll per i link del menu
  function initSmoothScroll() {
    try {
      const menuLinks = document.querySelectorAll('.menu a');
      menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const targetId = this.getAttribute('href').substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement) {
            const targetPosition = targetElement.offsetTop - 80; // Offset per header fisso
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
            // Chiudi menu mobile dopo il click (UX mobile)
            if (window.innerWidth <= 900) {
              const menuEl = document.querySelector('.menu');
              if (menuEl) menuEl.classList.remove('active');
            }
          }
        });
      });
      console.log('✅ Smooth scroll inizializzato');
    } catch (error) {
      console.error('❌ Errore smooth scroll:', error);
    }
  }
  
  // Mobile hamburger menu toggle
  function initMobileMenu() {
    try {
      const toggleBtn = document.getElementById('menuToggle');
      const menuEl = document.querySelector('.menu');
      if (!toggleBtn || !menuEl) return;
      toggleBtn.addEventListener('click', () => {
        menuEl.classList.toggle('active');
      });
      console.log('✅ Mobile menu inizializzato');
    } catch (error) {
      console.error('❌ Errore mobile menu:', error);
    }
  }
  
  // Inizializza tutti i miglioramenti
  initScrollIndicator();
  initScrollSpy();
  initAccessibility();
  initSmoothScroll();
  initMobileMenu();
  manageFocus();

  // ---------- Mobile hero parallax (pointer follows aura) ----------
  (function(){
    if(window.innerWidth > 900) return; // only mobile/tablet
    const hero = document.querySelector('.hero');
    if(!hero) return;
    let rafId = null;
    function updateVars(xPct,yPct){
      hero.style.setProperty('--x', xPct+'%');
      hero.style.setProperty('--y', yPct+'%');
    }
    function handleMove(e){
      const touch = e.touches ? e.touches[0] : e;
      const xPct = (touch.clientX / window.innerWidth) * 100;
      const yPct = (touch.clientY / window.innerHeight) * 100;
      if(rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(()=>{
        updateVars(xPct,yPct);
      });
    }
    window.addEventListener('mousemove',handleMove,{passive:true});
    window.addEventListener('touchmove',handleMove,{passive:true});
  })();

  /* ---------------- Shader resolution tweak for mobile ---------------- */
  (function(){
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const shaderIframe = document.getElementById('shader-iframe');
    if(shaderIframe && isMobile){
      try{
        const url = new URL(shaderIframe.src);
        url.searchParams.set('res','0.5'); // render at 50% resolution
        shaderIframe.src = url.toString();
        console.log('📱 Shader resolution reduced for mobile');
      }catch(err){ console.warn('Shader URL adjust error',err); }
    }
  })();

  /* -------------- Mobile long-press to play GLSL shader -------------- */
  (function(){
    const iframe = document.getElementById('shader-iframe');
    if(!iframe) return;
    // Ensure starts paused
    try{
      const u = new URL(iframe.src);
      u.searchParams.set('paused','true');
      iframe.src = u.toString();
    }catch(err){ console.warn('shader url',err); }
    let timer=null;
    const hero = document.querySelector('.hero');
    if(!hero) return;
    function sendPlay(paused){
      iframe.contentWindow.postMessage(paused? 'pause':'play','*');
    }
    function onStart(){ timer=setTimeout(()=>sendPlay(false),600); }
    function onEnd(){ clearTimeout(timer); sendPlay(true); }
    hero.addEventListener('mousedown',onStart);
    hero.addEventListener('mouseup',onEnd);
    hero.addEventListener('mouseleave',onEnd);
    hero.addEventListener('touchstart',onStart,{passive:true});
    hero.addEventListener('touchend',onEnd);
    hero.addEventListener('touchcancel',onEnd);
  })();

  /* ---------------- Mobile particle effect ---------------- */
  (function(){
    if(window.innerWidth>900) return;
    const canvas=document.getElementById('particle-canvas');
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    let w,h,particles=[],pointer={x:null,y:null,active:false};
    function resize(){w=canvas.width=canvas.clientWidth;h=canvas.height=canvas.clientHeight;}
    resize();window.addEventListener('resize',()=>{resize();seedParticles();});

    const density = 0.00025; // particles per pixel
    function seedParticles(){
      particles=[];
      const count=Math.floor(w*h*density);
      for(let i=0;i<count;i++){
        particles.push({
          x:Math.random()*w,
          y:Math.random()*h,
          vx:(Math.random()-0.5)*0.4,
          vy:(Math.random()-0.5)*0.4,
          r:1.2+Math.random()*2.2,
          alpha:0.4+Math.random()*0.6,
          hue:Math.random()*360
        });
      }
    }
    seedParticles();

    function update(){
      // trail effect
      ctx.globalCompositeOperation='source-over';
      ctx.fillStyle='rgba(15,32,39,0.08)';
      ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation='lighter';
      particles.forEach(p=>{
        if(pointer.active){
          const dx=pointer.x-p.x, dy=pointer.y-p.y, dist=Math.hypot(dx,dy)+0.1;
          const pull= (1/dist)*2;
          p.vx+=dx*pull*0.001;
          p.vy+=dy*pull*0.001;
        }
        p.x+=p.vx;
        p.y+=p.vy;
        // wrap around
        if(p.x<0) p.x+=w; if(p.x>w) p.x-=w; if(p.y<0) p.y+=h; if(p.y>h) p.y-=h;
        ctx.globalAlpha=p.alpha;
        const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2);
        grd.addColorStop(0,`hsla(${p.hue},100%,60%,1)`);
        grd.addColorStop(1,`hsla(${p.hue},100%,60%,0)`);
        ctx.fillStyle=grd;
        ctx.shadowColor=`hsla(${p.hue},100%,60%,0.6)`;
        ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
      });
      requestAnimationFrame(update);
    }
    update();

    function setPointer(x,y){pointer.x=x;pointer.y=y;pointer.active=true;}
    function clearPointer(){pointer.active=false;}

    window.addEventListener('mousemove',e=>setPointer(e.clientX,e.clientY));
    window.addEventListener('mouseleave',clearPointer);
    window.addEventListener('touchstart',e=>{
      const t=e.touches[0];setPointer(t.clientX,t.clientY);
    },{passive:true});
    window.addEventListener('touchmove',e=>{
      const t=e.touches[0];setPointer(t.clientX,t.clientY);
    },{passive:true});
    window.addEventListener('touchend',clearPointer);
    window.addEventListener('touchcancel',clearPointer);
  })();

  let galleries = {};

  // Funzione per creare canvas con stili personalizzati
  function createCanvasContent(ctx, title, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (title.includes('Generative')) {
      // Canvas generativo con pattern
      ctx.fillStyle = '#8A2BE2';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(Math.random() * width, Math.random() * height, 8, 8);
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('GEN', centerX, centerY);
    } else if (title.includes('Interactive')) {
      // Canvas interattivo con cerchi
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('INT', centerX, centerY);
    } else if (title.includes('VFX') || title.includes('Motion')) {
      // Canvas VFX con gradiente
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#FF0080');
      gradient.addColorStop(1, '#00FFFF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('VFX', centerX, centerY);
    } else if (title.includes('AI') || title.includes('Neural')) {
      // Canvas AI con pattern neurale
      ctx.fillStyle = '#1E1E1E';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
      }
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('AI', centerX, centerY);
    } else if (title.includes('Motion')) {
      // Canvas Motion Graphics
      ctx.fillStyle = '#4B0082';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(20, 20, width-40, 20);
      ctx.fillRect(20, centerY-10, width-40, 20);
      ctx.fillRect(20, height-40, width-40, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('MOT', centerX, centerY);
    } else if (title.includes('Creative') || title.includes('Coding') || title.includes('Algoritmic')) {
      // Canvas Creative Coding
      ctx.fillStyle = '#2E8B57';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFB6C1';
      for (let i = 0; i < 10; i++) {
        ctx.fillRect(i * 20, i * 15, 15, 15);
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Montserrat, Arial';
      ctx.fillText('CODE', centerX, centerY);
    } else {
      // Default canvas style
      ctx.fillStyle = '#40e0d0';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Montserrat, Arial';
      ctx.fillText('Canvas', centerX, centerY);
    }
  }

  // 🎬 CANVAS VIDEO SYSTEM - Lightweight video textures
  class CanvasVideoRenderer {
    constructor(canvas, videoSrc, fallbackImageSrc) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.videoSrc = videoSrc;
      this.fallbackImageSrc = fallbackImageSrc;
      this.video = null;
      this.isPlaying = false;
      this.isVisible = false;
      this.animationId = null;
      this.observer = null;
      this.lastFrameTime = 0;
      this.targetFPS = 15; // Limit FPS for performance
      this.frameInterval = 1000 / this.targetFPS;
      
      this.init();
    }

    init() {
      // Setup intersection observer for lazy loading and auto-pause
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.onVisible();
          } else {
            this.onHidden();
          }
        });
      }, { threshold: 0.1 });
      
      this.observer.observe(this.canvas);
      
      // Load fallback image first
      if (this.fallbackImageSrc) {
        this.loadFallbackImage();
      }
      
      // Start loading video immediately for preview
      if (this.videoSrc) {
        this.loadVideo();
      }
    }

    loadFallbackImage() {
      const img = new Image();
      img.onload = () => {
        this.drawImageToCanvas(img);
      };
      img.onerror = () => {
        // If fallback image fails, create procedural content
        createCanvasContent(this.ctx, 'Canvas', this.canvas.width, this.canvas.height);
      };
      img.src = this.fallbackImageSrc;
    }

    drawImageToCanvas(img) {
      const canvasW = this.canvas.width;
      const canvasH = this.canvas.height;
      const imgW = img.width;
      const imgH = img.height;
      
      // Calculate scale to FILL canvas while maintaining aspect ratio (like object-fit: cover)
      const scale = Math.max(canvasW / imgW, canvasH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const offsetX = (canvasW - drawW) / 2;
      const offsetY = (canvasH - drawH) / 2;
      
      this.ctx.clearRect(0, 0, canvasW, canvasH);
      
      // Add subtle background
      this.ctx.fillStyle = '#1a1a2e';
      this.ctx.fillRect(0, 0, canvasW, canvasH);
      
      // Draw image
      this.ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      
      // Add subtle overlay effect
      this.ctx.fillStyle = 'rgba(64, 224, 208, 0.1)';
      this.ctx.fillRect(0, 0, canvasW, canvasH);
    }

    onVisible() {
      this.isVisible = true;
      // Resume video if it was paused
      if (this.video && !this.isPlaying) {
        this.startVideo();
      }
    }

    onHidden() {
      this.isVisible = false;
      // Pause video to save resources when not visible
      this.pauseVideo();
    }

    loadVideo() {
      if (!this.videoSrc) return;
      
      this.video = document.createElement('video');
      this.video.src = this.videoSrc;
      this.video.loop = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.preload = 'metadata';
      
      // Use very low resolution for performance
      this.video.style.width = '240px';
      this.video.style.height = '135px';
      
      this.video.addEventListener('loadeddata', () => {
        // Start video immediately when loaded, regardless of visibility
        this.startVideo();
      });
      
      this.video.addEventListener('error', () => {
        console.warn('⚠️ Canvas video failed to load:', this.videoSrc);
        // Fallback to static image
        if (this.fallbackImageSrc) {
          this.loadFallbackImage();
        }
      });
    }

    startVideo() {
      if (!this.video || this.isPlaying) return;
      
      this.video.play().then(() => {
        this.isPlaying = true;
        this.render();
      }).catch(err => {
        console.warn('⚠️ Canvas video play failed:', err);
        // Keep fallback image
      });
    }

    pauseVideo() {
      if (this.video && this.isPlaying) {
        this.video.pause();
        this.isPlaying = false;
      }
      
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    render(currentTime = 0) {
      if (!this.isPlaying) return;
      
      // Throttle FPS for performance
      if (currentTime - this.lastFrameTime >= this.frameInterval) {
        this.drawVideoFrame();
        this.lastFrameTime = currentTime;
      }
      
      this.animationId = requestAnimationFrame((time) => this.render(time));
    }

    drawVideoFrame() {
      if (!this.video || this.video.readyState < 2) return;
      
      const canvasW = this.canvas.width;
      const canvasH = this.canvas.height;
      const videoW = this.video.videoWidth;
      const videoH = this.video.videoHeight;
      
      if (videoW === 0 || videoH === 0) return;
      
      // Calculate scale to FILL canvas (like object-fit: cover)
      const scale = Math.max(canvasW / videoW, canvasH / videoH);
      const drawW = videoW * scale;
      const drawH = videoH * scale;
      const offsetX = (canvasW - drawW) / 2;
      const offsetY = (canvasH - drawH) / 2;
      
      this.ctx.clearRect(0, 0, canvasW, canvasH);
      
      // Add background
      this.ctx.fillStyle = '#0a0a0a';
      this.ctx.fillRect(0, 0, canvasW, canvasH);
      
      // Draw video frame
      this.ctx.drawImage(this.video, offsetX, offsetY, drawW, drawH);
      
      // Add subtle video overlay effect
      this.ctx.fillStyle = 'rgba(64, 224, 208, 0.05)';
      this.ctx.fillRect(0, 0, canvasW, canvasH);
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
      
      this.pauseVideo();
      
      if (this.video) {
        this.video.src = '';
        this.video.load();
      }
    }
  }

  // Store canvas video renderers for cleanup
  const canvasVideoRenderers = new Map();

  // Funzione per inizializzare una gallery
  function initGallery(sectionId, images) {
    const track = document.querySelector(`#${sectionId}-track`);
    if (!track) {
      console.warn(`⚠️ Track non trovato per sezione: ${sectionId}`);
      return;
    }
    
    const section = track.closest('.section');

    // 1. Calcola slidesPerView reale in base alla larghezza corrente
    let realSPV;
    const w = window.innerWidth;
    if (w <= 320)      realSPV = 1;
    else if (w <= 480) realSPV = 1;
    else if (w <= 600) realSPV = 1.5;
    else if (w <= 900) realSPV = 2;
    else if (w <= 1200) realSPV = 2.5;
    else                realSPV = 3;

    // 2. Crea copia dell'array immagini e aggiungi placeholder se necessario
    const slidesData = [...images];
    const remainder = slidesData.length % Math.ceil(realSPV);
    const fillersNeeded = remainder === 0 ? 0 : Math.ceil(realSPV) - remainder;
    for (let i = 0; i < fillersNeeded; i++) {
      slidesData.push({ placeholder: true, title: `placeholder-${i}` });
    }

    console.log(`📊 [${sectionId}] SPV=${realSPV}, Slide reali=${images.length}, placeholder=${fillersNeeded}, totali=${slidesData.length}`);
 
    // Genera dinamicamente gli item con Swiper slide
    slidesData.forEach((img, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item swiper-slide';
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      if (img.placeholder) {
        item.classList.add('placeholder-slide');
        track.appendChild(item);
        return;
      }
      if (img.video) item.setAttribute('data-video', img.video);
      if (img.description) item.setAttribute('data-description', img.description);

      let mediaEl;
      if (img.canvas) {
        mediaEl = document.createElement('canvas');
        mediaEl.className = 'gallery-canvas';
        // Dimensioni canvas responsive
        mediaEl.width = 300;
        mediaEl.height = 210;
        if (window.innerWidth <= 600) {
          mediaEl.width = 240;
          mediaEl.height = 160;
        }
        
        const ctx = mediaEl.getContext('2d');
        
        // 🎬 NEW: Check if this canvas should have video preview
        // Only create video renderer if it's explicitly marked as canvas-video
        if (img.canvasVideo && img.video) {
          // Create canvas video renderer for dynamic preview
          const canvasId = `${sectionId}-canvas-${index}`;
          mediaEl.id = canvasId;
          
          const renderer = new CanvasVideoRenderer(mediaEl, img.video, img.src);
          canvasVideoRenderers.set(canvasId, renderer);
          
          console.log(`🎬 Canvas video created: ${canvasId} (${img.video})`);
        } else if (img.src) {
          // Static image canvas (existing logic)
          const imageObj = new Image();
          imageObj.onload = function() {
            const canvasW = mediaEl.width;
            const canvasH = mediaEl.height;
            const imgW = imageObj.width;
            const imgH = imageObj.height;
            let scale;
            if (imgH > imgW) {
              scale = Math.min((canvasW * 0.6) / imgW, canvasH / imgH);
            } else {
              scale = Math.min(canvasW / imgW, canvasH / imgH);
            }
            const drawW = imgW * scale;
            const drawH = imgH * scale;
            const offsetX = (canvasW - drawW) / 2;
            const offsetY = (canvasH - drawH) / 2;
            ctx.clearRect(0, 0, canvasW, canvasH);
            ctx.drawImage(imageObj, offsetX, offsetY, drawW, drawH);
          };

          // Se l'immagine non esiste o dà errore, mostra un placeholder testuale
          imageObj.onerror = function() {
            console.warn('⚠️ Canvas fallback, immagine non trovata:', imageObj.src);
            createCanvasContent(ctx, img.title, mediaEl.width, mediaEl.height);
          };
          imageObj.src = img.src;
        } else {
          // Procedural canvas content
          createCanvasContent(ctx, img.title, mediaEl.width, mediaEl.height);
        }
      } else {
        /* Utilizza ImageOptimizer per immagini responsive e lazy */
        const imgFilename = (img.src || '').split('/').pop(); // es. "boccioni.png"
        if (window.createResponsiveImage) {
          // Crea <img> con placeholder base64, attributi data-* e classe "lazy-image"
          mediaEl = window.createResponsiveImage(imgFilename, img.title, 'gallery-img');
        } else {
          // Fallback: comportamento precedente
          mediaEl = document.createElement('img');
          mediaEl.className = 'gallery-img';
          mediaEl.src = img.src;
          mediaEl.alt = img.title;
          mediaEl.onerror = () => { 
            mediaEl.style.display = 'none'; 
            console.log('Immagine non trovata:', mediaEl.src); 
          };
        }
      }

      const titleEl = document.createElement('div');
      titleEl.className = 'gallery-title';
      titleEl.textContent = img.title;

      item.appendChild(mediaEl);
      item.appendChild(titleEl);
      track.appendChild(item);
    });

    // Inizializza Swiper per questa gallery
    const swiperContainer = section.querySelector('.gallery-carousel');
    const totalSlides = slidesData.length;

    // Funzione di blocco preventiva: evita di superare l'ultima slide (mobile: una prima)
    const dynamicBlock = (sw) => {
      const realSPV = (typeof sw.params.slidesPerView === 'number') ? sw.params.slidesPerView : sw.slidesPerViewDynamic();
      const baseLimit = totalSlides - Math.ceil(realSPV);
      // Se visualizzi solo 1 slide (spv ~1) blocca una slide prima per evitare ultima singola
      const extraOffset = realSPV <= 1.05 ? 1 : 0;
      const maxAllowedIndex = Math.max(0, baseLimit - extraOffset);
        
      if (sw.activeIndex >= maxAllowedIndex) {
        sw.allowSlideNext = false;
      } else {
        sw.allowSlideNext = true;
      }
        
      if (sw.activeIndex <= 0) {
        sw.allowSlidePrev = false;
      } else {
        sw.allowSlidePrev = true;
      }
    };

    console.log(`🔍 [${sectionId}] Inizializzo Swiper - BLOCCO MANUALE`);
    
    // -------------------- CLAMP BASED ON TRANSFORM --------------------
    // Funzione che calcola la translate massima consentita e la salva su swiper
    const updateClamp = (sw) => {
      const perView = (typeof sw.params.slidesPerView === 'number') ? sw.params.slidesPerView : sw.slidesPerViewDynamic();
      const space = sw.params.spaceBetween || 0;
      const slideW = sw.slides[0] ? sw.slides[0].offsetWidth + space : 0;
      const maxIndex = Math.max(0, sw.slides.length - Math.ceil(perView));
      sw.__maxTranslate = -slideW * maxIndex; // valore negativo
    };

    // Funzione che forza il transform a non superare il limite
    const clampTranslate = (sw) => {
      if (typeof sw.__maxTranslate === 'undefined') updateClamp(sw);
      const tx = sw.getTranslate(); // valore negativo attuale

      // Evita ricorsione infinita usando un semplice lock
      if (sw.__clampLock) return;

      if (tx < sw.__maxTranslate) {
        sw.__clampLock = true;
        sw.setTranslate(sw.__maxTranslate);
        sw.__clampLock = false;
        sw.allowSlideNext = false;
      } else {
        sw.allowSlideNext = true;
      }
      // prev limite inizio
      if (sw.getTranslate() === 0) {
        sw.allowSlidePrev = false;
      } else {
        sw.allowSlidePrev = true;
      }
    };

    const swiper = new Swiper(swiperContainer, {
      slidesPerView: 3,
      spaceBetween: 40,
      grabCursor: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
          spaceBetween: 16
        },
        480: {
          slidesPerView: 1.5,
          spaceBetween: 16
        },
        600: {
          slidesPerView: 2,
          spaceBetween: 20
        },
        900: {
          slidesPerView: 2.5,
          spaceBetween: 30
        },
        1200: {
          slidesPerView: 3,
          spaceBetween: 40
        }
      },
      speed: 300,
      on: {
        init() {
          updateClamp(this);
        },
        resize() {
          updateClamp(this);
          clampTranslate(this);
        },
        slideChange() {
          clampTranslate(this);
        },
        setTranslate(sw, translate) {
          clampTranslate(sw);
        }
      }
    });

    // Aggiorna clamp su resize esterno (backup)
    window.addEventListener('resize', () => setTimeout(() => {
      updateClamp(swiper);
      clampTranslate(swiper);
    }, 120));
    
    return swiper;
  }

  // Modal functionality
  const modal = document.getElementById('modalVideo');
  const modalPlayer = document.getElementById('modalVideoPlayer');
  const modalDescription = document.getElementById('modalDescription');
  const closeModalBtn = document.getElementById('closeModal');
  
  // Debug controlli modal
  console.log('🔍 Modal elements:', { 
    modal: !!modal, 
    modalPlayer: !!modalPlayer, 
    modalDescription: !!modalDescription, 
    closeModalBtn: !!closeModalBtn 
  });
  
  // Funzione per chiudere il modal
  function closeModalFunction() {
    try {
      if (modal) {
        modal.style.display = 'none';
        if (modalPlayer) {
          modalPlayer.pause();
          modalPlayer.src = '';
        }
        console.log('✅ Modal chiuso');
      }
    } catch (error) {
      console.error('❌ Errore chiusura modal:', error);
    }
  }
  
  // Event listeners per chiudere il modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModalFunction);
    console.log('✅ Event listener close modal aggiunto');
  } else {
    console.warn('⚠️ Pulsante close modal non trovato');
  }
  
  // Chiudi modal cliccando fuori
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModalFunction();
      }
    });
    console.log('✅ Click fuori modal handler aggiunto');
  }

  // Gestione focus per rimuovere focus dai canvas quando necessario
  function manageFocus() {
    // Rimuovi focus dai canvas quando si clicca altrove
    document.addEventListener('click', function(e) {
      const focusedElement = document.activeElement;
      const clickedElement = e.target;
      
      // Se c'è un canvas focalizzato e si clicca fuori da esso
      if (focusedElement && focusedElement.closest('.gallery-item') && 
          !clickedElement.closest('.gallery-item')) {
        focusedElement.blur();
      }
    });
    
    // Rimuovi focus dai canvas quando si fa swipe o scroll
    document.addEventListener('touchstart', function(e) {
      const focusedElement = document.activeElement;
      if (focusedElement && focusedElement.closest('.gallery-item') && 
          !e.target.closest('.gallery-item')) {
        focusedElement.blur();
      }
    });
    
    // Gestione Escape per rimuovere focus
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.closest('.gallery-item')) {
          focusedElement.blur();
        }
      }
    });
  }
  
  // Gestione click semplificata per mobile
  function addClickHandler(element, handler) {
    let touchStartTime = 0;
    let touchMoved = false;
    
    // Gestione touch per mobile
    element.addEventListener('touchstart', function(e) {
      touchStartTime = Date.now();
      touchMoved = false;
      element.style.opacity = '0.8';
    }, { passive: true });
    
    element.addEventListener('touchmove', function(e) {
      touchMoved = true;
    }, { passive: true });
    
    element.addEventListener('touchend', function(e) {
      element.style.opacity = '1';
      const touchDuration = Date.now() - touchStartTime;
      
      // Solo se è un tap veloce e non c'è stato movimento
      if (!touchMoved && touchDuration < 300) {
        e.preventDefault();
        e.stopPropagation();
        // Rimuovi focus prima di eseguire il handler
        if (document.activeElement && document.activeElement !== element) {
          document.activeElement.blur();
        }
        setTimeout(() => handler(e), 50); // Piccolo delay per evitare conflitti
      }
    }, { passive: false });
    
    // Fallback per desktop
    element.addEventListener('click', function(e) {
      if (e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
        handler(e);
      }
    });
  }

  // Carica dati dinamici e inizializza
  console.log('🌍 Environment:', window.APP_ENV);
  
  // Use the dataProvider's fetchJson which handles fallbacks correctly
  window.fetchJson('/api/galleries', 'data/galleries.json')
    .then(data => {
      console.log('📁 Galleries loaded:', Object.keys(data));
      galleries = data;
      Object.entries(data).forEach(([k, v]) => initGallery(k, v));
      afterGalleryInit();
    })
    .catch(err => {
      console.error('❌ Errore fetch galleries:', err);
      // Fallback to local file directly
      fetch('data/galleries.json')
        .then(r => r.json())
        .then(data => {
          console.log('📁 Galleries loaded from fallback:', Object.keys(data));
          galleries = data;
          Object.entries(data).forEach(([k, v]) => initGallery(k, v));
          afterGalleryInit();
        })
        .catch(err2 => console.error('❌ Errore fetch galleries fallback:', err2));
    });

  function afterGalleryInit() {
    // Lazy-loading: inizializza ImageOptimizer una sola volta
    if (window.ImageOptimizer && !window.imageOptimizer) {
      window.imageOptimizer = new ImageOptimizer({
        rootMargin: '300px',
        threshold: 0.1,
        enableWebP: true,
        enableAVIF: true
      });
      console.log('🖼️ ImageOptimizer avviato (gallerie)');
    }

    // Aggiungi click handlers dopo che tutte le gallery sono pronte
    console.log('🔗 Aggiunta click handlers...');
    const galleryItems = document.querySelectorAll('.gallery-item');
    console.log(`📱 Trovati ${galleryItems.length} gallery items`);
    
    galleryItems.forEach((item, index) => {
      if(item.classList.contains('placeholder-slide')) return; // skip filler slides
      const videoSrc = item.getAttribute('data-video');
      const description = item.getAttribute('data-description') || 'Lorem ipsum dolor sit amet.';
      
      // Trova l'immagine corrispondente nell'array
      const titleEl = item.querySelector('.gallery-title');
      if(!titleEl) return;
      const title = titleEl.textContent;
      let imgData = null;
      
      // Cerca nei dati delle gallery
      Object.values(galleries).forEach(gallery => {
        const found = gallery.find(img => img.title === title);
        if (found) imgData = found;
      });

      // RIMOSSO hint overlay "TAP"
      // const hint=document.createElement('div');
      // hint.className='overlay-hint';
      // hint.textContent='TAP';
      // item.appendChild(hint);

      if (modal) {
        item.style.cursor = 'pointer';
        console.log(`🖱️ Aggiungendo click handler per item ${index + 1}`);
        addClickHandler(item, e => {
          const canvas = item.querySelector('.gallery-canvas');
          
          // Gestione dei canvas con comportamenti speciali
          if (canvas && imgData) {
            if (imgData.modalImage) {
              // Mostra immagine singola
              modal.style.display = 'flex';
              modalPlayer.style.display = 'none';
              const modalGallery = document.getElementById('modalGallery');
              if (modalGallery) modalGallery.style.display = 'none';
              const modalImg = document.getElementById('modalImage');
              if (modalImg) {
                modalImg.src = imgData.modalImage;
                modalImg.style.display = '';
                modalImg.onload = function() {
                  if (modalImg.naturalHeight > modalImg.naturalWidth) {
                    // Vertical image - limit width more aggressively
                    modalImg.style.maxWidth = '40vw';
                    modalImg.style.maxHeight = '85vh';
                    modalImg.style.width = 'auto';
                    modalImg.style.height = 'auto';
                  } else {
                    // Horizontal image
                    modalImg.style.maxWidth = '85vw';
                    modalImg.style.maxHeight = '70vh';
                    modalImg.style.width = 'auto';
                    modalImg.style.height = 'auto';
                  }
                };
              }
            } else if (imgData.modalGallery) {
              // Mostra carosello immagini
              modal.style.display = 'flex';
              modalPlayer.style.display = 'none';
              const modalImg = document.getElementById('modalImage');
              if (modalImg) modalImg.style.display = 'none';
              const modalGallery = document.getElementById('modalGallery');
              if (modalGallery) {
                modalGallery.innerHTML = '';
                modalGallery.style.display = '';
                
                const imgs = imgData.modalGallery;
                let galleryIndex = 0;
                
                const galleryContainer = document.createElement('div');
                galleryContainer.className = 'modal-gallery-container';
                
                const galleryTrack = document.createElement('div');
                galleryTrack.className = 'modal-gallery-track';
                
                // Add touch gesture support for mobile navigation
                let touchStartX = 0;
                let touchStartY = 0;
                let touchEndX = 0;
                let touchEndY = 0;
                let isDragging = false;
                const minSwipeDistance = 50; // Minimum distance for swipe
                
                const handleTouchStart = (e) => {
                  touchStartX = e.touches[0].clientX;
                  touchStartY = e.touches[0].clientY;
                  isDragging = true;
                };
                
                const handleTouchMove = (e) => {
                  if (!isDragging) return;
                  
                  touchEndX = e.touches[0].clientX;
                  touchEndY = e.touches[0].clientY;
                  
                  // Calculate distances
                  const deltaX = touchEndX - touchStartX;
                  const deltaY = touchEndY - touchStartY;
                  
                  // Only prevent default if horizontal swipe is dominant
                  if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    e.preventDefault();
                    
                    // Add visual feedback during swipe - only for valid directions
                    const progress = Math.min(Math.abs(deltaX) / minSwipeDistance, 1);
                    const opacity = 0.1 + (progress * 0.2);
                    
                    // Only show feedback if swipe is valid
                    if (deltaX > 0 && galleryIndex > 0) {
                      // Swiping right - show left area (only if not at start)
                      const leftArea = galleryContainer.querySelector('div[style*="left: 0"]');
                      if (leftArea) leftArea.style.opacity = opacity;
                    } else if (deltaX < 0 && galleryIndex < imgs.length - 1) {
                      // Swiping left - show right area (only if not at end)
                      const rightArea = galleryContainer.querySelector('div[style*="right: 0"]');
                      if (rightArea) rightArea.style.opacity = opacity;
                    }
                  }
                };
                
                const handleTouchEnd = (e) => {
                  if (!isDragging) return;
                  isDragging = false;
                  
                  // Reset visual feedback
                  const leftArea = galleryContainer.querySelector('div[style*="left: 0"]');
                  const rightArea = galleryContainer.querySelector('div[style*="right: 0"]');
                  if (leftArea) leftArea.style.opacity = '0';
                  if (rightArea) rightArea.style.opacity = '0';
                  
                  const deltaX = touchEndX - touchStartX;
                  const deltaY = touchEndY - touchStartY;
                  
                  // Only process horizontal swipes
                  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                      // Swipe right - go to previous (only if not at start)
                      if (galleryIndex > 0) {
                        const currentVideo = galleryTrack.children[galleryIndex]?.querySelector('video');
                        if (currentVideo) currentVideo.pause();
                        
                        galleryIndex = galleryIndex - 1;
                        // Ensure we don't go below 0
                        galleryIndex = Math.max(0, galleryIndex);
                        
                        // Calculate precise transform with container width
                        const containerWidth = galleryContainer.offsetWidth;
                        const translateX = -galleryIndex * containerWidth;
                        galleryTrack.style.transform = `translateX(${translateX}px)`;
                        
                        const newVideo = galleryTrack.children[galleryIndex]?.querySelector('video');
                        if (newVideo) newVideo.play().catch(e => console.warn('Video autoplay failed:', e));
                        
                        // Update swipe hint
                        updateSwipeHint();
                      }
                    } else {
                      // Swipe left - go to next (only if not at end)
                      if (galleryIndex < imgs.length - 1) {
                        const currentVideo = galleryTrack.children[galleryIndex]?.querySelector('video');
                        if (currentVideo) currentVideo.pause();
                        
                        galleryIndex = galleryIndex + 1;
                        // Ensure we don't exceed array bounds
                        galleryIndex = Math.min(imgs.length - 1, galleryIndex);
                        
                        // Calculate precise transform with container width
                        const containerWidth = galleryContainer.offsetWidth;
                        const translateX = -galleryIndex * containerWidth;
                        galleryTrack.style.transform = `translateX(${translateX}px)`;
                        
                        const newVideo = galleryTrack.children[galleryIndex]?.querySelector('video');
                        if (newVideo) newVideo.play().catch(e => console.warn('Video autoplay failed:', e));
                        
                        // Update swipe hint
                        updateSwipeHint();
                      }
                    }
                  }
                  
                  // Force alignment to prevent drift
                  setTimeout(() => {
                    const containerWidth = galleryContainer.offsetWidth;
                    const translateX = -galleryIndex * containerWidth;
                    galleryTrack.style.transform = `translateX(${translateX}px)`;
                  }, 50);
                };
                
                // Function to ensure proper alignment and prevent over-scrolling
                const ensureProperAlignment = () => {
                  // Clamp galleryIndex to valid bounds
                  galleryIndex = Math.max(0, Math.min(galleryIndex, imgs.length - 1));
                  
                  const containerWidth = galleryContainer.offsetWidth;
                  const translateX = -galleryIndex * containerWidth;
                  galleryTrack.style.transform = `translateX(${translateX}px)`;
                  
                  // Prevent any CSS transitions that might cause drift
                  galleryTrack.style.transition = 'transform 0.3s ease';
                };
                
                // Add touch event listeners to gallery container
                galleryContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
                galleryContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
                galleryContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
                
                // Ensure proper alignment on window resize
                window.addEventListener('resize', () => {
                  setTimeout(ensureProperAlignment, 100);
                });
                
                // Update swipe hint visibility based on gallery position
                const updateSwipeHint = () => {
                  const swipeHintText = galleryContainer.querySelector('.swipe-hint-text');
                  if (swipeHintText && galleryIndex === imgs.length - 1) {
                    // At the end - show hint
                    swipeHintText.style.opacity = '1';
                    setTimeout(() => {
                      if (galleryIndex === imgs.length - 1) {
                        swipeHintText.style.opacity = '0.7';
                      }
                    }, 2000);
                  } else if (swipeHintText) {
                    swipeHintText.style.opacity = '0';
                  }
                };
                
                // Add visual feedback for swipe areas on mobile
                if (window.innerWidth <= 900) {
                  galleryContainer.style.position = 'relative';
                  
                  // Create invisible swipe areas for better UX
                  const leftSwipeArea = document.createElement('div');
                  leftSwipeArea.style.cssText = `
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 30%;
                    height: 100%;
                    z-index: 15;
                    background: rgba(255,255,255,0.05);
                    opacity: 0;
                    transition: opacity 0.2s;
                    pointer-events: none;
                  `;
                  
                  const rightSwipeArea = document.createElement('div');
                  rightSwipeArea.style.cssText = `
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: 30%;
                    height: 100%;
                    z-index: 15;
                    background: rgba(255,255,255,0.05);
                    opacity: 0;
                    transition: opacity 0.2s;
                    pointer-events: none;
                  `;
                  
                  // Add swipe hint text at the end
                  const swipeHintText = document.createElement('div');
                  swipeHintText.className = 'swipe-hint-text';
                  swipeHintText.style.cssText = `
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: rgba(255,255,255,0.7);
                    font-size: 0.9rem;
                    text-align: center;
                    z-index: 20;
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                    background: rgba(0,0,0,0.5);
                    padding: 8px 12px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                  `;
                  swipeHintText.innerHTML = '← Swipe indietro';
                  
                  // Show swipe areas briefly on touch
                  const showSwipeHint = () => {
                    if (galleryIndex > 0) {
                      leftSwipeArea.style.opacity = '1';
                      setTimeout(() => leftSwipeArea.style.opacity = '0', 200);
                    }
                    if (galleryIndex < imgs.length - 1) {
                      rightSwipeArea.style.opacity = '1';
                      setTimeout(() => rightSwipeArea.style.opacity = '0', 200);
                    }
                    updateSwipeHint();
                  };
                  
                  galleryContainer.addEventListener('touchstart', showSwipeHint);
                  galleryContainer.appendChild(leftSwipeArea);
                  galleryContainer.appendChild(rightSwipeArea);
                  galleryContainer.appendChild(swipeHintText);
                  
                  // Initial hint update and show when reaching the end
                  setTimeout(updateSwipeHint, 500);
                  
                  // Show hint when user reaches the end for the first time
                  let hasShownEndHint = false;
                  const originalUpdateSwipeHint = updateSwipeHint;
                  updateSwipeHint = () => {
                    originalUpdateSwipeHint();
                    if (galleryIndex === imgs.length - 1 && !hasShownEndHint) {
                      hasShownEndHint = true;
                      const swipeHintText = galleryContainer.querySelector('.swipe-hint-text');
                      if (swipeHintText) {
                        swipeHintText.style.opacity = '1';
                        setTimeout(() => {
                          if (swipeHintText) swipeHintText.style.opacity = '0.7';
                        }, 3000);
                      }
                    }
                  };
                }
                
                imgs.forEach((mediaSrc, index) => {
                  // 🎬 NEW: Detect if media is video or image
                  const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(mediaSrc);
                  
                  let mediaEl;
                  if (isVideo) {
                    // Create video element
                    mediaEl = document.createElement('video');
                    mediaEl.src = mediaSrc;
                    mediaEl.className = 'modal-gallery-video';
                    mediaEl.controls = true;
                    mediaEl.muted = true;
                    mediaEl.loop = true;
                    mediaEl.preload = 'metadata';
                    mediaEl.playsInline = true;
                    
                    // Optimized video sizing
                    mediaEl.style.maxWidth = '90vw';
                    mediaEl.style.maxHeight = '70vh';
                    mediaEl.style.width = '100%';
                    mediaEl.style.height = 'auto';
                    mediaEl.style.objectFit = 'contain';
                    
                    // Auto-play when visible (with intersection observer)
                    const videoObserver = new IntersectionObserver((entries) => {
                      entries.forEach(entry => {
                        if (entry.isIntersecting) {
                          mediaEl.play().catch(e => console.warn('Video autoplay failed:', e));
                        } else {
                          mediaEl.pause();
                        }
                      });
                    }, { threshold: 0.5 });
                    
                    videoObserver.observe(mediaEl);
                    
                    console.log(`🎬 Modal gallery video created: ${mediaSrc}`);
                  } else {
                    // Create image element (existing logic)
                    mediaEl = document.createElement('img');
                    mediaEl.src = mediaSrc;
                    mediaEl.className = 'modal-gallery-img';
                    mediaEl.onload = function() {
                      if (mediaEl.naturalHeight > mediaEl.naturalWidth) {
                        // Vertical image - limit width more aggressively
                        mediaEl.style.maxWidth = '40vw';
                        mediaEl.style.maxHeight = '85vh';
                        mediaEl.style.width = 'auto';
                        mediaEl.style.height = 'auto';
                      } else {
                        // Horizontal image
                        mediaEl.style.maxWidth = '85vw';
                        mediaEl.style.maxHeight = '70vh';
                        mediaEl.style.width = 'auto';
                        mediaEl.style.height = 'auto';
                      }
                    };
                  }
                  
                  galleryTrack.appendChild(mediaEl);
                });
                
                galleryContainer.appendChild(galleryTrack);
                
                if (imgs.length > 1) {
                  const prevButton = document.createElement('button');
                  prevButton.className = 'modal-gallery-btn prev';
                  prevButton.innerHTML = '&#8592;';
                  prevButton.addEventListener('click', () => {
                    // Only proceed if not at start
                    if (galleryIndex <= 0) return;
                    
                    // Pause current video if playing
                    const currentVideo = galleryTrack.children[galleryIndex]?.querySelector('video');
                    if (currentVideo) currentVideo.pause();
                    
                    galleryIndex = galleryIndex - 1;
                    // Ensure we don't go below 0
                    galleryIndex = Math.max(0, galleryIndex);
                    
                    // Calculate precise transform with container width
                    const containerWidth = galleryContainer.offsetWidth;
                    const translateX = -galleryIndex * containerWidth;
                    galleryTrack.style.transform = `translateX(${translateX}px)`;
                    
                    // Auto-play new video if it exists
                    const newVideo = galleryTrack.children[galleryIndex]?.querySelector('video');
                    if (newVideo) newVideo.play().catch(e => console.warn('Video autoplay failed:', e));
                    
                    // Update swipe hint if function exists
                    if (typeof updateSwipeHint === 'function') updateSwipeHint();
                  });
                  
                  const nextButton = document.createElement('button');
                  nextButton.className = 'modal-gallery-btn next';
                  nextButton.innerHTML = '&#8594;';
                  nextButton.addEventListener('click', () => {
                    // Only proceed if not at end
                    if (galleryIndex >= imgs.length - 1) return;
                    
                    // Pause current video if playing
                    const currentVideo = galleryTrack.children[galleryIndex]?.querySelector('video');
                    if (currentVideo) currentVideo.pause();
                    
                    galleryIndex = galleryIndex + 1;
                    // Ensure we don't exceed array bounds
                    galleryIndex = Math.min(imgs.length - 1, galleryIndex);
                    
                    // Calculate precise transform with container width
                    const containerWidth = galleryContainer.offsetWidth;
                    const translateX = -galleryIndex * containerWidth;
                    galleryTrack.style.transform = `translateX(${translateX}px)`;
                    
                    // Auto-play new video if it exists
                    const newVideo = galleryTrack.children[galleryIndex]?.querySelector('video');
                    if (newVideo) newVideo.play().catch(e => console.warn('Video autoplay failed:', e));
                    
                    // Update swipe hint if function exists
                    if (typeof updateSwipeHint === 'function') updateSwipeHint();
                  });
                  
                  galleryContainer.appendChild(prevButton);
                  galleryContainer.appendChild(nextButton);
                }
                
                modalGallery.appendChild(galleryContainer);
              }
            }
            else if (imgData.video || videoSrc) {
              // Open video in modal when canvas overlay is present
              modal.style.display = 'flex';
              modalPlayer.style.display = '';
              const modalImg = document.getElementById('modalImage');
              if (modalImg) modalImg.style.display = 'none';
              const modalGallery = document.getElementById('modalGallery');
              if (modalGallery) modalGallery.style.display = 'none';

              const src = videoSrc || imgData.video;
              modalPlayer.src = src;
              modalPlayer.play();
            }
          } else if (canvas && !imgData) {
            // Canvas senza dati specifici - mostra messaggio di demo
            console.log('Canvas clicked but no specific data found');
          } else if (videoSrc && modalPlayer) {
            // Default: video per immagini normali
            modal.style.display = 'flex';
            modalPlayer.style.display = '';
            const modalImg = document.getElementById('modalImage');
            if (modalImg) modalImg.style.display = 'none';
            const modalGallery = document.getElementById('modalGallery');
            if (modalGallery) modalGallery.style.display = 'none';
            modalPlayer.src = videoSrc;
            modalPlayer.play();
          }
          
          if (modalDescription) modalDescription.textContent = description;
          item.classList.add('opened');
        });
      }
    });
  }

  console.log('🎉 Portfolio: Inizializzazione completata con successo!');
}); 

  // ---------------- sito meta (bio, contatti, visibilità sezioni) ----------------
  // Load site configuration with robust fallbacks and cache busting
  const loadSiteConfig = async (bustCache = false) => {
    console.log('🔧 Loading site configuration...');
    
    // Wait for dataProvider to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Cache busting parameter
    const cacheBuster = bustCache ? `?_cb=${Date.now()}` : '';
    
    // Try dataProvider's fetchJson first (handles Firestore in prod)
    if (window.fetchJson) {
      try {
        const site = await window.fetchJson(`/api/site${cacheBuster}`, `data/site.json${cacheBuster}`);
        console.log('✅ Site config loaded via dataProvider:', site);
        return site;
      } catch(err) {
        console.error('❌ DataProvider site load error:', err);
      }
    }
    
    // Fallback to direct file fetch
    try {
      console.log('🔄 Trying direct fetch to data/site.json');
      const response = await fetch(`data/site.json${cacheBuster}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const site = await response.json();
      console.log('✅ Site config loaded via direct fetch:', site);
      return site;
    } catch(err) {
      console.error('❌ Direct fetch site load error:', err);
      throw new Error('Failed to load site configuration');
    }
  };
  
  // Apply site configuration to the page
  const applySiteConfig = (site) => {
    try {
      const applyHero = text => {
        document.querySelectorAll('.fa3io-text').forEach(el => {
          el.textContent = text;
          el.classList.remove('preload');
        });
      };
      
      // Bio
      const aboutTextEl = document.querySelector('.about-text');
      if (aboutTextEl && site.bio) aboutTextEl.textContent = site.bio;
      if (site.heroText) { applyHero(site.heroText); }

      // Contatti
      const contactSection = document.getElementById('contact');
      if (contactSection && Array.isArray(site.contacts)) {
        const contactsContainer = document.createElement('div');
        contactsContainer.className = 'contacts-container';
        
        site.contacts.forEach(c => {
          // Skip hidden contacts
          if (c.visible === false) return;
          
          const contactItem = document.createElement('div');
          contactItem.className = 'contact-item';
          
          // Create clickable link if it's a URL or email
          let valueElement;
          if (c.value.includes('@')) {
            valueElement = `<a href="mailto:${c.value}" class="contact-link">${c.value}</a>`;
          } else if (c.value.includes('http')) {
            valueElement = `<a href="${c.value}" target="_blank" rel="noopener noreferrer" class="contact-link">${c.value}</a>`;
          } else {
            valueElement = `<span class="contact-text">${c.value}</span>`;
          }
          
          contactItem.innerHTML = `
            <div class="contact-info">
              <div class="contact-label">${c.label}</div>
              <div class="contact-value">${valueElement}</div>
            </div>
          `;
          
          contactsContainer.appendChild(contactItem);
        });
        
        contactSection.innerHTML = '<h2 id="contact-heading">CONTACT</h2>';
        contactSection.appendChild(contactsContainer);
      }

      // Sezioni
      site.sections?.forEach(sec => {
        const id = sec.key;
        const sectionEl = document.getElementById(id);
        const navLink = document.querySelector(`.menu a[href="#${id}"]`);
        const heading = document.querySelector(`#${id}-heading`);
        if (!sectionEl) return;
        const status = sec.status || (sec.visible === false ? 'hide' : 'show');
        if (status === 'hide') {
          sectionEl.style.display = 'none';
          if (navLink) navLink.style.display = 'none';
        } else {
          if (sec.label) {
            if (heading) heading.textContent = sec.label;
            if (navLink) navLink.textContent = sec.label;
          }
          if (status === 'soon') {
            const galleryCarousel = sectionEl.querySelector('.gallery-carousel');
            if (galleryCarousel) galleryCarousel.style.display = 'none';
            const placeholder = document.createElement('p');
            placeholder.className = 'coming-soon';
            placeholder.textContent = 'Coming Soon';
            placeholder.style.color = '#fff';
            placeholder.style.textAlign = 'center';
            placeholder.style.fontSize = '1.4rem';
            placeholder.style.padding = '40px 0';
            sectionEl.appendChild(placeholder);
          }
        }
      });
      
      // aggiorna apiBase per fetch futuri
      if (site.apiBase) {
        window.__API_BASE = site.apiBase;
        if (!location.origin.includes(site.apiBase)) {
          fetch(`${site.apiBase}/api/site`).then(r => r.ok ? r.json() : null).then(remote => {
            if (remote) {
              Object.assign(site, remote);
              if (remote.heroText) { applyHero(remote.heroText); }
            }
          }).catch(() => {});
        }
      }
      if (site.shaderUrl) {
        const sh = document.getElementById('shader-iframe');
        if (sh) sh.src = site.shaderUrl;
      }

      // Versione sito
      const versionEl = document.getElementById('version');
      if (versionEl && site.version) {
        versionEl.textContent = site.version;
      }
      
      // Site name
      const siteNameEl = document.getElementById('site-name');
      const heroTitleEl = document.getElementById('hero-title');
      if (site.siteName) {
        if (siteNameEl) siteNameEl.textContent = site.siteName;
        if (heroTitleEl) heroTitleEl.textContent = site.siteName;
      }
      
      // Logo visibility
      if (site.showLogo) {
        // Show logos if enabled
        const headerLogo = document.querySelector('.logo img');
        const heroLogo = document.querySelector('.center-logo img');
        if (!headerLogo) {
          const img = document.createElement('img');
          img.src = 'logo.png';
          img.alt = site.siteName || 'Logo';
          img.onerror = function() { this.style.display = 'none'; };
          document.querySelector('.logo').insertBefore(img, document.getElementById('site-name'));
        }
        if (!heroLogo) {
          const img = document.createElement('img');
          img.src = 'logo.png';
          img.alt = site.siteName || 'Logo';
          img.style.width = '60px';
          img.onerror = function() { this.style.display = 'none'; };
          document.querySelector('.center-logo').insertBefore(img, document.getElementById('hero-title'));
        }
      } else {
        // Hide logos if disabled
        const headerLogo = document.querySelector('.logo img');
        const heroLogo = document.querySelector('.center-logo img');
        if (headerLogo) headerLogo.style.display = 'none';
        if (heroLogo) heroLogo.style.display = 'none';
      }
    } catch (err) { 
      console.error('Errore applicazione site meta', err); 
    }
  };
  
  // Store current site config for comparison
  let currentSiteConfig = null;
  
  // Check for site config updates
  const checkForSiteUpdates = async () => {
    try {
      console.log('🔍 Checking for site configuration updates...');
      const newSiteConfig = await loadSiteConfig(true); // Force cache bust
      
      if (currentSiteConfig) {
        // Create a deep comparison hash for better change detection
        const currentHash = JSON.stringify(currentSiteConfig);
        const newHash = JSON.stringify(newSiteConfig);
        
        if (currentHash !== newHash) {
          console.log('🔄 Site configuration changes detected');
          console.log('Previous config:', currentSiteConfig);
          console.log('New config:', newSiteConfig);
          
          // Check if version has changed
          if (currentSiteConfig.version !== newSiteConfig.version) {
            console.log(`🔄 Site version updated: ${currentSiteConfig.version} → ${newSiteConfig.version}`);
            showUpdateNotification(newSiteConfig.version);
          }
          
          // Apply all changes
          applySiteConfig(newSiteConfig);
          
          // Show generic update notification if no version change
          if (currentSiteConfig.version === newSiteConfig.version) {
            showUpdateNotification('Contenuto aggiornato');
          }
        } else {
          console.log('✅ No site configuration changes detected');
        }
      }
      
      currentSiteConfig = newSiteConfig;
    } catch (err) {
      console.error('❌ Error checking for site updates:', err);
    }
  };
  
  // Show update notification to user
  const showUpdateNotification = (newVersion) => {
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #40e0d0, #ff0080);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
      cursor: pointer;
      backdrop-filter: blur(10px);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 20px;">🚀</div>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Sito aggiornato!</div>
          <div style="opacity: 0.9; font-size: 12px;">Versione ${newVersion}</div>
        </div>
        <div style="margin-left: auto; font-size: 18px; opacity: 0.7;">×</div>
      </div>
    `;
    
    // Add animation keyframes
    if (!document.getElementById('update-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'update-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Remove existing notification if present
    const existing = document.getElementById('update-notification');
    if (existing) existing.remove();
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    });
  };
  
  // Listen for admin updates via localStorage
  const listenForAdminUpdates = () => {
    window.addEventListener('storage', (e) => {
      if (e.key === 'admin-update-trigger' && e.newValue) {
        try {
          const updateInfo = JSON.parse(e.newValue);
          if (updateInfo.type === 'site-config-update') {
            console.log('🔄 Admin update detected:', updateInfo.displayName);
            
            // Force immediate config reload
            setTimeout(() => {
              checkForSiteUpdates();
            }, 500); // Small delay to ensure admin save is complete
          }
        } catch (err) {
          console.error('Error parsing admin update trigger:', err);
        }
      }
    });
    
    // Also check for persistent markers on page load/focus
    const checkPersistentUpdates = () => {
      try {
        const lastUpdate = localStorage.getItem('last-admin-update');
        if (lastUpdate) {
          const updateInfo = JSON.parse(lastUpdate);
          const timeSinceUpdate = Date.now() - updateInfo.timestamp;
          
          // If update was less than 5 minutes ago, force a refresh
          if (timeSinceUpdate < 5 * 60 * 1000) {
            console.log('🔄 Recent admin update detected, forcing refresh');
            setTimeout(() => {
              checkForSiteUpdates();
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Error checking persistent updates:', err);
      }
    };
    
    // Check on page load
    checkPersistentUpdates();
    
    // Check when page regains focus
    window.addEventListener('focus', checkPersistentUpdates);
  };
  
  // Initial load
  loadSiteConfig()
    .then(site => {
      currentSiteConfig = site;
      applySiteConfig(site);
      
      // Start with more frequent polling for the first few minutes
      let pollCount = 0;
      const pollInterval = setInterval(() => {
        checkForSiteUpdates();
        pollCount++;
        
        // After 10 polls (5 minutes), reduce frequency
        if (pollCount >= 10) {
          clearInterval(pollInterval);
          // Start regular polling every 30 seconds
          setInterval(checkForSiteUpdates, 30000);
        }
      }, 30000); // Check every 30 seconds initially
      
      // Also do an immediate check after 5 seconds
      setTimeout(checkForSiteUpdates, 5000);
      
      // Listen for admin updates
      listenForAdminUpdates();
    })
    .catch(err => console.error('Errore fetch site meta', err)); 

document.addEventListener('DOMContentLoaded',()=>{
  // Apply pulse animation to gallery cards until first interaction
  const galleryItems=document.querySelectorAll('.gallery-item');
  galleryItems.forEach(item=>{
    item.classList.add('pulse');
    const clearPulse=()=>{item.classList.remove('pulse');item.removeEventListener('pointerdown',clearPulse);};
    item.addEventListener('pointerdown',clearPulse,{once:true});
  });

  // Arrow scroll hint for horizontal carousels
  const carousels=document.querySelectorAll('.gallery-carousel');
  carousels.forEach(carousel=>{
    if(carousel.scrollWidth<=carousel.clientWidth) return; // no overflow
    const hint=document.createElement('div');
    hint.className='scroll-hint';
    hint.textContent='›';
    carousel.style.position='relative';
    carousel.appendChild(hint);
    let removed=false;
    function removeHint(){
      if(removed) return; removed=true; hint.remove();
      carousel.removeEventListener('scroll',onScroll);
    }
    function onScroll(){ if(Math.abs(carousel.scrollLeft)>8){ removeHint(); } }
    carousel.addEventListener('scroll',onScroll);
    // Fallback: rimuovi comunque dopo 4s
    setTimeout(removeHint,4000);
  });

  // Fade-in shader iframe after load
  const shader=document.getElementById('shader-iframe');
  const logoEl=document.querySelector('.center-logo');
  const shaderLoader=document.getElementById('shaderLoader');
  const hideShaderLoader=()=>{ if(shaderLoader) shaderLoader.classList.add('hide'); };
  if(shader){ shader.addEventListener('load',()=>{
      shader.classList.add('loaded');
      if(logoEl) logoEl.classList.add('loaded');
      hideShaderLoader();
    });
  }else{
    if(logoEl) logoEl.classList.add('loaded');
    hideShaderLoader();
  }

  /* Mobile GLSL shader fetched from API */
  (async function(){
    if(window.innerWidth>900) return; // only mobile
    const canvas=document.getElementById('mobile-shader');
    if(!canvas){console.warn('[MobileShader] canvas not found'); return;}
    const hasGL= typeof GlslCanvas!=='undefined';
    const loadShaderText = async ()=>{
      // Try to load from local file first
      try {
        const res = await fetch('data/mobile_shader.glsl');
        if(res.ok) {
          const shaderText = await res.text();
          console.log('📱 Mobile shader loaded from local file');
          return shaderText;
        }
      } catch(e) { 
        console.warn('Local mobile shader file failed, trying other sources:', e); 
      }
      
      // Fallback to Firestore in production
      if(window.APP_ENV === 'prod' && window.getSiteProd) {
        try {
          const site = await window.getSiteProd();
          if(site.mobileShader) {
            console.log('📱 Mobile shader loaded from Firestore');
            return site.mobileShader;
          }
        } catch(e) { 
          console.warn('Firestore mobileShader failed',e); 
        }
      }
      
      // Fallback to API endpoint
      try{
        const res= await fetch('/api/mobileShader');
        if(res.ok){ 
          console.log('📱 Mobile shader loaded from API');
          return await res.text(); 
        }
      }catch(e){ console.warn('fetch mobileShader API failed',e); }
      
      // Final fallback to inline shader
      const fragEl=document.getElementById('mobile-shader-code');
      if(fragEl && fragEl.textContent) {
        console.log('📱 Mobile shader loaded from inline script');
        return fragEl.textContent;
      }
      
      console.error('❌ No mobile shader source available');
      return null;
    };

    if(hasGL){
      const shaderText = await loadShaderText();
      if(!shaderText){console.error('No shader text available');return;}
      const sandbox=new GlslCanvas(canvas);
      sandbox.load(shaderText);
      console.log('[MobileShader] GLSL initialized');
      hideShaderLoader();
      const resize=()=>{const ratio=window.devicePixelRatio||1;const scale=0.5;canvas.width=canvas.clientWidth*scale*ratio;canvas.height=canvas.clientHeight*scale*ratio;};
      resize();window.addEventListener('resize',resize);
    }else{
      console.warn('[MobileShader] GlslCanvas undefined – trying dynamic import');
      import('https://cdn.skypack.dev/glslCanvas').then(mod=>{
        const Glsl=mod.default||mod.GlslCanvas||window.GlslCanvas;
        if(!Glsl){throw new Error('glslCanvas not resolved');}
        return loadShaderText().then(text=>{
           const sandbox=new Glsl(canvas);
           sandbox.load(text);
           console.log('[MobileShader] GLSL initialized (dynamic)');
           hideShaderLoader();
           const resize=()=>{const ratio=window.devicePixelRatio||1;const scale=0.5;canvas.width=canvas.clientWidth*scale*ratio;canvas.height=canvas.clientHeight*scale*ratio;};
           resize();window.addEventListener('resize',resize);
        });
      }).catch(err=>{
        console.error('glslCanvas dynamic import failed',err);
        // Fallback 2D gradient
        const ctx=canvas.getContext('2d');
        function resize2d(){canvas.width=canvas.clientWidth;canvas.height=canvas.clientHeight;}
        resize2d();window.addEventListener('resize',resize2d);
        function draw(t){requestAnimationFrame(draw);const w=canvas.width,h=canvas.height;const time=t*0.0004;const grd=ctx.createRadialGradient(w*0.5+Math.sin(time)*w*0.2,h*0.4+Math.cos(time*1.3)*h*0.2,0,w/2,h/2,Math.max(w,h)*0.7);const hue=(time*40)%360;grd.addColorStop(0,`hsl(${hue},70%,55%)`);grd.addColorStop(1,'#001820');ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);}draw();
        hideShaderLoader();
      });
    }
  })();

  /* Mobile 3D model removed: fallback to lightweight CSS aura */
}); 

// Update footer with environment info
document.addEventListener('DOMContentLoaded', () => {
  const envSpan = document.getElementById('environment');
  if (envSpan) {
    const env = window.APP_ENV || 'local';
    const envColors = {
      local: '#28a745',     // green
      preprod: '#ffc107',   // yellow
      prod: '#dc3545'       // red
    };
    
    const envNames = {
      local: 'LOCAL',
      preprod: 'PRE-PROD',
      prod: 'PRODUCTION'
    };
    
    envSpan.innerHTML = `ENV: <span style="color: ${envColors[env] || '#6c757d'}; font-weight: bold;">${envNames[env] || env.toUpperCase()}</span>`;
  }
});

console.log('Portfolio script loaded'); 

// Cleanup function for canvas video renderers
function cleanupCanvasVideos() {
  canvasVideoRenderers.forEach((renderer, id) => {
    renderer.destroy();
  });
  canvasVideoRenderers.clear();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupCanvasVideos); 
window.addEventListener('beforeunload', cleanupCanvasVideos); 