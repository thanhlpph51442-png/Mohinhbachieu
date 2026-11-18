const fs = require('fs');
const path = require('path');

// Helper to build a valid binary GLB from geometry data
function buildGLB({ name, positions, normals, uvs, indices, material }) {
  const posArray = new Float32Array(positions);
  const normArray = new Float32Array(normals);
  const uvArray = new Float32Array(uvs);
  const indArray = new Uint16Array(indices);

  const posBuf = Buffer.from(posArray.buffer);
  const normBuf = Buffer.from(normArray.buffer);
  const uvBuf = Buffer.from(uvArray.buffer);
  const indBuf = Buffer.from(indArray.buffer);

  function align4(buf) {
    const pad = (4 - (buf.length % 4)) % 4;
    return pad === 0 ? buf : Buffer.concat([buf, Buffer.alloc(pad)]);
  }

  const aPos = align4(posBuf);
  const aNorm = align4(normBuf);
  const aUv = align4(uvBuf);
  const aInd = align4(indBuf);

  let offset = 0;
  const posOffset = offset; offset += aPos.length;
  const normOffset = offset; offset += aNorm.length;
  const uvOffset = offset; offset += aUv.length;
  const indOffset = offset; offset += aInd.length;

  const binBuffer = Buffer.concat([aPos, aNorm, aUv, aInd]);

  // Compute min/max
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < posArray.length; i += 3) {
    min[0] = Math.min(min[0], posArray[i]);
    min[1] = Math.min(min[1], posArray[i+1]);
    min[2] = Math.min(min[2], posArray[i+2]);
    max[0] = Math.max(max[0], posArray[i]);
    max[1] = Math.max(max[1], posArray[i+1]);
    max[2] = Math.max(max[2], posArray[i+2]);
  }

  const gltf = {
    asset: { version: '2.0', generator: 'Heritage 3D Photogrammetry Studio' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: name || 'ArtifactModel' }],
    meshes: [{
      name: name || 'ArtifactMesh',
      primitives: [{
        attributes: {
          POSITION: 0,
          NORMAL: 1,
          TEXCOORD_0: 2
        },
        indices: 3,
        material: 0
      }]
    }],
    materials: [{
      name: (name || 'Artifact') + '_Material',
      pbrMetallicRoughness: {
        baseColorFactor: material.baseColor || [0.7, 0.6, 0.45, 1.0],
        metallicFactor: material.metallic ?? 0.5,
        roughnessFactor: material.roughness ?? 0.5
      },
      doubleSided: true
    }],
    accessors: [
      { bufferView: 0, byteOffset: 0, componentType: 5126, count: posArray.length / 3, type: 'VEC3', min, max },
      { bufferView: 1, byteOffset: 0, componentType: 5126, count: normArray.length / 3, type: 'VEC3' },
      { bufferView: 2, byteOffset: 0, componentType: 5126, count: uvArray.length / 2, type: 'VEC2' },
      { bufferView: 3, byteOffset: 0, componentType: 5123, count: indArray.length, type: 'SCALAR' }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: posOffset, byteLength: posBuf.length, target: 34962 },
      { buffer: 0, byteOffset: normOffset, byteLength: normBuf.length, target: 34962 },
      { buffer: 0, byteOffset: uvOffset, byteLength: uvBuf.length, target: 34962 },
      { buffer: 0, byteOffset: indOffset, byteLength: indBuf.length, target: 34963 }
    ],
    buffers: [{ byteLength: binBuffer.length }]
  };

  const jsonBufRaw = Buffer.from(JSON.stringify(gltf), 'utf8');
  const jsonPad = (4 - (jsonBufRaw.length % 4)) % 4;
  const jsonBuf = jsonPad === 0 ? jsonBufRaw : Buffer.concat([jsonBufRaw, Buffer.alloc(jsonPad, 0x20)]);

  const binPad = (4 - (binBuffer.length % 4)) % 4;
  const finalBin = binPad === 0 ? binBuffer : Buffer.concat([binBuffer, Buffer.alloc(binPad, 0x00)]);

  const totalLength = 12 + 8 + jsonBuf.length + 8 + finalBin.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const chunk0 = Buffer.alloc(8);
  chunk0.writeUInt32LE(jsonBuf.length, 0);
  chunk0.writeUInt32LE(0x4E4F534A, 4);

  const chunk1 = Buffer.alloc(8);
  chunk1.writeUInt32LE(finalBin.length, 0);
  chunk1.writeUInt32LE(0x004E4942, 4);

  return Buffer.concat([header, chunk0, jsonBuf, chunk1, finalBin]);
}

// Geometry Builder Helpers
class MeshBuilder {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
  }

  addVertex(x, y, z, nx, ny, nz, u, v) {
    this.positions.push(x, y, z);
    const len = Math.hypot(nx, ny, nz) || 1;
    this.normals.push(nx / len, ny / len, nz / len);
    this.uvs.push(u, v);
    return (this.positions.length / 3) - 1;
  }

  addTriangle(i1, i2, i3) {
    this.indices.push(i1, i2, i3);
  }

  addQuad(i1, i2, i3, i4) {
    this.indices.push(i1, i2, i3, i1, i3, i4);
  }

  // Create surface of revolution (Lathe) around Y axis from 2D profile points [r, y]
  addLathe(profile, radialSegments = 36) {
    const grid = [];
    for (let j = 0; j < profile.length; j++) {
      const row = [];
      const [r, y] = profile[j];
      const v = j / (profile.length - 1);
      
      // Calculate profile slope normal
      let dr = 0, dy = 1;
      if (j === 0) {
        dr = profile[1][0] - profile[0][0];
        dy = profile[1][1] - profile[0][1];
      } else if (j === profile.length - 1) {
        dr = profile[j][0] - profile[j-1][0];
        dy = profile[j][1] - profile[j-1][1];
      } else {
        dr = profile[j+1][0] - profile[j-1][0];
        dy = profile[j+1][1] - profile[j-1][1];
      }
      // Perpendicular vector (-dy, dr)
      let pnx = dy;
      let pny = -dr;
      const plen = Math.hypot(pnx, pny) || 1;
      pnx /= plen;
      pny /= plen;

      for (let i = 0; i <= radialSegments; i++) {
        const u = i / radialSegments;
        const theta = u * Math.PI * 2;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const px = r * cos;
        const pz = r * sin;
        const nx = pnx * cos;
        const ny = pny;
        const nz = pnx * sin;
        const idx = this.addVertex(px, y, pz, nx, ny, nz, u, v);
        row.push(idx);
      }
      grid.push(row);
    }

    for (let j = 0; j < profile.length - 1; j++) {
      for (let i = 0; i < radialSegments; i++) {
        const i1 = grid[j][i];
        const i2 = grid[j][i+1];
        const i3 = grid[j+1][i+1];
        const i4 = grid[j+1][i];
        this.addQuad(i1, i2, i3, i4);
      }
    }
  }

  // Add a Torus / curved handle
  addTorus(cx, cy, cz, R, r, thetaStart, thetaEnd, segments = 16, sides = 8, rotZ = 0) {
    const grid = [];
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const theta = thetaStart + u * (thetaEnd - thetaStart);
      const row = [];
      const centerCircleX = cx + Math.cos(theta) * R;
      const centerCircleY = cy + Math.sin(theta) * R;

      for (let j = 0; j <= sides; j++) {
        const phi = (j / sides) * Math.PI * 2;
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);

        // Vector pointing outward from torus ring center
        const ox = Math.cos(theta) * cosP * r;
        const oy = Math.sin(theta) * cosP * r;
        const oz = sinP * r;

        let px = centerCircleX + ox;
        let py = centerCircleY + oy;
        let pz = cz + oz;

        // Normal
        const nx = Math.cos(theta) * cosP;
        const ny = Math.sin(theta) * cosP;
        const nz = sinP;

        const idx = this.addVertex(px, py, pz, nx, ny, nz, u, j / sides);
        row.push(idx);
      }
      grid.push(row);
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < sides; j++) {
        this.addQuad(grid[i][j], grid[i+1][j], grid[i+1][j+1], grid[i][j+1]);
      }
    }
  }

  // Add a box / pedestal
  addBox(cx, cy, cz, wx, wy, wz) {
    const hx = wx / 2, hy = wy / 2, hz = wz / 2;
    // 6 faces
    const faces = [
      // Front
      { n: [0, 0, 1], v: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]] },
      // Back
      { n: [0, 0, -1], v: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]] },
      // Top
      { n: [0, 1, 0], v: [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]] },
      // Bottom
      { n: [0, -1, 0], v: [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]] },
      // Right
      { n: [1, 0, 0], v: [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]] },
      // Left
      { n: [-1, 0, 0], v: [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]] }
    ];

    faces.forEach(f => {
      const idxs = f.v.map(pt => this.addVertex(cx + pt[0], cy + pt[1], cz + pt[2], f.n[0], f.n[1], f.n[2], 0, 0));
      this.addQuad(idxs[0], idxs[1], idxs[2], idxs[3]);
    });
  }

  // Add cylinder
  addCylinder(cx, cy, cz, rTop, rBottom, height, segments = 24) {
    const halfH = height / 2;
    const profile = [
      [0, -halfH],
      [rBottom, -halfH],
      [rTop, halfH],
      [0, halfH]
    ];
    // Custom lathe for this cylinder
    const grid = [];
    for (let j = 0; j < profile.length; j++) {
      const row = [];
      const [r, y] = profile[j];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const px = cx + r * Math.cos(theta);
        const pz = cz + r * Math.sin(theta);
        const py = cy + y;
        let nx = Math.cos(theta);
        let nz = Math.sin(theta);
        let ny = 0;
        if (j === 0) { nx = 0; ny = -1; nz = 0; }
        else if (j === 3) { nx = 0; ny = 1; nz = 0; }
        row.push(this.addVertex(px, py, pz, nx, ny, nz, i / segments, j / 3));
      }
      grid.push(row);
    }
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < segments; i++) {
        this.addQuad(grid[j][i], grid[j][i+1], grid[j+1][i+1], grid[j+1][i]);
      }
    }
  }

  // Add sphere
  addSphere(cx, cy, cz, radius, segLat = 12, segLon = 16) {
    const grid = [];
    for (let i = 0; i <= segLat; i++) {
      const lat = (i / segLat) * Math.PI - Math.PI / 2;
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);
      const row = [];
      for (let j = 0; j <= segLon; j++) {
        const lon = (j / segLon) * Math.PI * 2;
        const sinLon = Math.sin(lon);
        const cosLon = Math.cos(lon);

        const nx = cosLat * cosLon;
        const ny = sinLat;
        const nz = cosLat * sinLon;

        const px = cx + radius * nx;
        const py = cy + radius * ny;
        const pz = cz + radius * nz;

        row.push(this.addVertex(px, py, pz, nx, ny, nz, j / segLon, i / segLat));
      }
      grid.push(row);
    }
    for (let i = 0; i < segLat; i++) {
      for (let j = 0; j < segLon; j++) {
        this.addQuad(grid[i][j], grid[i][j+1], grid[i+1][j+1], grid[i+1][j]);
      }
    }
  }
}

// 1. TRỐNG ĐỒNG ĐÔNG SƠN (Dong Son Bronze Drum)
function generateDongSonDrum() {
  const b = new MeshBuilder();
  // Accurate Heger 1 silhouette:
  // Drum head (mặt trống), tang trống phình ra, thắt eo ở giữa, chân choãi ra
  const profile = [
    [0.00, 0.42],  // Center of tympanum
    [0.48, 0.42],  // Flat sun star disc
    [0.50, 0.415], // Rim edge
    [0.51, 0.39],  // Upper rim bead
    [0.50, 0.35],  // Flared shoulder (tang trống phình)
    [0.48, 0.28],
    [0.38, 0.18],  // Waist constriction (lưng trống)
    [0.37, 0.05],
    [0.38, -0.05],
    [0.42, -0.18], // Lower foot flare (chân trống)
    [0.49, -0.32],
    [0.51, -0.38],
    [0.52, -0.40], // Base foot edge
    [0.46, -0.40], // Inner hollow thickness
    [0.44, -0.36],
    [0.34, -0.05],
    [0.34, 0.15],
    [0.00, 0.15]   // Hollow inner underside
  ];

  b.addLathe(profile, 40);

  // 4 Handles (Quai kép chữ U dạng bện thừng) attached at tang and body
  const handleAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  handleAngles.forEach(ang => {
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    // Upper connection at y = 0.32, r = 0.49; Lower connection at y = 0.12, r = 0.38
    // Torus arc segment
    const midR = 0.46;
    const midY = 0.22;
    b.addTorus(cos * midR, midY, sin * midR, 0.08, 0.02, -Math.PI * 0.4, Math.PI * 0.4, 8, 6);
  });

  // 4 Sacred Frogs on the drum head (Tượng 4 con cóc trên mặt trống)
  [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach(ang => {
    const frogR = 0.42;
    const fx = Math.cos(ang) * frogR;
    const fz = Math.sin(ang) * frogR;
    const fy = 0.425;
    b.addSphere(fx, fy, fz, 0.025, 6, 8);
    // Tiny head
    const headX = Math.cos(ang + 0.1) * (frogR - 0.02);
    const headZ = Math.sin(ang + 0.1) * (frogR - 0.02);
    b.addSphere(headX, fy + 0.01, headZ, 0.015, 4, 6);
  });

  return buildGLB({
    name: 'TrongDongDongSon',
    positions: b.positions,
    normals: b.normals,
    uvs: b.uvs,
    indices: b.indices,
    material: {
      baseColor: [0.38, 0.45, 0.36, 1.0], // Rêu đồng cổ kính (Antique Bronze Green Patina)
      metallic: 0.75,
      roughness: 0.42
    }
  });
}

// 2. BÌNH GỐM HOA LAM TRIỀU LÊ SƠ (Blue and White Ceramic Vase)
function generateCeramicVase() {
  const b = new MeshBuilder();
  // Classic Ming-Le dynasty Meiping / garlic head vase
  const profile = [
    [0.00, 0.55],   // Lip opening
    [0.10, 0.55],
    [0.11, 0.53],
    [0.07, 0.47],   // Slender neck
    [0.065, 0.38],
    [0.09, 0.28],   // Expanding shoulder
    [0.26, 0.12],   // Full round shoulder
    [0.28, -0.02],
    [0.24, -0.18],  // Tapering body
    [0.18, -0.32],
    [0.15, -0.42],  // Lower base flare
    [0.16, -0.48],
    [0.17, -0.50],  // Foot rim
    [0.00, -0.50]   // Base center
  ];

  b.addLathe(profile, 36);

  return buildGLB({
    name: 'BinhGomHoaLam',
    positions: b.positions,
    normals: b.normals,
    uvs: b.uvs,
    indices: b.indices,
    material: {
      baseColor: [0.86, 0.90, 0.93, 1.0], // Ivory porcelain glaze with cobalt blue shimmer
      metallic: 0.08,
      roughness: 0.18
    }
  });
}

// 3. THẠP ĐỒNG ĐÀO THỊNH (Dao Thinh Bronze Situla)
function generateDaoThinhSitula() {
  const b = new MeshBuilder();
  // Cylindrical situla with conical lid and stepped base
  const profile = [
    [0.00, 0.52],   // Lid finial
    [0.05, 0.50],
    [0.08, 0.45],
    [0.32, 0.36],   // Lid slope
    [0.34, 0.34],   // Lid rim
    [0.32, 0.33],   // Situla mouth
    [0.31, 0.20],   // Upper body cylinder
    [0.29, 0.00],
    [0.26, -0.20],  // Lower body taper
    [0.23, -0.38],
    [0.24, -0.42],  // Foot rim
    [0.00, -0.42]
  ];

  b.addLathe(profile, 36);

  // 4 Miniature fertility figures / birds on lid
  [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach(ang => {
    const lx = Math.cos(ang) * 0.20;
    const lz = Math.sin(ang) * 0.20;
    const ly = 0.41;
    b.addCylinder(lx, ly + 0.03, lz, 0.02, 0.025, 0.06, 8);
    b.addSphere(lx, ly + 0.07, lz, 0.02, 6, 6);
  });

  // 2 Loop handles on body
  [-1, 1].forEach(side => {
    b.addTorus(side * 0.30, 0.16, 0, 0.06, 0.018, -Math.PI * 0.5, Math.PI * 0.5, 8, 6);
  });

  return buildGLB({
    name: 'ThapDongDaoThinh',
    positions: b.positions,
    normals: b.normals,
    uvs: b.uvs,
    indices: b.indices,
    material: {
      baseColor: [0.32, 0.29, 0.25, 1.0], // Dark weathered bronze
      metallic: 0.72,
      roughness: 0.55
    }
  });
}

// 4. TƯỢNG ĐIÊU KHẮC SA THẠCH CHĂM PA (Cham Sandstone Sculpture)
function generateChamSculpture() {
  const b = new MeshBuilder();

  // 1. Lotus pedestal base (Bệ sen vuông và tròn)
  b.addBox(0, -0.45, 0, 0.55, 0.12, 0.55);
  b.addCylinder(0, -0.35, 0, 0.26, 0.28, 0.08, 24);

  // 2. Stele back slab (Bia vòm sau lưng tượng)
  const slabProfile = [
    [-0.24, -0.30, -0.08], [0.24, -0.30, -0.08],
    [0.24, 0.25, -0.08], [0.18, 0.45, -0.08],
    [0.00, 0.52, -0.08], [-0.18, 0.45, -0.08],
    [-0.24, 0.25, -0.08]
  ];
  b.addBox(0, 0.08, -0.08, 0.48, 0.74, 0.08);

  // 3. Deity Body (Thân tượng Tara Chăm Pa)
  // Lower body wrapped in sampot (sarong)
  b.addCylinder(0, -0.15, 0.02, 0.13, 0.16, 0.32, 20);
  
  // Slender waist
  b.addCylinder(0, 0.03, 0.02, 0.12, 0.11, 0.12, 18);

  // Bust / Torso (Ngực trần đầy đặn thẩm mỹ Chăm Pa)
  b.addSphere(-0.065, 0.10, 0.07, 0.055, 10, 12);
  b.addSphere(0.065, 0.10, 0.07, 0.055, 10, 12);
  b.addCylinder(0, 0.12, 0.02, 0.15, 0.13, 0.10, 18);

  // Neck and Ornate Necklace
  b.addCylinder(0, 0.20, 0.02, 0.07, 0.08, 0.08, 16);
  b.addTorus(0, 0.17, 0.02, 0.09, 0.015, 0, Math.PI * 2, 16, 6);

  // Head and Serene Face
  b.addSphere(0, 0.28, 0.03, 0.09, 12, 14);

  // Ornate Chignon / Jatamukuta Crown (Búi tóc vương miện)
  b.addCylinder(0, 0.40, 0.02, 0.05, 0.08, 0.16, 16);
  b.addSphere(0, 0.49, 0.02, 0.04, 8, 10);

  // Arms in meditative mudra
  b.addCylinder(-0.16, 0.05, 0.03, 0.04, 0.04, 0.24, 10);
  b.addCylinder(0.16, 0.05, 0.03, 0.04, 0.04, 0.24, 10);

  return buildGLB({
    name: 'TuongChamPa',
    positions: b.positions,
    normals: b.normals,
    uvs: b.uvs,
    indices: b.indices,
    material: {
      baseColor: [0.66, 0.60, 0.52, 1.0], // Sa thạch Chăm Pa ấm áp (Warm Cham Sandstone)
      metallic: 0.04,
      roughness: 0.88
    }
  });
}

// 5. ẤN VÀNG "HOÀNG ĐẾ CHI BẢO" (Imperial Gold Seal of Nguyen Dynasty)
function generateImperialGoldSeal() {
  const b = new MeshBuilder();

  // 1. Square Seal Base Block (Khối thân ấn vuông vức hoàng cung)
  b.addBox(0, -0.15, 0, 0.52, 0.18, 0.52);

  // Stepped upper platform on top of base
  b.addBox(0, -0.04, 0, 0.44, 0.04, 0.44);
  b.addBox(0, -0.01, 0, 0.38, 0.03, 0.38);

  // 2. Coiled Dragon Handle (Núm rồng cuộn "Long Tọa")
  // Coiled body loop (Torus arch)
  b.addTorus(0, 0.12, 0, 0.13, 0.06, 0, Math.PI * 1.8, 20, 10);

  // Dragon Head raised high (Đầu rồng ngẩng cao)
  b.addSphere(0.14, 0.24, 0.05, 0.075, 10, 12);
  // Dragon Snout / Jaw (Mõm rồng)
  b.addCylinder(0.21, 0.22, 0.05, 0.04, 0.05, 0.10, 10);
  // Dragon Horns (Hai sừng rồng)
  b.addCylinder(0.12, 0.33, 0.08, 0.015, 0.025, 0.10, 6);
  b.addCylinder(0.12, 0.33, 0.02, 0.015, 0.025, 0.10, 6);

  // 4 Dragon Claws gripping the seal top (4 móng rồng vuốt bám)
  const clawPositions = [
    [0.15, 0.02, 0.15],
    [-0.15, 0.02, 0.15],
    [-0.15, 0.02, -0.15],
    [0.15, 0.02, -0.15]
  ];
  clawPositions.forEach(([cx, cy, cz]) => {
    b.addSphere(cx, cy, cz, 0.045, 8, 8);
  });

  return buildGLB({
    name: 'AnVangHoangDe',
    positions: b.positions,
    normals: b.normals,
    uvs: b.uvs,
    indices: b.indices,
    material: {
      baseColor: [0.96, 0.81, 0.22, 1.0], // Imperial 24K Pure Gold
      metallic: 0.95,
      roughness: 0.22
    }
  });
}

// Generate all and save to public/models/
const modelsDir = path.join(__dirname, '..', 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

console.log('Generating authentic 3D GLB cultural artifacts...');

const models = [
  { file: 'trong-dong-dong-son.glb', gen: generateDongSonDrum, desc: 'Trống Đồng Đông Sơn' },
  { file: 'binh-gom-hoa-lam.glb', gen: generateCeramicVase, desc: 'Bình Gốm Hoa Lam Triều Lê Sơ' },
  { file: 'thap-dong-dao-thinh.glb', gen: generateDaoThinhSitula, desc: 'Thạp Đồng Đào Thịnh' },
  { file: 'tuong-cham-pa.glb', gen: generateChamSculpture, desc: 'Tượng Bồ Tát Tara Chăm Pa' },
  { file: 'an-vang-hoang-de.glb', gen: generateImperialGoldSeal, desc: 'Ấn Vàng Hoàng Đế Chi Bảo' }
];

models.forEach(m => {
  const glbBuffer = m.gen();
  const filePath = path.join(modelsDir, m.file);
  fs.writeFileSync(filePath, glbBuffer);
  console.log(`✓ Created: ${m.file} (${m.desc}) - Size: ${(glbBuffer.length / 1024).toFixed(1)} KB`);
});

console.log('All 5 3D models generated successfully!');

