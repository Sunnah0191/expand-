import * as THREE from 'three';

// 🏢 1. Центральный континент: «Ядро Системы»
// Монументальный футуристичный мегаполис в минималистичном стиле.
// Белоснежные mid-poly здания со стеклянными фасадами.

export function createMainContinent() {
  const group = new THREE.Group();

  // Base platform
  const baseGeo = new THREE.CylinderGeometry(100, 120, 20, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.1
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -10;
  group.add(base);

  // Materials
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.9,
    opacity: 1,
    metalness: 0,
    roughness: 0.1,
    ior: 1.5,
    thickness: 5,
  });

  // Buildings (InstancedMesh for optimization)
  const bldgGeo = new THREE.BoxGeometry(1, 1, 1);
  const numBuildings = 50;
  const buildings = new THREE.InstancedMesh(bldgGeo, buildingMat, numBuildings);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < numBuildings; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 80;
    const h = 10 + Math.random() * 80;
    const w = 5 + Math.random() * 15;
    const d = 5 + Math.random() * 15;

    dummy.position.set(Math.cos(angle)*radius, h/2, Math.sin(angle)*radius);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    buildings.setMatrixAt(i, dummy.matrix);
  }
  group.add(buildings);

  // Floating platforms
  const platGeo = new THREE.BoxGeometry(20, 1, 20);
  const platforms = new THREE.InstancedMesh(platGeo, glassMat, 10);
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 90;
    dummy.position.set(Math.cos(angle)*radius, 20 + Math.random()*60, Math.sin(angle)*radius);
    dummy.scale.set(1,1,1);
    dummy.updateMatrix();
    platforms.setMatrixAt(i, dummy.matrix);
  }
  group.add(platforms);

  return group;
}
