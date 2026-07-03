import * as THREE from 'three';

// 🏝️ 2. Первый остров: «Стеклянный биом» (Ближний круг)
// Природа, застывшая в стекле. Деревья и кристаллы выполнены с высокой прозрачностью.

export function createIslandOne() {
  const group = new THREE.Group();

  // Base
  const baseGeo = new THREE.DodecahedronGeometry(50, 1);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    roughness: 0.6,
    flatShading: true
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.scale.y = 0.3;
  group.add(base);

  // Glass material for Frutiger Aero aesthetic
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xccffff,
    transmission: 0.95,
    opacity: 1,
    metalness: 0.2,
    roughness: 0.05,
    ior: 1.3,
    thickness: 2.0,
  });

  // Trees/Crystals (InstancedMesh)
  const treeGeo = new THREE.ConeGeometry(5, 20, 6);
  const numTrees = 80;
  const trees = new THREE.InstancedMesh(treeGeo, glassMat, numTrees);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < numTrees; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 40;
    dummy.position.set(Math.cos(angle)*radius, 10, Math.sin(angle)*radius);
    dummy.rotation.x = (Math.random() - 0.5) * 0.2;
    dummy.rotation.z = (Math.random() - 0.5) * 0.2;
    dummy.updateMatrix();
    trees.setMatrixAt(i, dummy.matrix);
  }
  group.add(trees);

  return group;
}
