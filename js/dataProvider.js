/* DataProvider – centralizes dynamic data access based on APP_ENV */
(function(){
  const ENV = window.APP_ENV || 'local';
  const originalFetchJson = window.fetchJson;

  async function listGalleriesFirestore(){
    // Wait for Firebase init
    if(!window.db){
      await new Promise(res=>{
        const iv=setInterval(()=>{ if(window.db){ clearInterval(iv); res(); } },50);
      });
    }
    const base = 'https://www.gstatic.com/firebasejs/10.12.0';
    const { getDocs, collection } = await import(`${base}/firebase-firestore.js`);
    const snap = await getDocs(collection(window.db,'galleries'));
    const out = {};
    snap.forEach(doc=>{ out[doc.id]=doc.data().items || []; });
    return out;
  }

  // Override global fetchJson for specific endpoints in prod
  window.fetchJson = async function(primaryUrl, fallbackUrl){
    if(ENV === 'prod' && primaryUrl.includes('/api/galleries')){
      try{
        return await listGalleriesFirestore();
      }catch(err){ console.error('Firestore fallback error',err); }
    }
    // default behaviour
    return originalFetchJson(primaryUrl, fallbackUrl);
  };

  // Expose helper explicitly too
  window.listGalleries = async function(){
    if(ENV==='prod') return listGalleriesFirestore();
    return originalFetchJson('/api/galleries','data/galleries.json');
  };
})(); 