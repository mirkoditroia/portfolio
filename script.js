// ---------------- Global helper to load JSON with fallback ----------------
function fetchJson(primaryUrl, fallbackUrl){
  return fetch(primaryUrl).then(res=>{
    if(res.ok) return res.json();
    return fetch(fallbackUrl).then(r=>r.json());
  }).catch(()=> fetch(fallbackUrl).then(r=>r.json()));
}

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
    } else if (title.includes('VFX')) {
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
    slidesData.forEach(img => {
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
        // Imposto dimensioni canvas responsive
        mediaEl.width = 300;
        mediaEl.height = 210;
        if (window.innerWidth <= 480) {
          mediaEl.width = 240;
          mediaEl.height = 160;
        } else if (window.innerWidth <= 600) {
          mediaEl.width = 270;
          mediaEl.height = 180;
        }
        
        const ctx = mediaEl.getContext('2d');
        if (img.src) {
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
          imageObj.src = img.src;
        } else {
          createCanvasContent(ctx, img.title, mediaEl.width, mediaEl.height);
        }
      } else {
        mediaEl = document.createElement('img');
        mediaEl.className = 'gallery-img';
        mediaEl.src = img.src;
        mediaEl.alt = img.title;
        mediaEl.onerror = () => { 
          mediaEl.style.display = 'none'; 
          console.log('Immagine non trovata:', mediaEl.src); 
        };
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
      if (tx < sw.__maxTranslate) {
        sw.setTranslate(sw.__maxTranslate);
        sw.allowSlideNext = false;
      } else {
        sw.allowSlideNext = true;
      }
      // prev
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
  fetchJson('/api/galleries','data/galleries.json')
    .then(data=>{ galleries=data; Object.entries(data).forEach(([k,v])=>initGallery(k,v)); afterGalleryInit(); })
    .catch(err=>console.error('❌ Errore fetch galleries.json', err));

  function afterGalleryInit() {
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
                    modalImg.style.maxWidth = '60vw';
                    modalImg.style.maxHeight = '80vh';
                  } else {
                    modalImg.style.maxWidth = '90vw';
                    modalImg.style.maxHeight = '60vh';
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
                
                imgs.forEach((imgSrc, index) => {
                  const imgEl = document.createElement('img');
                  imgEl.src = imgSrc;
                  imgEl.className = 'modal-gallery-img';
                  imgEl.onload = function() {
                    if (imgEl.naturalHeight > imgEl.naturalWidth) {
                      imgEl.style.maxWidth = '60vw';
                      imgEl.style.maxHeight = '80vh';
                    } else {
                      imgEl.style.maxWidth = '90vw';
                      imgEl.style.maxHeight = '60vh';
                    }
                  };
                  galleryTrack.appendChild(imgEl);
                });
                
                galleryContainer.appendChild(galleryTrack);
                
                if (imgs.length > 1) {
                  const prevButton = document.createElement('button');
                  prevButton.className = 'modal-gallery-btn prev';
                  prevButton.innerHTML = '&#8592;';
                  prevButton.addEventListener('click', () => {
                    galleryIndex = (galleryIndex - 1 + imgs.length) % imgs.length;
                    galleryTrack.style.transform = `translateX(-${galleryIndex * 100}%)`;
                  });
                  
                  const nextButton = document.createElement('button');
                  nextButton.className = 'modal-gallery-btn next';
                  nextButton.innerHTML = '&#8594;';
                  nextButton.addEventListener('click', () => {
                    galleryIndex = (galleryIndex + 1) % imgs.length;
                    galleryTrack.style.transform = `translateX(-${galleryIndex * 100}%)`;
                  });
                  
                  galleryContainer.appendChild(prevButton);
                  galleryContainer.appendChild(nextButton);
                }
                
                modalGallery.appendChild(galleryContainer);
              }
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
  fetchJson('/api/site','data/site.json')
    .then(site=>{
      try{
        // Bio
        const aboutTextEl = document.querySelector('.about-text');
        if(aboutTextEl && site.bio) aboutTextEl.textContent = site.bio;

        // Contatti
        const contactSection = document.getElementById('contact');
        if(contactSection && Array.isArray(site.contacts)){
          const list = document.createElement('ul');
          site.contacts.forEach(c=>{
            const li = document.createElement('li');
            li.innerHTML = `<strong>${c.label}:</strong> <a href="${c.value.startsWith('http')?'': 'mailto:'}${c.value}" target="_blank" rel="noopener">${c.value}</a>`;
            list.appendChild(li);
          });
          contactSection.innerHTML = '<h2 id="contact-heading">CONTACT</h2>';
          contactSection.appendChild(list);
        }

        // Sezioni
        site.sections?.forEach(sec=>{
          const id = sec.key;
          const sectionEl = document.getElementById(id);
          const navLink   = document.querySelector(`.menu a[href="#${id}"]`);
          const heading   = document.querySelector(`#${id}-heading`);
          if(!sectionEl) return;
          const status = sec.status || (sec.visible===false? 'hide':'show');
          if(status==='hide'){
            sectionEl.style.display='none';
            if(navLink) navLink.style.display='none';
          }else{
            if(sec.label){
              if(heading) heading.textContent = sec.label;
              if(navLink) navLink.textContent = sec.label;
            }
            if(status==='soon'){
              const galleryCarousel = sectionEl.querySelector('.gallery-carousel');
              if(galleryCarousel) galleryCarousel.style.display='none';
              const placeholder=document.createElement('p');
              placeholder.className='coming-soon';
              placeholder.textContent='Coming Soon';
              placeholder.style.color='#fff';
              placeholder.style.textAlign='center';
              placeholder.style.fontSize='1.4rem';
              placeholder.style.padding='40px 0';
              sectionEl.appendChild(placeholder);
            }
          }
        });
        // aggiorna apiBase per fetch futuri
        if(site.apiBase){ window.__API_BASE = site.apiBase; }
        if(site.shaderUrl){
          const sh=document.getElementById('shader-iframe');
          if(sh) sh.src = site.shaderUrl;
        }
      }catch(err){ console.error('Errore applicazione site meta',err); }
    })
    .catch(err=>console.error('Errore fetch site meta',err)); 

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
  if(shader){ shader.addEventListener('load',()=>{
      shader.classList.add('loaded');
      if(logoEl) logoEl.classList.add('loaded');
    });
  }else{
    if(logoEl) logoEl.classList.add('loaded');
  }

  /* Mobile lightweight GLSL shader */
  (function(){
    if(window.innerWidth>900) return; // only mobile
    const canvas=document.getElementById('mobile-shader');
    if(!canvas){console.warn('[MobileShader] canvas not found'); return;}
    const hasGL= typeof GlslCanvas!=='undefined';
    if(hasGL){
      const sandbox=new GlslCanvas(canvas);
      console.log('[MobileShader] GLSL initialized');
      const frag=document.getElementById('mobile-shader-code');
      if(!frag) return;
      sandbox.load(frag.textContent);
      function resize(){
        const ratio=window.devicePixelRatio||1;
        const scale=0.5; // render at half res for perf
        canvas.width = canvas.clientWidth*scale*ratio;
        canvas.height= canvas.clientHeight*scale*ratio;
      }
      resize();
      window.addEventListener('resize',resize);
    }else{
      console.warn('[MobileShader] GlslCanvas undefined – trying dynamic import');
      import('https://cdn.skypack.dev/glslCanvas').then(mod=>{
        const Glsl=mod.default||mod.GlslCanvas||window.GlslCanvas;
        if(!Glsl){throw new Error('glslCanvas not resolved');}
        const sandbox=new Glsl(canvas);
        console.log('[MobileShader] GLSL initialized (dynamic)');
        const frag=document.getElementById('mobile-shader-code');
        if(!frag) return;
        sandbox.load(frag.textContent);
        function resize(){const ratio=window.devicePixelRatio||1;const scale=0.5;canvas.width=canvas.clientWidth*scale*ratio;canvas.height=canvas.clientHeight*scale*ratio;}
        resize();window.addEventListener('resize',resize);
      }).catch(err=>{
        console.error('glslCanvas dynamic import failed',err);
        // Fallback 2D gradient
        const ctx=canvas.getContext('2d');
        function resize2d(){canvas.width=canvas.clientWidth;canvas.height=canvas.clientHeight;}
        resize2d();window.addEventListener('resize',resize2d);
        function draw(t){requestAnimationFrame(draw);const w=canvas.width,h=canvas.height;const time=t*0.0004;const grd=ctx.createRadialGradient(w*0.5+Math.sin(time)*w*0.2,h*0.4+Math.cos(time*1.3)*h*0.2,0,w/2,h/2,Math.max(w,h)*0.7);const hue=(time*40)%360;grd.addColorStop(0,`hsl(${hue},70%,55%)`);grd.addColorStop(1,'#001820');ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);}draw();
      });
    }
  })();

  /* Mobile 3D model removed: fallback to lightweight CSS aura */
}); 