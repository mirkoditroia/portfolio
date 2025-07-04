// JS pronto per future funzionalità 
document.addEventListener('DOMContentLoaded', function() {
  // Array demo: inserisci qui i nomi delle immagini nella cartella images
  const images = [
    { src: 'images/boccioni.png', title: 'boccioni', video: 'video/1.mp4', description: 'Lorem ipsum dolor sit amet, Frame 1040.' },
    { src: 'images/rhythm_v004.karmarendersettings.1052.png',video: 'video/3.mp4', title: 'Rhythm Render', description: 'Lorem ipsum dolor sit amet, Rhythm Render.' },
    { src: 'images/art_2k2.png', title: 'Art 2K2', video: 'video/ART.mp4',description: 'Lorem ipsum dolor sit amet, Art 2K2.' },
    { src: 'images/frame_1040.jpg',video: 'video/2.mp4', title: 'aaaaa', description: 'Lorem ipsum dolor sit amet, aaaaa.' },
    // Canvas demo che apre un'immagine
    { canvas: true, title: 'Canvas -> Immagine', modalImage: 'images/frame_1040.jpg', description: 'Questo canvas apre un\'immagine.' },
    // Canvas demo che apre un carosello di immagini
    { canvas: true, title: 'Canvas -> Carosello', modalGallery: ['images/art_2k2.png','images/frame_1040.jpg','images/boccioni.png'], description: 'Questo canvas apre un carosello di immagini.' },
    // aggiungi qui altre immagini/canvas...
  ];

  console.log('Numero immagini:', images.length, images.map(i => i.title));

  const track = document.querySelector('.gallery-track');
  const prevBtn = document.querySelector('.gallery-carousel .carousel-btn.prev');
  const nextBtn = document.querySelector('.gallery-carousel .carousel-btn.next');
  const visible = 3; // Impostato a 3 in modo fisso

  // Genera dinamicamente gli item
  images.forEach(img => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    if (img.video) item.setAttribute('data-video', img.video);
    if (img.description) item.setAttribute('data-description', img.description);

    let mediaEl;
    if (img.canvas) {
      mediaEl = document.createElement('canvas');
      mediaEl.className = 'gallery-canvas';
      // Imposto dimensioni canvas di default (desktop)
      mediaEl.width = 300;
      mediaEl.height = 210;
      // Se su mobile, aggiorno dimensioni
      if (window.innerWidth <= 480) {
        mediaEl.width = 100;
        mediaEl.height = 160;
      } else if (window.innerWidth <= 600) {
        mediaEl.width = 120;
        mediaEl.height = 200;
      }
      const ctx = mediaEl.getContext('2d');
      if (img.src) {
        const imageObj = new window.Image();
        imageObj.onload = function() {
          // Calcolo il rapporto per object-fit: contain
          const canvasW = mediaEl.width;
          const canvasH = mediaEl.height;
          const imgW = imageObj.width;
          const imgH = imageObj.height;
          let scale;
          if (imgH > imgW) {
            // Immagine verticale: occupa max il 60% della larghezza
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
        // Demo: disegno qualcosa sul canvas
        ctx.fillStyle = '#40e0d0';
        ctx.fillRect(0, 0, mediaEl.width, mediaEl.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Montserrat, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Canvas', mediaEl.width/2, mediaEl.height/2);
      }
    } else {
      mediaEl = document.createElement('img');
      mediaEl.className = 'gallery-img';
      mediaEl.src = img.src;
      mediaEl.alt = img.title;
      mediaEl.onerror = () => { mediaEl.src = 'images/fallback.png'; };
    }

    const titleEl = document.createElement('div');
    titleEl.className = 'gallery-title';
    titleEl.textContent = img.title;

    item.appendChild(mediaEl);
    item.appendChild(titleEl);
    track.appendChild(item);
    console.log(`Creato item:`, img.title, item);
  });

  const items = Array.from(document.querySelectorAll('.gallery-item'));
  let currentIndex = 0;

  function getItemWidth() {
    if (!items[0]) return 0;
    const w = items[0].getBoundingClientRect().width;
    console.log('Larghezza item:', w);
    return w;
  }
  function getGap() {
    if (items.length < 2) return 0;
    const first = items[0].getBoundingClientRect();
    const second = items[1].getBoundingClientRect();
    const gap = Math.round(second.left - first.right);
    console.log('Gap calcolato:', gap);
    return gap;
  }
  function updateCarousel() {
    if (currentIndex > items.length - visible) currentIndex = Math.max(0, items.length - visible);
    const itemWidth = getItemWidth();
    const gap = getGap();
    const offset = currentIndex * (itemWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    prevBtn.disabled = (currentIndex === 0);
    nextBtn.disabled = (currentIndex >= items.length - visible);
    console.log('updateCarousel:', { currentIndex, itemWidth, gap, offset, visible, itemsLength: items.length });
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

  // Modal video su click
  const modal = document.getElementById('modalVideo');
  const modalPlayer = document.getElementById('modalVideoPlayer');
  const modalDescription = document.getElementById('modalDescription');
  const closeModal = document.getElementById('closeModal');
  function addTapOrClickListener(element, handler) {
    let touchStartX = 0, touchStartY = 0, moved = false;
    element.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        moved = false;
      }
    });
    element.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1) {
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > 10 || dy > 10) moved = true;
      }
    });
    element.addEventListener('touchend', function(e) {
      if (!moved) handler(e);
    });
    element.addEventListener('click', handler);
  }
  items.forEach(item => {
    const videoSrc = item.getAttribute('data-video');
    const description = item.getAttribute('data-description') || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    const img = item.querySelector('.gallery-img');
    const canvas = item.querySelector('.gallery-canvas');
    // Recupero info custom per canvas demo
    const index = items.indexOf(item);
    const data = images[index];
    
    // Aggiungo il click handler all'intero elemento invece che solo all'immagine/canvas
    if (modal) {
      item.style.cursor = 'pointer';
      addTapOrClickListener(item, e => {
        e.preventDefault();
        e.stopPropagation();
        
        // Gestione dei canvas con comportamenti speciali
        if (canvas && data) {
          // Se ha modalImage, mostra immagine
          if (data.modalImage) {
            modal.style.display = 'flex';
            modalPlayer.style.display = 'none';
            document.getElementById('modalGallery').style.display = 'none';
            const modalImg = document.getElementById('modalImage');
            modalImg.src = data.modalImage;
            modalImg.onload = function() {
              if (modalImg.naturalHeight > modalImg.naturalWidth) {
                modalImg.style.maxWidth = '60vw';
                modalImg.style.maxHeight = '80vh';
              } else {
                modalImg.style.maxWidth = '90vw';
                modalImg.style.maxHeight = '60vh';
              }
            };
            modalImg.style.display = '';
          } else if (data.modalGallery) {
            // Se ha modalGallery, mostra carosello immagini
            modal.style.display = 'flex';
            modalPlayer.style.display = 'none';
            document.getElementById('modalImage').style.display = 'none';
            const modalGallery = document.getElementById('modalGallery');
            modalGallery.innerHTML = '';
            let galleryIndex = 0;
            const imgs = data.modalGallery;
            
            // Creo un contenitore per il carosello
            const galleryContainer = document.createElement('div');
            galleryContainer.className = 'modal-gallery-container';
            
            const galleryTrack = document.createElement('div');
            galleryTrack.className = 'modal-gallery-track';
            
            // Aggiungo tutte le immagini al carosello
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
            
            // Frecce (desktop only)
            const prev = document.createElement('button');
            prev.textContent = '<';
            prev.className = 'carousel-btn prev modal-gallery-btn';
            const next = document.createElement('button');
            next.textContent = '>';
            next.className = 'carousel-btn next modal-gallery-btn';
            
            const updateModalGallery = () => {
              const translateX = galleryIndex * -100;
              galleryTrack.style.transform = `translateX(${translateX}%)`;
            };
            
            prev.onclick = () => {
              galleryIndex = Math.max(0, galleryIndex - 1);
              updateModalGallery();
            };
            next.onclick = () => {
              galleryIndex = Math.min(imgs.length - 1, galleryIndex + 1);
              updateModalGallery();
            };
            
            galleryContainer.appendChild(prev);
            galleryContainer.appendChild(next);
            modalGallery.appendChild(galleryContainer);
            modalGallery.style.display = '';
          } else if (videoSrc && modalPlayer) {
            // Default: video per canvas
            modal.style.display = 'flex';
            modalPlayer.style.display = '';
            document.getElementById('modalImage').style.display = 'none';
            document.getElementById('modalGallery').style.display = 'none';
            modalPlayer.src = videoSrc;
            modalPlayer.play();
          }
        } else if (videoSrc && modalPlayer) {
          // Default: video per immagini normali
          modal.style.display = 'flex';
          modalPlayer.style.display = '';
          document.getElementById('modalImage').style.display = 'none';
          document.getElementById('modalGallery').style.display = 'none';
          modalPlayer.src = videoSrc;
          modalPlayer.play();
        }
        
        if (modalDescription) modalDescription.textContent = description;
      });
    }
  });
  if (closeModal && modal && modalPlayer) {
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
      modalPlayer.pause();
      modalPlayer.src = '';
      if (modalDescription) modalDescription.textContent = '';
    });
  }
  modal && modal.addEventListener('click', e => {
    if (e.target === modal && modalPlayer) {
      modal.style.display = 'none';
      modalPlayer.pause();
      modalPlayer.src = '';
      if (modalDescription) modalDescription.textContent = '';
    }
  });
});

document.querySelectorAll('.gallery-item').forEach(item => {
  const popup = item.querySelector('.gallery-popup');
  item.addEventListener('mouseleave', () => {
    popup.style.opacity = '';
    popup.style.pointerEvents = '';
    popup.style.transform = '';
  });
  // Touch support: tap per aprire/chiudere
  item.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.gallery-popup').forEach(p => {
      if (p !== popup) {
        p.style.opacity = '';
        p.style.pointerEvents = '';
        p.style.transform = '';
      }
    });
    popup.style.opacity = 1;
    popup.style.pointerEvents = 'auto';
    popup.style.transform = 'translate(-50%, 0) scale(1)';
  });
});
document.body.addEventListener('touchstart', () => {
  document.querySelectorAll('.gallery-popup').forEach(p => {
    p.style.opacity = '';
    p.style.pointerEvents = '';
    p.style.transform = '';
  });
}); 