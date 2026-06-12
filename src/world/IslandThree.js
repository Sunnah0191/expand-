import * as THREE from 'three';

export class IslandThree {
  constructor() {
    this.group = new THREE.Group();
    this.isDivergent = true;
    this.id = 3;
    this.initialDistance = 600;
    this.initialPosition = new THREE.Vector3(-this.initialDistance, 0, 0); // West
    this.group.position.copy(this.initialPosition);

    this.buildTerraces();
    this.buildLiquid();
  }

  buildTerraces() {
    const geo = new THREE.CylinderGeometry(40, 60, 5, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x112233,
      roughness: 0.8,
    });

    // Stack terraces
    for (let i = 0; i < 4; i++) {
      const terraceGeo = new THREE.CylinderGeometry(40 - i*8, 50 - i*8, 5, 12);
      const terrace = new THREE.Mesh(terraceGeo, mat);
      terrace.position.y = i * 5;
      this.group.add(terrace);
    }
  }

  buildLiquid() {
    // Liquid neon waterfalls/pools
    const poolGeo = new THREE.CylinderGeometry(38, 38, 5.2, 12);
    this.liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.8,
      transmission: 0.9,
      roughness: 0.0,
      ior: 1.2,
      thickness: 2.0
    });

    // Top pool
    const topPool = new THREE.Mesh(poolGeo, this.liquidMat);
    topPool.position.y = 15;
    topPool.scale.set(16/38, 1, 16/38); // match top terrace
    this.group.add(topPool);

    // Waterfall strips
    const fallGeo = new THREE.PlaneGeometry(10, 20, 4, 4);
    const fall1 = new THREE.Mesh(fallGeo, this.liquidMat);
    fall1.position.set(20, 10, 0);
    fall1.rotation.y = Math.PI / 2;
    fall1.rotation.x = -Math.PI / 8;
    this.group.add(fall1);

    const fall2 = new THREE.Mesh(fallGeo, this.liquidMat);
    fall2.position.set(-20, 10, 0);
    fall2.rotation.y = -Math.PI / 2;
    fall2.rotation.x = -Math.PI / 8;
    this.group.add(fall2);
  }

  update(time, delta) {
    // Pulse liquid emissive intensity
    if (this.liquidMat) {
      this.liquidMat.emissiveIntensity = 0.6 + Math.sin(time * 3) * 0.4;
    }
  }
}
