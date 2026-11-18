// Admin Dashboard & Artifact Management
let adminArtifacts = [];
let editingArtifactId = null;
let uploadedModelUrl = null;
let uploadedImageUrl = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  setupAdminEvents();
});

async function loadDashboardData() {
  try {
    // 1. Load Stats
    const statsRes = await fetch('/api/stats');
    const statsJson = await statsRes.json();
    if (statsJson.success && statsJson.stats) {
      renderStats(statsJson.stats);
    }

    // 2. Load Artifacts
    const artRes = await fetch('/api/artifacts');
    const artJson = await artRes.json();
    if (artJson.success && Array.isArray(artJson.data)) {
      adminArtifacts = artJson.data;
      renderArtifactTable(adminArtifacts);
    }
  } catch (err) {
    console.error('Lỗi nạp dữ liệu quản trị:', err);
    showToast('Lỗi nạp dữ liệu từ máy chủ', 'error');
  }
}

function renderStats(stats) {
  document.getElementById('stat-total-artifacts').textContent = stats.totalArtifacts || 0;
  document.getElementById('stat-total-models').textContent = stats.modelsCount || 0;
  document.getElementById('stat-total-categories').textContent = stats.categoriesCount || 0;
  document.getElementById('stat-total-photos').textContent = stats.totalPhotosCount || 0;
}

function renderArtifactTable(artifacts) {
  const tbody = document.getElementById('artifacts-tbody');
  if (!tbody) return;

  if (artifacts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--color-text-muted);">
          Chưa có hiện vật nào trong hệ thống. Hãy nhấn "+ Thêm Hiện Vật Mới" để bắt đầu.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = artifacts.map((item, index) => {
    return `
      <tr>
        <td><strong>#${index + 1}</strong></td>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${item.mainImage || '/assets/images/trong-dong-dong-son/main.svg'}" 
                 style="width: 48px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid var(--color-border-subtle);" />
            <div>
              <div style="font-weight: 700; color: var(--color-gold-light);">${item.name}</div>
              <div style="font-size: 0.78rem; color: var(--color-text-muted);">${item.id}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-gold">${item.categoryName || item.category}</span></td>
        <td style="font-size: 0.85rem; color: var(--color-text-secondary);">${item.period || '—'}</td>
        <td style="font-size: 0.85rem; color: var(--color-bronze);">${item.location || '—'}</td>
        <td>
          ${item.modelPath ? `
            <span style="color: var(--color-accent-green); font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
              ✓ GLB 3D
            </span>
          ` : '<span style="color: var(--color-text-muted); font-size: 0.8rem;">Chưa có</span>'}
        </td>
        <td>
          <div style="display: flex; gap: 8px;">
            <a href="detail.html?id=${item.id}" target="_blank" class="btn btn-secondary btn-sm" title="Xem trên Web" style="padding: 6px 10px;">
              👁️
            </a>
            <button class="btn btn-secondary btn-sm" onclick="openEditModal('${item.id}')" title="Chỉnh sửa" style="padding: 6px 10px;">
              ✏️
            </button>
            <button class="btn btn-secondary btn-sm" onclick="confirmDelete('${item.id}', '${item.name.replace(/'/g, "\\'")}')" 
                    title="Xóa" style="padding: 6px 10px; color: var(--color-accent-red); border-color: rgba(239, 68, 68, 0.3);">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupAdminEvents() {
  // Add artifact button
  const btnAdd = document.getElementById('btn-add-artifact');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => openCreateModal());
  }

  // File upload: 3D Model (.glb, .gltf)
  const inputModelFile = document.getElementById('input-model-file');
  if (inputModelFile) {
    inputModelFile.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      await uploadFile(file, 'model');
    });
  }

  // File upload: Main Image
  const inputImgFile = document.getElementById('input-image-file');
  if (inputImgFile) {
    inputImgFile.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      await uploadFile(file, 'image');
    });
  }

  // Form submit
  const form = document.getElementById('artifact-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await handleSaveArtifact();
    });
  }

  // Category select change auto-updates category name
  const catSelect = document.getElementById('form-category');
  if (catSelect) {
    catSelect.addEventListener('change', () => {
      const selected = catSelect.options[catSelect.selectedIndex];
      const catNameInput = document.getElementById('form-category-name');
      if (catNameInput && selected) {
        catNameInput.value = selected.getAttribute('data-name') || selected.text;
      }
    });
  }

  // Filter input on table
  const searchInput = document.getElementById('admin-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = adminArtifacts.filter(a => 
        (a.name || '').toLowerCase().includes(q) ||
        (a.id || '').toLowerCase().includes(q) ||
        (a.categoryName || '').toLowerCase().includes(q)
      );
      renderArtifactTable(filtered);
    });
  }
}

async function uploadFile(file, type) {
  const statusEl = document.getElementById(type === 'model' ? 'model-upload-status' : 'image-upload-status');
  if (statusEl) {
    statusEl.innerHTML = `<span style="color: var(--color-gold-primary);">⏳ Đang tải lên: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...</span>`;
  }

  const formData = new FormData();
  formData.append(type === 'model' ? 'modelFile' : 'imageFile', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    if (json.success && json.files && json.files.length > 0) {
      const uploaded = json.files[0];
      if (type === 'model') {
        uploadedModelUrl = uploaded.url;
        document.getElementById('form-model-path').value = uploaded.url;
        if (statusEl) {
          statusEl.innerHTML = `<span style="color: var(--color-accent-green);">✓ Tải lên thành công: ${file.name}</span>`;
        }
        // Update Live 3D Preview
        updateAdmin3DPreview(uploaded.url);
      } else {
        uploadedImageUrl = uploaded.url;
        document.getElementById('form-main-image').value = uploaded.url;
        if (statusEl) {
          statusEl.innerHTML = `<span style="color: var(--color-accent-green);">✓ Tải lên ảnh thành công</span>`;
        }
      }
      showToast(`Đã tải lên ${file.name}`, 'success');
    } else {
      throw new Error(json.message || 'Lỗi không xác định');
    }
  } catch (err) {
    console.error('Lỗi tải tệp:', err);
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: var(--color-accent-red);">⚠️ Thất bại: ${err.message}</span>`;
    }
    showToast('Lỗi tải tệp: ' + err.message, 'error');
  }
}

function updateAdmin3DPreview(modelUrl) {
  const previewViewer = document.getElementById('admin-preview-viewer');
  if (previewViewer && modelUrl) {
    previewViewer.setAttribute('src', modelUrl);
    previewViewer.style.display = 'block';
  }
}

function openCreateModal() {
  editingArtifactId = null;
  uploadedModelUrl = null;
  uploadedImageUrl = null;

  document.getElementById('modal-title').textContent = 'Thêm Hiện Vật Mới';
  document.getElementById('artifact-form').reset();
  document.getElementById('form-model-path').value = '/models/trong-dong-dong-son.glb';
  document.getElementById('form-main-image').value = '/assets/images/trong-dong-dong-son/main.svg';
  document.getElementById('model-upload-status').innerHTML = '';
  document.getElementById('image-upload-status').innerHTML = '';

  updateAdmin3DPreview('/models/trong-dong-dong-son.glb');
  document.getElementById('artifact-modal').classList.add('open');
}

function openEditModal(id) {
  const item = adminArtifacts.find(a => a.id === id);
  if (!item) return;

  editingArtifactId = id;
  document.getElementById('modal-title').textContent = `Chỉnh Sửa: ${item.name}`;

  document.getElementById('form-name').value = item.name || '';
  document.getElementById('form-category').value = item.category || 'bronze';
  document.getElementById('form-category-name').value = item.categoryName || '';
  document.getElementById('form-period').value = item.period || '';
  document.getElementById('form-material').value = item.material || '';
  document.getElementById('form-dimensions').value = item.dimensions || '';
  document.getElementById('form-location').value = item.location || '';
  document.getElementById('form-heritage-rank').value = item.heritageRank || '';
  document.getElementById('form-model-path').value = item.modelPath || '';
  document.getElementById('form-main-image').value = item.mainImage || '';
  document.getElementById('form-description').value = item.description || '';
  document.getElementById('form-significance').value = item.historicalSignificance || '';
  document.getElementById('form-references').value = Array.isArray(item.references) ? item.references.join('\n') : (item.references || '');

  document.getElementById('model-upload-status').innerHTML = '';
  document.getElementById('image-upload-status').innerHTML = '';

  updateAdmin3DPreview(item.modelPath);
  document.getElementById('artifact-modal').classList.add('open');
}

function closeAdminModal() {
  document.getElementById('artifact-modal').classList.remove('open');
}

async function handleSaveArtifact() {
  const name = document.getElementById('form-name').value.trim();
  if (!name) {
    showToast('Vui lòng nhập tên hiện vật', 'error');
    return;
  }

  const category = document.getElementById('form-category').value;
  const categoryName = document.getElementById('form-category-name').value || 'Hiện vật';
  const period = document.getElementById('form-period').value.trim();
  const material = document.getElementById('form-material').value.trim();
  const dimensions = document.getElementById('form-dimensions').value.trim();
  const location = document.getElementById('form-location').value.trim();
  const heritageRank = document.getElementById('form-heritage-rank').value.trim();
  const modelPath = document.getElementById('form-model-path').value.trim();
  const mainImage = document.getElementById('form-main-image').value.trim();
  const description = document.getElementById('form-description').value.trim();
  const historicalSignificance = document.getElementById('form-significance').value.trim();
  const rawRefs = document.getElementById('form-references').value.trim();
  const references = rawRefs ? rawRefs.split('\n').map(r => r.trim()).filter(Boolean) : [];

  const payload = {
    name,
    category,
    categoryName,
    period,
    material,
    dimensions,
    location,
    heritageRank,
    modelPath,
    mainImage,
    description,
    historicalSignificance,
    references
  };

  try {
    let res;
    if (editingArtifactId) {
      // Update
      res = await fetch(`/api/artifacts/${editingArtifactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Create
      res = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const json = await res.json();
    if (json.success) {
      showToast(editingArtifactId ? 'Đã cập nhật hiện vật thành công' : 'Đã thêm hiện vật mới thành công', 'success');
      closeAdminModal();
      await loadDashboardData();
    } else {
      showToast('Lỗi: ' + json.message, 'error');
    }
  } catch (err) {
    console.error('Lỗi lưu hiện vật:', err);
    showToast('Lỗi khi gửi yêu cầu lên máy chủ', 'error');
  }
}

async function confirmDelete(id, name) {
  if (!confirm(`Bạn có chắc chắn muốn xóa hiện vật "${name}" khỏi bảo tàng không?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/artifacts/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast(`Đã xóa hiện vật "${name}"`, 'success');
      await loadDashboardData();
    } else {
      showToast('Lỗi xóa: ' + json.message, 'error');
    }
  } catch (err) {
    console.error('Lỗi xóa hiện vật:', err);
    showToast('Không thể xóa hiện vật', 'error');
  }
}

