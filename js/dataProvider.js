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
    // Wait for Firebase init with timeout ridotto
    if(!window.db){
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds timeout (ridotto da 30s)
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout after 5 seconds'));
          }
        }, 50);
      });
    }
    
    // Try new schema: each gallery is a document in 'galleries' collection
    const colSnap = await window.db.collection('galleries').get();
    if(!colSnap.empty){
      const out = {};
      colSnap.forEach(doc=>{ const d=doc.data(); out[doc.id]=Array.isArray(d)? d : (d.items || d.slides || d || []); });
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
    // Wait for Firebase init with timeout ridotto
    if(!window.db){ 
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds timeout (ridotto da 30s)
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ 
            clearInterval(iv); 
            resolve(); 
          } else if(attempts >= maxAttempts) {
            clearInterval(iv);
            reject(new Error('Firebase initialization timeout after 5 seconds'));
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

  async function getDownloadsFirestore(){
    if(!window.db){
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100;
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ clearInterval(iv); resolve(); }
          else if(attempts >= maxAttempts){ clearInterval(iv); reject(new Error('Firebase initialization timeout')); }
        }, 50);
      });
    }
    const snap = await window.db.collection('config').doc('downloads').get();
    return snap.exists ? (snap.data().items || []) : [];
  }

  async function saveDownloadsFirestore(itemsArray){
    if(!window.db){
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100;
        const iv = setInterval(() => {
          attempts++;
          if(window.db){ clearInterval(iv); resolve(); }
          else if(attempts >= maxAttempts){ clearInterval(iv); reject(new Error('Firebase initialization timeout')); }
        }, 50);
      });
    }
    await window.db.collection('config').doc('downloads').set({ items: itemsArray }, { merge: true });
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
    
    if(window.auth && window.auth.currentUser){
      await window.auth.currentUser.getIdToken(true);
    }

    const timestamp = Date.now();
    const extension = file.name.split('.').pop().toLowerCase();
    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    const folder = isVideo ? 'videos' : 'images';

    let fileName;
    if (isVideo || isImage) {
      fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    } else {
      const baseName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      fileName = `${timestamp}_${baseName}`;
    }
    const path = `${folder}/${fileName}`;

    const storageRef = window.st.ref(path);
    const metadata = (!isVideo && !isImage) ? {
      contentDisposition: `attachment; filename="${file.name}"`
    } : undefined;
    const snapshot = await storageRef.put(file, metadata);
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
      if(primaryUrl.includes('/api/downloads')){
        try{
          const dlData = await getDownloadsFirestore();
          console.log('📡 Downloads loaded from Firestore:', dlData.length, 'items');
          return dlData;
        }catch(err){
          console.error('Firestore downloads error, falling back to local JSON:', err);
          return safeFetchJson('data/downloads.json', fallbackUrl);
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

  /* ───── Analytics helpers (admin) ───── */
  async function getAnalyticsCounters() {
    if (!window.db) await waitForDb();
    const snap = await window.db.collection('analytics').doc('counters').get();
    return snap.exists ? snap.data() : { totalPageViews: 0, totalDownloads: 0, totalInteractions: 0 };
  }

  async function getAnalyticsDaily(days) {
    if (!window.db) await waitForDb();
    const result = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = 'daily_' + d.toISOString().split('T')[0];
      const snap = await window.db.collection('analytics').doc(key).get();
      if (snap.exists) result.push(snap.data());
    }
    return result;
  }

  async function getAnalyticsEvents(limitCount, eventType) {
    if (!window.db) await waitForDb();
    let query = window.db.collection('analytics_events')
      .orderBy('timestamp', 'desc')
      .limit(limitCount || 100);
    if (eventType) query = query.where('type', '==', eventType);
    const snap = await query.get();
    const events = [];
    snap.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
    return events;
  }

  async function getAnalyticsTopContent(days) {
    if (!window.db) await waitForDb();
    const since = new Date();
    since.setDate(since.getDate() - (days || 30));
    const sinceStr = since.toISOString().split('T')[0];

    const snap = await window.db.collection('analytics_events')
      .where('type', '==', 'interaction')
      .where('date', '>=', sinceStr)
      .orderBy('date', 'desc')
      .limit(500)
      .get();

    const counts = {};
    snap.forEach(doc => {
      const d = doc.data();
      if (d.itemTitle === '__section_view__') return;
      const key = (d.section || '?') + ' / ' + (d.itemTitle || '?');
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  async function waitForDb() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const iv = setInterval(() => {
        attempts++;
        if (window.db) { clearInterval(iv); resolve(); }
        else if (attempts >= 100) { clearInterval(iv); reject(new Error('Firestore timeout')); }
      }, 50);
    });
  }

  async function getAnalyticsGeo(days) {
    if (!window.db) await waitForDb();
    const since = new Date();
    since.setDate(since.getDate() - (days || 30));
    const sinceStr = since.toISOString().split('T')[0];

    const snap = await window.db.collection('analytics_events')
      .where('date', '>=', sinceStr)
      .orderBy('date', 'desc')
      .limit(1000)
      .get();

    const countries = {};
    const cities = {};
    const downloadGeo = {};

    snap.forEach(doc => {
      const d = doc.data();
      if (!d.country) return;

      const cKey = d.country;
      countries[cKey] = (countries[cKey] || 0) + 1;

      if (d.city) {
        const cityKey = d.city + ', ' + (d.countryCode || '');
        cities[cityKey] = (cities[cityKey] || 0) + 1;
      }

      if (d.type === 'download' && d.country) {
        downloadGeo[cKey] = (downloadGeo[cKey] || 0) + 1;
      }
    });

    const toSorted = obj => Object.entries(obj)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      countries: toSorted(countries),
      cities: toSorted(cities),
      downloadsByCountry: toSorted(downloadGeo)
    };
  }

  async function getAnalyticsContentTime(days) {
    if (!window.db) await waitForDb();
    const since = new Date();
    since.setDate(since.getDate() - (days || 30));
    const sinceStr = since.toISOString().split('T')[0];

    const snap = await window.db.collection('analytics_events')
      .where('type', '==', 'content_view')
      .where('date', '>=', sinceStr)
      .orderBy('date', 'desc')
      .limit(500)
      .get();

    const items = {};
    snap.forEach(doc => {
      const d = doc.data();
      const key = (d.section || '?') + ' / ' + (d.itemTitle || '?');
      if (!items[key]) items[key] = { totalSec: 0, count: 0 };
      items[key].totalSec += d.durationSec || 0;
      items[key].count += 1;
    });

    return Object.entries(items)
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalSec: data.totalSec,
        avgSec: data.count > 0 ? Math.round(data.totalSec / data.count) : 0
      }))
      .sort((a, b) => b.totalSec - a.totalSec);
  }

  window.getAnalyticsCounters    = getAnalyticsCounters;
  window.getAnalyticsDaily       = getAnalyticsDaily;
  window.getAnalyticsEvents      = getAnalyticsEvents;
  window.getAnalyticsTopContent  = getAnalyticsTopContent;
  window.getAnalyticsGeo         = getAnalyticsGeo;
  window.getAnalyticsContentTime = getAnalyticsContentTime;

  // Expose helpers for admin
  window.listGalleries = async function(){ 
    return ENV==='prod'? listGalleriesFirestore().catch(()=>safeFetchJson('data/galleries.json')) : safeFetchJson('/api/galleries','data/galleries.json'); 
  };
  window.saveGalleriesProd   = saveGalleriesFirestore;
  window.getSiteProd         = getSiteFirestore;
  window.saveSiteProd        = saveSiteFirestore;
  window.saveDownloadsProd   = saveDownloadsFirestore;
  window.getDownloadsProd    = getDownloadsFirestore;
})(); 