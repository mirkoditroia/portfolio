/* Firebase dynamic initializer – only runs in production */
(function(){
  if(window.APP_ENV !== 'prod') return; // Non-production env: skip

  // Helper to load script via dynamic import URLs (ES modules hosted by Google)
  const FIREBASE_VERSION = '10.12.0';
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

  async function init(){
    try{
      const { initializeApp } = await import(`${base}/firebase-app.js`);
      const { getAnalytics }  = await import(`${base}/firebase-analytics.js`);
      const { getFirestore }  = await import(`${base}/firebase-firestore.js`);
      const { getStorage }    = await import(`${base}/firebase-storage.js`);

      const app = initializeApp(window.FIREBASE_CONFIG);
      window.an = getAnalytics(app);
      window.db = getFirestore(app);
      window.st = getStorage(app);
      console.log('🔥 Firebase initialised (prod)');
    }catch(err){
      console.error('Firebase init error',err);
    }
  }
  init();
})(); 