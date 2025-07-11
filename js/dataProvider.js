/* DataProvider – centralizes dynamic data access based on APP_ENV */
(function(){
  const ENV = window.APP_ENV || 'local';
  const originalFetchJson = window.fetchJson;

  // Fallback fetchJson implementation if not available
  const fallbackFetchJson = function(primaryUrl, fallbackUrl) {
    return fetch(primaryUrl).then(res => {
      if (res.ok) return res.json();
      if (fallbackUrl) return fetch(fallbackUrl).then(r => r.json());
      throw new Error(`Failed to fetch ${primaryUrl}`);
    }).catch(err => {
      if (fallbackUrl) {
        return fetch(fallbackUrl).then(r => r.json());
      }
      throw err;
    });
  };

  // Use originalFetchJson if available, otherwise use fallback
  const safeFetchJson = originalFetchJson || fallbackFetchJson;

  async function listGalleriesFirestore(){
    // Wait for Firebase init with timeout
    if(!window.db){
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds timeout
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout'));
          }
        }, 50);
      });
    }
    
    const base = 'https://www.gstatic.com/firebasejs/10.12.0';
    const { getDocs, collection } = await import(`${base}/firebase-firestore.js`);
    const snap = await getDocs(collection(window.db,'galleries'));
    const out = {};
    snap.forEach(doc=>{ out[doc.id]=doc.data().items || []; });
    return out;
  }

  async function getSiteFirestore(){
    // Wait for Firebase init with timeout
    if(!window.db){ 
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds timeout
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout'));
          }
        }, 50);
      });
    }
    
    const base='https://www.gstatic.com/firebasejs/10.12.0';
    const { getDoc, doc, getDocFromServer, enableNetwork, disableNetwork } = await import(`${base}/firebase-firestore.js`);
    const ref = doc(window.db,'config','site');
    
    // Force fresh data from server (bypass cache) with multiple strategies
    let snap;
    let cacheBypassSuccess = false;
    
    try {
      // Strategy 1: Try getDocFromServer first
      console.log('🔥 Attempting to get site data from server (bypass cache)...');
      snap = await getDocFromServer(ref);
      cacheBypassSuccess = true;
      console.log('🔥 ✅ Successfully retrieved site data from Firestore server (cache bypassed)');
    } catch (err) {
      console.warn('🔥 ❌ getDocFromServer failed, trying network disable/enable strategy:', err);
      
      try {
        // Strategy 2: Disable/enable network to force fresh data
        await disableNetwork(window.db);
        await enableNetwork(window.db);
        
        // Wait a bit for network to re-establish
        await new Promise(resolve => setTimeout(resolve, 100));
        
        snap = await getDocFromServer(ref);
        cacheBypassSuccess = true;
        console.log('🔥 ✅ Successfully retrieved site data after network reset');
      } catch (err2) {
        console.warn('🔥 ❌ Network reset strategy failed, falling back to cache:', err2);
        snap = await getDoc(ref);
        cacheBypassSuccess = false;
      }
    }
    
    const data = snap.exists() ? snap.data() : {};
    
    // Add comprehensive debug info
    if (data) {
      console.log('🔥 Firestore site data retrieved:', {
        exists: snap.exists(),
        metadata: snap.metadata,
        fromCache: snap.metadata.fromCache,
        hasPendingWrites: snap.metadata.hasPendingWrites,
        cacheBypassSuccess: cacheBypassSuccess,
        timestamp: new Date().toISOString(),
        dataHash: JSON.stringify(data).substring(0, 100) + '...',
        fullData: data
      });
      
      // Log specific fields for debugging
      console.log('🔥 Site data fields:', {
        heroText: data.heroText,
        bio: data.bio,
        version: data.version,
        contacts: data.contacts
      });
    }
    
    return data;
  }

  async function saveSiteFirestore(data){
    // Wait for Firebase init with timeout
    if(!window.db){ 
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds timeout
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout'));
          }
        }, 50);
      });
    }
    
    const base='https://www.gstatic.com/firebasejs/10.12.0';
    const { setDoc, doc } = await import(`${base}/firebase-firestore.js`);
    await setDoc(doc(window.db,'config','site'), data, {merge:true});
  }

  async function saveGalleriesFirestore(galleriesData){
    // Wait for Firebase init with timeout
    if(!window.db){ 
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds timeout
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout'));
          }
        }, 50);
      });
    }
    
    const base='https://www.gstatic.com/firebasejs/10.12.0';
    const { setDoc, doc } = await import(`${base}/firebase-firestore.js`);
    const writes = Object.entries(galleriesData).map(([key,items])=>
      setDoc(doc(window.db,'galleries',key), {items}, {merge:true})
    );
    await Promise.all(writes);
  }

  async function uploadToFirebaseStorage(file){
    // Wait for Firebase Storage init with timeout
    if(!window.st){ 
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds timeout
        const iv = setInterval(() => {
          attempts++;
          if(window.st){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase Storage initialization timeout'));
          }
        }, 50);
      });
    }
    
    const base='https://www.gstatic.com/firebasejs/10.12.0';
    const { ref, uploadBytes, getDownloadURL } = await import(`${base}/firebase-storage.js`);
    
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    const isVideo = file.type.startsWith('video');
    const folder = isVideo ? 'videos' : 'images';
    const path = `${folder}/${fileName}`;
    
    const storageRef = ref(window.st, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }

  // Expose Firebase Storage upload function globally
  window.uploadToFirebaseStorage = uploadToFirebaseStorage;

  // Override global fetchJson for specific endpoints in prod
  window.fetchJson = async function(primaryUrl, fallbackUrl){
    if(ENV === 'prod'){
      if(primaryUrl.includes('/api/galleries')){
        try{ 
          const galleriesData = await listGalleriesFirestore(); 
          console.log('📡 Galleries data loaded from Firestore:', galleriesData);
          return galleriesData;
        }catch(err){ 
          console.error('Firestore galleries error, falling back to local JSON:', err);
          // Fallback to local JSON file
          return safeFetchJson('data/galleries.json', fallbackUrl);
        }
      }
      if(primaryUrl.includes('/api/site')){
        try{ 
          const siteData = await getSiteFirestore(); 
          console.log('📡 Site data loaded from Firestore:', siteData);
          return siteData;
        }catch(err){ 
          console.error('Firestore site error, falling back to local JSON:', err);
          // Fallback to local JSON file
          return safeFetchJson('data/site.json', fallbackUrl);
        }
      }
    }
    
    // For non-prod environments or other URLs, use safe fetch
    return safeFetchJson(primaryUrl, fallbackUrl);
  };

  // Expose helpers for admin
  window.listGalleries = async function(){ 
    return ENV==='prod'? listGalleriesFirestore().catch(()=>safeFetchJson('data/galleries.json')) : safeFetchJson('/api/galleries','data/galleries.json'); 
  };
  window.saveGalleriesProd = saveGalleriesFirestore;
  window.getSiteProd       = getSiteFirestore;
  window.saveSiteProd      = saveSiteFirestore;
})(); 