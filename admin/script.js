/* Admin dashboard logic (work in progress) */

document.addEventListener('DOMContentLoaded', ()=>{
  const container = document.getElementById('galleries');
  if(!container) return;

  // Determine environment once
  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host.includes('localhost');

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
            if(confirm('Eliminare questa slide?')){ 
              tr.remove(); 
              refreshIndexes(tbody);
              // Mark gallery as unsaved when slide is deleted
              const galleryKey = tbody.closest('.gallery-panel').querySelector('.gallery-title').textContent.trim();
              markGalleryUnsaved(galleryKey);
            }
          });
          // move up/down
          tr.querySelector('.up-btn').addEventListener('click',()=>{ 
            const prev=tr.previousElementSibling; 
            if(prev){ 
              tbody.insertBefore(tr,prev); 
              refreshIndexes(tbody);
              // Mark gallery as unsaved when order changes
              const galleryKey = tbody.closest('.gallery-panel').querySelector('.gallery-title').textContent.trim();
              markGalleryUnsaved(galleryKey);
            }
          });
          tr.querySelector('.down-btn').addEventListener('click',()=>{ 
            const next=tr.nextElementSibling?.nextElementSibling; 
            if(next){
              tbody.insertBefore(tr,next); 
              refreshIndexes(tbody);
              // Mark gallery as unsaved when order changes
              const galleryKey = tbody.closest('.gallery-panel').querySelector('.gallery-title').textContent.trim();
              markGalleryUnsaved(galleryKey);
            }
          });
          tbody.appendChild(frag);
      }

      // initialize existing
      tbody.innerHTML = '';
      slides.forEach(addSlideRow);
      // enable drag reorder slides
      if(window.Sortable){ 
        new Sortable(tbody, {
          animation: 120,
          handle: '.drag-handle',
          onEnd: () => {
            refreshIndexes(tbody);
            // Mark gallery as unsaved when order changes
            const galleryKey = panel.querySelector('.gallery-title').textContent.trim();
            markGalleryUnsaved(galleryKey);
          }
        }); 
      }
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
        
        // Check for title changes
        if((prev.title||'') !== (sl.title||'')){
          diffMsgs.push(`📝 TITOLO modificato [Gallery: ${gKey} | Slide #${idx+1}]\n   • Prima: "${prev.title||'(vuoto)'}" → Dopo: "${sl.title||'(vuoto)'}"`);
        }
        
        // Check for description changes
        if((prev.description||'') !== (sl.description||'')){
          const prevDesc = prev.description || '(vuota)';
          const newDesc = sl.description || '(vuota)';
          diffMsgs.push(`📝 DESCRIZIONE modificata [Gallery: ${gKey} | Slide #${idx+1} "${sl.title||'Senza titolo'}"]\n   • Prima: "${prevDesc.substr(0,80)}${prevDesc.length>80?'...':''}"\n   • Dopo:  "${newDesc.substr(0,80)}${newDesc.length>80?'...':''}"`);
        }
        
        // Check for video path changes
        if((prev.video||'') !== (sl.video||'')){
          diffMsgs.push(`📝 VIDEO modificato [Gallery: ${gKey} | Slide #${idx+1} "${sl.title||'Senza titolo'}"]\n   • Prima: "${prev.video||'(nessun video)'}" → Dopo: "${sl.video||'(nessun video)'}"`);
        }
        
        // Check for image src changes
        if((prev.src||'') !== (sl.src||'')){
          diffMsgs.push(`📝 IMMAGINE COPERTINA modificata [Gallery: ${gKey} | Slide #${idx+1} "${sl.title||'Senza titolo'}"]\n   • Prima: "${prev.src||'(nessuna)'}" → Dopo: "${sl.src||'(nessuna)'}"`);
        }
        
        // Check for modal image changes
        if((prev.modalImage||'') !== (sl.modalImage||'')){
          diffMsgs.push(`📝 IMMAGINE MODALE modificata [Gallery: ${gKey} | Slide #${idx+1} "${sl.title||'Senza titolo'}"]\n   • Prima: "${prev.modalImage||'(nessuna)'}" → Dopo: "${sl.modalImage||'(nessuna)'}"`);
        }
        
        // Check for canvas toggle
        if(!!prev.canvas !== !!sl.canvas){
          diffMsgs.push(`📝 CANVAS ${sl.canvas?'ATTIVATO':'DISATTIVATO'} [Gallery: ${gKey} | Slide #${idx+1} "${sl.title||'Senza titolo'}"]`);
        }
      });
      
      // Check for added slides
      if(slides.length > origSlides.length){
        const addedCount = slides.length - origSlides.length;
        diffMsgs.push(`➕ AGGIUNTE ${addedCount} nuove slide nella gallery "${gKey}"`);
      }
      
      // Check for removed slides
      if(slides.length < origSlides.length){
        const removedCount = origSlides.length - slides.length;
        diffMsgs.push(`➖ RIMOSSE ${removedCount} slide dalla gallery "${gKey}"`);
      }
    });
    // Log diffs
    diffMsgs.forEach(m=>window.adminLog?.(m));

    // Detailed log information
    const galleryCount = Object.keys(galleriesData).length;
    const slideCount = Object.values(galleriesData).reduce((acc,arr)=>acc+arr.length,0);
    
    // Create summary of changes
    let changeSummary = '';
    if(diffMsgs.length === 0){
      changeSummary = 'Nessuna modifica rilevata';
    } else {
      const changeTypes = {
        titoli: diffMsgs.filter(m=>m.includes('TITOLO')).length,
        descrizioni: diffMsgs.filter(m=>m.includes('DESCRIZIONE')).length,
        video: diffMsgs.filter(m=>m.includes('VIDEO')).length,
        immagini: diffMsgs.filter(m=>m.includes('IMMAGINE')).length,
        canvas: diffMsgs.filter(m=>m.includes('CANVAS')).length,
        aggiunte: diffMsgs.filter(m=>m.includes('AGGIUNTE')).length,
        rimosse: diffMsgs.filter(m=>m.includes('RIMOSSE')).length
      };
      
      const changes = [];
      if(changeTypes.titoli > 0) changes.push(`${changeTypes.titoli} titoli`);
      if(changeTypes.descrizioni > 0) changes.push(`${changeTypes.descrizioni} descrizioni`);
      if(changeTypes.video > 0) changes.push(`${changeTypes.video} video`);
      if(changeTypes.immagini > 0) changes.push(`${changeTypes.immagini} immagini`);
      if(changeTypes.canvas > 0) changes.push(`${changeTypes.canvas} canvas`);
      if(changeTypes.aggiunte > 0) changes.push(`${changeTypes.aggiunte} slide aggiunte`);
      if(changeTypes.rimosse > 0) changes.push(`${changeTypes.rimosse} slide rimosse`);
      
      changeSummary = changes.length > 0 ? `Modifiche: ${changes.join(', ')}` : 'Modifiche minori';
    }
    
    const logMsgOk = `✅ Salvataggio completato → ${changeSummary} | Totale: ${galleryCount} gallery, ${slideCount} slide`;

    if(window.APP_ENV==='prod'){
      // Check if user is authenticated
      if (!window.isAuthenticated || !window.isAuthenticated()) {
        alert('Please login first');
        return;
      }
      
      window.saveGalleriesProd(galleriesData)
        .then(()=>{ alert('Gallerie salvate su Firestore!'); window.adminLog?.(logMsgOk+' [Firestore]'); window.unsavedChanges.galleries.clear(); document.querySelectorAll('.gallery-panel').forEach(p=>p.classList.remove('unsaved-changes')); document.querySelectorAll('.save-gallery-btn').forEach(b=>b.classList.remove('save-btn-highlight')); })
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
      if(r.ok){ window.adminLog?.(logMsgOk); window.unsavedChanges.galleries.clear(); document.querySelectorAll('.gallery-panel').forEach(p=>p.classList.remove('unsaved-changes')); document.querySelectorAll('.save-gallery-btn').forEach(b=>b.classList.remove('save-btn-highlight')); }
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
      window._origSite = JSON.parse(JSON.stringify(site)); // Store original for diff
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
    // site name
    const siteNameInput=document.getElementById('site-name-input');
    if(siteNameInput) siteNameInput.value = site.siteName || 'VFXULO';
    const heroInput=document.getElementById('hero-text-input');
    if(heroInput) heroInput.value = site.heroText || '';
    // show logo
    const showLogoInput=document.getElementById('show-logo-input');
    if(showLogoInput) showLogoInput.checked = site.showLogo || false;
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

    // Individual save functions
    setupIndividualSaveFunctions();
    
    // Add change detection to all site config inputs
    const siteInputs = [
      { id: 'site-name-input', form: 'heroBio' },
      { id: 'bio-input', form: 'heroBio' },
      { id: 'hero-text-input', form: 'heroBio' },
      { id: 'show-logo-input', form: 'heroBio' },
      { id: 'version-input', form: 'version' },
      { id: 'api-base-input', form: 'api' },
      { id: 'shader-url-input', form: 'api' }
    ];
    
    siteInputs.forEach(({id, form}) => {
      const input = document.getElementById(id);
      if(input) {
        const eventType = input.type === 'checkbox' ? 'change' : 'input';
        input.addEventListener(eventType, () => markFormUnsaved(form));
      }
    });
    
    // Add change detection to contact and section modifications
    document.getElementById('add-contact-btn').addEventListener('click', () => {
      setTimeout(() => markFormUnsaved('contacts'), 100);
    });
    
    document.getElementById('add-section-btn').addEventListener('click', () => {
      setTimeout(() => markFormUnsaved('sections'), 100);
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
    const slideData = {
      title: F.title.value,
      canvas: F.canvas.checked,
      description: F.desc.value
    };
    if(F.type.value==='video'){
      slideData.src = F.src.value;
      slideData.video = F.video.value;
    }else if(F.type.value==='image'){
      slideData.modalImage = F.image.value;
    }else if(F.type.value==='gallery'){
      slideData.modalGallery = [...galleryArr];
    }
    editorCb(slideData);
    
    // Mark gallery as unsaved when slide is modified
    const activeGallery = document.querySelector('.gallery-panel[open]');
    if(activeGallery) {
      const galleryKey = activeGallery.querySelector('.gallery-title').textContent.trim();
      markGalleryUnsaved(galleryKey);
    }
    
    overlay.classList.add('hidden');
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
    
    // Show upload overlay
    const overlay = document.getElementById('upload-progress-overlay');
    const progressFill = document.getElementById('upload-progress-fill');
    const uploadStatus = document.getElementById('upload-status');
    const uploadTitle = document.getElementById('upload-title');
    const fileList = document.getElementById('upload-file-list');
    
    const showUploadProgress = () => {
      overlay.classList.add('show');
      progressFill.style.width = '0%';
      uploadStatus.textContent = 'Preparazione upload...';
      uploadTitle.textContent = `Caricamento ${hiddenInput.files.length} file...`;
      fileList.innerHTML = '';
      
      // Add files to list
      Array.from(hiddenInput.files).forEach(file => {
        const item = document.createElement('div');
        item.className = 'upload-file-item';
        item.innerHTML = `<span class="upload-file-icon">📄</span>${file.name}`;
        fileList.appendChild(item);
      });
    };
    
    const hideUploadProgress = () => {
      setTimeout(() => {
        overlay.classList.remove('show');
      }, 1000);
    };
    
    const updateProgress = (percent, status) => {
      progressFill.style.width = percent + '%';
      uploadStatus.textContent = status;
    };
    
    const markFileComplete = (fileName, success = true) => {
      const items = fileList.querySelectorAll('.upload-file-item');
      items.forEach(item => {
        if(item.textContent.includes(fileName)) {
          item.classList.add(success ? 'success' : 'error');
          item.querySelector('.upload-file-icon').textContent = success ? '✅' : '❌';
        }
      });
    };
    
    showUploadProgress();
    
    if(window.APP_ENV === 'prod') {
      // Check if user is authenticated
      if (!window.isAuthenticated || !window.isAuthenticated()) {
        alert('Please login first');
        hiddenInput.value = '';
        hideUploadProgress();
        return;
      }
      
      updateProgress(10, 'Connessione a Firebase...');
      
      // Firebase Storage upload in production
      const filesArr = Array.from(hiddenInput.files);
      const uploadPromises = filesArr.map(async (file, index) => {
        try {
          updateProgress(20 + (index * 60 / filesArr.length), `Upload ${file.name}...`);
          const downloadURL = await uploadToFirebaseStorage(file);
          markFileComplete(file.name, true);
          return { path: downloadURL };
        } catch (error) {
          console.error('Firebase upload error:', error);
          markFileComplete(file.name, false);
          throw error;
        }
      });
      
      Promise.all(uploadPromises).then(results => {
        updateProgress(100, 'Upload completato!');
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
        hideUploadProgress();
      }).catch(err => {
        updateProgress(0, 'Errore durante upload');
        alert('Errore upload: ' + err.message);
        console.error(err);
        window.adminLog?.('❌ Errore upload');
        hiddenInput.value = '';
        hideUploadProgress();
      });
      return;
    }
    
    const token = prompt('Token amministratore per upload:');
    if(!token){ hiddenInput.value=''; hideUploadProgress(); return; }

    updateProgress(20, 'Invio file al server...');
    const filesArr = Array.from(hiddenInput.files);

    const uploadPromises = filesArr.map((file, index)=>{
      updateProgress(30 + (index * 50 / filesArr.length), `Upload ${file.name}...`);
      const fd = new FormData();
      fd.append('file', file);
      return fetch(`/api/upload?token=${encodeURIComponent(token)}`,{method:'POST',body:fd})
              .then(r=>{
                markFileComplete(file.name, r.ok);
                return r.json();
              });
    });

    Promise.all(uploadPromises).then(results=>{
      updateProgress(100, 'Upload completato!');
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
      window.adminLog?.(`✅ Upload completato (${paths.length} file): ${paths.join(', ')}`);
      hideUploadProgress();
    }).catch(err=>{
      updateProgress(0, 'Errore durante upload');
      alert('Errore upload'); console.error(err); hiddenInput.value='';
      hideUploadProgress();
    });
  });
});

  // Inject log styles once
  (function(){
    if(document.getElementById('log-style')) return;
    const style = document.createElement('style');
    style.id = 'log-style';
    style.textContent = `
      .log-line{font-family:monospace;white-space:pre-wrap;}
      .log-success{color:#28a745;}
      .log-info{color:#00bcd4;}
      .log-diff{color:#ffc107;}
      .log-error{color:#ff3860;}
    `;
    document.head.appendChild(style);
  })();

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
  const line=document.createElement('span');
  line.style.display='block';
  line.style.margin='2px 0';
  line.style.fontFamily='monospace';
  // Determine color from first char
  if(msg.startsWith('✅')) line.style.color='#28a745'; // green
  else if(msg.startsWith('❌')) line.style.color='#dc3545'; // red  
  else if(msg.startsWith('📌') || msg.startsWith('📝')) line.style.color='#ffc107'; // yellow
  else if(msg.startsWith('➕') || msg.startsWith('➖')) line.style.color='#fd7e14'; // orange
  else line.style.color='#17a2b8'; // cyan
  line.textContent=`[${time}] ${msg}`;
  out.appendChild(line);
  out.appendChild(document.createElement('br'));
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

// --- Unsaved changes tracking ---
window.unsavedChanges = {
  galleries: new Set(),
  heroBio: false,
  version: false,
  contacts: false,
  api: false,
  sections: false,
  shader: false
};

function markGalleryUnsaved(galleryKey) {
  window.unsavedChanges.galleries.add(galleryKey);
  const panel = Array.from(document.querySelectorAll('.gallery-panel')).find(p => 
    p.querySelector('.gallery-title').textContent.trim() === galleryKey
  );
  if(panel) {
    panel.classList.add('unsaved-changes');
    const saveBtn = panel.querySelector('.save-gallery-btn');
    if(saveBtn) saveBtn.classList.add('save-btn-highlight');
  }
  window.adminLog?.(`⚠️ Gallery "${galleryKey}" ha modifiche non salvate`);
}

function markSiteConfigUnsaved() {
  // This function is now replaced by specific form functions
}

function markFormUnsaved(formType) {
  window.unsavedChanges[formType] = true;
  const form = document.getElementById(`${formType.replace(/([A-Z])/g, '-$1').toLowerCase()}-form`);
  if(form) {
    form.classList.add('unsaved-changes');
    const saveBtn = form.querySelector('button[id*="save"]');
    if(saveBtn) saveBtn.classList.add('save-btn-highlight');
  }
  window.adminLog?.(`⚠️ ${getFormDisplayName(formType)} ha modifiche non salvate`);
}

function clearFormUnsaved(formType) {
  window.unsavedChanges[formType] = false;
  const form = document.getElementById(`${formType.replace(/([A-Z])/g, '-$1').toLowerCase()}-form`);
  if(form) {
    form.classList.remove('unsaved-changes');
    const saveBtn = form.querySelector('button[id*="save"]');
    if(saveBtn) saveBtn.classList.remove('save-btn-highlight');
  }
}

function getFormDisplayName(formType) {
  const names = {
    heroBio: 'Hero & Bio',
    version: 'Versione',
    contacts: 'Contatti',
    api: 'API Settings',
    sections: 'Sezioni',
    shader: 'Mobile Shader'
  };
  return names[formType] || formType;
}

function clearSiteConfigUnsaved() {
  // Clear all form unsaved states
  ['heroBio', 'version', 'contacts', 'api', 'sections', 'shader'].forEach(clearFormUnsaved);
}

function setupIndividualSaveFunctions() {
  // Hero & Bio save
  document.getElementById('save-hero-bio-btn')?.addEventListener('click', () => {
    const siteNameVal = document.getElementById('site-name-input').value;
    const heroVal = document.getElementById('hero-text-input').value;
    const showLogoVal = document.getElementById('show-logo-input').checked;
    const bioVal = document.getElementById('bio-input').value;
    const payload = { siteName: siteNameVal, heroText: heroVal, showLogo: showLogoVal, bio: bioVal };
    savePartialSiteConfig('Hero & Bio', payload, 'heroBio');
  });

  // Version save
  document.getElementById('save-version-btn')?.addEventListener('click', () => {
    const versionVal = document.getElementById('version-input').value.trim();
    const payload = { version: versionVal };
    savePartialSiteConfig('Versione', payload, 'version');
  });

  // Contacts save
  document.getElementById('save-contacts-btn')?.addEventListener('click', () => {
    const contacts = Array.from(document.querySelectorAll('.contact-row')).map(r=>({
      label: r.querySelector('.contact-label').value,
      value: r.querySelector('.contact-value').value
    })).filter(c=>c.label||c.value);
    const payload = { contacts };
    savePartialSiteConfig('Contatti', payload, 'contacts');
  });

  // API Settings save
  document.getElementById('save-api-btn')?.addEventListener('click', () => {
    const apiBaseVal = document.getElementById('api-base-input').value.trim();
    const shaderVal = document.getElementById('shader-url-input').value.trim();
    const payload = { apiBase: apiBaseVal, shaderUrl: shaderVal };
    savePartialSiteConfig('API Settings', payload, 'api');
  });

  // Sections save
  document.getElementById('save-sections-btn')?.addEventListener('click', () => {
    const sections = Array.from(document.querySelectorAll('#sections-table tbody tr')).map(tr=>({
      status: tr.querySelector('.status-select').value,
      key: tr.querySelector('.sec-key').value.trim(),
      label: tr.querySelector('.sec-label').value.trim()
    })).filter(s=>s.key);
    const payload = { sections };
    savePartialSiteConfig('Sezioni', payload, 'sections');
  });
}

async function savePartialSiteConfig(displayName, partialPayload, formType) {
  try {
    // Merge with existing site config
    const currentSite = window._origSite || {};
    const fullPayload = { ...currentSite, ...partialPayload };
    
    const logMsg = `✅ ${displayName} salvato`;
    
    if(window.APP_ENV === 'prod') {
      await window.saveSiteProd(fullPayload);
      alert(`${displayName} salvato in Firestore!`);
      window.adminLog?.(logMsg + ' [Firestore]');
    } else {
      const token = prompt(`Token amministratore per salvare ${displayName}:`);
      if(!token) return;
      
      const response = await fetch(`/api/site?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
      });
      
      if(response.ok) {
        alert(`${displayName} salvato con successo!`);
        window.adminLog?.(logMsg);
      } else {
        throw new Error('Errore nel salvataggio');
      }
    }
    
    // Update original site config and clear unsaved state
    Object.assign(window._origSite, partialPayload);
    clearFormUnsaved(formType);
    
  } catch(err) {
    console.error(err);
    alert(`Errore salvataggio ${displayName}`);
    window.adminLog?.(`❌ Errore salvataggio ${displayName}`);
  }
}

// --- Local testing helper ---
if (location.hostname === 'localhost' || location.hostname.startsWith('127.') || location.hostname.includes('local')) {
  window.adminLog('🔧 Sistema log inizializzato - Script aggiornato alle 16:34:15');
  let _testCnt = 0;
  const _testId = setInterval(() => {
    _testCnt++;
    window.adminLog(`✅ Log di prova #${_testCnt} - DOVREBBE ESSERE VERDE`);
    if (_testCnt >= 3) clearInterval(_testId);
  }, 2000);
} 
