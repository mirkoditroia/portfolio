/* Admin dashboard logic (work in progress) */

document.addEventListener('DOMContentLoaded', ()=>{
  const container = document.getElementById('galleries');
  if(!container) return;

  // Determine environment once
  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host.includes('localhost');

  let env;
  if (isLocalhost) {
    env = 'local';
  } else if (host.includes('preprod') || host.includes('pre-prod')) {
    env = 'preprod';
  } else {
    env = window.APP_ENV || 'prod';
  }

  // Assicura che APP_ENV sia sempre valorizzato, anche se lo script env.* non è ancora stato caricato
  if (!window.APP_ENV) {
    window.APP_ENV = env;
  }

  // Update admin footer with environment info
  const adminEnvSpan = document.getElementById('admin-environment');
  if (adminEnvSpan) {
    const envColors = {
      local: '#28a745',     // green
      preprod: '#ffc107',   // yellow  
      prod: '#dc3545'       // red
    };
    
    const envNames = {
      local: 'LOCAL',
      preprod: 'PRE-PROD',
      prod: 'PRODUCTION'
    };
    
    adminEnvSpan.innerHTML = `ENV: <span style="color: ${envColors[env] || '#6c757d'}; font-weight: bold;">${envNames[env] || env.toUpperCase()}</span>`;
  }

  // Disable login for LOCAL e PRE-PROD (token only)
  if(env === 'preprod' || env === 'local'){
    const authSection = document.getElementById('auth-section');
    if(authSection) authSection.style.display='none';
    window.isAuthenticated = ()=>true; // stub
  }

  // Setup authentication event listeners
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = loginEmail.value.trim();
      const password = loginPassword.value.trim();
      
      if (!email || !password) {
        alert('Please enter both email and password');
        return;
      }
      
      try {
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        
        if (window.adminLogin) {
          await window.adminLogin(email, password);
          loginEmail.value = '';
          loginPassword.value = '';
        } else {
          throw new Error('Authentication not available');
        }
      } catch (error) {
        alert('Login failed: ' + error.message);
      } finally {
        loginBtn.textContent = 'Login';
        loginBtn.disabled = false;
      }
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        if (window.adminLogout) {
          await window.adminLogout();
        }
      } catch (error) {
        alert('Logout failed: ' + error.message);
      }
    });
  }
  
  // Enter key support for login
  if (loginPassword) {
    loginPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginBtn.click();
      }
    });
  }

  // Fetch galleries data
  function fetchJson(primaryUrl, fallbackUrl){
    return fetch(primaryUrl).then(res=>{
      if(res.ok) return res.json();
      return fetch(fallbackUrl).then(r=>r.json());
    }).catch(()=>fetch(fallbackUrl).then(r=>r.json()));
  }

  const progressDiv = document.getElementById('upload-progress');
  const hideLoading=()=>{ if(progressDiv) progressDiv.style.display='none'; };

  fetchJson('/api/galleries','../data/galleries.json')
    .then(data=>{renderGalleries(data); hideLoading(); window._origGalleries = JSON.parse(JSON.stringify(data)); window.adminLog?.('Gallerie caricate');})
    .catch(err=>{
      console.error(err);
      window.adminLog?.('Errore caricamento gallerie');
      container.innerHTML = '<p class="error">Impossibile caricare i dati. Controlla che il server sia in esecuzione.</p>';
      hideLoading();
    });

  function renderGalleries(data){
    const gTpl = document.getElementById('gallery-template');
    const sTpl = document.getElementById('slide-row-template');
    Object.entries(data).forEach(([galleryKey,slides])=>{
      const gNode = gTpl.content.cloneNode(true);
      const panel = gNode.querySelector('.gallery-panel');
      const title = gNode.querySelector('.gallery-title');
      const tbody = gNode.querySelector('tbody');

      title.textContent = galleryKey;

      slides.forEach((slide,i)=>{
        const row   = sTpl.content.cloneNode(true);
        row.querySelector('.slide-index').textContent = i+1;
        row.querySelector('.slide-title').textContent = slide.title || '-';
        const type = slide.video ? 'video' : slide.modalGallery ? 'gallery' : slide.modalImage ? 'image' : slide.canvas ? 'canvas' : 'unknown';
        row.querySelector('.slide-type').textContent = type;
        tbody.appendChild(row);
      });

      // attach add slide & save handlers
      const addBtn = gNode.querySelector('.add-slide-btn');
      const saveBtn= gNode.querySelector('.save-gallery-btn');

      addBtn.addEventListener('click',()=>{
        openSlideEditor(null,(slideObj)=>{
          addSlideRow(slideObj);
          refreshIndexes(tbody);
        });
      });

      saveBtn.addEventListener('click',()=>{
        saveAllGalleries();
      });

      container.appendChild(gNode);

      // helper to add row
      function addSlideRow(slide){
          const frag   = sTpl.content.cloneNode(true);
          const tr     = frag.querySelector('tr');
          const index  = tbody.querySelectorAll('tr').length;

          tr.querySelector('.slide-index').textContent = index+1;
          tr.querySelector('.slide-title').textContent = slide.title || '-';
          const type = slide.video ? 'video' : slide.modalGallery ? 'gallery' : slide.modalImage ? 'image' : slide.canvas ? 'canvas' : 'unknown';
          tr.querySelector('.slide-type').textContent = type;
          tr.dataset.slide = JSON.stringify(slide);

          // edit
          tr.querySelector('.edit-btn').addEventListener('click',()=>{
            const current = JSON.parse(tr.dataset.slide);
            openSlideEditor(current, (updated)=> {
              tr.dataset.slide = JSON.stringify(updated);
              tr.querySelector('.slide-title').textContent = updated.title || '-';
              const newType = updated.video ? 'video' : updated.modalGallery ? 'gallery' : updated.modalImage ? 'image' : updated.canvas ? 'canvas' : 'unknown';
              tr.querySelector('.slide-type').textContent = newType;
            });
          });
          // delete
          tr.querySelector('.delete-btn').addEventListener('click',()=>{
            if(confirm('Eliminare questa slide?')){ tr.remove(); refreshIndexes(tbody);}
          });
          // move up/down
          tr.querySelector('.up-btn').addEventListener('click',()=>{ const prev=tr.previousElementSibling; if(prev){ tbody.insertBefore(tr,prev); refreshIndexes(tbody);} });
          tr.querySelector('.down-btn').addEventListener('click',()=>{ const next=tr.nextElementSibling?.nextElementSibling; tbody.insertBefore(tr,next); refreshIndexes(tbody);} );
          tbody.appendChild(frag);
      }

      // initialize existing
      tbody.innerHTML = '';
      slides.forEach(addSlideRow);
      // enable drag reorder slides
      if(window.Sortable){ new Sortable(tbody,{animation:120,handle:'.slide-index',onEnd:()=>refreshIndexes(tbody)}); }
    });
  }

  function saveAllGalleries(){
    const galleriesData = {};
    document.querySelectorAll('.gallery-panel').forEach(panel=>{
      const key = panel.querySelector('.gallery-title').textContent.trim();
      const rows = panel.querySelectorAll('tbody tr');
      const slidesArr = Array.from(rows).map(r=>JSON.parse(r.dataset.slide));
      galleriesData[key] = slidesArr;
    });

    // ------- Diff descriptions vs original --------
    const diffMsgs = [];
    const orig = window._origGalleries || {};
    Object.entries(galleriesData).forEach(([gKey,slides])=>{
      const origSlides = orig[gKey] || [];
      slides.forEach((sl,idx)=>{
        const prev = origSlides[idx] || {};
        if((prev.description||'') !== (sl.description||'')){
          diffMsgs.push(`\n📌 Descrizione modificata [Gallery: ${gKey} | Slide #${idx+1} "${sl.title||'-'}"]\n   • Prima: "${(prev.description||'').substr(0,120)}"\n   • Dopo:  "${(sl.description||'').substr(0,120)}"`);
        }
      });
    });
    // Log diffs
    diffMsgs.forEach(m=>window.adminLog?.(m));

    // Detailed log information
    const galleryCount = Object.keys(galleriesData).length;
    const slideCount = Object.values(galleriesData).reduce((acc,arr)=>acc+arr.length,0);
    const logMsgOk = `✅ Gallerie salvate (${galleryCount} gallery, ${slideCount} slide)`;

    if(window.APP_ENV==='prod'){
      // Check if user is authenticated
      if (!window.isAuthenticated || !window.isAuthenticated()) {
        alert('Please login first');
        return;
      }
      
      window.saveGalleriesProd(galleriesData)
        .then(()=>{ alert('Gallerie salvate su Firestore!'); window.adminLog?.(logMsgOk+' [Firestore]'); })
        .catch(err=>{ console.error(err); alert('Errore salvataggio'); window.adminLog?.('❌ Errore salvataggio gallerie'); });
      return;
    }

    const token = prompt('Token amministratore per salvare:');
    if(!token) return;
    fetch(`/api/galleries?token=${encodeURIComponent(token)}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(galleriesData)
    }).then(r=>{
      if(r.ok){ window.adminLog?.(logMsgOk); }
      else{ alert('Errore nel salvataggio'); window.adminLog?.('❌ Errore salvataggio gallerie'); }
    }).catch(err=>{
      alert('Errore di rete'); console.error(err); window.adminLog?.('❌ Errore rete salvataggio gallerie');
    });
  }

  // Additionally load site config (bio, contacts, sections)
  // Load site config - use Firestore in prod
  const loadSiteConfigAdmin = async () => {
    try {
      const site = await fetchJson('/api/site','../data/site.json');
      renderSiteConfig(site);
      window.adminLog?.('Site config caricata');
      return site; // <-- ensure the promise resolves with the loaded config
    } catch (err) {
      console.error(err);
      window.adminLog?.('Errore caricamento site config');
    }
  };
  
  loadSiteConfigAdmin();

  function renderSiteConfig(site){
    // api base
    const apiInput=document.getElementById('api-base-input');
    if(apiInput) apiInput.value = site.apiBase || '';
    const heroInput=document.getElementById('hero-text-input');
    if(heroInput) heroInput.value = site.heroText || '';
    // version
    const versionInput=document.getElementById('version-input');
    if(versionInput) versionInput.value = site.version || '';
    // bio
    document.getElementById('bio-input').value = site.bio || '';

    // contacts
    const contactsDiv = document.getElementById('contacts-list');
    contactsDiv.innerHTML = '';
    site.contacts?.forEach((c,i)=>{
      const row = document.createElement('div');
      row.className = 'contact-row';
      row.innerHTML = `<input type="text" class="contact-label" value="${c.label}" placeholder="etichetta" style="width:100px"> <input type="text" class="contact-value" value="${c.value}" placeholder="valore" style="width:300px"> <button class="delete contact-del">X</button>`;
      row.querySelector('.contact-del').addEventListener('click', ()=>{
        row.remove();
      });
      contactsDiv.appendChild(row);
    });

    document.getElementById('add-contact-btn').addEventListener('click',()=>{
      const row = document.createElement('div');
      row.className = 'contact-row';
      row.innerHTML = `<input type="text" class="contact-label" placeholder="etichetta" style="width:100px"> <input type="text" class="contact-value" placeholder="valore" style="width:300px"> <button class="delete contact-del">X</button>`;
      row.querySelector('.contact-del').addEventListener('click', ()=> row.remove());
      contactsDiv.appendChild(row);
    });

    // sections
    const secBody = document.querySelector('#sections-table tbody');
    secBody.innerHTML = '';
    site.sections?.forEach((s,i)=>{
      const tr=document.createElement('tr');
      const status = s.status || (s.visible===false? 'hide':'show');
      tr.innerHTML=`<td class="drag-handle">☰</td><td><select class="status-select"><option value="show">Mostra</option><option value="soon">Coming Soon</option><option value="hide">Nascondi</option></select></td><td><input type="text" class="sec-key" value="${s.key}" style="width:90px"></td><td><input type="text" class="sec-label" value="${s.label}" style="width:120px"></td><td><button class="delete sec-del">Elimina</button></td>`;
      tr.querySelector('.status-select').value = status;
      tr.querySelector('.sec-del').addEventListener('click',()=>tr.remove());
      // move buttons for sections
      tr.querySelector('.drag-handle'); // already exists
      const up=document.createElement('button');up.textContent='↑';up.className='move-btn up-btn';
      const down=document.createElement('button');down.textContent='↓';down.className='move-btn down-btn';
      const actionCell=tr.querySelector('td:last-child');
      actionCell.prepend(down); actionCell.prepend(up);
      up.addEventListener('click',()=>{const prev=tr.previousElementSibling; if(prev){secBody.insertBefore(tr,prev);}});
      down.addEventListener('click',()=>{const next=tr.nextElementSibling?.nextElementSibling; secBody.insertBefore(tr,next);} );
      secBody.appendChild(tr);
    });
    // enable drag reorder of sections
    if(window.Sortable){ new Sortable(document.getElementById('sections-tbody'),{animation:150}); }

    document.getElementById('add-section-btn').addEventListener('click',()=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td class="drag-handle">☰</td><td><select class="status-select"><option value="show" selected>Mostra</option><option value="soon">Coming Soon</option><option value="hide">Nascondi</option></select></td><td><input type="text" class="sec-key" placeholder="chiave" style="width:90px"></td><td><input type="text" class="sec-label" placeholder="label" style="width:120px"></td><td><button class="delete sec-del">Elimina</button></td>`;
      tr.querySelector('.sec-del').addEventListener('click',()=>tr.remove());
      document.querySelector('#sections-table tbody').appendChild(tr);
    });

    // save btn
    document.getElementById('save-site-btn').addEventListener('click',()=>{
      const bioVal = document.getElementById('bio-input').value;
      const heroVal = document.getElementById('hero-text-input').value;
      // collect contacts
      const contacts = Array.from(document.querySelectorAll('.contact-row')).map(r=>({
        label: r.querySelector('.contact-label').value,
        value: r.querySelector('.contact-value').value
      })).filter(c=>c.label||c.value);
      // collect sections
      const sections = Array.from(document.querySelectorAll('#sections-table tbody tr')).map(tr=>({
        status: tr.querySelector('.status-select').value,
        key: tr.querySelector('.sec-key').value.trim(),
        label: tr.querySelector('.sec-label').value.trim()
      })).filter(s=>s.key);

      const apiBaseVal = document.getElementById('api-base-input').value.trim();
      const shaderVal = document.getElementById('shader-url-input').value.trim();
      const versionVal = document.getElementById('version-input').value.trim();
      const payload = { bio: bioVal, heroText: heroVal, contacts, sections, apiBase: apiBaseVal, shaderUrl: shaderVal, version: versionVal };

      const logSiteMsg = `✅ Site salvato (version ${versionVal||'n/a'}, contatti ${contacts.length}, sezioni ${sections.length})`;

      if(window.APP_ENV==='prod'){
        window.saveSiteProd(payload)
          .then(()=>{ alert('Salvato in Firestore!'); window.adminLog?.(logSiteMsg+' [Firestore]'); })
          .catch(err=>{ console.error(err); alert('Errore salvataggio'); });
        return;
      }

      const token = prompt('Inserisci il token amministratore per salvare:');
      if(!token) return;
      fetch(`/api/site?token=${encodeURIComponent(token)}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      }).then(r=>{
        if(r.ok){
          alert('Salvato con successo!');
          window.adminLog?.(logSiteMsg);
        }else{
          alert('Errore nel salvataggio');
          window.adminLog?.('❌ Errore salvataggio site');
        }
      }).catch(err=>{
        alert('Errore di rete');
        console.error(err);
        window.adminLog?.('❌ Errore rete salvataggio site');
      });
    });

    const shaderInput=document.getElementById('shader-url-input');
    const shaderCurrent=document.getElementById('shader-current');
    if(shaderInput) shaderInput.value = site.shaderUrl || '';
    if(shaderCurrent) shaderCurrent.textContent = site.shaderUrl || '—';
    if(shaderInput){
      shaderInput.addEventListener('input',()=>{
        if(shaderCurrent) shaderCurrent.textContent = shaderInput.value.trim() || '—';
      });
    }
  }

  const overlay = document.getElementById('slide-editor-overlay');
  const F = {
    title: document.getElementById('se-title'),
    canvas: document.getElementById('se-canvas'),
    type: document.getElementById('se-type'),
    src: document.getElementById('se-src'),
    video: document.getElementById('se-video'),
    image: document.getElementById('se-image'),
    desc: document.getElementById('se-description')
  };
  const typeFields = {
    video: document.getElementById('field-video'),
    image: document.getElementById('field-image'),
    gallery: document.getElementById('field-gallery')
  };

  function showTypeFields(t){
    Object.entries(typeFields).forEach(([k,div])=>{
      div.style.display = k===t ? 'block':'none';
    });
  }
  F.type.addEventListener('change',()=>showTypeFields(F.type.value));

  // ----- Gallery list UI helpers -----
  const galleryListEl = document.getElementById('se-gallery-list');
  let galleryArr = [];

  function renderGallery(){
    if(!galleryListEl) return;
    galleryListEl.innerHTML='';
    galleryArr.forEach((p,idx)=>{
      const li=document.createElement('li');
      li.innerHTML=`<span>${p}</span> <button class="delete small">X</button>`;
      li.querySelector('button').addEventListener('click',()=>{
        galleryArr.splice(idx,1);
        renderGallery();
      });
      galleryListEl.appendChild(li);
    });
  }

  let editorCb = null;
  document.getElementById('se-cancel').addEventListener('click',()=>overlay.classList.add('hidden'));
  document.getElementById('se-save').addEventListener('click',()=>{
    const obj = {};
    if(F.src.value.trim()) obj.src = F.src.value.trim();
    if(F.canvas.checked) obj.canvas = true;
    if(F.title.value.trim()) obj.title = F.title.value.trim();
    if(F.desc.value.trim()) obj.description = F.desc.value.trim();
    switch(F.type.value){
      case 'video':
        if(F.src.value.trim()) obj.src = F.src.value.trim();
        if(F.video.value.trim()) obj.video = F.video.value.trim();
        break;
      case 'image':
        obj.modalImage = F.image.value.trim();
        if(!obj.canvas) obj.canvas = true;
        break;
      case 'gallery':
        obj.modalGallery = [...galleryArr];
        if(!obj.canvas) obj.canvas = true;
        break;
    }
    overlay.classList.add('hidden');
    if(editorCb) editorCb(obj);
  });

  function openSlideEditor(slide, cb){
    editorCb = cb;
    document.getElementById('se-heading').textContent = slide ? 'Modifica Slide' : 'Nuova Slide';
    F.title.value='';F.canvas.checked=false;F.type.value='video';F.src.value='';F.video.value='';F.image.value='';F.desc.value='';
    if(slide){
      F.title.value = slide.title || '';
      F.canvas.checked = !!slide.canvas;
      if(slide.video){
        F.type.value='video'; F.src.value=slide.src||''; F.video.value=slide.video||'';
      }else if(slide.modalImage){
        F.type.value='image'; F.image.value=slide.modalImage;
      }else if(slide.modalGallery){
        F.type.value='gallery'; galleryArr=[...slide.modalGallery]; renderGallery();
      }
      F.desc.value = slide.description || '';
    }
    if(!slide){ galleryArr=[]; renderGallery(); }
    showTypeFields(F.type.value);
    overlay.classList.remove('hidden');
  }

  function refreshIndexes(tbody){
    Array.from(tbody.querySelectorAll('tr')).forEach((tr,idx)=>{
      tr.querySelector('.slide-index').textContent = idx+1;
    });
  }

  const hiddenInput = document.getElementById('hidden-file-input');
  let uploadTargetInputId = null;

  // click upload buttons
  document.querySelectorAll('.upload-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      uploadTargetInputId = btn.dataset.target;
      const accept = btn.dataset.accept || 'image/*,video/*';
      hiddenInput.accept = accept;
      hiddenInput.multiple = !!btn.dataset.multiple;
      hiddenInput.click();
    });
  });

  hiddenInput.addEventListener('change',()=>{
    if(!hiddenInput.files || hiddenInput.files.length===0) return;
    
    if(window.APP_ENV === 'prod') {
      // Check if user is authenticated
      if (!window.isAuthenticated || !window.isAuthenticated()) {
        alert('Please login first');
        hiddenInput.value = '';
        return;
      }
      
      // Firebase Storage upload in production
      const filesArr = Array.from(hiddenInput.files);
      const uploadPromises = filesArr.map(async file => {
        try {
          const downloadURL = await uploadToFirebaseStorage(file);
          return { path: downloadURL };
        } catch (error) {
          console.error('Firebase upload error:', error);
          throw error;
        }
      });
      
      Promise.all(uploadPromises).then(results => {
        const paths = results.map(r => r.path);
        const targetEl = document.getElementById(uploadTargetInputId);
        if(!targetEl) return;
        if(targetEl.id === 'se-gallery-list') {
          galleryArr.push(...paths);
          renderGallery();
        } else {
          targetEl.value = paths[0];
        }
        hiddenInput.value = '';
        alert('Upload completato!');
        window.adminLog?.(`✅ Upload completato (${paths.length} file): ${paths.join(', ')}`);
      }).catch(err => {
        alert('Errore upload: ' + err.message);
        console.error(err);
        window.adminLog?.('❌ Errore upload');
        hiddenInput.value = '';
      });
      return;
    }
    
    const token = prompt('Token amministratore per upload:');
    if(!token){ hiddenInput.value=''; return; }

    const filesArr = Array.from(hiddenInput.files);

    const uploadPromises = filesArr.map(file=>{
      const fd = new FormData();
      fd.append('file', file);
      return fetch(`/api/upload?token=${encodeURIComponent(token)}`,{method:'POST',body:fd})
              .then(r=>r.json());
    });

    Promise.all(uploadPromises).then(results=>{
      const paths = results.map(r=>r.path);
      const targetEl = document.getElementById(uploadTargetInputId);
      if(!targetEl) return;
      if(targetEl.id==='se-gallery-list'){
        galleryArr.push(...paths);
        renderGallery();
      }else{
        targetEl.value = paths[0];
      }
      hiddenInput.value='';
    }).catch(err=>{
      alert('Errore upload'); console.error(err); hiddenInput.value='';
    });
  });
});

  // Mobile shader editor
  (function(){
    const ta=document.getElementById('shader-text');
    const btn=document.getElementById('save-shader-btn');
    if(!ta||!btn) return;
    
    // Load shader text
    const loadShader = async () => {
      if(window.APP_ENV === 'prod' && window.getSiteProd) {
        try {
          const site = await window.getSiteProd();
          return site.mobileShader || '// No shader found in Firestore';
        } catch(err) {
          console.error('Firestore shader load error:', err);
          return '// Firestore load failed';
        }
      } else {
        try {
          const res = await fetch('/api/mobileShader');
          if(res.ok) return await res.text();
          return '// API fetch failed';
        } catch(err) {
          return '// fetch failed';
        }
      }
    };
    
    loadShader().then(txt => { ta.value = txt; });
    
    btn.addEventListener('click', async () => {
      if(window.APP_ENV === 'prod') {
        try {
          await window.saveSiteProd({ mobileShader: ta.value });
          alert('Shader salvato in Firestore!');
          window.adminLog?.('Mobile shader salvato');
        } catch(err) {
          console.error(err);
          alert('Errore salvataggio shader');
        }
        return;
      }
      
      const token = prompt('Token amministratore per salvare shader:');
      if(!token) return;
      fetch(`/api/mobileShader?token=${encodeURIComponent(token)}`, {
        method:'PUT',
        headers:{'Content-Type':'text/plain'},
        body:ta.value
      }).then(r=>{
        if(r.ok){
          alert('Shader salvato!');
          window.adminLog?.(`✅ Mobile shader salvato (${ta.value.length} caratteri)`);
        }else{ alert('Errore salvataggio'); window.adminLog?.('❌ Errore salvataggio shader'); }
      }).catch(()=>{alert('Errore rete'); window.adminLog?.('❌ Errore rete salvataggio shader');});
    });
  })(); 

// ---------- UI HELPERS ----------
function selectNav(targetId){
  document.querySelectorAll('.nav-link').forEach(btn=>{
    const active = btn.dataset.target === targetId;
    btn.classList.toggle('active', active);
  });
  document.querySelectorAll('.main-content section').forEach(sec=>{
    sec.classList.toggle('hidden-section', sec.id!==targetId);
  });
}

function addLog(msg){
  const out=document.getElementById('log-output');
  if(!out) return;
  const time = new Date().toLocaleTimeString();
  out.textContent += `[${time}] ${msg}\n`;
  out.scrollTop = out.scrollHeight;
}

// attach nav listeners
document.querySelectorAll('.nav-link').forEach(btn=>{
  btn.addEventListener('click',()=>{
    selectNav(btn.dataset.target);
  });
});

// default view
selectNav('galleries');

// expose addLog globally for other modules
window.adminLog = addLog; 

// --- Local testing helper ---
if (location.hostname === 'localhost' || location.hostname.startsWith('127.') || location.hostname.includes('local')) {
  window.adminLog('🔧 Sistema log inizializzato');
  let _testCnt = 0;
  const _testId = setInterval(() => {
    _testCnt++;
    window.adminLog(`Log di prova #${_testCnt}`);
    if (_testCnt >= 3) clearInterval(_testId);
  }, 2000);
} 
