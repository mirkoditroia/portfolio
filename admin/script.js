/* Admin dashboard logic (work in progress) */

document.addEventListener('DOMContentLoaded', ()=>{
  const container = document.getElementById('galleries');
  if(!container) return;

  // Fetch galleries data
  function fetchJson(primaryUrl, fallbackUrl){
    return fetch(primaryUrl).then(res=>{
      if(res.ok) return res.json();
      return fetch(fallbackUrl).then(r=>r.json());
    }).catch(()=>fetch(fallbackUrl).then(r=>r.json()));
  }

  fetchJson('/api/galleries','../data/galleries.json')
    .then(data=>renderGalleries(data))
    .catch(err=>{
      console.error(err);
      container.innerHTML = '<p class="error">Impossibile caricare i dati. Controlla che il server sia in esecuzione.</p>';
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
          tbody.appendChild(frag);
      }

      // initialize existing
      tbody.innerHTML = '';
      slides.forEach(addSlideRow);
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
    const token = prompt('Token amministratore per salvare:');
    if(!token) return;
    fetch(`/api/galleries?token=${encodeURIComponent(token)}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(galleriesData)
    }).then(r=>{
      if(r.ok){ alert('Gallerie salvate!'); }
      else{ alert('Errore nel salvataggio'); }
    }).catch(err=>{
      alert('Errore di rete'); console.error(err);
    });
  }

  // Additionally load site config (bio, contacts, sections)
  fetchJson('/api/site','../data/site.json')
    .then(site=>renderSiteConfig(site))
    .catch(err=>console.error(err));

  function renderSiteConfig(site){
    // api base
    const apiInput=document.getElementById('api-base-input');
    if(apiInput) apiInput.value = site.apiBase || '';
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
      tr.innerHTML=`<td><select class="status-select"><option value="show">Mostra</option><option value="soon">Coming Soon</option><option value="hide">Nascondi</option></select></td><td><input type="text" class="sec-key" value="${s.key}" style="width:90px"></td><td><input type="text" class="sec-label" value="${s.label}" style="width:120px"></td><td><button class="delete sec-del">Elimina</button></td>`;
      tr.querySelector('.status-select').value = status;
      tr.querySelector('.sec-del').addEventListener('click',()=>tr.remove());
      secBody.appendChild(tr);
    });
    document.getElementById('add-section-btn').addEventListener('click',()=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td><select class="status-select"><option value="show" selected>Mostra</option><option value="soon">Coming Soon</option><option value="hide">Nascondi</option></select></td><td><input type="text" class="sec-key" placeholder="chiave" style="width:90px"></td><td><input type="text" class="sec-label" placeholder="label" style="width:120px"></td><td><button class="delete sec-del">Elimina</button></td>`;
      tr.querySelector('.sec-del').addEventListener('click',()=>tr.remove());
      document.querySelector('#sections-table tbody').appendChild(tr);
    });

    // save btn
    document.getElementById('save-site-btn').addEventListener('click',()=>{
      const bioVal = document.getElementById('bio-input').value;
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
      const payload = { bio: bioVal, contacts, sections, apiBase: apiBaseVal, shaderUrl: shaderVal };
      const token = prompt('Inserisci il token amministratore per salvare:');
      if(!token) return;
      fetch(`/api/site?token=${encodeURIComponent(token)}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      }).then(r=>{
        if(r.ok){
          alert('Salvato con successo!');
        }else{
          alert('Errore nel salvataggio');
        }
      }).catch(err=>{
        alert('Errore di rete');
        console.error(err);
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
