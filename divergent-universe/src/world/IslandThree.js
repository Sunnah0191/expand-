import * as THREE from 'three';
import { oasisGroundMaterial, liquidNeonMaterial } from './Materials.js';

export class IslandThree {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Initial position
    this.baseX = -160;
    this.baseZ = 0;
    this.group.position.set(this.baseX, 0, this.baseZ);
    this.init();
    this.scene.add(this.group);
  }

  init() {
    // Oasis ground
    const groundGeo = new THREE.CylinderGeometry(30, 20, 15, 12);
    const ground = new THREE.Mesh(groundGeo, oasisGroundMaterial);
    ground.position.y = -7.5;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Liquid Neon Waterfalls
    const waterfallGeo = new THREE.CylinderGeometry(5, 5, 40, 8);
    const waterfall1 = new THREE.Mesh(waterfallGeo, liquidNeonMaterial);
    waterfall1.position.set(15, 10, 0);
    this.group.add(waterfall1);

    const waterfall2 = new THREE.Mesh(waterfallGeo, liquidNeonMaterial);
    waterfall2.position.set(-10, 5, 15);
    this.group.add(waterfall2);

    // Pool
    const poolGeo = new THREE.CylinderGeometry(15, 15, 1, 16);
    const pool = new THREE.Mesh(poolGeo, liquidNeonMaterial);
    pool.position.set(0, 0, 0);
    this.group.add(pool);
  }

  setPosition(x, z) {
    this.group.position.x = x;
    this.group.position.z = z;
  }
}
