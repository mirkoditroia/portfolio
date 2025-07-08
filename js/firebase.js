/* Firebase dynamic initializer – only runs in production */
(function(){
  if(window.APP_ENV !== 'prod') return; // Non-production env: skip

  // Helper to load script via dynamic import URLs (ES modules hosted by Google)
  const FIREBASE_VERSION = '10.12.0';
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  
  async function init(){
    try{
      const { initializeApp } = await import(`${base}/firebase-app.js`);
      const { getFirestore } = await import(`${base}/firebase-firestore.js`);
      const { getStorage } = await import(`${base}/firebase-storage.js`);
      const { getAuth } = await import(`${base}/firebase-auth.js`);
      
      // INSERISCI QUI LA TUA CONFIGURAZIONE FIREBASE REALE
      const firebaseConfig = {
        apiKey: "AIzaSyAZyywhWm0Ju-N_YhIgUhWaqENfXrgZ8fY",
        authDomain: "portfolio-eb526.firebaseapp.com",
        projectId: "portfolio-eb526",
        storageBucket: "portfolio-eb526.firebasestorage.app",
        messagingSenderId: "92912043022",
        appId: "1:92912043022:web:c49dc167d9c84ead46a85f",
        measurementId: "G-TRZ856L9ZZ"
      };
      
      const app = initializeApp(firebaseConfig);
      window.db = getFirestore(app);
      window.st = getStorage(app);
      window.auth = getAuth(app);
      console.log('🔥 Firebase initialized successfully');
    }catch(err){
      console.error('Firebase init error:', err);
      // Continue without Firebase in case of error
    }
  }
  init();
})(); 