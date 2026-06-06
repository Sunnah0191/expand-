import * as THREE from 'three';
import { GlassPresets } from '../materials/GlassMaterial.js';

export class MainContinent {
  constructor() {
    this.group = new THREE.Group();

    // Position/Divergence Data
    // Main continent does not diverge, it's the center
    this.divergenceBaseRadius = 0;
    this.divergenceAngle = 0;

    this.buildContinent();
  }

  buildContinent() {
    // 1. Base platform (Monumental, clean)
    const baseGeo = new THREE.CylinderGeometry(200, 180, 20, 64);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -10;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // 2. Central Monolith / Megalopolis core
    const coreGeo = new THREE.BoxGeometry(40, 200, 40);
    const coreMat = GlassPresets.CoreGlass();
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 100;
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    this.group.add(coreMesh);

    // 3. Surrounding white mid-poly buildings
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.05
    });

    const buildingCount = 15;
    const instancedGeo = new THREE.BoxGeometry(1, 1, 1);
    this.buildings = new THREE.InstancedMesh(instancedGeo, buildingMat, buildingCount);
    this.buildings.castShadow = true;
    this.buildings.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < buildingCount; i++) {
      // Position in a ring around the core
      const angle = (i / buildingCount) * Math.PI * 2;
      const radius = 60 + Math.random() * 80;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Variable heights
      const width = 15 + Math.random() * 15;
      const depth = 15 + Math.random() * 15;
      const height = 40 + Math.random() * 100;

      dummy.position.set(x, height / 2, z);
      // Point towards center
      dummy.lookAt(0, height / 2, 0);
      dummy.scale.set(width, height, depth);
      dummy.updateMatrix();

      this.buildings.setMatrixAt(i, dummy.matrix);
    }

    this.group.add(this.buildings);

    // 4. Hovering glass platforms
    const platGeo = new THREE.CylinderGeometry(15, 15, 2, 32);
    const platMat = GlassPresets.BiomeGlass(); // slightly blueish clear glass

    for (let i = 0; i < 5; i++) {
      const plat = new THREE.Mesh(platGeo, platMat);
      plat.position.set(
        (Math.random() - 0.5) * 150,
        50 + Math.random() * 100,
        (Math.random() - 0.5) * 150
      );
      this.group.add(plat);
    }

    // Save reference for rotation update
    this.coreMesh = coreMesh;
  }

  update(delta, totalTime) {
    // Slow rotation of the core
    if (this.coreMesh) {
      this.coreMesh.rotation.y = totalTime * 0.1;
    }
  }
}
