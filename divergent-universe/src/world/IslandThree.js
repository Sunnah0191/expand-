import * as THREE from 'three';
import { Chunk } from './Chunk.js';

export class IslandThree extends Chunk {
  constructor(scene) {
    // Liquid Neon, diverges along -X
    super(scene, 'IslandThree', new THREE.Vector3(-300, -10, 0), new THREE.Vector3(-1, 0, 0));
  }

  generate() {
    const platformGeom = new THREE.TorusGeometry(60, 20, 16, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.7,
      metalness: 0.3,
    });
    const platform = new THREE.Mesh(platformGeom, platformMat);
    platform.rotation.x = Math.PI / 2;
    platform.receiveShadow = true;
    this.group.add(platform);

    const waterGeom = new THREE.CylinderGeometry(55, 55, 5, 32);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x00aaff,
      emissive: 0x0055ff,
      emissiveIntensity: 0.5,
      transmission: 0.9,
      opacity: 0.8,
      transparent: true,
      roughness: 0.1,
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    this.group.add(water);
  }
}
