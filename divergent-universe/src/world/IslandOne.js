import * as THREE from 'three';
import { glassTreeMaterial, glassGroundMaterial } from './Materials.js';

export class IslandOne {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Initial position
    this.baseX = 80;
    this.baseZ = 0;
    this.group.position.set(this.baseX, 0, this.baseZ);
    this.init();
    this.scene.add(this.group);
  }

  init() {
    // Glass ground
    const groundGeo = new THREE.DodecahedronGeometry(20, 1);
    const ground = new THREE.Mesh(groundGeo, glassGroundMaterial);
    ground.position.y = -10;
    ground.scale.y = 0.5;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Instanced Trees
    const treeCount = 50;
    const trunkGeo = new THREE.CylinderGeometry(0.5, 1, 5, 5);
    const leavesGeo = new THREE.IcosahedronGeometry(3, 0);

    // Combine geometry for simplicity in instancing (or use separate)
    const treeGeo = new THREE.BufferGeometry(); // Just use leaves for simple instancing to save code

    this.treeMesh = new THREE.InstancedMesh(leavesGeo, glassTreeMaterial, treeCount);
    this.treeMesh.castShadow = true;
    this.treeMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 15;
      dummy.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      // Raycast down to find surface (simplified: just offset y)
      dummy.position.y = 2 + Math.random() * 3;

      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.setScalar(0.5 + Math.random() * 1);

      dummy.updateMatrix();
      this.treeMesh.setMatrixAt(i, dummy.matrix);
    }

    this.group.add(this.treeMesh);
  }

  setPosition(x, z) {
    this.group.position.x = x;
    this.group.position.z = z;
  }
}
