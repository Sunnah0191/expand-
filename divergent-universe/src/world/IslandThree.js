import * as THREE from 'three';

// 🌊 4. Третий остров: «Жидкий неон» (Дальний круг)
// Оазис, где суша переплетается с водопадами из светящейся цифровой жидкости. Плавные формы.

export function createIslandThree() {
  const group = new THREE.Group();

  // Terrain (Terraces)
  const terrMat = new THREE.MeshStandardMaterial({
    color: 0x001122,
    roughness: 0.8,
    flatShading: true
  });

  for(let i=0; i<4; i++) {
    const geo = new THREE.CylinderGeometry(40 - i*8, 45 - i*8, 10, 12);
    const mesh = new THREE.Mesh(geo, terrMat);
    mesh.position.y = i * 10;
    // slightly offset
    mesh.position.x = (Math.random() - 0.5) * 10;
    mesh.position.z = (Math.random() - 0.5) * 10;
    group.add(mesh);
  }

  // Waterfalls (Animated textures or simple moving UVs could be used, keeping it simple here)
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x00ffcc,
    emissive: 0x003322,
    transmission: 0.8,
    roughness: 0.1,
    transparent: true,
    opacity: 0.8
  });

  const waterGeo = new THREE.BoxGeometry(10, 40, 2);
  const waterfall = new THREE.Mesh(waterGeo, waterMat);
  waterfall.position.set(20, 15, 0);
  group.add(waterfall);

  const waterfall2 = new THREE.Mesh(waterGeo, waterMat);
  waterfall2.position.set(-15, 15, 20);
  waterfall2.rotation.y = Math.PI / 2;
  group.add(waterfall2);

  // Animate liquid (fake it via slight scale pulsing)
  let time = 0;
  group.userData.update = (delta) => {
    time += delta;
    waterfall.scale.z = 1 + Math.sin(time * 5) * 0.1;
    waterfall2.scale.z = 1 + Math.cos(time * 5) * 0.1;
  };

  return group;
}
