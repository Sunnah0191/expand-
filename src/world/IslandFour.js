import * as THREE from 'three';

export class IslandFour {
  constructor() {
    this.group = new THREE.Group();
    this.isDivergent = true;
    this.id = 4;
    this.initialDistance = 800;
    this.initialPosition = new THREE.Vector3(0, 0, this.initialDistance); // South
    this.group.position.copy(this.initialPosition);

    this.fractals = [];
    this.buildFractals();
  }

  buildFractals() {
    const geo = new THREE.OctahedronGeometry(10, 1); // Mid-poly structure

    // Wireframe / glitchy material
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    const solidMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.2,
    });

    for (let i = 0; i < 50; i++) {
      const isWire = Math.random() > 0.5;
      const mesh = new THREE.Mesh(geo, isWire ? mat : solidMat);

      const dist = Math.random() * 80;
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI * 2;

      mesh.position.set(
        Math.sin(angle1) * Math.cos(angle2) * dist,
        Math.sin(angle1) * Math.sin(angle2) * dist,
        Math.cos(angle1) * dist
      );

      mesh.scale.setScalar(Math.random() * 1.5 + 0.5);

      this.group.add(mesh);
      this.fractals.push({
        mesh: mesh,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        speedZ: (Math.random() - 0.5) * 2,
        isWire: isWire
      });
    }
  }

  update(time, delta) {
    // Abstract floating and glitching
    for (const frac of this.fractals) {
      frac.mesh.rotation.x += frac.speedX * delta;
      frac.mesh.rotation.y += frac.speedY * delta;
      frac.mesh.rotation.z += frac.speedZ * delta;

      // Glitch effect: random scale snapping for wireframes
      if (frac.isWire && Math.random() < 0.05) {
        const s = Math.random() * 2 + 0.5;
        frac.mesh.scale.setScalar(s);
        frac.mesh.material.opacity = Math.random() * 0.8 + 0.2;
      }
    }
  }
}
