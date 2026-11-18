// Gallery Page Logic
let allArtifacts = [];
let currentCategory = 'all';
let currentPeriod = 'all';
let searchQuery = '';
let viewMode = 'grid'; // 'grid' or 'list'

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
});

async function initGallery() {
  const container = document.getElementById('artifacts-container');
  const searchInput = document.getElementById('search-input');
  const categoryFilters = document.querySelectorAll('.category-filter-btn');
  const periodFilter = document.getElementById('period-filter-select');
  const viewToggles = document.querySelectorAll('.view-toggle-btn');

  // Load from API
  try {
    const res = await fetch('/api/artifacts');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      allArtifacts = json.data;
      renderArtifacts();
      populatePeriods(allArtifacts);
    }
  } catch (err) {
    console.error('Lỗi nạp danh sách hiện vật:', err);
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <p style="color: var(--color-accent-red); font-size: 1.1rem; margin-bottom: 12px;">⚠️ Không thể nạp dữ liệu từ máy chủ.</p>
          <button class="btn btn-secondary" onclick="location.reload()">Thử Lại</button>
        </div>
      `;
    }
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderArtifacts();
    });
  }

  // Category filter pills
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderArtifacts();
    });
  });

  // Period dropdown
  if (periodFilter) {
    periodFilter.addEventListener('change', e => {
      currentPeriod = e.target.value;
      renderArtifacts();
    });
  }

  // View toggle (Grid / List)
  viewToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggles.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = btn.getAttribute('data-view');
      renderArtifacts();
    });
  });
}

function populatePeriods(artifacts) {
  const periodSelect = document.getElementById('period-filter-select');
  if (!periodSelect) return;

  const periods = new Set();
  artifacts.forEach(a => {
    if (a.period) periods.add(a.period);
  });

  periods.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    periodSelect.appendChild(opt);
  });
}

function renderArtifacts() {
  const container = document.getElementById('artifacts-container');
  const countBadge = document.getElementById('result-count');
  if (!container) return;

  let filtered = allArtifacts.filter(item => {
    const matchCategory = currentCategory === 'all' || item.category === currentCategory;
    const matchPeriod = currentPeriod === 'all' || (item.period && item.period.includes(currentPeriod));
    const matchSearch = !searchQuery || (
      (item.name || '').toLowerCase().includes(searchQuery) ||
      (item.description || '').toLowerCase().includes(searchQuery) ||
      (item.period || '').toLowerCase().includes(searchQuery) ||
      (item.material || '').toLowerCase().includes(searchQuery) ||
      (item.location || '').toLowerCase().includes(searchQuery) ||
      (item.categoryName || '').toLowerCase().includes(searchQuery)
    );
    return matchCategory && matchPeriod && matchSearch;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} hiện vật`;
  }

  if (filtered.length === 0) {
    container.className = 'artifacts-empty-state';
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <span style="font-size: 3rem; display: block; margin-bottom: 16px;">🔍</span>
        <h3 style="font-size: 1.3rem; margin-bottom: 8px; color: var(--color-gold-light);">Không tìm thấy hiện vật phù hợp</h3>
        <p style="color: var(--color-text-muted); margin-bottom: 20px;">Vui lòng thử từ khóa khác hoặc điều chỉnh bộ lọc phân loại.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetFilters()">Đặt lại bộ lọc</button>
      </div>
    `;
    return;
  }

  container.className = viewMode === 'list' ? 'artifacts-list-view' : 'artifacts-grid-view';

  container.innerHTML = filtered.map(item => {
    const isNational = (item.heritageRank || '').includes('Bảo vật Quốc gia');
    const badgeClass = isNational ? 'badge-national' : 'badge-gold';
    const photoCount = item.captureInfo?.photoCount || 60;

    if (viewMode === 'list') {
      return `
        <div class="card card-horizontal">
          <div class="card-media" style="width: 280px; min-width: 280px;">
            <img src="${item.mainImage || '/assets/images/trong-dong-dong-son/main.svg'}" alt="${item.name}" loading="lazy" />
            <div class="card-tag-badge">
              <span class="badge ${badgeClass}">${item.categoryName || 'Hiện vật'}</span>
            </div>
            <div class="card-3d-indicator">
              <span>🌐 3D</span>
            </div>
          </div>
          <div class="card-body">
            <h3 class="card-title"><a href="detail.html?id=${item.id}">${item.name}</a></h3>
            <div class="card-meta">
              <span class="card-meta-item">⏳ <strong>Niên đại:</strong> ${item.period || 'Chưa rõ'}</span>
              <span class="card-meta-item">🏛️ <strong>Lưu giữ:</strong> ${item.location || 'Bảo tàng Quốc gia'}</span>
              <span class="card-meta-item">🏺 <strong>Chất liệu:</strong> ${item.material || 'Hợp kim'}</span>
            </div>
            <p class="card-excerpt">${item.description || ''}</p>
            <div class="card-footer">
              <span class="card-capture-meta">📸 Tái tạo từ <strong>${photoCount} ảnh</strong> (Photogrammetry)</span>
              <a href="detail.html?id=${item.id}" class="btn btn-primary btn-sm">
                <span>Khám phá 3D</span> ➔
              </a>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="card">
        <div class="card-media">
          <img src="${item.mainImage || '/assets/images/trong-dong-dong-son/main.svg'}" alt="${item.name}" loading="lazy" />
          <div class="card-tag-badge">
            <span class="badge ${badgeClass}">${item.categoryName || 'Hiện vật'}</span>
          </div>
          <div class="card-3d-indicator">
            <span>🌐 Xoay 360°</span>
          </div>
        </div>
        <div class="card-body">
          <h3 class="card-title"><a href="detail.html?id=${item.id}">${item.name}</a></h3>
          <div class="card-meta">
            <span class="card-meta-item">⏳ ${item.period || 'Chưa rõ'}</span>
            <span class="card-meta-item">🏛️ ${item.location || 'Bảo tàng Quốc gia'}</span>
          </div>
          <p class="card-excerpt">${item.description || ''}</p>
          <div class="card-footer">
            <span class="card-capture-meta">📸 ${photoCount} góc ảnh</span>
            <a href="detail.html?id=${item.id}" class="btn btn-primary btn-sm">
              <span>Xem 3D</span> ➔
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  currentCategory = 'all';
  currentPeriod = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.category-filter-btn').forEach((b, idx) => {
    b.classList.toggle('active', idx === 0);
  });
  const periodFilter = document.getElementById('period-filter-select');
  if (periodFilter) periodFilter.value = 'all';
  renderArtifacts();
}
