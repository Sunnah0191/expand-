import * as THREE from 'three';
import { Chunk } from './Chunk.js';

export class IslandFour extends Chunk {
  constructor(scene) {
    // Diverged Limit, diverges along -Z
    super(scene, 'IslandFour', new THREE.Vector3(0, 0, -300), new THREE.Vector3(0, 0, -1));
  }

  generate() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      wireframe: true, // glitchy abstract feel
      emissive: 0x550055,
    });

    const geom = new THREE.IcosahedronGeometry(40, 1);
    const core = new THREE.Mesh(geom, mat);
    this.group.add(core);

    // Fractal bits
    for(let i=0; i<50; i++) {
      const bitGeom = new THREE.IcosahedronGeometry(Math.random() * 10, 0);
      const bit = new THREE.Mesh(bitGeom, mat);

      const angle = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 50;

      bit.position.set(
        Math.cos(angle) * Math.sin(angle2) * radius,
        Math.sin(angle) * Math.sin(angle2) * radius,
        Math.cos(angle2) * radius
      );
      this.group.add(bit);
    }
  }
}
