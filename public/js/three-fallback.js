/**
 * Three.js Standalone Fallback Loader & WebGL Orbit Engine
 * Provides backup 3D WebGL rendering with Wireframe, Clay, Lighting, and OrbitControls.
 */

class HeritageThreeViewer {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.currentMesh = null;
    this.animId = null;
    this.isRotating = true;
    this.viewMode = 'texture'; // 'texture', 'wireframe', 'clay', 'xray'
    this.lightPreset = 'museum'; // 'museum', 'studio', 'sunset', 'white'

    // Mouse drag state
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.rotation = { x: 0.2, y: 0 };
    this.zoom = 2.2;
    this.target = { x: 0, y: 0, z: 0 };
  }

  init() {
    if (!window.THREE) {
      console.warn('Three.js library not loaded yet; fallback initialized in standby.');
      return false;
    }

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0.5, this.zoom);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.setupEvents();
    this.animate();

    return true;
  }

  setupLights() {
    this.lightsGroup = new THREE.Group();

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.8);
    this.lightsGroup.add(this.ambientLight);

    // Key light (warm golden museum spotlight)
    this.keyLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    this.keyLight.position.set(3, 4, 3);
    this.lightsGroup.add(this.keyLight);

    // Fill light (soft bronze)
    this.fillLight = new THREE.DirectionalLight(0xc5a059, 1.2);
    this.fillLight.position.set(-3, 2, -2);
    this.lightsGroup.add(this.fillLight);

    // Rim light (crisp highlight)
    this.rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.rimLight.position.set(0, -3, -2);
    this.lightsGroup.add(this.rimLight);

    this.scene.add(this.lightsGroup);
  }

  setLighting(preset) {
    this.lightPreset = preset;
    if (!this.ambientLight) return;

    if (preset === 'museum') {
      this.ambientLight.color.setHex(0xffeedd);
      this.ambientLight.intensity = 0.8;
      this.keyLight.color.setHex(0xfff7e6);
      this.keyLight.intensity = 2.0;
      this.fillLight.color.setHex(0xd4af37);
      this.fillLight.intensity = 1.2;
    } else if (preset === 'studio') {
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.0;
      this.keyLight.color.setHex(0xffffff);
      this.keyLight.intensity = 1.8;
      this.fillLight.color.setHex(0xe0e0e0);
      this.fillLight.intensity = 1.0;
    } else if (preset === 'sunset') {
      this.ambientLight.color.setHex(0xff7733);
      this.ambientLight.intensity = 0.7;
      this.keyLight.color.setHex(0xffa500);
      this.keyLight.intensity = 2.5;
      this.fillLight.color.setHex(0x882200);
      this.fillLight.intensity = 1.5;
    } else if (preset === 'white') {
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.4;
      this.keyLight.color.setHex(0xffffff);
      this.keyLight.intensity = 1.2;
      this.fillLight.color.setHex(0xffffff);
      this.fillLight.intensity = 0.8;
    }
  }

  setupEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    el.addEventListener('mousemove', e => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.rotation.y += dx * 0.008;
      this.rotation.x += dy * 0.008;
      this.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.rotation.x));
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    el.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom += e.deltaY * 0.002;
      this.zoom = Math.max(0.6, Math.min(5.0, this.zoom));
    }, { passive: false });

    // Touch events for mobile
    let touchStartDist = 0;
    el.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    el.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.prevMouse.x;
        const dy = e.touches[0].clientY - this.prevMouse.y;
        this.rotation.y += dx * 0.008;
        this.rotation.x += dy * 0.008;
        this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchStartDist - dist;
        this.zoom += diff * 0.005;
        this.zoom = Math.max(0.6, Math.min(5.0, this.zoom));
        touchStartDist = dist;
      }
    });

    el.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  loadGLB(url, onProgress, onComplete, onError) {
    if (!window.THREE || !THREE.GLTFLoader) {
      if (onError) onError(new Error('GLTFLoader not available'));
      return;
    }

    const loader = new THREE.GLTFLoader();
    loader.load(
      url,
      gltf => {
        if (this.currentMesh) {
          this.scene.remove(this.currentMesh);
        }
        this.currentMesh = gltf.scene;
        
        // Auto-center and normalize size
        const box = new THREE.Box3().setFromObject(this.currentMesh);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.2 / (maxDim || 1);
        this.currentMesh.scale.set(scale, scale, scale);
        this.currentMesh.position.sub(center.multiplyScalar(scale));

        // Save original materials
        this.currentMesh.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.originalMaterial = child.material;
          }
        });

        this.scene.add(this.currentMesh);
        this.applyViewMode(this.viewMode);

        if (onComplete) onComplete(gltf);
      },
      progress => {
        if (onProgress && progress.total) {
          onProgress(progress.loaded / progress.total);
        }
      },
      err => {
        console.error('Error loading GLB in Three.js:', err);
        if (onError) onError(err);
      }
    );
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.applyViewMode(mode);
  }

  applyViewMode(mode) {
    if (!this.currentMesh) return;

    this.currentMesh.traverse(child => {
      if (!child.isMesh) return;

      if (mode === 'texture') {
        child.material = child.userData.originalMaterial || child.material;
        child.material.wireframe = false;
      } else if (mode === 'wireframe') {
        child.material = new THREE.MeshBasicMaterial({
          color: 0xd4af37,
          wireframe: true
        });
      } else if (mode === 'clay') {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xd4c4b0,
          roughness: 0.8,
          metalness: 0.1,
          wireframe: false
        });
      } else if (mode === 'xray') {
        child.material = new THREE.MeshPhysicalMaterial({
          color: 0x60a5fa,
          transmission: 0.85,
          opacity: 0.6,
          transparent: true,
          roughness: 0.1,
          ior: 1.5
        });
      }
    });
  }

  toggleAutoRotate() {
    this.isRotating = !this.isRotating;
    return this.isRotating;
  }

  resetCamera() {
    this.rotation = { x: 0.2, y: 0 };
    this.zoom = 2.2;
  }

  captureSnapshot() {
    if (!this.renderer) return null;
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());

    if (this.isRotating && !this.isDragging) {
      this.rotation.y += 0.004;
    }

    if (this.currentMesh) {
      this.currentMesh.rotation.x = this.rotation.x;
      this.currentMesh.rotation.y = this.rotation.y;
    }

    this.camera.position.z = this.zoom;
    this.camera.lookAt(0, 0, 0);

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}

window.HeritageThreeViewer = HeritageThreeViewer;

