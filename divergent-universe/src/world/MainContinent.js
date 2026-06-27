import * as THREE from 'three';
import { whiteBuildingMaterial, glassFacadeMaterial } from './Materials.js';

export class MainContinent {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.init();
    this.scene.add(this.group);
  }

  init() {
    // Ground
    const groundGeo = new THREE.CylinderGeometry(50, 45, 10, 8);
    const ground = new THREE.Mesh(groundGeo, whiteBuildingMaterial);
    ground.position.y = -5;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Buildings
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);

    // Core Monolith
    const core = new THREE.Mesh(buildingGeo, glassFacadeMaterial);
    core.scale.set(10, 40, 10);
    core.position.y = 20;
    core.castShadow = true;
    core.receiveShadow = true;
    this.group.add(core);

    // Surrounding buildings
    for (let i = 0; i < 20; i++) {
      const b = new THREE.Mesh(buildingGeo, Math.random() > 0.5 ? whiteBuildingMaterial : glassFacadeMaterial);
      const w = 2 + Math.random() * 5;
      const h = 5 + Math.random() * 20;
      const d = 2 + Math.random() * 5;

      b.scale.set(w, h, d);

      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + Math.random() * 25;
      b.position.set(Math.cos(angle) * radius, h/2, Math.sin(angle) * radius);

      b.rotation.y = Math.random() * Math.PI;
      b.castShadow = true;
      b.receiveShadow = true;
      this.group.add(b);
    }
  }

  update(deltaTime) {
    // Main continent is static, or slowly rotates
    this.group.rotation.y += deltaTime * 0.05;
  }
}
