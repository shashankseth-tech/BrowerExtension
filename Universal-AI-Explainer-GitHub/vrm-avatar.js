// vrm-avatar.js — High-Performance 3D VRoid / VRM Character Engine
// Supports Three.js + three-vrm with procedural lip-sync, blinking, breathing, and mouse look-at.
(function (global) {
  'use strict';

  class VRMAvatarController {
    constructor(options = {}) {
      this.canvas = options.canvas;
      this.modelUrl = options.modelUrl || '';
      this.fov = options.fov || 26;
      this.enableMouseTracking = options.enableMouseTracking !== false;
      this.autoBlink = options.autoBlink !== false;
      this.idleMovement = options.idleMovement !== false;
      this.onLoaded = options.onLoaded || null;
      this.onError = options.onError || null;

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.currentVrm = null;
      this.animFrameId = null;
      this.clock = null;

      // Model bone & morph target references
      this.headBone = null;
      this.neckBone = null;
      this.chestBone = null;
      this.faceMesh = null;
      this.morphMap = {};

      // Animation state
      this.isSpeaking = false;
      this.speechEndTime = 0;
      this.currentMouthOpen = 0;
      this.targetMouthOpen = 0;

      // Blinking state
      this.blinkTimer = 0;
      this.nextBlinkInterval = 3.0;
      this.blinkProgress = 0;
      this.isBlinking = false;

      // Mouse look-at tracking
      this.targetLookX = 0;
      this.targetLookY = 0;
      this.currentLookX = 0;
      this.currentLookY = 0;

      // Bound handlers
      this._onResize = this._onResize.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._animate = this._animate.bind(this);
    }

    init() {
      if (!this.canvas) {
        console.error('[VRMAvatar] No canvas provided');
        return false;
      }
      if (typeof THREE === 'undefined') {
        console.warn('[VRMAvatar] Three.js is not loaded yet.');
        return false;
      }

      const THREE = global.THREE;
      const width = this.canvas.clientWidth || 300;
      const height = this.canvas.clientHeight || 300;

      // 1. Scene
      this.scene = new THREE.Scene();

      // 2. Camera: Framed for upper chest and face
      this.camera = new THREE.PerspectiveCamera(this.fov, width / height, 0.1, 20.0);
      this.camera.position.set(0, 1.34, 0.78);
      this.camera.lookAt(0, 1.30, 0);

      // 3. Renderer with high performance & smooth transparency
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.outputEncoding = THREE.sRGBEncoding || 3001;

      // 4. Lighting: Gorgeous cyber studio three-point light setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      this.scene.add(ambientLight);

      // Warm Key Light (Front-Right)
      const keyLight = new THREE.DirectionalLight(0xfff3e0, 0.95);
      keyLight.position.set(0.8, 1.8, 1.2);
      this.scene.add(keyLight);

      // Cyber Rim Light (Back-Left - cyan glow)
      const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
      rimLight.position.set(-1.0, 1.6, -1.0);
      this.scene.add(rimLight);

      // Front Soft Fill Light
      const fillLight = new THREE.DirectionalLight(0x818cf8, 0.35);
      fillLight.position.set(0, 0.6, 1.0);
      this.scene.add(fillLight);

      this.clock = new THREE.Clock();

      // Window & Mouse listeners
      window.addEventListener('resize', this._onResize);
      if (this.enableMouseTracking) {
        window.addEventListener('mousemove', this._onMouseMove);
      }

      // Load VRM Model
      if (this.modelUrl) {
        this.loadModel(this.modelUrl);
      }

      // Start animation loop
      this._animate();
      return true;
    }

    loadModel(url) {
      if (!THREE || !THREE.GLTFLoader) {
        console.warn('[VRMAvatar] THREE.GLTFLoader is not available');
        return;
      }

      const loader = new THREE.GLTFLoader();

      // Register three-vrm plugin if loaded
      if (global.THREE_VRM && global.THREE_VRM.VRMLoaderPlugin) {
        loader.register((parser) => new global.THREE_VRM.VRMLoaderPlugin(parser));
      }

      loader.load(
        url,
        (gltf) => {
          // Check for VRM instance
          if (gltf.userData && gltf.userData.vrm) {
            this.currentVrm = gltf.userData.vrm;
            this.currentVrm.scene.rotation.y = 0; // Face forward towards camera
            this.scene.add(this.currentVrm.scene);
            this._setupVrmReferences(this.currentVrm);
          } else {
            // Direct glTF 2.0 fallback (VRM 1.0 binary glTF)
            const root = gltf.scene || gltf.scenes[0];
            root.rotation.y = 0; // Face forward towards camera
            this.scene.add(root);
            this._setupGltfReferences(root);
          }

          if (typeof this.onLoaded === 'function') {
            this.onLoaded(this);
          }
        },
        (progress) => {
          // Progress callback
        },
        (error) => {
          console.error('[VRMAvatar] Failed to load model:', error);
          if (typeof this.onError === 'function') {
            this.onError(error);
          }
        }
      );
    }

    _setupVrmReferences(vrm) {
      // Find humanoid bones via VRM interface
      if (vrm.humanoid) {
        this.headBone = vrm.humanoid.getNormalizedBoneNode('head') || vrm.humanoid.getBoneNode('head');
        this.neckBone = vrm.humanoid.getNormalizedBoneNode('neck') || vrm.humanoid.getBoneNode('neck');
        this.chestBone = vrm.humanoid.getNormalizedBoneNode('chest') || vrm.humanoid.getBoneNode('chest');
      }
      this._setupGltfReferences(vrm.scene);
    }

    _setupGltfReferences(root) {
      root.traverse((obj) => {
        // Look for humanoid bones by standard VRoid naming convention
        if (obj.isBone) {
          const name = obj.name || '';
          if (!this.headBone && (name.includes('Head') || name.includes('head') || name === 'J_Bip_C_Head')) {
            this.headBone = obj;
          } else if (!this.neckBone && (name.includes('Neck') || name.includes('neck') || name === 'J_Bip_C_Neck')) {
            this.neckBone = obj;
          } else if (!this.chestBone && (name.includes('Chest') || name.includes('chest') || name === 'J_Bip_C_Chest')) {
            this.chestBone = obj;
          }
        }

        // Look for face morph targets (blend shapes)
        if (obj.isMesh && obj.morphTargetDictionary && obj.morphTargetInfluences) {
          const dict = obj.morphTargetDictionary;
          this.faceMesh = obj;
          for (const key in dict) {
            const idx = dict[key];
            const lower = key.toLowerCase();

            if (lower.includes('blink') || lower === 'fcl_eye_close') {
              this.morphMap['blink'] = { mesh: obj, index: idx };
            } else if (lower === 'aa' || lower.includes('mth_a') || lower === 'fcl_mth_a' || lower === 'a') {
              this.morphMap['aa'] = { mesh: obj, index: idx };
            } else if (lower.includes('joy') || lower.includes('happy') || lower === 'fcl_all_joy') {
              this.morphMap['happy'] = { mesh: obj, index: idx };
            } else if (lower.includes('surprised') || lower === 'fcl_all_surprised') {
              this.morphMap['surprised'] = { mesh: obj, index: idx };
            } else if (lower.includes('neutral') || lower === 'fcl_all_neutral') {
              this.morphMap['neutral'] = { mesh: obj, index: idx };
            }
          }
        }
      });
    }

    startSpeaking(durationMs = 3000) {
      this.isSpeaking = true;
      this.speechEndTime = performance.now() + durationMs;
    }

    stopSpeaking() {
      this.isSpeaking = false;
      this.speechEndTime = 0;
      this.targetMouthOpen = 0;
    }

    setExpression(name, weight = 1.0) {
      // 1. Try via three-vrm expression manager
      if (this.currentVrm) {
        if (this.currentVrm.expressionManager) {
          this.currentVrm.expressionManager.setValue(name, weight);
          return;
        }
        if (this.currentVrm.blendShapeProxy) {
          this.currentVrm.blendShapeProxy.setValue(name, weight);
          return;
        }
      }

      // 2. Direct morph target fallback
      const entry = this.morphMap[name];
      if (entry && entry.mesh && entry.mesh.morphTargetInfluences) {
        entry.mesh.morphTargetInfluences[entry.index] = weight;
      }
    }

    _onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalized coordinates (-1 to 1)
      const nx = (e.clientX - centerX) / (window.innerWidth / 2);
      const ny = (e.clientY - centerY) / (window.innerHeight / 2);

      // Clamp target angles (max ~15 degrees)
      this.targetLookX = Math.max(-0.25, Math.min(0.25, nx * 0.25));
      this.targetLookY = Math.max(-0.18, Math.min(0.18, ny * 0.18));
    }

    _onResize() {
      if (!this.renderer || !this.camera || !this.canvas) return;
      const width = this.canvas.clientWidth || 300;
      const height = this.canvas.clientHeight || 300;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    }

    resetCamera() {
      if (this.camera) {
        this.camera.position.set(0, 1.34, 0.78);
        this.camera.lookAt(0, 1.30, 0);
      }
    }

    _animate() {
      this.animFrameId = requestAnimationFrame(this._animate);

      const delta = this.clock ? this.clock.getDelta() : 0.016;
      const elapsed = this.clock ? this.clock.getElapsedTime() : performance.now() * 0.001;

      // Update three-vrm springs / physics if available
      if (this.currentVrm && this.currentVrm.update) {
        this.currentVrm.update(delta);
      }

      // 1. Mouse look-at smooth dampening
      this.currentLookX += (this.targetLookX - this.currentLookX) * 0.08;
      this.currentLookY += (this.targetLookY - this.currentLookY) * 0.08;

      // 2. Head & Neck Movement (Natural Idle + Look-At)
      if (this.headBone) {
        if (this.idleMovement) {
          const idleX = Math.sin(elapsed * 0.8) * 0.025;
          const idleY = Math.sin(elapsed * 0.5) * 0.035;
          const idleZ = Math.sin(elapsed * 0.6) * 0.008;

          // Conversational head nod when speaking
          const speechNod = this.isSpeaking ? Math.sin(elapsed * 9) * 0.025 : 0;

          this.headBone.rotation.y = idleY + this.currentLookX;
          this.headBone.rotation.x = idleX + this.currentLookY + speechNod;
          this.headBone.rotation.z = idleZ;
        } else {
          this.headBone.rotation.y = this.currentLookX;
          this.headBone.rotation.x = this.currentLookY;
        }
      }

      // 3. Breathing Animation (Chest)
      if (this.chestBone) {
        this.chestBone.rotation.x = Math.sin(elapsed * 1.6) * 0.012;
      }

      // 4. Procedural Blinking
      if (this.autoBlink) {
        this.blinkTimer += delta;
        if (!this.isBlinking && this.blinkTimer >= this.nextBlinkInterval) {
          this.isBlinking = true;
          this.blinkProgress = 0;
          this.blinkTimer = 0;
          this.nextBlinkInterval = 2.5 + Math.random() * 3.0; // Random interval 2.5 - 5.5s
        }

        if (this.isBlinking) {
          this.blinkProgress += delta * 7.5; // ~130ms blink cycle
          let blinkWeight = 0;
          if (this.blinkProgress <= 0.5) {
            blinkWeight = this.blinkProgress * 2.0; // Close
          } else if (this.blinkProgress <= 1.0) {
            blinkWeight = (1.0 - this.blinkProgress) * 2.0; // Open
          } else {
            this.isBlinking = false;
            blinkWeight = 0;
          }
          this.setExpression('blink', Math.max(0, Math.min(1, blinkWeight)));
        }
      }

      // 5. Procedural Lip-Sync Mouth Movement
      if (this.isSpeaking) {
        if (performance.now() > this.speechEndTime && this.speechEndTime > 0) {
          this.stopSpeaking();
        } else {
          // Dynamic conversational syllable cadence
          const fastVowel = Math.sin(elapsed * 16.0) * 0.35;
          const slowVowel = Math.sin(elapsed * 7.0) * 0.25;
          this.targetMouthOpen = Math.max(0.15, Math.min(0.85, 0.45 + fastVowel + slowVowel));
        }
      } else {
        this.targetMouthOpen = 0;
      }

      // Smooth mouth transition
      this.currentMouthOpen += (this.targetMouthOpen - this.currentMouthOpen) * 0.25;
      if (Math.abs(this.currentMouthOpen) < 0.01) this.currentMouthOpen = 0;
      this.setExpression('aa', this.currentMouthOpen);

      // Render scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    destroy() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }

      window.removeEventListener('resize', this._onResize);
      if (this.enableMouseTracking) {
        window.removeEventListener('mousemove', this._onMouseMove);
      }

      if (this.scene) {
        this.scene.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }

      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.forceContextLoss();
        this.renderer = null;
      }

      this.scene = null;
      this.camera = null;
      this.currentVrm = null;
    }
  }

  global.VRMAvatarController = VRMAvatarController;
})(typeof window !== 'undefined' ? window : this);
