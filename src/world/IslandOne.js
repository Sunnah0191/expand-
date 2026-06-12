import * as THREE from 'three';

export class IslandOne {
  constructor() {
    this.group = new THREE.Group();
    this.isDivergent = true;
    this.id = 1;
    this.initialDistance = 250;
    this.initialPosition = new THREE.Vector3(this.initialDistance, 0, 0); // East
    this.group.position.copy(this.initialPosition);

    this.buildTerrain();
    this.buildFlora();
  }

  buildTerrain() {
    // Rounded mid-poly hills
    const geo = new THREE.IcosahedronGeometry(60, 2);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccaa,
      transmission: 0.8,
      opacity: 1,
      metalness: 0,
      roughness: 0.1,
      ior: 1.5,
      thickness: 5.0,
      specularIntensity: 1.0,
    });

    const terrain = new THREE.Mesh(geo, mat);
    // Flatten it
    terrain.scale.set(1, 0.3, 1);
    terrain.position.y = -10;
    this.group.add(terrain);
  }

  buildFlora() {
    // Instanced glass trees
    const count = 100;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.5, 1, 10, 5);
    const trunkMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.2,
      thickness: 1.0,
    });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);

    // Leaves (Crystals)
    const leafGeo = new THREE.DodecahedronGeometry(4, 0);
    const leafMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ffaa,
      emissive: 0x00ffaa,
      emissiveIntensity: 0.2,
      transmission: 0.9,
      roughness: 0.1,
      thickness: 2.0,
    });
    const leaves = new THREE.InstancedMesh(leafGeo, leafMat, count);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 50;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const height = Math.random() * 5 + 5;

      // Trunk
      dummy.position.set(x, height / 2, z);
      dummy.scale.set(1, height / 10, 1);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);

      // Leaf
      dummy.position.set(x, height, z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
    }

    this.group.add(trunks);
    this.group.add(leaves);
  }
}
