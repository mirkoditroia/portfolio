// Mobile Splash Screen Module
(function () {
  // Configurazione
  const SPLASH_DURATION = 4500; // ms
  const AUDIO_URL = '/assets/meirks.mp3'; // Cambia con il tuo file audio
  const SITE_NAME = window.APP_SITE_NAME || 'VFXULO'; // Puoi settare window.APP_SITE_NAME prima di includere questo script
  const ENABLE_AUDIO = false; // Imposta a true per abilitare l'audio (può essere bloccato dal browser)

  // Solo mobile
  if (window.innerWidth > 900) return;
  if (window.__mobileSplashLoaded) return;
  window.__mobileSplashLoaded = true;

  // Crea overlay
  const overlay = document.createElement('div');
  overlay.id = 'mobile-splash-overlay';
  overlay.style.cssText = `
    position: fixed;
    z-index: 99999;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100vw; height: 100vh;
    background: linear-gradient(135deg, rgba(20,30,48,0.85) 60%, rgba(64,224,208,0.7) 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0.98;
    transition: opacity 0.7s cubic-bezier(.77,0,.18,1);
    backdrop-filter: blur(8px);
  `;

  // Rotellina di caricamento moderna
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 60px;
    height: 60px;
    border: 3px solid rgba(64, 224, 208, 0.3);
    border-top: 3px solid #40e0d0;
    border-radius: 50%;
    margin-bottom: 20px;
    animation: spin 1s linear infinite;
    box-shadow: 0 0 20px rgba(64, 224, 208, 0.5);
  `;
  overlay.appendChild(spinner);

  // Sottotitolo "ottimizzazione"
  const subtitle = document.createElement('div');
  subtitle.textContent = 'Site optimization in progress';
  subtitle.style.cssText = `
    font-family: 'Montserrat', Arial, sans-serif;
    font-size: 0.9rem;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: rgba(64, 224, 208, 0.8);
    text-transform: uppercase;
    margin-bottom: 8px;
    user-select: none;
    animation: pulse 2s infinite;
  `;
  overlay.appendChild(subtitle);

  // Messaggio di pazienza
  const message = document.createElement('div');
  message.textContent = 'Hang on a moment...';
  message.style.cssText = `
    font-family: 'Montserrat', Arial, sans-serif;
    font-size: 0.75rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    user-select: none;
    animation: fadeInOut 3s infinite;
  `;
  overlay.appendChild(message);

  // CSS keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
    #mobile-splash-overlay::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(style);

  // Audio - gestione migliorata
  let audio = null;
  let audioPlayed = false;

  function initAudio() {
    if (audio) return;
    
    audio = document.createElement('audio');
    audio.src = AUDIO_URL;
    audio.preload = 'auto';
    audio.style.display = 'none';
    audio.volume = 0.7;
    overlay.appendChild(audio);
  }

  function playAudio() {
    if (!ENABLE_AUDIO || audioPlayed) return;
    
    initAudio();
    audioPlayed = true;
    
    // Prova a riprodurre l'audio con gestione errori migliorata
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Audio riprodotto con successo');
        })
        .catch((error) => {
          console.log('Audio non può essere riprodotto:', error.message);
          // Mostra un messaggio visivo all'utente
          text.style.color = '#ff6b6b';
          text.textContent = '🔇 Audio bloccato';
          setTimeout(() => {
            text.style.color = '#40e0d0';
            text.textContent = SITE_NAME;
          }, 2000);
        });
    }
  }

  // Aggiungi event listener solo al testo per avviare l'audio (se abilitato)
  if (ENABLE_AUDIO) {
    text.addEventListener('click', playAudio);
    text.addEventListener('touchstart', playAudio);
  }

  // Aggiungi overlay e blocca scrolling
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.height = '100%';

  // Rimuovi dopo SPLASH_DURATION
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      // Ripristina scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }, 700);
  }, SPLASH_DURATION);
})();

// Universal Splash Screen Module
(function () {
  // Configurazione
  const SPLASH_DURATION = 3500; // ms
  const AUDIO_URL = '/assets/meirks.mp3';
  const SITE_NAME = window.APP_SITE_NAME || 'VFXULO';
  const ENABLE_AUDIO = false;

  // Evita doppia esecuzione
  if (window.__universalSplashLoaded) return;
  window.__universalSplashLoaded = true;
  window.__splashActive = true;

  // Crea overlay
  const overlay = document.createElement('div');
  overlay.id = 'universal-splash-overlay';
  overlay.style.cssText = `
    position: fixed;
    z-index: 99999;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100vw; height: 100vh;
    background: linear-gradient(135deg, rgba(20,30,48,0.85) 60%, rgba(64,224,208,0.7) 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0.98;
    transition: opacity 0.7s cubic-bezier(.77,0,.18,1);
    backdrop-filter: blur(8px);
  `;

  // Rotellina di caricamento moderna
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 60px;
    height: 60px;
    border: 3px solid rgba(64, 224, 208, 0.3);
    border-top: 3px solid #40e0d0;
    border-radius: 50%;
    margin-bottom: 20px;
    animation: spin 1s linear infinite;
    box-shadow: 0 0 20px rgba(64, 224, 208, 0.5);
  `;
  overlay.appendChild(spinner);

  // Sottotitolo "ottimizzazione"
  const subtitle = document.createElement('div');
  subtitle.textContent = 'Site optimization in progress';
  subtitle.style.cssText = `
    font-family: 'Montserrat', Arial, sans-serif;
    font-size: 0.9rem;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: rgba(64, 224, 208, 0.8);
    text-transform: uppercase;
    margin-bottom: 8px;
    user-select: none;
    animation: pulse 2s infinite;
  `;
  overlay.appendChild(subtitle);

  // Messaggio di pazienza
  const message = document.createElement('div');
  message.textContent = 'Hang on a moment...';
  message.style.cssText = `
    font-family: 'Montserrat', Arial, sans-serif;
    font-size: 0.75rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    user-select: none;
    animation: fadeInOut 3s infinite;
  `;
  overlay.appendChild(message);

  // CSS keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
    #universal-splash-overlay::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(style);

  // Aggiungi overlay e blocca scrolling
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.height = '100%';

  // Rimuovi dopo SPLASH_DURATION
  setTimeout(() => {
    overlay.style.opacity = '0';
    window.__splashActive = false;
    setTimeout(() => {
      overlay.remove();
      // Ripristina scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }, 700);
  }, SPLASH_DURATION);
})(); 