import * as THREE from 'three';
import { Chunk } from './Chunk.js';

export class IslandOne extends Chunk {
  constructor(scene) {
    // Glass Biome, diverges along X
    super(scene, 'IslandOne', new THREE.Vector3(300, -20, 0), new THREE.Vector3(1, 0, 0));
  }

  generate() {
    // Base platform
    const platformGeom = new THREE.CylinderGeometry(80, 80, 10, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      roughness: 0.5,
      metalness: 0.1,
    });
    const platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.y = -5;
    platform.receiveShadow = true;
    this.group.add(platform);

    // Glass objects
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xaaffff,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 1.5,
      transparent: true,
    });

    for(let i=0; i<15; i++) {
      const geom = new THREE.ConeGeometry(5 + Math.random()*5, 20 + Math.random()*30, 5);
      const mesh = new THREE.Mesh(geom, glassMat);

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 60;
      mesh.position.set(Math.cos(angle)*radius, 10, Math.sin(angle)*radius);
      mesh.rotation.y = Math.random() * Math.PI;
      this.group.add(mesh);
    }
  }
}
