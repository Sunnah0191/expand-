import * as THREE from 'three';
import { GlassPresets } from '../materials/GlassMaterial.js';

export class IslandTwo {
  constructor() {
    this.group = new THREE.Group();

    // Divergence math variables
    this.divergenceBaseRadius = 700; // Middle circle
    this.divergenceAngle = Math.PI / 2; // Starts 90 degrees offset

    this.buildIsland();
  }

  buildIsland() {
    // Monolithic rift - sharp, dark, geometric blocks
    const blockCount = 40;

    // Base geometry - sharp box
    const blockGeo = new THREE.BoxGeometry(20, 20, 20);
    const blockMat = GlassPresets.MonolithGlass();

    this.blocks = new THREE.InstancedMesh(blockGeo, blockMat, blockCount);
    this.blocks.castShadow = true;
    this.blocks.receiveShadow = true;

    this.blockData = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < blockCount; i++) {
      // Clustered together forming a rift
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 80;

      // Vertical stacking with gaps
      const y = (i * 5) - 50 + (Math.random() * 20);

      dummy.position.set(x, y, z);

      // Random subtle rotations
      dummy.rotation.x = (Math.random() - 0.5) * 0.2;
      dummy.rotation.y = (Math.random() - 0.5) * 0.2;
      dummy.rotation.z = (Math.random() - 0.5) * 0.2;

      const scaleX = 1 + Math.random() * 2;
      const scaleY = 0.5 + Math.random() * 1;
      const scaleZ = 1 + Math.random() * 2;
      dummy.scale.set(scaleX, scaleY, scaleZ);

      dummy.updateMatrix();
      this.blocks.setMatrixAt(i, dummy.matrix);

      this.blockData.push({
        baseY: y,
        speed: 0.2 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2
      });
    }

    this.group.add(this.blocks);

    // Neon light emitting from the "rift"
    const neonGeo = new THREE.PlaneGeometry(100, 100);
    // Rotate to face up
    neonGeo.rotateX(-Math.PI / 2);

    const neonMat = GlassPresets.NeonGlass(0x64c8ff);
    const neonMesh = new THREE.Mesh(neonGeo, neonMat);
    neonMesh.position.y = -20;
    this.group.add(neonMesh);

    // Add an actual point light for the rift glow
    const riftLight = new THREE.PointLight(0x64c8ff, 2.0, 300);
    riftLight.position.set(0, 0, 0);
    this.group.add(riftLight);
  }

  update(delta, totalTime) {
    // Slow levitation of the monolithic blocks
    if (this.blocks) {
      const dummy = new THREE.Object3D();

      for (let i = 0; i < this.blockData.length; i++) {
        this.blocks.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        const data = this.blockData[i];
        dummy.position.y = data.baseY + Math.sin(totalTime * data.speed + data.offset) * 5;

        dummy.updateMatrix();
        this.blocks.setMatrixAt(i, dummy.matrix);
      }
      this.blocks.instanceMatrix.needsUpdate = true;
    }
  }
}
