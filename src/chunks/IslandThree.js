import * as THREE from 'three';
import { GlassPresets } from '../materials/GlassMaterial.js';

export class IslandThree {
  constructor() {
    this.group = new THREE.Group();

    // Divergence math variables
    this.divergenceBaseRadius = 1200; // Outer circle
    this.divergenceAngle = Math.PI; // Starts 180 degrees offset

    this.buildIsland();
  }

  buildIsland() {
    // Liquid neon oasis - smooth curves, flowing glowing water

    // 1. Terraced base
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2
    });

    const t1Geo = new THREE.CylinderGeometry(80, 70, 20, 32);
    const t1 = new THREE.Mesh(t1Geo, baseMat);
    t1.position.y = -10;
    this.group.add(t1);

    const t2Geo = new THREE.CylinderGeometry(50, 45, 20, 32);
    const t2 = new THREE.Mesh(t2Geo, baseMat);
    t2.position.set(10, 10, -10);
    this.group.add(t2);

    const t3Geo = new THREE.CylinderGeometry(20, 18, 20, 32);
    const t3 = new THREE.Mesh(t3Geo, baseMat);
    t3.position.set(20, 30, -20);
    this.group.add(t3);

    // 2. Neon Liquid surfaces
    // Use a custom material or animated map for liquid effect
    // For now, we'll use a highly emissive glowing neon material and animate UVs or vertices
    this.liquidMat = GlassPresets.NeonGlass(0x00ffcc);

    const l1Geo = new THREE.CylinderGeometry(40, 40, 2, 32);
    this.l1 = new THREE.Mesh(l1Geo, this.liquidMat);
    this.l1.position.set(10, 21, -10);
    this.group.add(this.l1);

    const l2Geo = new THREE.CylinderGeometry(15, 15, 2, 32);
    this.l2 = new THREE.Mesh(l2Geo, this.liquidMat);
    this.l2.position.set(20, 41, -20);
    this.group.add(this.l2);

    // 3. Waterfalls (flowing cylinders)
    const fallGeo = new THREE.CylinderGeometry(4, 4, 30, 16);
    this.fall = new THREE.Mesh(fallGeo, this.liquidMat);
    this.fall.position.set(15, 25, 20);
    // Angle the fall slightly
    this.fall.rotation.x = Math.PI / 12;
    this.group.add(this.fall);

    // 4. Glow light
    const glowLight = new THREE.PointLight(0x00ffcc, 1.5, 200);
    glowLight.position.set(10, 30, -10);
    this.group.add(glowLight);
  }

  update(delta, totalTime) {
    // Animate the liquid (scaling slightly to simulate movement/ripples)
    if (this.l1) {
      const scaleBase = 1.0;
      const pulse = Math.sin(totalTime * 2) * 0.02;
      this.l1.scale.set(scaleBase + pulse, 1, scaleBase + pulse);
      this.l2.scale.set(scaleBase - pulse, 1, scaleBase - pulse);

      // Rotate the waterfall cylinder rapidly to simulate flow (if it had a texture)
      this.fall.rotation.y -= delta * 5;
    }
  }
}
