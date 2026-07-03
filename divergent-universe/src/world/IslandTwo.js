import * as THREE from 'three';

// 🪨 3. Второй остров: «Монолитный разлом» (Средний круг)
// Гигантские геометрические блоки и плит, которые левитируют друг над другом. Неоновый свет.

export function createIslandTwo() {
  const group = new THREE.Group();

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.2,
    flatShading: true
  });

  const neonMat = new THREE.MeshStandardMaterial({
    color: 0xff0055,
    emissive: 0xff0055,
    emissiveIntensity: 2
  });

  // Levitating blocks
  const blockGeo = new THREE.BoxGeometry(1,1,1);
  const blocks = new THREE.InstancedMesh(blockGeo, darkMat, 60);
  const neonBlocks = new THREE.InstancedMesh(blockGeo, neonMat, 15);

  const dummy = new THREE.Object3D();

  for (let i = 0; i < 60; i++) {
    dummy.position.set((Math.random() - 0.5)*100, (Math.random() - 0.5)*60, (Math.random() - 0.5)*100);
    dummy.scale.set(10+Math.random()*20, 5+Math.random()*15, 10+Math.random()*20);
    dummy.rotation.set(Math.random()*0.2, Math.random()*Math.PI, Math.random()*0.2);
    dummy.updateMatrix();
    blocks.setMatrixAt(i, dummy.matrix);
  }

  for (let i = 0; i < 15; i++) {
    dummy.position.set((Math.random() - 0.5)*80, (Math.random() - 0.5)*40, (Math.random() - 0.5)*80);
    dummy.scale.set(2, 20+Math.random()*30, 2);
    dummy.updateMatrix();
    neonBlocks.setMatrixAt(i, dummy.matrix);
  }

  group.add(blocks);
  group.add(neonBlocks);

  // Very slow rotation
  group.userData.update = (delta) => {
    group.rotation.y += delta * 0.05;
  };

  return group;
}
