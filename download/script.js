/* Downloads page logic */
(function () {
  'use strict';

  const CATEGORY_LABELS = {
    touchdesigner: 'TouchDesigner',
    houdini: 'Houdini',
    blender: 'Blender',
    unity: 'Unity',
    unreal: 'Unreal',
    other: 'Other'
  };

  const FILE_ICONS = {
    tox: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>',
    hda: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    default: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'
  };

  let allAssets = [];
  let activeCategory = 'all';

  const grid = document.getElementById('downloads-grid');
  const emptyState = document.getElementById('dl-empty');
  const filtersSection = document.querySelector('.dl-filters');
  const modal = document.getElementById('dl-modal');

  /* ───── Data loading ───── */
  async function loadDownloads() {
    try {
      await new Promise(r => setTimeout(r, 200));

      let data;
      if (window.fetchJson) {
        data = await window.fetchJson('/api/downloads', '/data/downloads.json');
      } else {
        const res = await fetch('/data/downloads.json');
        data = await res.json();
      }

      allAssets = Array.isArray(data) ? data : [];
      buildFilters();
      renderGrid();
    } catch (err) {
      console.error('Failed to load downloads:', err);
      allAssets = [];
      renderGrid();
    }
  }

  /* ───── Filters ───── */
  function buildFilters() {
    const categories = new Set(allAssets.map(a => a.category).filter(Boolean));
    filtersSection.innerHTML = '';

    const allBtn = createFilterBtn('all', 'All');
    allBtn.classList.add('active');
    filtersSection.appendChild(allBtn);

    categories.forEach(cat => {
      filtersSection.appendChild(createFilterBtn(cat, CATEGORY_LABELS[cat] || cat));
    });
  }

  function createFilterBtn(cat, label) {
    const btn = document.createElement('button');
    btn.className = 'dl-filter-btn';
    btn.dataset.category = cat;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      activeCategory = cat;
      document.querySelectorAll('.dl-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    });
    return btn;
  }

  /* ───── Grid rendering ───── */
  function renderGrid() {
    const filtered = activeCategory === 'all'
      ? allAssets
      : allAssets.filter(a => a.category === activeCategory);

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.appendChild(emptyState);
      emptyState.style.display = '';
      return;
    }

    filtered.forEach((asset, idx) => {
      const card = document.createElement('article');
      card.className = 'dl-card';
      card.setAttribute('role', 'listitem');
      card.style.animationDelay = `${idx * 0.06}s`;
      card.addEventListener('click', () => openModal(asset));

      const catClass = `dl-cat-${asset.category || 'other'}`;
      const fileIcon = FILE_ICONS[asset.fileType] || FILE_ICONS.default;

      card.innerHTML = `
        <div class="dl-card-thumb">
          ${asset.thumbnail
            ? `<img src="${asset.thumbnail}" alt="${asset.title}" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111820;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
               </div>`
          }
          <div class="dl-card-overlay"></div>
          ${asset.video ? `
          <div class="dl-card-play">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#0a0e14">
              <polygon points="8,5 20,12 8,19"/>
            </svg>
          </div>` : ''}
        </div>
        <div class="dl-card-body">
          <div class="dl-card-header">
            <h3 class="dl-card-name">${asset.title || 'Untitled'}</h3>
            ${asset.free !== false ? '<span class="dl-badge dl-badge-free">Free</span>' : ''}
          </div>
          <p class="dl-card-desc">${asset.description || ''}</p>
          <div class="dl-card-footer">
            <span class="dl-card-type ${catClass}">${fileIcon} .${asset.fileType || 'file'}</span>
            ${asset.fileSize ? `<span class="dl-card-size">${asset.fileSize}</span>` : ''}
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  /* ───── Modal ───── */
  function openModal(asset) {
    const video = document.getElementById('dl-modal-video');
    const image = document.getElementById('dl-modal-image');
    const title = document.getElementById('dl-modal-title');
    const badge = document.getElementById('dl-modal-badge');
    const desc = document.getElementById('dl-modal-description');
    const cat = document.getElementById('dl-modal-category');
    const ft = document.getElementById('dl-modal-filetype');
    const fs = document.getElementById('dl-modal-filesize');
    const ver = document.getElementById('dl-modal-version');
    const verRow = document.getElementById('dl-modal-version-row');
    const tags = document.getElementById('dl-modal-tags');
    const dlBtn = document.getElementById('dl-modal-download-btn');

    title.textContent = asset.title || 'Untitled';
    desc.textContent = asset.description || '';

    badge.textContent = asset.free !== false ? 'Free' : '';
    badge.className = 'dl-badge' + (asset.free !== false ? ' dl-badge-free' : '');

    cat.textContent = CATEGORY_LABELS[asset.category] || asset.category || '—';
    ft.textContent = asset.fileType ? `.${asset.fileType.toUpperCase()}` : '—';
    fs.textContent = asset.fileSize || '—';

    if (asset.version) {
      ver.textContent = `v${asset.version}`;
      verRow.style.display = '';
    } else {
      verRow.style.display = 'none';
    }

    tags.innerHTML = '';
    if (asset.tags && asset.tags.length) {
      asset.tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'dl-tag';
        span.textContent = t;
        tags.appendChild(span);
      });
    }

    if (asset.video) {
      video.src = asset.video;
      video.style.display = 'block';
      image.style.display = 'none';
      video.load();
    } else if (asset.thumbnail) {
      video.style.display = 'none';
      video.src = '';
      image.src = asset.thumbnail;
      image.alt = asset.title || '';
      image.style.display = 'block';
    } else {
      video.style.display = 'none';
      video.src = '';
      image.style.display = 'none';
    }

    if (asset.fileUrl) {
      dlBtn.href = asset.fileUrl;
      dlBtn.style.display = '';
      dlBtn.style.pointerEvents = '';
      dlBtn.onclick = function () {
        if (window.MeirksAnalytics) {
          window.MeirksAnalytics.trackDownload(asset.title || 'unknown');
        }
      };
    } else {
      dlBtn.removeAttribute('href');
      dlBtn.style.display = 'none';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (window.MeirksAnalytics) {
      window.MeirksAnalytics.trackInteraction('download', asset.title || 'unknown');
      window.MeirksAnalytics.startContentView('download', asset.title || 'unknown');
    }
  }

  function closeModal() {
    if (window.MeirksAnalytics) {
      window.MeirksAnalytics.endContentView();
    }
    modal.style.display = 'none';
    document.body.style.overflow = '';
    const video = document.getElementById('dl-modal-video');
    video.pause();
    video.src = '';
  }

  document.getElementById('dl-modal-close').addEventListener('click', closeModal);
  document.getElementById('dl-modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
  });

  /* ───── Init ───── */
  document.addEventListener('DOMContentLoaded', loadDownloads);
})();
