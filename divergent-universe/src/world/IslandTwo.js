import * as THREE from 'three';
import { Chunk } from './Chunk.js';

export class IslandTwo extends Chunk {
  constructor(scene) {
    // Monolithic Rift, diverges along Z
    super(scene, 'IslandTwo', new THREE.Vector3(0, -40, 300), new THREE.Vector3(0, 0, 1));
  }

  generate() {
    // Base is made of floating cubes
    const mat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.2,
    });
    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 2
    });

    for(let i=0; i<30; i++) {
      const size = 10 + Math.random()*30;
      const geom = new THREE.BoxGeometry(size, size, size);
      const mesh = new THREE.Mesh(geom, Math.random() > 0.9 ? neonMat : mat);

      mesh.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 150
      );

      mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }
}
