import * as THREE from 'three';

export class IslandTwo {
  constructor() {
    this.group = new THREE.Group();
    this.isDivergent = true;
    this.id = 2;
    this.initialDistance = 400;
    this.initialPosition = new THREE.Vector3(0, 0, -this.initialDistance); // North
    this.group.position.copy(this.initialPosition);

    this.blocks = [];
    this.buildMonoliths();
  }

  buildMonoliths() {
    const count = 40;
    const geo = new THREE.BoxGeometry(1, 1, 1);

    // Dark monolithic material
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1a24,
      roughness: 0.7,
      metalness: 0.2,
    });

    // Neon crack/accent material
    const neonMat = new THREE.MeshBasicMaterial({
      color: 0xaa00ff, // Purple neon
    });

    const instancedBlocks = new THREE.InstancedMesh(geo, mat, count);
    const instancedNeon = new THREE.InstancedMesh(geo, neonMat, count);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;

      const width = Math.random() * 20 + 10;
      const height = Math.random() * 80 + 20;
      const depth = Math.random() * 20 + 10;

      const y = (Math.random() - 0.5) * 40; // Some floating below/above

      dummy.position.set(x, y, z);
      dummy.scale.set(width, height, depth);
      // Angular rotations
      dummy.rotation.set(
        Math.random() > 0.5 ? 0 : Math.PI / 4,
        Math.random() * Math.PI,
        Math.random() > 0.5 ? 0 : Math.PI / 8
      );
      dummy.updateMatrix();
      instancedBlocks.setMatrixAt(i, dummy.matrix);

      // Save for animation
      this.blocks.push({
        index: i,
        baseY: y,
        speed: Math.random() * 0.5 + 0.1,
        offset: Math.random() * Math.PI * 2,
        matrix: dummy.matrix.clone(),
        dummy: dummy.clone()
      });

      // Add thin neon accents slightly smaller and offset
      if (Math.random() > 0.5) {
        dummy.scale.set(width + 0.5, height * 0.1, depth + 0.5);
        dummy.updateMatrix();
        instancedNeon.setMatrixAt(i, dummy.matrix);
      } else {
        instancedNeon.setMatrixAt(i, new THREE.Matrix4().set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)); // Hide
      }
    }

    this.instancedBlocks = instancedBlocks;
    this.group.add(instancedBlocks);
    this.group.add(instancedNeon);
  }

  update(time, delta) {
    // Slowly levitate blocks
    for (const block of this.blocks) {
      block.dummy.position.y = block.baseY + Math.sin(time * block.speed + block.offset) * 5;
      block.dummy.updateMatrix();
      this.instancedBlocks.setMatrixAt(block.index, block.dummy.matrix);
    }
    this.instancedBlocks.instanceMatrix.needsUpdate = true;
  }
}
