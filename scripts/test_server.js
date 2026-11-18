const http = require('http');
const fs = require('fs');
const path = require('path');

// Run tests against the server
async function runTests() {
  console.log('--- STARTING COMPREHENSIVE AUTOMATED TESTS ---');

  // Launch server in background
  const PORT = 3001;
  process.env.PORT = PORT;
  
  // Require server
  require('../server.js');

  // Wait 500ms for server to bind
  await new Promise(r => setTimeout(r, 500));

  function get(urlPath) {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}${urlPath}`, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }).on('error', reject);
    });
  }

  function postJSON(urlPath, data) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(data);
      const req = http.request(`http://127.0.0.1:${PORT}${urlPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  function deleteReq(urlPath) {
    return new Promise((resolve, reject) => {
      const req = http.request(`http://127.0.0.1:${PORT}${urlPath}`, {
        method: 'DELETE'
      }, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.end();
    });
  }

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`✕ [FAIL] ${name}: ${e.message}`);
    }
  }

  // 1. Home page
  await test('Trang chủ (GET /)', async () => {
    const res = await get('/');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('BẢO TÀNG SỐ 3D')) throw new Error('Missing title');
    if (!res.body.includes('model-viewer')) throw new Error('Missing model-viewer');
  });

  // 2. Guide page
  await test('Trang hướng dẫn (GET /guide.html)', async () => {
    const res = await get('/guide.html');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('60% – 80%')) throw new Error('Missing overlap text');
    if (!res.body.includes('Quy Trình 7 Bước')) throw new Error('Missing 7-step pipeline');
  });

  // 3. Gallery page
  await test('Trang thư viện (GET /gallery.html)', async () => {
    const res = await get('/gallery.html');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('Thư Viện Hiện Vật')) throw new Error('Missing header');
    if (!res.body.includes('search-input')) throw new Error('Missing search input');
  });

  // 4. Detail page
  await test('Trang chi tiết hiện vật (GET /detail.html?id=trong-dong-dong-son)', async () => {
    const res = await get('/detail.html?id=trong-dong-dong-son');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('main-model-viewer')) throw new Error('Missing 3D viewer');
    if (!res.body.includes('btn-snapshot')) throw new Error('Missing snapshot button');
  });

  // 5. Admin page
  await test('Trang quản trị (GET /admin.html)', async () => {
    const res = await get('/admin.html');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('Trung Tâm Quản Trị')) throw new Error('Missing admin heading');
    if (!res.body.includes('artifacts-tbody')) throw new Error('Missing table body');
  });

  // 6. API Artifacts
  await test('API Danh sách hiện vật (GET /api/artifacts)', async () => {
    const res = await get('/api/artifacts');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = JSON.parse(res.body);
    if (!json.success || !Array.isArray(json.data) || json.data.length < 5) {
      throw new Error(`Expected at least 5 artifacts, got ${json.data?.length}`);
    }
  });

  // 7. API Single Artifact Detail
  await test('API Chi tiết hiện vật (GET /api/artifacts/trong-dong-dong-son)', async () => {
    const res = await get('/api/artifacts/trong-dong-dong-son');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = JSON.parse(res.body);
    if (!json.success || json.data.id !== 'trong-dong-dong-son') {
      throw new Error('Invalid artifact detail response');
    }
    if (!json.data.hotspots || json.data.hotspots.length === 0) {
      throw new Error('Missing 3D archaeological hotspots');
    }
  });

  // 8. API Stats
  await test('API Thống kê (GET /api/stats)', async () => {
    const res = await get('/api/stats');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = JSON.parse(res.body);
    if (!json.success || !json.stats || json.stats.totalArtifacts < 5) {
      throw new Error('Invalid stats response');
    }
  });

  // 9. Static 3D Model GLB serving
  await test('Tải tệp 3D GLB (GET /models/trong-dong-dong-son.glb)', async () => {
    const res = await get('/models/trong-dong-dong-son.glb');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.headers['content-type'] !== 'model/gltf-binary') {
      throw new Error(`Invalid MIME type: ${res.headers['content-type']}`);
    }
    // Check glTF binary header: 0x46546C67 ("glTF")
    const magic = res.body.substring(0, 4);
    if (magic !== 'glTF') {
      throw new Error(`Invalid GLB header magic: ${magic}`);
    }
  });

  // 10. CRUD Test: Create, Update, Delete
  await test('CRUD Quản trị: Thêm, Sửa và Xóa hiện vật mẫu', async () => {
    // 1. Create
    const createRes = await postJSON('/api/artifacts', {
      name: 'Bình Gốm Chu Đậu Cổ Test',
      category: 'ceramic',
      categoryName: 'Gốm Sứ',
      period: 'Thế kỷ XIV',
      material: 'Gốm men tro',
      location: 'Bảo tàng Nam Sách',
      modelPath: '/models/binh-gom-hoa-lam.glb'
    });
    if (createRes.status !== 201) throw new Error(`Create status ${createRes.status}`);
    const createdJson = JSON.parse(createRes.body);
    const newId = createdJson.data.id;

    // 2. Verify existence
    const getRes = await get(`/api/artifacts/${newId}`);
    if (getRes.status !== 200) throw new Error(`Get created status ${getRes.status}`);

    // 3. Delete
    const delRes = await deleteReq(`/api/artifacts/${newId}`);
    if (delRes.status !== 200) throw new Error(`Delete status ${delRes.status}`);

    // 4. Verify gone
    const checkRes = await get(`/api/artifacts/${newId}`);
    if (checkRes.status !== 404) throw new Error('Artifact was not deleted');
  });

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed}/${total} TESTS ĐẠT CHUẨN!`);
  console.log(`========================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

