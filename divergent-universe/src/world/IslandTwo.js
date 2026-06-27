import * as THREE from 'three';
import { monolithicMaterial, neonGlowMaterial } from './Materials.js';

export class IslandTwo {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Initial position
    this.baseX = 0;
    this.baseZ = 120;
    this.group.position.set(this.baseX, 0, this.baseZ);
    this.init();
    this.scene.add(this.group);
  }

  init() {
    // Monolithic Blocks
    const blockCount = 30;
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    this.blocksMesh = new THREE.InstancedMesh(boxGeo, monolithicMaterial, blockCount);
    this.blocksMesh.castShadow = true;
    this.blocksMesh.receiveShadow = true;

    this.neonMesh = new THREE.InstancedMesh(boxGeo, neonGlowMaterial, blockCount / 3);

    const dummy = new THREE.Object3D();
    let neonIndex = 0;

    for (let i = 0; i < blockCount; i++) {
      const w = 5 + Math.random() * 10;
      const h = 5 + Math.random() * 20;
      const d = 5 + Math.random() * 10;

      dummy.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 40
      );

      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      dummy.scale.set(w, h, d);
      dummy.updateMatrix();

      this.blocksMesh.setMatrixAt(i, dummy.matrix);

      if (i % 3 === 0) {
        dummy.scale.set(w * 0.8, h * 1.1, d * 0.8);
        dummy.updateMatrix();
        this.neonMesh.setMatrixAt(neonIndex++, dummy.matrix);
      }
    }

    this.group.add(this.blocksMesh);
    this.group.add(this.neonMesh);
  }

  setPosition(x, z) {
    this.group.position.x = x;
    this.group.position.z = z;
  }
}
