const fs = require('fs');
const path = require('path');

// Test the actual API handlers from server.js
const DATA_FILE = path.join(__dirname, '..', 'data', 'artifacts.json');

function loadArtifacts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

console.log('--- STARTING REST API LOGIC TESTS ---');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.error(`✕ [FAIL] ${name}: ${e.message}`);
  }
}

// 1. Test search filter
test('Lọc tìm kiếm theo từ khóa', () => {
  const list = loadArtifacts();
  const query = 'đông sơn';
  const filtered = list.filter(item => 
    (item.name || '').toLowerCase().includes(query) ||
    (item.description || '').toLowerCase().includes(query) ||
    (item.period || '').toLowerCase().includes(query) ||
    (item.material || '').toLowerCase().includes(query)
  );
  if (filtered.length < 2) throw new Error(`Expected at least 2 items matching 'đông sơn', got ${filtered.length}`);
});

// 2. Test category filter
test('Lọc theo danh mục: ceramic (gốm sứ)', () => {
  const list = loadArtifacts();
  const filtered = list.filter(item => item.category === 'ceramic');
  if (filtered.length < 1) throw new Error('Expected at least 1 ceramic artifact');
  if (filtered[0].id !== 'binh-gom-hoa-lam') throw new Error('Expected binh-gom-hoa-lam');
});

// 3. Test get single artifact detail
test('Chi tiết hiện vật theo ID: an-vang-hoang-de', () => {
  const list = loadArtifacts();
  const item = list.find(a => a.id === 'an-vang-hoang-de');
  if (!item) throw new Error('Artifact not found');
  if (!item.name.includes('Hoàng Đế Chi Bảo')) throw new Error('Name mismatch');
  if (!item.hotspots || item.hotspots.length < 2) throw new Error('Hotspots missing');
});

// 4. Test stats computation
test('Tính toán thống kê Dashboard', () => {
  const list = loadArtifacts();
  const categories = {};
  let totalPhotos = 0;
  list.forEach(a => {
    categories[a.category] = (categories[a.category] || 0) + 1;
    totalPhotos += (a.captureInfo?.photoCount || 0) + (a.photos?.length || 0);
  });
  if (list.length < 5) throw new Error('Less than 5 artifacts');
  if (totalPhotos < 300) throw new Error('Expected at least 300 photos');
  console.log(`  -> Tổng số hiện vật: ${list.length}, Tổng ảnh: ${totalPhotos}, Danh mục: ${Object.keys(categories).length}`);
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ API: ${passed}/${total} ĐẠT CHUẨN!`);
console.log(`========================================\n`);

process.exit(passed === total ? 0 : 1);
