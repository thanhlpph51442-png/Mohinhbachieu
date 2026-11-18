const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'data', 'artifacts.json');

// Ensure directories
[
  path.join(UPLOADS_DIR, 'models'),
  path.join(UPLOADS_DIR, 'images'),
  path.join(__dirname, 'data')
].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load artifacts data
function loadArtifacts() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading artifacts:', err.message);
  }
  return [];
}

// Save artifacts data
function saveArtifacts(artifacts) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(artifacts, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving artifacts:', err.message);
    return false;
  }
}

// MIME types table
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Helper to send JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Simple Multipart Form-Data parser for handling file uploads without external dependencies
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
      return reject(new Error('No multipart boundary found'));
    }
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const boundaryBuf = Buffer.from('--' + boundary);
      const fields = {};
      const files = [];

      let start = 0;
      while ((start = buffer.indexOf(boundaryBuf, start)) !== -1) {
        start += boundaryBuf.length;
        if (buffer[start] === 0x2d && buffer[start + 1] === 0x2d) {
          // Final boundary '--'
          break;
        }
        if (buffer[start] === 0x0d && buffer[start + 1] === 0x0a) {
          start += 2;
        }

        const nextBoundary = buffer.indexOf(boundaryBuf, start);
        if (nextBoundary === -1) break;

        // Part between start and nextBoundary - 2 (strip trailing \r\n)
        const partEnd = nextBoundary - 2;
        const partBuf = buffer.slice(start, partEnd);

        // Find header-body separator \r\n\r\n
        const headerEnd = partBuf.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd !== -1) {
          const headerStr = partBuf.slice(0, headerEnd).toString('utf8');
          const bodyBuf = partBuf.slice(headerEnd + 4);

          const nameMatch = headerStr.match(/name="([^"]+)"/i);
          const filenameMatch = headerStr.match(/filename="([^"]+)"/i);
          const fieldName = nameMatch ? nameMatch[1] : null;

          if (filenameMatch && filenameMatch[1]) {
            const originalFilename = filenameMatch[1];
            const mimeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
            const mimeType = mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream';
            files.push({
              fieldName,
              originalFilename,
              mimeType,
              data: bodyBuf
            });
          } else if (fieldName) {
            fields[fieldName] = bodyBuf.toString('utf8');
          }
        }
      }
      resolve({ fields, files });
    });
    req.on('error', err => reject(err));
  });
}

// Read raw JSON body
function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (e) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const method = req.method;

  // CORS Headers
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ==================== RESTful API ====================

  // 1. GET /api/artifacts
  if (pathname === '/api/artifacts' && method === 'GET') {
    let list = loadArtifacts();
    const query = (parsedUrl.query.q || '').trim().toLowerCase();
    const category = (parsedUrl.query.category || '').trim().toLowerCase();
    const period = (parsedUrl.query.period || '').trim().toLowerCase();

    if (category && category !== 'all') {
      list = list.filter(item => item.category === category);
    }
    if (period && period !== 'all') {
      list = list.filter(item => (item.period || '').toLowerCase().includes(period));
    }
    if (query) {
      list = list.filter(item => {
        return (
          (item.name || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          (item.period || '').toLowerCase().includes(query) ||
          (item.material || '').toLowerCase().includes(query) ||
          (item.location || '').toLowerCase().includes(query) ||
          (item.categoryName || '').toLowerCase().includes(query)
        );
      });
    }

    return sendJSON(res, 200, { success: true, count: list.length, data: list });
  }

  // 2. GET /api/artifacts/:id
  if (pathname.startsWith('/api/artifacts/') && method === 'GET') {
    const id = pathname.replace('/api/artifacts/', '');
    const list = loadArtifacts();
    const item = list.find(a => a.id === id);
    if (!item) {
      return sendJSON(res, 404, { success: false, message: 'Không tìm thấy hiện vật' });
    }
    return sendJSON(res, 200, { success: true, data: item });
  }

  // 3. POST /api/artifacts (Create new artifact)
  if (pathname === '/api/artifacts' && method === 'POST') {
    try {
      const list = loadArtifacts();
      const body = await parseJSONBody(req);

      if (!body.name || !body.name.trim()) {
        return sendJSON(res, 400, { success: false, message: 'Tên hiện vật không được để trống' });
      }

      // Generate ID slug
      const idBase = (body.id || body.name)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || ('art-' + Date.now());

      let finalId = idBase;
      let counter = 1;
      while (list.some(a => a.id === finalId)) {
        finalId = `${idBase}-${counter++}`;
      }

      const newArtifact = {
        id: finalId,
        name: body.name.trim(),
        category: body.category || 'bronze',
        categoryName: body.categoryName || 'Hiện Vật Khảo Cổ',
        period: body.period || 'Chưa xác định niên đại',
        material: body.material || 'Chất liệu truyền thống',
        dimensions: body.dimensions || 'Đang cập nhật',
        location: body.location || 'Bảo tàng Quốc gia Việt Nam',
        heritageRank: body.heritageRank || 'Di sản văn hóa',
        modelPath: body.modelPath || '/models/trong-dong-dong-son.glb',
        mainImage: body.mainImage || '/assets/images/trong-dong-dong-son/main.svg',
        photos: Array.isArray(body.photos) ? body.photos : [],
        captureInfo: body.captureInfo || {
          photoCount: 64,
          camera: 'Máy ảnh kỹ thuật số DSLR / Mirrorless',
          overlap: '70%',
          reconstructionSoftware: 'Photogrammetry 3D Pipeline',
          polygonCount: '35,000 Faces',
          textureResolution: '4096 x 4096 PBR'
        },
        description: body.description || '',
        historicalSignificance: body.historicalSignificance || '',
        references: Array.isArray(body.references) ? body.references : [body.references || 'Tài liệu bảo tàng'],
        hotspots: Array.isArray(body.hotspots) ? body.hotspots : [],
        createdAt: new Date().toISOString()
      };

      list.unshift(newArtifact);
      saveArtifacts(list);

      return sendJSON(res, 201, {
        success: true,
        message: 'Thêm hiện vật thành công',
        data: newArtifact
      });
    } catch (err) {
      return sendJSON(res, 500, { success: false, message: err.message });
    }
  }

  // 4. PUT /api/artifacts/:id (Update artifact)
  if (pathname.startsWith('/api/artifacts/') && method === 'PUT') {
    try {
      const id = pathname.replace('/api/artifacts/', '');
      const list = loadArtifacts();
      const index = list.findIndex(a => a.id === id);
      if (index === -1) {
        return sendJSON(res, 404, { success: false, message: 'Hiện vật không tồn tại' });
      }

      const body = await parseJSONBody(req);
      const existing = list[index];

      list[index] = {
        ...existing,
        ...body,
        id: existing.id, // Keep original ID immutable
        updatedAt: new Date().toISOString()
      };

      saveArtifacts(list);
      return sendJSON(res, 200, {
        success: true,
        message: 'Cập nhật hiện vật thành công',
        data: list[index]
      });
    } catch (err) {
      return sendJSON(res, 500, { success: false, message: err.message });
    }
  }

  // 5. DELETE /api/artifacts/:id
  if (pathname.startsWith('/api/artifacts/') && method === 'DELETE') {
    const id = pathname.replace('/api/artifacts/', '');
    let list = loadArtifacts();
    const index = list.findIndex(a => a.id === id);
    if (index === -1) {
      return sendJSON(res, 404, { success: false, message: 'Hiện vật không tồn tại' });
    }

    const removed = list.splice(index, 1)[0];
    saveArtifacts(list);
    return sendJSON(res, 200, {
      success: true,
      message: `Đã xóa hiện vật "${removed.name}"`,
      data: removed
    });
  }

  // 6. POST /api/upload (Upload 3D model GLB/GLTF or image)
  if (pathname === '/api/upload' && method === 'POST') {
    try {
      const parsed = await parseMultipart(req);
      const results = [];

      for (const file of parsed.files) {
        const ext = path.extname(file.originalFilename).toLowerCase();
        const isModel = ext === '.glb' || ext === '.gltf';
        const targetSubdir = isModel ? 'models' : 'images';
        const cleanName = `${Date.now()}_${path.basename(file.originalFilename).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const targetPath = path.join(UPLOADS_DIR, targetSubdir, cleanName);

        fs.writeFileSync(targetPath, file.data);
        const webUrl = `/uploads/${targetSubdir}/${cleanName}`;

        results.push({
          fieldName: file.fieldName,
          originalName: file.originalFilename,
          size: file.data.length,
          type: isModel ? 'model' : 'image',
          url: webUrl
        });
      }

      return sendJSON(res, 200, {
        success: true,
        message: `Đã tải lên ${results.length} tệp thành công`,
        files: results
      });
    } catch (err) {
      return sendJSON(res, 500, { success: false, message: 'Lỗi tải tệp: ' + err.message });
    }
  }

  // 7. GET /api/stats (Dashboard statistics)
  if (pathname === '/api/stats' && method === 'GET') {
    const list = loadArtifacts();
    const categories = {};
    let totalPhotos = 0;
    list.forEach(a => {
      categories[a.category] = (categories[a.category] || 0) + 1;
      totalPhotos += (a.captureInfo?.photoCount || 0) + (a.photos?.length || 0);
    });

    return sendJSON(res, 200, {
      success: true,
      stats: {
        totalArtifacts: list.length,
        categoriesCount: Object.keys(categories).length,
        totalPhotosCount: totalPhotos,
        modelsCount: list.filter(a => !!a.modelPath).length,
        categoriesBreakdown: categories,
        serverTime: new Date().toISOString()
      }
    });
  }

  // ==================== Static File Serving ====================

  let filePath = '';
  if (pathname.startsWith('/uploads/')) {
    filePath = path.join(__dirname, pathname);
  } else {
    filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  }

  // Security: prevent directory traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(PUBLIC_DIR) && !resolved.startsWith(UPLOADS_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden');
  }

  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 Fallback
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <!DOCTYPE html>
        <html lang="vi">
        <head><meta charset="UTF-8"><title>404 - Không tìm thấy trang</title>
        <style>body{background:#12100e;color:#e6c687;font-family:system-ui;text-align:center;padding:100px;}</style>
        </head>
        <body>
          <h1>404 - Không Tìm Thấy Tài Nguyên</h1>
          <p>Trang hoặc mô hình bạn yêu cầu không tồn tại.</p>
          <a href="/" style="color:#d4af37;text-decoration:none;border:1px solid #d4af37;padding:10px 20px;border-radius:6px;">Về Trang Chủ</a>
        </body>
        </html>
      `);
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // HTTP Range Requests support for large 3D models and media streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(resolved, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(resolved).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏛️ BẢO TÀNG SỐ 3D HIỆN VẬT TỪ ẢNH (PHOTOGRAMMETRY)`);
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📁 Thư mục Public: ${PUBLIC_DIR}`);
  console.log(`📁 Thư mục Uploads: ${UPLOADS_DIR}`);
  console.log(`====================================================`);
});
