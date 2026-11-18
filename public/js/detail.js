// Artifact Detail Page & 3D Interactive Controller
let currentArtifact = null;
let modelViewerEl = null;
let threeViewerInstance = null;
let isUsingThreeFallback = false;

document.addEventListener('DOMContentLoaded', () => {
  initDetailPage();
});

async function initDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const artifactId = urlParams.get('id') || 'trong-dong-dong-son';

  try {
    const res = await fetch(`/api/artifacts/${artifactId}`);
    const json = await res.json();
    if (!json.success || !json.data) {
      showErrorState('Không tìm thấy hiện vật được yêu cầu.');
      return;
    }
    currentArtifact = json.data;
    renderArtifactDetails(currentArtifact);
    init3DViewer(currentArtifact);
    initGalleryTabs(currentArtifact);
  } catch (err) {
    console.error('Lỗi tải hiện vật:', err);
    showErrorState('Không thể kết nối đến máy chủ bảo tàng.');
  }
}

function showErrorState(msg) {
  const container = document.querySelector('.detail-main-layout');
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px;">
        <span style="font-size: 3.5rem;">⚠️</span>
        <h2 style="color: var(--color-gold-light); margin: 16px 0;">${msg}</h2>
        <a href="gallery.html" class="btn btn-primary" style="margin-top: 16px;">Về Thư Viện Hiện Vật</a>
      </div>
    `;
  }
}

function renderArtifactDetails(art) {
  // Breadcrumb & Titles
  document.title = `${art.name} | Bảo Tàng Số 3D`;
  const elName = document.getElementById('artifact-title');
  const elPeriod = document.getElementById('artifact-period');
  const elCategory = document.getElementById('artifact-category-badge');
  const elHeritage = document.getElementById('artifact-heritage-badge');

  if (elName) elName.textContent = art.name;
  if (elPeriod) elPeriod.textContent = art.period;
  if (elCategory) elCategory.textContent = art.categoryName || 'Hiện vật cổ';
  if (elHeritage) {
    elHeritage.textContent = art.heritageRank || 'Di sản văn hóa';
    if (art.heritageRank?.includes('Bảo vật Quốc gia')) {
      elHeritage.className = 'badge badge-national';
    }
  }

  // Specifications
  document.getElementById('meta-material').textContent = art.material || 'Đang cập nhật';
  document.getElementById('meta-dimensions').textContent = art.dimensions || 'Đang cập nhật';
  document.getElementById('meta-location').textContent = art.location || 'Bảo tàng Lịch sử Quốc gia';

  // Description & Significance
  document.getElementById('desc-content').textContent = art.description || '';
  document.getElementById('significance-content').textContent = art.historicalSignificance || '';

  // Photogrammetry Tech Specs Box
  if (art.captureInfo) {
    document.getElementById('tech-photos').textContent = `${art.captureInfo.photoCount} ảnh chụp thực tế`;
    document.getElementById('tech-overlap').textContent = `${art.captureInfo.overlap} (Độ phủ khuyến nghị)`;
    document.getElementById('tech-camera').textContent = art.captureInfo.camera || 'Máy ảnh chuyên dụng';
    document.getElementById('tech-software').textContent = art.captureInfo.reconstructionSoftware || 'Photogrammetry 3D';
    document.getElementById('tech-poly').textContent = art.captureInfo.polygonCount || '35,000 đa giác';
    document.getElementById('tech-texture').textContent = art.captureInfo.textureResolution || '4K PBR';
  }

  // References list
  const refList = document.getElementById('references-list');
  if (refList && Array.isArray(art.references)) {
    refList.innerHTML = art.references.map(r => `<li>❖ ${r}</li>`).join('');
  }
}

function init3DViewer(art) {
  modelViewerEl = document.getElementById('main-model-viewer');
  const loadingOverlay = document.getElementById('viewer-loading');
  const loadingBar = document.getElementById('loading-bar-fill');
  const hudTitle = document.getElementById('hud-artifact-title');
  const hudMeta = document.getElementById('hud-artifact-meta');

  if (hudTitle) hudTitle.textContent = art.name;
  if (hudMeta) hudMeta.textContent = `${art.dimensions || ''} • 3D Photogrammetry`;

  if (modelViewerEl) {
    modelViewerEl.setAttribute('src', art.modelPath);
    modelViewerEl.setAttribute('poster', art.mainImage || '');
    modelViewerEl.setAttribute('alt', art.name);

    // Setup archaeological hotspots
    setupHotspots(art.hotspots || []);

    // Loading events
    modelViewerEl.addEventListener('progress', e => {
      const p = Math.round(e.detail.totalProgress * 100);
      if (loadingBar) loadingBar.style.width = `${p}%`;
    });

    modelViewerEl.addEventListener('load', () => {
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.style.display = 'none', 300);
      }
    });

    modelViewerEl.addEventListener('error', () => {
      console.warn('Google Model-Viewer failed to load model, activating Three.js fallback engine...');
      activateThreeFallback(art);
    });
  }

  setupViewerControls(art);
}

function setupHotspots(hotspots) {
  if (!modelViewerEl) return;

  // Clear existing hotspots
  const oldPins = modelViewerEl.querySelectorAll('.view-hotspot');
  oldPins.forEach(p => p.remove());

  hotspots.forEach((hs, idx) => {
    const pin = document.createElement('button');
    pin.className = 'view-hotspot';
    pin.slot = hs.slot || `hotspot-${idx}`;
    pin.setAttribute('data-position', hs.position);
    pin.setAttribute('data-normal', hs.normal || '0m 1m 0m');

    const annotation = document.createElement('div');
    annotation.className = 'hotspot-annotation';
    annotation.innerHTML = `
      <h4 class="hotspot-annotation-title">${hs.title}</h4>
      <p class="hotspot-annotation-desc">${hs.text}</p>
    `;

    pin.appendChild(annotation);

    pin.addEventListener('click', () => {
      annotation.classList.toggle('visible');
    });

    modelViewerEl.appendChild(pin);
  });
}

function setupViewerControls(art) {
  // 1. Auto-Rotate Toggle
  const btnAutoRotate = document.getElementById('btn-auto-rotate');
  if (btnAutoRotate && modelViewerEl) {
    btnAutoRotate.addEventListener('click', () => {
      const isAuto = modelViewerEl.hasAttribute('auto-rotate');
      if (isAuto) {
        modelViewerEl.removeAttribute('auto-rotate');
        btnAutoRotate.classList.remove('active');
        showToast('Đã dừng tự động xoay', 'info');
      } else {
        modelViewerEl.setAttribute('auto-rotate', '');
        btnAutoRotate.classList.add('active');
        showToast('Bật tự động xoay 360°', 'info');
      }
    });
  }

  // 2. Reset View
  const btnReset = document.getElementById('btn-reset-view');
  if (btnReset && modelViewerEl) {
    btnReset.addEventListener('click', () => {
      modelViewerEl.cameraOrbit = '0deg 75deg 105%';
      modelViewerEl.cameraTarget = 'auto auto auto';
      modelViewerEl.fieldOfView = 'auto';
      showToast('Đã đặt lại góc nhìn mặc định', 'info');
    });
  }

  // 3. Zoom In & Out
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  if (btnZoomIn && modelViewerEl) {
    btnZoomIn.addEventListener('click', () => {
      modelViewerEl.zoom(1);
    });
  }
  if (btnZoomOut && modelViewerEl) {
    btnZoomOut.addEventListener('click', () => {
      modelViewerEl.zoom(-1);
    });
  }

  // 4. Fullscreen Toggle
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const viewerWrapper = document.getElementById('viewer-wrapper');
  if (btnFullscreen && viewerWrapper) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        viewerWrapper.requestFullscreen().catch(() => {
          viewerWrapper.classList.toggle('fullscreen');
        });
        btnFullscreen.classList.add('active');
      } else {
        document.exitFullscreen().catch(() => {});
        viewerWrapper.classList.remove('fullscreen');
        btnFullscreen.classList.remove('active');
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        viewerWrapper.classList.remove('fullscreen');
        btnFullscreen.classList.remove('active');
      }
    });
  }

  // 5. Snapshot Capture Button
  const btnSnapshot = document.getElementById('btn-snapshot');
  if (btnSnapshot && modelViewerEl) {
    btnSnapshot.addEventListener('click', async () => {
      try {
        let dataUrl;
        if (isUsingThreeFallback && threeViewerInstance) {
          dataUrl = threeViewerInstance.captureSnapshot();
        } else {
          dataUrl = modelViewerEl.toDataURL('image/png');
        }

        if (dataUrl) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${art.id}_3d_snapshot.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          showToast('Đã chụp và lưu ảnh mô hình 3D thành công!', 'success');
        }
      } catch (e) {
        showToast('Không thể chụp ảnh: ' + e.message, 'error');
      }
    });
  }

  // 6. View Mode Switcher (Realistic, Wireframe, Clay, X-Ray)
  const modePills = document.querySelectorAll('.mode-pill');
  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const mode = pill.getAttribute('data-mode');

      if (isUsingThreeFallback && threeViewerInstance) {
        threeViewerInstance.setViewMode(mode);
      } else if (modelViewerEl && modelViewerEl.model) {
        // Manipulate model-viewer material
        applyModelViewerMaterialMode(mode);
      }
      showToast(`Chế độ xem: ${pill.textContent}`, 'info');
    });
  });

  // 7. Lighting Preset Switcher
  const lightBtns = document.querySelectorAll('.btn-light-preset');
  lightBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      lightBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-preset');

      if (isUsingThreeFallback && threeViewerInstance) {
        threeViewerInstance.setLighting(preset);
      } else if (modelViewerEl) {
        if (preset === 'studio') {
          modelViewerEl.exposure = 1.4;
          modelViewerEl.shadowIntensity = 1.0;
        } else if (preset === 'museum') {
          modelViewerEl.exposure = 1.1;
          modelViewerEl.shadowIntensity = 1.5;
        } else if (preset === 'sunset') {
          modelViewerEl.exposure = 0.9;
          modelViewerEl.shadowIntensity = 2.0;
        } else if (preset === 'white') {
          modelViewerEl.exposure = 1.6;
          modelViewerEl.shadowIntensity = 0.5;
        }
      }
      showToast(`Ánh sáng: ${btn.getAttribute('data-name')}`, 'info');
    });
  });
}

function applyModelViewerMaterialMode(mode) {
  if (!modelViewerEl || !modelViewerEl.model) return;
  const materials = modelViewerEl.model.materials;
  if (!materials || materials.length === 0) return;

  materials.forEach(mat => {
    if (mode === 'texture') {
      mat.pbrMetallicRoughness.setBaseColorFactor(null); // Restore original
      mat.pbrMetallicRoughness.setMetallicFactor(0.7);
      mat.pbrMetallicRoughness.setRoughnessFactor(0.4);
    } else if (mode === 'clay') {
      mat.pbrMetallicRoughness.setBaseColorFactor([0.82, 0.76, 0.68, 1.0]);
      mat.pbrMetallicRoughness.setMetallicFactor(0.05);
      mat.pbrMetallicRoughness.setRoughnessFactor(0.85);
    } else if (mode === 'wireframe') {
      // If native wireframe is not exposed by model-viewer WebComponent, switch to Three.js canvas
      activateThreeFallback(currentArtifact, 'wireframe');
    } else if (mode === 'xray') {
      activateThreeFallback(currentArtifact, 'xray');
    }
  });
}

function activateThreeFallback(art, initialMode = 'texture') {
  isUsingThreeFallback = true;
  const mv = document.getElementById('main-model-viewer');
  const threeContainer = document.getElementById('three-canvas-container');
  const loadingOverlay = document.getElementById('viewer-loading');

  if (mv) mv.style.display = 'none';
  if (threeContainer) threeContainer.style.display = 'block';

  if (!threeViewerInstance) {
    threeViewerInstance = new window.HeritageThreeViewer(threeContainer);
    threeViewerInstance.init();
  }

  threeViewerInstance.setViewMode(initialMode);
  threeViewerInstance.loadGLB(
    art.modelPath,
    pct => {
      const bar = document.getElementById('loading-bar-fill');
      if (bar) bar.style.width = `${Math.round(pct * 100)}%`;
    },
    () => {
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.style.display = 'none', 300);
      }
    },
    () => {
      if (loadingOverlay) {
        loadingOverlay.innerHTML = `
          <p style="color: var(--color-accent-red); font-size: 1rem;">Không thể nạp tệp mô hình 3D.</p>
        `;
      }
    }
  );
}

function initGalleryTabs(art) {
  const container = document.getElementById('photo-gallery-grid');
  if (!container) return;

  const photos = art.photos || [];
  if (photos.length === 0) {
    container.innerHTML = '<p class="text-muted">Chưa có ảnh chụp thực tế được tải lên.</p>';
    return;
  }

  container.innerHTML = photos.map(p => `
    <div class="photo-gallery-card" onclick="openPhotoLightbox('${p.url}', '${p.title}')">
      <img src="${p.url}" alt="${p.title}" loading="lazy" />
      <div class="photo-gallery-overlay">
        <span>🔍 ${p.title}</span>
      </div>
    </div>
  `).join('');
}

function openPhotoLightbox(url, title) {
  let modal = document.getElementById('photo-lightbox-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'photo-lightbox-modal';
    modal.className = 'lightbox-modal';
    modal.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" onclick="closePhotoLightbox()">✕</button>
        <img id="lightbox-img" src="" alt="" />
        <p id="lightbox-caption" class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) closePhotoLightbox();
    });
  }

  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox-caption').textContent = title;
  modal.classList.add('open');
}

function closePhotoLightbox() {
  const modal = document.getElementById('photo-lightbox-modal');
  if (modal) modal.classList.remove('open');
}

