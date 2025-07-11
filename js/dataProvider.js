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
        const maxAttempts = 600; // 30 seconds timeout
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout after 10 seconds'));
          }
        }, 50);
      });
    }
    
    // Try new schema: each gallery is a document in 'galleries' collection
    const colSnap = await window.db.collection('galleries').get();
    if(!colSnap.empty){
      const out = {};
      colSnap.forEach(doc=>{ out[doc.id]=doc.data().items || []; });
      return out;
    }

    // Fallback to legacy schema: single document config/galleries
    const legacyDoc = await window.db.collection('config').doc('galleries').get();
    if(legacyDoc.exists){
      return legacyDoc.data() || {};
    }

    throw new Error('No galleries found in Firestore');
  }

  async function getSiteFirestore(){
    // Wait for Firebase init with timeout
    if(!window.db){ 
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 600; // 30 seconds timeout
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout after 10 seconds'));
          }
        }, 50);
      });
    }
    
    // Use compat API directly
    const ref = window.db.collection('config').doc('site');
    
    console.log('🔥 Loading site data from Firestore...');

    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};
    
    console.log('🔥 Site data loaded from Firestore:', {
      exists: snap.exists,
      timestamp: new Date().toISOString(),
      heroText: data.heroText,
      bio: data.bio,
      version: data.version,
      contacts: data.contacts ? data.contacts.length : 0,
      allFields: Object.keys(data)
    });
    
    return data;
  }

  async function saveSiteFirestore(data){
    // Wait for Firebase init with timeout
    if(!window.db){ 
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 600; // 30 seconds timeout
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout after 10 seconds'));
          }
        }, 50);
      });
    }
    
    await window.db.collection('config').doc('site').set(data,{merge:true});
  }

  async function saveGalleriesFirestore(galleriesData){
    // Wait for Firebase init with timeout
    if(!window.db){ 
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 600; // 30 seconds timeout
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout after 10 seconds'));
          }
        }, 50);
      });
    }
    
    const writes = Object.entries(galleriesData).map(([key,items])=>
      window.db.collection('galleries').doc(key).set({items},{merge:true})
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
    
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    const isVideo = file.type.startsWith('video');
    const folder = isVideo ? 'videos' : 'images';
    const path = `${folder}/${fileName}`;

    const storageRef = window.st.ref(path);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
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