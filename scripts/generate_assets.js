const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '..', 'public', 'assets', 'images');
const diagDir = path.join(__dirname, '..', 'public', 'assets', 'diagrams');

[imgDir, diagDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// 1. Diagram: 360 Orbit & 60-80% Overlap
const overlapDiagramSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181310" />
      <stop offset="100%" stop-color="#2a201a" />
    </linearGradient>
    <radialGradient id="artifactGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#d4af37" stop-opacity="0" />
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="900" height="520" fill="url(#bgGrad)" rx="16" />
  <rect x="10" y="10" width="880" height="500" fill="none" stroke="#c5a059" stroke-width="1" stroke-opacity="0.3" rx="12" />

  <!-- Title -->
  <text x="450" y="48" fill="#e6c687" font-size="20" font-weight="700" text-anchor="middle" font-family="'Cinzel', serif, system-ui">
    SƠ ĐỒ QUỸ ĐẠO CHỤP ẢNH 360° &amp; ĐỘ CHỒNG LẤP (OVERLAP 60% – 80%)
  </text>
  <text x="450" y="74" fill="#a89a8a" font-size="13" text-anchor="middle" font-family="system-ui">
    Nguyên lý cốt lõi của Photogrammetry: Đảm bảo phần mềm nhận diện tối thiểu 3 ảnh cho mỗi đặc trưng bề mặt
  </text>

  <!-- Left: Circular Orbit Top-Down -->
  <g transform="translate(240, 290)">
    <!-- Orbit Circles -->
    <circle r="170" fill="none" stroke="#52443a" stroke-width="1.5" stroke-dasharray="6,6" />
    <circle r="120" fill="none" stroke="#c5a059" stroke-width="2" stroke-opacity="0.5" />
    <circle r="60" fill="url(#artifactGlow)" />
    
    <!-- Central Artifact -->
    <circle r="36" fill="#3a2a1d" stroke="#d4af37" stroke-width="2.5" />
    <text x="0" y="5" fill="#f5e6c8" font-size="12" font-weight="700" text-anchor="middle" font-family="system-ui">HIỆN VẬT</text>
    <text x="0" y="22" fill="#c5a059" font-size="10" text-anchor="middle" font-family="system-ui">(Bàn xoay)</text>

    <!-- Camera Positions around circle -->
    <!-- Draw Overlap Cone between Cam 1 and Cam 2 -->
    <path d="M 0 -120 L -45 -18 L 45 -18 Z" fill="#d4af37" fill-opacity="0.18" stroke="#d4af37" stroke-width="1" stroke-dasharray="3,3" />
    <path d="M 70 -97 L 15 -10 L 80 15 Z" fill="#4ade80" fill-opacity="0.18" stroke="#4ade80" stroke-width="1" stroke-dasharray="3,3" />

    <!-- 16 Camera Nodes -->
    ${Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * 120;
      const y = Math.sin(angle) * 120;
      const isHero = i === 0 || i === 1;
      const color = isHero ? '#f59e0b' : '#c5a059';
      return `
        <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})">
          <circle r="${isHero ? 10 : 7}" fill="#1c1612" stroke="${color}" stroke-width="${isHero ? 2.5 : 1.5}" />
          <polygon points="0,-3 3,3 -3,3" fill="${color}" transform="rotate(${(i * 22.5 + 90)})" />
        </g>
      `;
    }).join('')}

    <!-- Labels on Left Diagram -->
    <text x="0" y="-138" fill="#f59e0b" font-size="11" font-weight="700" text-anchor="middle" font-family="system-ui">Ảnh 1 (0°)</text>
    <text x="95" y="-105" fill="#4ade80" font-size="11" font-weight="700" text-anchor="middle" font-family="system-ui">Ảnh 2 (22.5°)</text>
    <text x="0" y="150" fill="#c5a059" font-size="12" font-weight="600" text-anchor="middle" font-family="system-ui">
      16 – 36 góc chụp / 1 vòng tròn 360°
    </text>
  </g>

  <!-- Right: Overlap Detail Explanation & Vertical Rings -->
  <g transform="translate(520, 110)">
    <!-- Overlap Banner Box -->
    <rect x="0" y="0" width="340" height="150" fill="#221a15" stroke="#c5a059" stroke-width="1.5" rx="8" />
    <text x="20" y="30" fill="#f5e6c8" font-size="15" font-weight="700" font-family="system-ui">Vùng Chồng Lấp Ảnh (Overlap)</text>
    
    <!-- Overlap Graphic -->
    <rect x="25" y="48" width="130" height="70" fill="#3b2b1d" stroke="#f59e0b" stroke-width="2" rx="4" />
    <text x="50" y="88" fill="#f5e6c8" font-size="11" font-weight="600" font-family="system-ui">Khung Ảnh 1</text>
    
    <rect x="95" y="48" width="130" height="70" fill="#1e3a2b" fill-opacity="0.6" stroke="#4ade80" stroke-width="2" rx="4" />
    <text x="175" y="88" fill="#4ade80" font-size="11" font-weight="600" font-family="system-ui">Khung Ảnh 2</text>
    
    <!-- Intersection Highlight -->
    <rect x="95" y="48" width="60" height="70" fill="#d4af37" fill-opacity="0.35" />
    <text x="125" y="132" fill="#e6c687" font-size="11" font-weight="700" text-anchor="middle" font-family="system-ui">Chồng lấp 70%</text>

    <!-- Side-Angle Elevation Box -->
    <g transform="translate(0, 168)">
      <rect x="0" y="0" width="340" height="200" fill="#221a15" stroke="#52443a" stroke-width="1" rx="8" />
      <text x="20" y="28" fill="#f5e6c8" font-size="14" font-weight="700" font-family="system-ui">3 Tầng Góc Cao Độ Cần Chụp</text>

      <!-- Vertical elevation arc -->
      <path d="M 80 160 A 80 80 0 0 1 160 80" fill="none" stroke="#c5a059" stroke-width="1.5" stroke-dasharray="4,4" />
      
      <!-- Center mini object -->
      <rect x="65" y="145" width="30" height="30" fill="#8c6d48" rx="3" />
      <line x1="50" y1="175" x2="280" y2="175" stroke="#685647" stroke-width="1.5" />
      
      <!-- Tier 1: Horizontal (0° - 15°) -->
      <circle cx="170" cy="155" r="7" fill="#f59e0b" />
      <line x1="170" y1="155" x2="95" y2="155" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2,2" />
      <text x="185" y="159" fill="#f5e6c8" font-size="11" font-family="system-ui">Tầng 1: Ngang tầm mắt (0° - 15°)</text>

      <!-- Tier 2: Oblique (35° - 45°) -->
      <circle cx="145" cy="115" r="7" fill="#4ade80" />
      <line x1="145" y1="115" x2="88" y2="150" stroke="#4ade80" stroke-width="1" stroke-dasharray="2,2" />
      <text x="185" y="119" fill="#f5e6c8" font-size="11" font-family="system-ui">Tầng 2: Nghiêng xuống (35° - 45°)</text>

      <!-- Tier 3: High Angle (65° - 75°) -->
      <circle cx="110" cy="85" r="7" fill="#60a5fa" />
      <line x1="110" y1="85" x2="80" y2="145" stroke="#60a5fa" stroke-width="1" stroke-dasharray="2,2" />
      <text x="185" y="79" fill="#f5e6c8" font-size="11" font-family="system-ui">Tầng 3: Góc cao đỉnh (65° - 75°)</text>
      
      <text x="20" y="190" fill="#a89a8a" font-size="11" font-style="italic" font-family="system-ui">
        * Tổng số lượng: 60 - 150 ảnh tùy chi tiết hoa văn hiện vật
      </text>
    </g>
  </g>
</svg>`;

// 2. Diagram: Photogrammetry 7-step Pipeline Infographic
const pipelineDiagramSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 480" width="100%" height="100%">
  <defs>
    <linearGradient id="pipeBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#15120f" />
      <stop offset="100%" stop-color="#241a14" />
    </linearGradient>
    <linearGradient id="stepGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#32241b" />
      <stop offset="100%" stop-color="#201712" />
    </linearGradient>
  </defs>

  <rect width="1100" height="480" fill="url(#pipeBg)" rx="16" />
  <rect x="10" y="10" width="1080" height="460" fill="none" stroke="#c5a059" stroke-width="1" stroke-opacity="0.3" rx="12" />

  <!-- Title -->
  <text x="550" y="50" fill="#e6c687" font-size="22" font-weight="700" text-anchor="middle" font-family="'Cinzel', serif, system-ui">
    QUY TRÌNH 7 BƯỚC TÁI TẠO MÔ HÌNH 3D HIỆN VẬT TỪ ẢNH CHỤP
  </text>
  <text x="550" y="78" fill="#a89a8a" font-size="13" text-anchor="middle" font-family="system-ui">
    Công nghệ Photogrammetry kết hợp WebGL số hóa di sản bảo tàng
  </text>

  <!-- Flow Steps -->
  ${[
    { step: 1, title: 'Chuẩn Bị Hiện Vật', icon: '🏛️', sub: 'Ánh sáng khuếch tán, bàn xoay, phông mờ' },
    { step: 2, title: 'Chụp Ảnh 360°', icon: '📸', sub: '60-120 ảnh, độ chồng lấp 60-80%' },
    { step: 3, title: 'Căn Chỉnh Ảnh (SfM)', icon: '💻', sub: 'Phần mềm dò tìm điểm đặc trưng tương đồng' },
    { step: 4, title: 'Tạo Mây Điểm & Lưới', icon: '✨', sub: 'Dense Point Cloud & Mesh Reconstruction' },
    { step: 5, title: 'Ánh Xạ Kết Cấu', icon: '🎨', sub: 'UV Unwrapping & Texture 4K từ ảnh gốc' },
    { step: 6, title: 'Xuất File GLB/GLTF', icon: '📦', sub: 'Decimate tối ưu đa giác, nén Draco' },
    { step: 7, title: 'Trưng Bày Web 3D', icon: '🌐', sub: 'Tương tác 360°, xoay, zoom, đo kích thước' }
  ].map((item, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = 50 + col * 255;
    const y = 110 + row * 175;
    return `
      <g transform="translate(${x}, ${y})">
        <!-- Card -->
        <rect width="235" height="140" fill="url(#stepGrad)" stroke="#c5a059" stroke-width="1.2" rx="10" />
        
        <!-- Step Badge -->
        <circle cx="28" cy="28" r="16" fill="#d4af37" />
        <text x="28" y="33" fill="#17120e" font-size="13" font-weight="800" text-anchor="middle" font-family="system-ui">${item.step}</text>

        <!-- Icon -->
        <text x="200" y="36" font-size="22" text-anchor="middle">${item.icon}</text>

        <!-- Title -->
        <text x="20" y="72" fill="#f5e6c8" font-size="14" font-weight="700" font-family="system-ui">${item.title}</text>
        
        <!-- Subtitle -->
        <foreignObject x="20" y="80" width="195" height="52">
          <p xmlns="http://www.w3.org/1999/xhtml" style="font-size: 11px; color: #b8a695; margin: 0; line-height: 1.4; font-family: system-ui;">
            ${item.sub}
          </p>
        </foreignObject>

        <!-- Connector Arrow -->
        ${idx < 6 && col < 3 ? `
          <g transform="translate(235, 70)">
            <line x1="0" y1="0" x2="16" y2="0" stroke="#d4af37" stroke-width="2" />
            <polygon points="16,-4 22,0 16,4" fill="#d4af37" />
          </g>
        ` : ''}
      </g>
    `;
  }).join('')}
</svg>`;

// 3. Diagram: Lighting & Turntable Setup Guide
const lightingDiagramSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 460" width="100%" height="100%">
  <defs>
    <linearGradient id="lightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14110e" />
      <stop offset="100%" stop-color="#241a13" />
    </linearGradient>
  </defs>

  <rect width="850" height="460" fill="url(#lightGrad)" rx="16" />
  <rect x="10" y="10" width="830" height="440" fill="none" stroke="#c5a059" stroke-width="1" stroke-opacity="0.3" rx="12" />

  <text x="425" y="45" fill="#e6c687" font-size="20" font-weight="700" text-anchor="middle" font-family="'Cinzel', serif, system-ui">
    THIẾT LẬP ÁNH SÁNG VÀ PHÒNG CHỤP PHOTOGRAMMETRY
  </text>
  <text x="425" y="70" fill="#a89a8a" font-size="13" text-anchor="middle" font-family="system-ui">
    Ánh sáng khuếch tán đều (diffuse light) - Triệt tiêu đổ bóng gắt và phản quang chói lóa
  </text>

  <!-- Setup Diagram -->
  <g transform="translate(50, 100)">
    <!-- Seamless Backdrop Studio -->
    <path d="M 50 20 L 350 20 L 350 280 L 50 280 Z" fill="#1b1612" stroke="#483a30" stroke-width="2" />
    <path d="M 50 220 Q 50 260 90 260 L 350 260" fill="none" stroke="#685647" stroke-width="2" stroke-dasharray="4,4" />
    <text x="200" y="45" fill="#a89a8a" font-size="12" text-anchor="middle" font-family="system-ui">Phông nền đơn sắc mờ (Backdrop)</text>

    <!-- Turntable (Bàn xoay) -->
    <ellipse cx="200" cy="220" rx="90" ry="25" fill="#2d221a" stroke="#d4af37" stroke-width="2" />
    <text x="200" y="225" fill="#e6c687" font-size="12" font-weight="700" text-anchor="middle" font-family="system-ui">Bàn Xoay Tự Động (Turntable)</text>

    <!-- Artifact on Turntable -->
    <rect x="175" y="140" width="50" height="70" fill="#604934" stroke="#e6c687" stroke-width="1.5" rx="4" />
    <text x="200" y="180" fill="#fff" font-size="11" font-weight="700" text-anchor="middle" font-family="system-ui">HIỆN VẬT</text>

    <!-- Left Softbox Light -->
    <g transform="translate(20, 80)">
      <polygon points="0,0 40,20 40,80 0,60" fill="#d4af37" fill-opacity="0.25" stroke="#f59e0b" stroke-width="1.5" />
      <text x="-5" y="35" fill="#f59e0b" font-size="11" font-weight="700" text-anchor="end" font-family="system-ui">Softbox Trái</text>
      <!-- Light rays -->
      <line x1="40" y1="50" x2="160" y2="160" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
    </g>

    <!-- Right Softbox Light -->
    <g transform="translate(340, 80)">
      <polygon points="40,0 0,20 0,80 40,60" fill="#d4af37" fill-opacity="0.25" stroke="#f59e0b" stroke-width="1.5" />
      <text x="45" y="35" fill="#f59e0b" font-size="11" font-weight="700" text-anchor="start" font-family="system-ui">Softbox Phải</text>
      <!-- Light rays -->
      <line x1="0" y1="50" x2="-100" y2="160" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
    </g>

    <!-- Tripod & Camera Front -->
    <g transform="translate(200, 310)">
      <!-- Camera -->
      <rect x="-20" y="-30" width="40" height="24" fill="#2d221a" stroke="#4ade80" stroke-width="2" rx="3" />
      <circle cx="0" cy="-18" r="8" fill="#111" stroke="#4ade80" stroke-width="1.5" />
      <!-- Tripod legs -->
      <line x1="0" y1="-6" x2="-30" y2="35" stroke="#a89a8a" stroke-width="2" />
      <line x1="0" y1="-6" x2="30" y2="35" stroke="#a89a8a" stroke-width="2" />
      <line x1="0" y1="-6" x2="0" y2="35" stroke="#a89a8a" stroke-width="2" />
      <text x="0" y="55" fill="#4ade80" font-size="11" font-weight="700" text-anchor="middle" font-family="system-ui">Chân máy cố định (Tripod)</text>
    </g>
  </g>

  <!-- Right: Technical parameters card -->
  <g transform="translate(480, 100)">
    <rect width="320" height="310" fill="#1e1814" stroke="#c5a059" stroke-width="1.5" rx="8" />
    <text x="20" y="32" fill="#e6c687" font-size="15" font-weight="700" font-family="system-ui">Thông Số Máy Ảnh Khuyến Nghị</text>

    ${[
      { label: 'Chế độ chụp', val: 'Manual (M) - Khóa thông số cố định' },
      { label: 'Khẩu độ (Aperture)', val: 'f/8 – f/11 (Độ sâu trường DOF nét sâu)' },
      { label: 'Độ nhạy ISO', val: 'ISO 100 – 200 (Giảm nhiễu hạt tối đa)' },
      { label: 'Tốc độ màn trập', val: '1/30s – 1/125s (Dùng chân máy & remote)' },
      { label: 'Tiêu cự (Focal Length)', val: '50mm – 85mm Prime (Tránh méo hình)' },
      { label: 'Cân bằng trắng', val: 'Cố định theo nhiệt độ đèn (5500K)' },
      { label: 'Định dạng tệp', val: 'RAW / JPEG Fine chất lượng cao nhất' }
    ].map((item, i) => `
      <g transform="translate(18, ${60 + i * 34})">
        <circle cx="6" cy="6" r="3" fill="#d4af37" />
        <text x="18" y="9" fill="#f5e6c8" font-size="12" font-weight="600" font-family="system-ui">${item.label}:</text>
        <text x="18" y="24" fill="#a89a8a" font-size="11" font-family="system-ui">${item.val}</text>
      </g>
    `).join('')}
  </g>
</svg>`;

// Write diagram SVGs
fs.writeFileSync(path.join(diagDir, 'overlap-diagram.svg'), overlapDiagramSVG);
fs.writeFileSync(path.join(diagDir, 'pipeline-diagram.svg'), pipelineDiagramSVG);
fs.writeFileSync(path.join(diagDir, 'lighting-diagram.svg'), lightingDiagramSVG);
console.log('✓ Generated 3 Photogrammetry Technical SVG Diagrams');

// Generate realistic illustrative photo cards for each artifact
const artifactVisuals = [
  {
    id: 'trong-dong-dong-son',
    title: 'Trống Đồng Đông Sơn Ngọc Lũ',
    color1: '#3d4838',
    color2: '#222b1e',
    symbol: 'Mặt trời 14 tia & Chim Lạc',
    badge: 'Bảo vật Quốc gia'
  },
  {
    id: 'binh-gom-hoa-lam',
    title: 'Bình Gốm Hoa Lam Thời Lê Sơ',
    color1: '#263d59',
    color2: '#121e2c',
    symbol: 'Men lam cobalt & Hoa sen',
    badge: 'Thế kỷ XV'
  },
  {
    id: 'thap-dong-dao-thinh',
    title: 'Thạp Đồng Đào Thịnh',
    color1: '#403429',
    color2: '#221912',
    symbol: 'Chiến thuyền & Đôi tượng giao hòa',
    badge: 'Văn hóa Đông Sơn'
  },
  {
    id: 'tuong-cham-pa',
    title: 'Tượng Bồ Tát Tara Đồng Dương',
    color1: '#544638',
    color2: '#292018',
    symbol: 'Sa thạch chạm khắc & Phật giáo Chăm Pa',
    badge: 'Thế kỷ IX'
  },
  {
    id: 'an-vang-hoang-de',
    title: 'Ấn Vàng Hoàng Đế Chi Bảo',
    color1: '#6b5114',
    color2: '#382a08',
    symbol: 'Long tọa cuộn & Vàng 10 tuổi',
    badge: 'Triều Nguyễn 1823'
  }
];

artifactVisuals.forEach(item => {
  const artFolder = path.join(imgDir, item.id);
  if (!fs.existsSync(artFolder)) fs.mkdirSync(artFolder, { recursive: true });

  // Main visual card
  const mainCardSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
    <defs>
      <linearGradient id="g_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${item.color1}" />
        <stop offset="100%" stop-color="${item.color2}" />
      </linearGradient>
      <radialGradient id="spot_${item.id}" cx="50%" cy="45%" r="45%">
        <stop offset="0%" stop-color="#d4af37" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="600" height="450" fill="url(#g_${item.id})" />
    <circle cx="300" cy="200" r="180" fill="url(#spot_${item.id})" />

    <!-- Heritage Border Pattern -->
    <rect x="18" y="18" width="564" height="414" fill="none" stroke="#d4af37" stroke-width="1.5" stroke-opacity="0.4" rx="10" />
    <rect x="26" y="26" width="548" height="398" fill="none" stroke="#d4af37" stroke-width="0.8" stroke-opacity="0.2" rx="8" />

    <!-- Corner Ornaments -->
    <g fill="#d4af37" opacity="0.6">
      <circle cx="36" cy="36" r="4" /><circle cx="564" cy="36" r="4" />
      <circle cx="36" cy="414" r="4" /><circle cx="564" cy="414" r="4" />
    </g>

    <!-- Center Silhouette representation -->
    <circle cx="300" cy="200" r="110" fill="#140f0c" stroke="#d4af37" stroke-width="2" />
    <text x="300" y="195" font-size="52" text-anchor="middle">🏛️</text>
    <text x="300" y="240" fill="#e6c687" font-size="13" font-weight="700" text-anchor="middle" font-family="'Cinzel', serif, system-ui">
      3D PHOTOGRAMMETRY
    </text>

    <!-- Badge -->
    <rect x="210" y="55" width="180" height="30" fill="#d4af37" rx="15" />
    <text x="300" y="75" fill="#140f0c" font-size="12" font-weight="800" text-anchor="middle" font-family="system-ui">
      ${item.badge.toUpperCase()}
    </text>

    <!-- Title and details -->
    <text x="300" y="350" fill="#ffffff" font-size="20" font-weight="700" text-anchor="middle" font-family="'Cinzel', serif, system-ui">
      ${item.title}
    </text>
    <text x="300" y="380" fill="#c5a059" font-size="13" text-anchor="middle" font-family="system-ui">
      ${item.symbol}
    </text>
    <text x="300" y="405" fill="#a89a8a" font-size="11" text-anchor="middle" font-family="system-ui">
      Mô hình 3D dựng từ 84 góc ảnh thực tế • Tỉ lệ 1:1 chuẩn xác
    </text>
  </svg>`;

  fs.writeFileSync(path.join(artFolder, 'main.svg'), mainCardSVG);

  // Generate 4 multi-angle photography representation cards
  const angles = [
    { name: 'angle_front.svg', label: 'Góc Chính Diện (0°)', desc: 'Ảnh thực tế chụp thẳng ngang đường chân trời' },
    { name: 'angle_side.svg', label: 'Góc Cạnh Hông (90°)', desc: 'Ảnh thực tế chi tiết quai cầm và gờ viền' },
    { name: 'angle_top.svg', label: 'Góc Đỉnh Nghiêng (45°)', desc: 'Ảnh thực tế hoa văn bề mặt nhìn từ trên' },
    { name: 'angle_macro.svg', label: 'Cận Cảnh Chi Tiết (Macro)', desc: 'Ảnh vi chụp chất liệu cổ và vết rỗ thời gian' }
  ];

  angles.forEach(a => {
    const angleSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
      <rect width="400" height="300" fill="#1b1612" rx="8" />
      <rect x="10" y="10" width="380" height="280" fill="none" stroke="#c5a059" stroke-width="1" stroke-opacity="0.3" rx="6" />
      <circle cx="200" cy="120" r="60" fill="#2d221a" stroke="#d4af37" stroke-width="1.5" />
      <text x="200" y="128" font-size="32" text-anchor="middle">📷</text>
      <text x="200" y="215" fill="#f5e6c8" font-size="14" font-weight="700" text-anchor="middle" font-family="system-ui">${a.label}</text>
      <text x="200" y="240" fill="#a89a8a" font-size="11" text-anchor="middle" font-family="system-ui">${a.desc}</text>
      <text x="200" y="265" fill="#d4af37" font-size="10" text-anchor="middle" font-family="system-ui">Bộ ảnh phục vụ ghép nối đám mây điểm 3D</text>
    </svg>`;
    fs.writeFileSync(path.join(artFolder, a.name), angleSVG);
  });
});

console.log('✓ Generated all artifact images and multi-angle photo sets');

