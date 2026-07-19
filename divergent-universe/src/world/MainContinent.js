import * as THREE from 'three';
import { Chunk } from './Chunk.js';

export class MainContinent extends Chunk {
  constructor(scene) {
    // Motherland is at center (0,0,0) and doesn't diverge (0 vector)
    super(scene, 'MainContinent', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
  }

  generate() {
    // Base platform
    const platformGeom = new THREE.CylinderGeometry(150, 150, 20, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.1,
    });
    const platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.y = -10;
    platform.receiveShadow = true;
    this.group.add(platform);

    // Some simple mid-poly white metropolis buildings
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.3,
      metalness: 0.1
    });

    for(let i=0; i<20; i++) {
      const height = 20 + Math.random() * 80;
      const geom = new THREE.BoxGeometry(10 + Math.random()*15, height, 10 + Math.random()*15);
      const mesh = new THREE.Mesh(geom, buildingMat);

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 120;
      mesh.position.set(Math.cos(angle)*radius, height/2, Math.sin(angle)*radius);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  update(dt, speed, time) {
    // Main continent does not diverge, but we might add some idle animations here
  }
}
