import * as THREE from 'three';

// 🌪️ 5. Четвертый остров: «Разошедшийся предел» (Грань вселенной)
// Текстуры начинают слегка «глючить», геометрия разделяется на парящие фракталы.

export function createIslandFour() {
  const group = new THREE.Group();

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });

  const glitchMat = new THREE.MeshStandardMaterial({
    color: 0x220044,
    roughness: 0.3
  });

  // Base abstract shape
  const baseGeo = new THREE.IcosahedronGeometry(30, 1);
  const base = new THREE.Mesh(baseGeo, glitchMat);
  const baseWire = new THREE.Mesh(baseGeo, wireMat);
  baseWire.scale.setScalar(1.02);

  group.add(base);
  group.add(baseWire);

  // Floating fractals
  const fracGeo = new THREE.OctahedronGeometry(5, 0);
  const fractals = new THREE.InstancedMesh(fracGeo, glitchMat, 100);
  const fractalsWire = new THREE.InstancedMesh(fracGeo, wireMat, 100);

  const dummy = new THREE.Object3D();
  const positions = [];

  for (let i = 0; i < 100; i++) {
    const p = new THREE.Vector3(
      (Math.random() - 0.5) * 150,
      (Math.random() - 0.5) * 150,
      (Math.random() - 0.5) * 150
    );
    positions.push(p);

    dummy.position.copy(p);
    dummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
    dummy.updateMatrix();
    fractals.setMatrixAt(i, dummy.matrix);
    fractalsWire.setMatrixAt(i, dummy.matrix);
  }

  group.add(fractals);
  group.add(fractalsWire);

  // Glitch animation effect
  let time = 0;
  group.userData.update = (delta) => {
    time += delta;

    // Rotate entire structure slowly
    group.rotation.x += delta * 0.1;
    group.rotation.y += delta * 0.15;

    // Occasionally "glitch" scale
    if (Math.random() > 0.98) {
      base.scale.setScalar(0.9 + Math.random() * 0.3);
      setTimeout(() => base.scale.setScalar(1), 50);
    }
  };

  return group;
}
