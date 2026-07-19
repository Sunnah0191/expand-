import * as THREE from 'three';

export class Builder {
  constructor(scene) {
    this.scene = scene;

    // Materials mapping based on catalog data-type
    this.materials = {
      'glass_block': new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transmission: 0.9, opacity: 1, metalness: 0, roughness: 0.1, thickness: 2
      }),
      'chrome_block': new THREE.MeshStandardMaterial({
        color: 0xcccccc, metalness: 1, roughness: 0.1
      }),
      'neon_block': new THREE.MeshStandardMaterial({
        color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 1
      }),
      'metal_block': new THREE.MeshStandardMaterial({
        color: 0x333333, metalness: 0.5, roughness: 0.8
      }),
      'rock': new THREE.MeshStandardMaterial({
        color: 0x555555, roughness: 0.9, flatShading: true
      }),
      'crystal': new THREE.MeshPhysicalMaterial({
        color: 0x00ffcc, transmission: 0.8, roughness: 0.2
      }),
      'tree': new THREE.MeshStandardMaterial({
        color: 0x00ff99, emissive: 0x003311, wireframe: true
      }),
      'monolith': new THREE.MeshStandardMaterial({
        color: 0x111111, roughness: 0.2, metalness: 0.8
      }),
      'tower': new THREE.MeshStandardMaterial({
        color: 0x222233, roughness: 0.5
      }),
      'bridge': new THREE.MeshPhysicalMaterial({
        color: 0xaaaaaa, transmission: 0.5, roughness: 0.5
      })
    };

    // Geometries mapping
    this.geometries = {
      'glass_block': new THREE.BoxGeometry(10, 10, 10),
      'chrome_block': new THREE.BoxGeometry(10, 10, 10),
      'neon_block': new THREE.BoxGeometry(10, 10, 10),
      'metal_block': new THREE.BoxGeometry(10, 10, 10),
      'rock': new THREE.DodecahedronGeometry(8, 0),
      'crystal': new THREE.OctahedronGeometry(5, 0),
      'tree': new THREE.ConeGeometry(5, 20, 5),
      'monolith': new THREE.BoxGeometry(15, 60, 15),
      'tower': new THREE.CylinderGeometry(10, 5, 80, 8),
      'bridge': new THREE.BoxGeometry(40, 2, 10)
    };
  }

  placeBlock(type, position) {
    if(!this.geometries[type] || !this.materials[type]) {
      console.warn("Unknown block type:", type);
      return;
    }

    const mesh = new THREE.Mesh(this.geometries[type], this.materials[type]);
    mesh.position.copy(position);

    // Adjust Y offset slightly based on geometry height so it sits ON the ground
    mesh.geometry.computeBoundingBox();
    const height = mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y;
    mesh.position.y += height / 2;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.scene.add(mesh);
    return mesh;
  }
}
