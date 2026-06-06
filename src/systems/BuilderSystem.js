import * as THREE from 'three';
import { GlassPresets } from '../materials/GlassMaterial.js';

export class BuilderSystem {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = false;
    this.selectedBlockId = 'block_glass';

    this.raycaster = new THREE.Raycaster();
    this.centerScreen = new THREE.Vector2(0, 0); // Always casting from center of screen (crosshair)

    this.buildGroup = new THREE.Group();
    this.scene.add(this.buildGroup);

    this.setupCursor();

    this.onMouseDown = this.onMouseDown.bind(this);
  }

  setupCursor() {
    // 3D placement cursor (Wireframe box)
    const cursorGeo = new THREE.BoxGeometry(10, 10, 10);
    const cursorMat = new THREE.MeshBasicMaterial({
      color: 0x64c8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    this.cursor = new THREE.Mesh(cursorGeo, cursorMat);
    this.cursor.visible = false;
    this.scene.add(this.cursor);

    // Crosshair UI (HTML)
    this.crosshair = document.createElement('div');
    Object.assign(this.crosshair.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '10px',
      height: '10px',
      border: '2px solid rgba(100, 200, 255, 0.8)',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '50'
    });
    document.body.appendChild(this.crosshair);
  }

  activate() {
    this.enabled = true;
    this.crosshair.style.display = 'block';
    this.domElement.addEventListener('mousedown', this.onMouseDown);
  }

  deactivate() {
    this.enabled = false;
    this.cursor.visible = false;
    this.crosshair.style.display = 'none';
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
  }

  selectItem(id) {
    this.selectedBlockId = id;
    // Update cursor shape based on selection if needed
    // For simplicity, keeping box cursor
  }

  onMouseDown(event) {
    if (!this.enabled || !this.cursor.visible) return;

    // Left click to build. Only build if pointer is locked (meaning catalog is closed)
    if (event.button === 0 && document.pointerLockElement === document.body) {
      this.placeBlock();
    }
  }

  placeBlock() {
    let geo, mat;

    switch (this.selectedBlockId) {
      case 'block_glass':
        geo = new THREE.BoxGeometry(10, 10, 10);
        mat = GlassPresets.BiomeGlass();
        break;
      case 'block_chrome':
        geo = new THREE.BoxGeometry(10, 10, 10);
        mat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 1.0, roughness: 0.1 });
        break;
      case 'block_neon':
        geo = new THREE.BoxGeometry(10, 10, 10);
        mat = GlassPresets.NeonGlass(0x00ffcc);
        break;
      case 'glass_tree':
        geo = new THREE.CylinderGeometry(0, 2, 15, 8);
        mat = GlassPresets.CoreGlass();
        break;
      case 'crystal':
        geo = new THREE.OctahedronGeometry(5, 0);
        mat = GlassPresets.BiomeGlass();
        break;
      case 'neon_monolith':
        geo = new THREE.BoxGeometry(8, 40, 8);
        mat = GlassPresets.MonolithGlass();
        break;
      case 'glass_bridge':
        geo = new THREE.BoxGeometry(30, 2, 10);
        mat = GlassPresets.CoreGlass();
        break;
      default:
        geo = new THREE.BoxGeometry(10, 10, 10);
        mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(this.cursor.position);

    // Align trees and monoliths slightly up based on geometry height
    if (this.selectedBlockId === 'glass_tree') mesh.position.y += 7.5;
    if (this.selectedBlockId === 'neon_monolith') mesh.position.y += 20;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.buildGroup.add(mesh);
  }

  update() {
    if (!this.enabled) return;

    // Cast ray from center of screen
    this.raycaster.setFromCamera(this.centerScreen, this.camera);

    // Intersect with scene objects (exclude cursor and built objects to avoid clipping self, or include built objects to stack)
    // For now, let's intersect with the whole scene but ignore the cursor
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    let validHit = null;
    for (const hit of intersects) {
      if (hit.object !== this.cursor) {
        validHit = hit;
        break;
      }
    }

    if (validHit && validHit.distance < 200) {
      this.cursor.visible = true;

      // Snap to grid (10 units)
      const snap = 10;
      const x = Math.round((validHit.point.x + validHit.face.normal.x * 5) / snap) * snap;
      const y = Math.round((validHit.point.y + validHit.face.normal.y * 5) / snap) * snap;
      const z = Math.round((validHit.point.z + validHit.face.normal.z * 5) / snap) * snap;

      this.cursor.position.set(x, y, z);

      // If we are looking at something to build on, light up cursor
      this.cursor.material.opacity = 0.8;
    } else {
      this.cursor.visible = false;
    }
  }
}
