import * as THREE from 'three';
import { glitchMaterial, abstractFractalMaterial } from './Materials.js';

export class IslandFour {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Initial position
    this.baseX = 0;
    this.baseZ = -200;
    this.group.position.set(this.baseX, 0, this.baseZ);
    this.init();
    this.scene.add(this.group);
  }

  init() {
    // Core abstract shape
    const coreGeo = new THREE.TorusKnotGeometry(15, 3, 100, 16);
    this.core = new THREE.Mesh(coreGeo, abstractFractalMaterial);
    this.group.add(this.core);

    // Glitchy shards
    const shardCount = 100;
    const shardGeo = new THREE.TetrahedronGeometry(2, 0);
    this.shardsMesh = new THREE.InstancedMesh(shardGeo, glitchMaterial, shardCount);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < shardCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.scale.setScalar(0.5 + Math.random() * 2);
      dummy.updateMatrix();
      this.shardsMesh.setMatrixAt(i, dummy.matrix);
    }

    this.group.add(this.shardsMesh);
  }

  setPosition(x, z) {
    this.group.position.x = x;
    this.group.position.z = z;
  }

  update(deltaTime) {
    this.core.rotation.x += deltaTime * 0.1;
    this.core.rotation.y += deltaTime * 0.2;
    // Glitch effect on shards could be updated here if we kept references, but static rotation for now
  }
}
