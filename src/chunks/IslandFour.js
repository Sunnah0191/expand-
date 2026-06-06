import * as THREE from 'three';

export class IslandFour {
  constructor() {
    this.group = new THREE.Group();

    // Divergence math variables
    this.divergenceBaseRadius = 1800; // Edge circle
    this.divergenceAngle = Math.PI * 1.5; // Starts 270 degrees offset

    this.buildIsland();
  }

  buildIsland() {
    // Diverged Limit - abstract, slightly glitching, edge of code

    // Abstract wireframe core
    const coreGeo = new THREE.IcosahedronGeometry(60, 1);

    // Glitch effect material (using standard materials with wireframe and colors)
    this.coreMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.group.add(this.coreMesh);

    // Floating polygonal fragments
    const fragCount = 80;
    const fragGeo = new THREE.TetrahedronGeometry(10);

    // We will use a custom shader or a noisy material for fragments.
    // For simplicity, alternating basic colors
    const mat1 = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    const mat2 = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });

    this.fragments = new THREE.Group();
    this.fragData = [];

    for (let i = 0; i < fragCount; i++) {
      const mesh = new THREE.Mesh(fragGeo, i % 2 === 0 ? mat1 : mat2);

      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;

      mesh.position.set(x, y, z);

      // Random rotations
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const scale = 0.2 + Math.random() * 1.5;
      mesh.scale.set(scale, scale, scale);

      this.fragments.add(mesh);

      this.fragData.push({
        mesh: mesh,
        baseX: x, baseY: y, baseZ: z,
        speed: Math.random() * 2,
        glitchTimer: 0,
        glitchThreshold: 2 + Math.random() * 5
      });
    }

    this.group.add(this.fragments);
  }

  update(delta, totalTime) {
    // Rotate core
    if (this.coreMesh) {
      this.coreMesh.rotation.y += delta * 0.2;
      this.coreMesh.rotation.z += delta * 0.1;

      // Slight color glitch
      if (Math.random() > 0.95) {
        this.coreMat.color.setHex(Math.random() > 0.5 ? 0xff00ff : 0x00ffff);
      }
    }

    // Update fragments (orbit and glitch)
    for (let i = 0; i < this.fragData.length; i++) {
      const data = this.fragData[i];
      const mesh = data.mesh;

      // Orbiting around center
      mesh.position.x = data.baseX * Math.cos(totalTime * data.speed * 0.1) - data.baseZ * Math.sin(totalTime * data.speed * 0.1);
      mesh.position.z = data.baseZ * Math.cos(totalTime * data.speed * 0.1) + data.baseX * Math.sin(totalTime * data.speed * 0.1);

      mesh.rotation.x += delta * data.speed;
      mesh.rotation.y += delta * data.speed * 0.5;

      // Glitch effect (sudden small teleportation)
      data.glitchTimer += delta;
      if (data.glitchTimer > data.glitchThreshold) {
        data.glitchTimer = 0;
        mesh.position.x += (Math.random() - 0.5) * 10;
        mesh.position.y += (Math.random() - 0.5) * 10;
        mesh.position.z += (Math.random() - 0.5) * 10;
      }
    }
  }
}
