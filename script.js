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
          }
        });
      });
      console.log('✅ Smooth scroll inizializzato');
    } catch (error) {
      console.error('❌ Errore smooth scroll:', error);
    }
  }
  
  // Inizializza tutti i miglioramenti
  initScrollIndicator();
  initScrollSpy();
  initAccessibility();
  initSmoothScroll();

  // Array per ogni sezione
  const galleries = {
    'vfx': [
      { canvas: true, title: 'VFX Canvas', modalImage: 'images/rhythm_v004.karmarendersettings.1052.png', description: 'Effetti visivi e compositing.' },
      { canvas: true, title: 'Motion Graphics', modalGallery: ['images/frame_1040.jpg','images/art_2k_end.png','images/rhythm_v004.karmarendersettings.1052.png'], description: 'Grafica animata e motion design.' },
      { canvas: true, title: 'VFX Demo', modalImage: 'images/art_2k2.png', description: 'Demo effetti visivi avanzati.' },
      { canvas: true, title: 'Compositing', modalGallery: ['images/boccioni.png','images/art_2k_end.png'], description: 'Tecniche di compositing digitale.' },
    ],
    'art3d': [
      { src: 'images/boccioni.png', title: 'boccioni', video: 'video/1.mp4', description: 'Lorem ipsum dolor sit amet, Frame 1040.' },
      { src: 'images/rhythm_v004.karmarendersettings.1052.png',video: 'video/3.mp4', title: 'Rhythm Render', description: 'Lorem ipsum dolor sit amet, Rhythm Render.' },
      { src: 'images/art_2k2.png', title: 'Art 2K2', video: 'video/ART.mp4',description: 'Lorem ipsum dolor sit amet, Art 2K2.' },
      { src: 'images/frame_1040.jpg',video: 'video/2.mp4', title: 'aaaaa', description: 'Lorem ipsum dolor sit amet, aaaaa.' },
      { canvas: true, title: 'Canvas -> Immagine', modalImage: 'images/frame_1040.jpg', description: 'Questo canvas apre un\'immagine.' },
      { canvas: true, title: 'Canvas -> Carosello', modalGallery: ['images/art_2k2.png','images/frame_1040.jpg','images/boccioni.png'], description: 'Questo canvas apre un carosello di immagini.' },
    ],
    'interactive': [
      { canvas: true, title: 'Interactive Canvas', modalGallery: ['images/boccioni.png','images/art_2k2.png'], description: 'Canvas interattivo con animazioni.' },
      { canvas: true, title: 'Generative Art', modalImage: 'images/art_2k_end.png', description: 'Arte generativa creata con algoritmi.' },
      { canvas: true, title: 'Particle System', modalGallery: ['images/frame_1040.jpg','images/art_2k_end.png'], description: 'Sistema di particelle interattivo.' },
      { canvas: true, title: 'Interactive Demo', modalImage: 'images/boccioni.png', description: 'Demo installazione interattiva.' },
    ],
    'creativecoding': [
      { canvas: true, title: 'Creative Coding', modalImage: 'images/boccioni.png', description: 'Programmazione creativa e arte digitale.' },
      { canvas: true, title: 'Algoritmic Art', modalGallery: ['images/art_2k2.png','images/art_2k_end.png'], description: 'Arte algoritmica e procedurale.' },
      { canvas: true, title: 'Code Art', modalImage: 'images/rhythm_v004.karmarendersettings.1052.png', description: 'Arte generata tramite codice.' },
      { canvas: true, title: 'Procedural Demo', modalGallery: ['images/frame_1040.jpg','images/boccioni.png'], description: 'Demo arte procedurale.' },
    ],
    'ai': [
      { canvas: true, title: 'AI Art', modalImage: 'images/art_2k_end.png', description: 'Arte generata con intelligenza artificiale.' },
      { canvas: true, title: 'Neural Networks', modalGallery: ['images/frame_1040.jpg','images/boccioni.png'], description: 'Opere create con reti neurali.' },
      { canvas: true, title: 'AI Demo', modalImage: 'images/art_2k2.png', description: 'Demo intelligenza artificiale creativa.' },
      { canvas: true, title: 'Machine Learning', modalGallery: ['images/rhythm_v004.karmarendersettings.1052.png','images/art_2k_end.png'], description: 'Arte generata con machine learning.' },
    ]
  };

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
    const prevBtn = section.querySelector('.carousel-btn.prev');
    const nextBtn = section.querySelector('.carousel-btn.next');
    const visible = 3;

    // Genera dinamicamente gli item
    images.forEach(img => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
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

    const items = Array.from(section.querySelectorAll('.gallery-item'));
    let currentIndex = 0;

    function getItemWidth() {
      if (!items[0]) return 0;
      return items[0].getBoundingClientRect().width;
    }
    
    function getGap() {
      if (items.length < 2) return 0;
      const first = items[0].getBoundingClientRect();
      const second = items[1].getBoundingClientRect();
      return Math.round(second.left - first.right);
    }
    
    function updateCarousel() {
      if (currentIndex > items.length - visible) currentIndex = Math.max(0, items.length - visible);
      const itemWidth = getItemWidth();
      const gap = getGap();
      const offset = currentIndex * (itemWidth + gap);
      track.style.transform = `translateX(-${offset}px)`;
      if (prevBtn) prevBtn.disabled = (currentIndex === 0);
      if (nextBtn) nextBtn.disabled = (currentIndex >= items.length - visible);
    }
    
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      });
      nextBtn.addEventListener('click', () => {
        if (currentIndex < items.length - visible) {
          currentIndex++;
          updateCarousel();
        }
      });
    }
    
    updateCarousel();
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
        setTimeout(() => handler(e), 50); // Piccolo delay per evitare conflitti
      }
    }, { passive: false });
    
    // Fallback per desktop
    element.addEventListener('click', function(e) {
      if (e.isTrusted && !('ontouchstart' in window)) {
        e.preventDefault();
        e.stopPropagation();
        handler(e);
      }
    });
  }

  // Inizializza tutte le gallery
  console.log('🎨 Inizializzazione gallery...');
  Object.keys(galleries).forEach(sectionId => {
    try {
      console.log(`🔧 Inizializzando gallery: ${sectionId}`);
      initGallery(sectionId, galleries[sectionId]);
      console.log(`✅ Gallery ${sectionId} inizializzata`);
    } catch (error) {
      console.error(`❌ Errore inizializzazione gallery ${sectionId}:`, error);
    }
  });

  // Aggiungi click handlers dopo l'inizializzazione
  console.log('🔗 Aggiunta click handlers...');
  const galleryItems = document.querySelectorAll('.gallery-item');
  console.log(`📱 Trovati ${galleryItems.length} gallery items`);
  
  galleryItems.forEach((item, index) => {
    const videoSrc = item.getAttribute('data-video');
    const description = item.getAttribute('data-description') || 'Lorem ipsum dolor sit amet.';
    
    // Trova l'immagine corrispondente nell'array
    const title = item.querySelector('.gallery-title').textContent;
    let imgData = null;
    
    // Cerca nei dati delle gallery
    Object.values(galleries).forEach(gallery => {
      const found = gallery.find(img => img.title === title);
      if (found) imgData = found;
    });

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
      });
    }
  });

  console.log('🎉 Portfolio: Inizializzazione completata con successo!');
}); 