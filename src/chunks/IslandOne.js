import * as THREE from 'three';
import { GlassPresets } from '../materials/GlassMaterial.js';

export class IslandOne {
  constructor() {
    this.group = new THREE.Group();

    // Divergence math variables
    this.divergenceBaseRadius = 350; // Inner circle
    this.divergenceAngle = 0; // Starts at 0 rad

    this.buildIsland();
  }

  buildIsland() {
    // 1. Base (Rounded mid-poly hills)
    const baseGeo = new THREE.SphereGeometry(60, 16, 16);
    // Flatten it into a disc/hill
    baseGeo.scale(1, 0.3, 1);

    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x81ecec,
      roughness: 0.6,
      metalness: 0.1
    });

    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -10;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // 2. Glass trees & Crystals (InstancedMesh)
    const crystalCount = 50;
    const crystalGeo = new THREE.CylinderGeometry(0, 3, 20, 6);
    const crystalMat = GlassPresets.BiomeGlass();

    this.crystals = new THREE.InstancedMesh(crystalGeo, crystalMat, crystalCount);
    this.crystals.castShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < crystalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 50;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const y = (Math.random() * 5) + 10; // offset based on height of crystal

      dummy.position.set(x, y, z);
      // Random tilt
      dummy.rotation.x = (Math.random() - 0.5) * 0.4;
      dummy.rotation.z = (Math.random() - 0.5) * 0.4;

      const scale = 0.5 + Math.random() * 1.5;
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      this.crystals.setMatrixAt(i, dummy.matrix);
    }

    this.group.add(this.crystals);

    // 3. Floating glass boulders
    const boulderCount = 15;
    const boulderGeo = new THREE.DodecahedronGeometry(5, 0);
    this.boulders = new THREE.InstancedMesh(boulderGeo, crystalMat, boulderCount);

    this.boulderData = [];

    for (let i = 0; i < boulderCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 40;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = 20 + Math.random() * 30;

      dummy.position.set(x, y, z);
      const scale = 0.5 + Math.random() * 1.0;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      this.boulders.setMatrixAt(i, dummy.matrix);

      // Store data for animation
      this.boulderData.push({
        baseY: y,
        speed: 1 + Math.random() * 2,
        offset: Math.random() * Math.PI * 2
      });
    }

    this.group.add(this.boulders);
  }

  update(delta, totalTime) {
    // Animate boulders bobbing
    if (this.boulders) {
      const dummy = new THREE.Object3D();

      for (let i = 0; i < this.boulderData.length; i++) {
        this.boulders.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        const data = this.boulderData[i];
        dummy.position.y = data.baseY + Math.sin(totalTime * data.speed + data.offset) * 3;
        dummy.rotation.y += delta * 0.5;
        dummy.rotation.x += delta * 0.2;

        dummy.updateMatrix();
        this.boulders.setMatrixAt(i, dummy.matrix);
      }
      this.boulders.instanceMatrix.needsUpdate = true;
    }
  }
}
