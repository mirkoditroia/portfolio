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

  async function getSiteFirestore(){
    if(!window.db){ await new Promise(res=>{const iv=setInterval(()=>{if(window.db){clearInterval(iv);res();}},50);}); }
    const base='https://www.gstatic.com/firebasejs/10.12.0';
    const { getDoc, doc } = await import(`${base}/firebase-firestore.js`);
    const ref = doc(window.db,'config','site');
    const snap = await getDoc(ref);
    return snap.exists()? snap.data() : {};
  }

  async function saveSiteFirestore(data){
    if(!window.db){ await new Promise(res=>{const iv=setInterval(()=>{if(window.db){clearInterval(iv);res();}},50);}); }
    const base='https://www.gstatic.com/firebasejs/10.12.0';
    const { setDoc, doc } = await import(`${base}/firebase-firestore.js`);
    await setDoc(doc(window.db,'config','site'), data, {merge:true});
  }

  async function saveGalleriesFirestore(galleriesData){
    if(!window.db){ await new Promise(res=>{const iv=setInterval(()=>{if(window.db){clearInterval(iv);res();}},50);}); }
    const base='https://www.gstatic.com/firebasejs/10.12.0';
    const { setDoc, doc } = await import(`${base}/firebase-firestore.js`);
    const writes = Object.entries(galleriesData).map(([key,items])=>
      setDoc(doc(window.db,'galleries',key), {items}, {merge:true})
    );
    await Promise.all(writes);
  }

  async function uploadToFirebaseStorage(file){
    if(!window.st){ await new Promise(res=>{const iv=setInterval(()=>{if(window.st){clearInterval(iv);res();}},50);}); }
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
        try{ return await listGalleriesFirestore(); }catch(err){ console.error('Firestore galleries error',err);} }
      if(primaryUrl.includes('/api/site')){
        try{ return await getSiteFirestore(); }catch(err){ console.error('Firestore site error',err);} }
    }
    return originalFetchJson(primaryUrl, fallbackUrl);
  };

  // Expose helpers for admin
  window.listGalleries = async function(){ return ENV==='prod'? listGalleriesFirestore() : originalFetchJson('/api/galleries','../data/galleries.json'); };
  window.saveGalleriesProd = saveGalleriesFirestore;
  window.getSiteProd       = getSiteFirestore;
  window.saveSiteProd      = saveSiteFirestore;
})(); 