/* Firebase compat initializer - guarantees connection even if dynamic import fails */
(function(){
  if(window.APP_ENV!=='prod') return;

  const firebaseConfig={
    apiKey:"AIzaSyAZyywhWm0Ju-N_YhIgUhWaqENfXrgZ8fY",
    authDomain:"portfolio-eb526.firebaseapp.com",
    projectId:"portfolio-eb526",
    storageBucket:"portfolio-eb526.appspot.com", // correct bucket domain
    messagingSenderId:"92912043022",
    appId:"1:92912043022:web:c49dc167d9c84ead46a85f",
    measurementId:"G-TRZ856L9ZZ"
  };

  const VERSION='10.12.0';
  const load=src=>new Promise(res=>{const s=document.createElement('script');s.src=`https://www.gstatic.com/firebasejs/${VERSION}/${src}`;s.onload=res;s.onerror=()=>{console.error('[Firebase] failed to load',src);res();};document.head.appendChild(s);});

  async function init(){
    console.log('[Firebase] Loading compat SDK ...');
    await load('firebase-app-compat.js');
    await load('firebase-firestore-compat.js');
    if(!window.firebase){console.error('[Firebase] compat SDK not available');return;}
    firebase.initializeApp(firebaseConfig);
    const db=firebase.firestore();
    window.db=db; // Expose for modular helpers waiting on window.db

    // Load Storage compat and expose instance for uploads (window.st)
    try {
      await load('firebase-storage-compat.js');
      window.st = firebase.storage();
    } catch(err) {
      console.warn('[Firebase] Storage compat failed to load', err);
    }

    // Load Auth compat and expose instance for admin login (window.auth)
    try {
      await load('firebase-auth-compat.js');
      window.auth = firebase.auth();
    } catch(err) {
      console.warn('[Firebase] Auth compat failed to load', err);
    }
    console.log('[Firebase] Connected (compat)');

    // Global helpers
    window.getSiteData=async()=>{const snap=await db.collection('config').doc('site').get();return snap.exists?snap.data():{};};
    window.saveSiteData=async d=>db.collection('config').doc('site').set(d,{merge:true});

    window.firebaseReady=true;
    window.dispatchEvent(new Event('firebase-ready'));
  }
  init();
})(); 