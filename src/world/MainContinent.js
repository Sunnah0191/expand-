import * as THREE from 'three';

export class MainContinent {
  constructor() {
    this.group = new THREE.Group();
    this.isDivergent = false; // Core system, doesn't diverge
    this.id = 0;

    this.buildMainPlatform();
    this.buildCity();
  }

  buildMainPlatform() {
    const geo = new THREE.CylinderGeometry(150, 120, 20, 8); // Octagonal base
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
    });
    const platform = new THREE.Mesh(geo, mat);
    platform.position.y = -10;
    platform.receiveShadow = true;
    this.group.add(platform);
  }

  buildCity() {
    const count = 300;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.5, // slightly glass-like facets
      thickness: 1.5,
    });

    this.cityInstanced = new THREE.InstancedMesh(geometry, material, count);
    this.cityInstanced.castShadow = true;
    this.cityInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Polar coordinates for placement
      const radius = Math.random() * 130;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Taller buildings near center
      const height = (Math.random() * 20 + 10) * (1 - (radius / 150));
      const width = Math.random() * 5 + 2;
      const depth = Math.random() * 5 + 2;

      dummy.position.set(x, height / 2, z);
      dummy.scale.set(width, height, depth);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();

      this.cityInstanced.setMatrixAt(i, dummy.matrix);
    }

    this.group.add(this.cityInstanced);

    // Add a core floating monolith
    const coreGeo = new THREE.OctahedronGeometry(15, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 2.0
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.coreMesh.position.y = 60;
    this.group.add(this.coreMesh);
  }

  update(time, delta) {
    if (this.coreMesh) {
      this.coreMesh.rotation.y += 0.01;
      this.coreMesh.position.y = 60 + Math.sin(time * 2) * 2;
    }
  }
}
