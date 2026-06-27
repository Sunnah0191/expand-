import * as THREE from 'three';
import { gridMaterial } from '../world/Materials.js';

export class RaycastingGrid {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.gridSize = 10;
    this.gridDivisions = 10;

    // Create the visual grid helper
    this.gridHelper = new THREE.GridHelper(this.gridSize, this.gridDivisions, 0x00ffff, 0x00ffff);
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.5;
    this.gridHelper.visible = false; // Hidden by default
    this.scene.add(this.gridHelper);

    // Current intersection point for building
    this.currentPosition = new THREE.Vector3();

    this.initEvents();
  }

  initEvents() {
    this.domElement.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;

      // Calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.gridHelper.visible = enabled;
  }

  update() {
    if (!this.enabled) return;

    // Update the raycaster with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Intersect against all objects in the scene
    // (excluding the grid helper itself or specific UI overlays)
    // For simplicity, we just check all meshes that are not helpers
    const intersectableObjects = this.scene.children.filter(obj =>
      !(obj instanceof THREE.GridHelper) && obj.type === 'Group' || obj.type === 'Mesh' || obj.type === 'InstancedMesh'
    );

    const intersects = this.raycaster.intersectObjects(intersectableObjects, true);

    if (intersects.length > 0) {
      // Find the first intersection that is a solid object
      const hit = intersects[0];

      // Snap to grid (1 unit blocks)
      this.currentPosition.copy(hit.point);
      this.currentPosition.x = Math.floor(this.currentPosition.x) + 0.5;
      this.currentPosition.y = hit.point.y; // Keep surface Y
      this.currentPosition.z = Math.floor(this.currentPosition.z) + 0.5;

      // Move grid helper to hit point
      this.gridHelper.position.copy(this.currentPosition);
    }
  }

  getPosition() {
    return this.currentPosition.clone();
  }
}
