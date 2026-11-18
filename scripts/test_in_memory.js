const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Load server internals or create mock req/res
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DATA_FILE = path.join(__dirname, '..', 'data', 'artifacts.json');

console.log('--- STARTING IN-MEMORY UNIT TESTS ---');

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

// 1. Check all 5 HTML pages exist and contain key elements
const pages = [
  { file: 'index.html', title: 'Trang chủ', keywords: ['BẢO TÀNG SỐ 3D', 'model-viewer', 'trong-dong-dong-son.glb'] },
  { file: 'guide.html', title: 'Trang hướng dẫn', keywords: ['60% – 80%', 'Quy Trình 7 Bước', 'overlap-slider', 'Meshroom'] },
  { file: 'gallery.html', title: 'Trang thư viện', keywords: ['Thư Viện Hiện Vật', 'search-input', 'artifacts-container'] },
  { file: 'detail.html', title: 'Trang chi tiết', keywords: ['main-model-viewer', 'btn-auto-rotate', 'btn-snapshot', 'btn-fullscreen', 'mode-pill'] },
  { file: 'admin.html', title: 'Trang quản trị', keywords: ['Hệ Thống Quản Lý', 'artifacts-tbody', 'input-model-file', 'artifact-modal'] }
];

pages.forEach(p => {
  test(`Kiểm tra file ${p.title} (${p.file})`, () => {
    const filePath = path.join(PUBLIC_DIR, p.file);
    if (!fs.existsSync(filePath)) throw new Error(`File ${p.file} does not exist`);
    const content = fs.readFileSync(filePath, 'utf8');
    p.keywords.forEach(kw => {
      if (!content.includes(kw)) throw new Error(`File ${p.file} missing expected keyword: "${kw}"`);
    });
  });
});

// 2. Check all 5 GLB 3D models exist and have valid glTF binary header
const models = [
  'trong-dong-dong-son.glb',
  'binh-gom-hoa-lam.glb',
  'thap-dong-dao-thinh.glb',
  'tuong-cham-pa.glb',
  'an-vang-hoang-de.glb'
];

models.forEach(m => {
  test(`Kiểm tra tệp 3D GLB: ${m}`, () => {
    const mPath = path.join(PUBLIC_DIR, 'models', m);
    if (!fs.existsSync(mPath)) throw new Error(`Model file ${m} missing`);
    const buf = fs.readFileSync(mPath);
    if (buf.length < 1000) throw new Error(`Model file ${m} too small (${buf.length} bytes)`);
    // Check magic 'glTF' = 0x46546C67
    const magic = buf.readUInt32LE(0);
    if (magic !== 0x46546C67) throw new Error(`Invalid glTF binary magic: 0x${magic.toString(16)}`);
    const version = buf.readUInt32LE(4);
    if (version !== 2) throw new Error(`Invalid glTF version: ${version}`);
    const length = buf.readUInt32LE(8);
    if (length !== buf.length) throw new Error(`GLB length header mismatch: ${length} vs ${buf.length}`);
  });
});

// 3. Check artifacts.json data integrity
test('Kiểm tra dữ liệu data/artifacts.json', () => {
  if (!fs.existsSync(DATA_FILE)) throw new Error('artifacts.json does not exist');
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const list = JSON.parse(raw);
  if (!Array.isArray(list) || list.length < 5) throw new Error('Expected at least 5 artifacts in database');
  
  list.forEach(a => {
    if (!a.id || !a.name || !a.category || !a.modelPath || !a.description) {
      throw new Error(`Artifact ${a.id} missing required fields`);
    }
    if (!a.captureInfo || !a.captureInfo.photoCount) {
      throw new Error(`Artifact ${a.id} missing photogrammetry captureInfo`);
    }
    if (!Array.isArray(a.photos) || a.photos.length === 0) {
      throw new Error(`Artifact ${a.id} missing photo gallery`);
    }
  });
});

// 4. Check CSS and JS assets
const assets = [
  'css/style.css',
  'css/viewer.css',
  'css/responsive.css',
  'js/main.js',
  'js/gallery.js',
  'js/detail.js',
  'js/guide.js',
  'js/admin.js',
  'js/three-fallback.js',
  'assets/diagrams/overlap-diagram.svg',
  'assets/diagrams/pipeline-diagram.svg',
  'assets/diagrams/lighting-diagram.svg'
];

assets.forEach(a => {
  test(`Kiểm tra tài nguyên web: ${a}`, () => {
    const aPath = path.join(PUBLIC_DIR, a);
    if (!fs.existsSync(aPath)) throw new Error(`Asset ${a} missing`);
  });
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passed}/${total} TIÊU CHUẨN ĐẠT HOÀN HẢO!`);
console.log(`========================================\n`);

process.exit(passed === total ? 0 : 1);

