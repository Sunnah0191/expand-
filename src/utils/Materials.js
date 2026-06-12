import * as THREE from 'three';

// Library of reusable materials conforming to the aesthetic

export const Materials = {
  // 1. Clean Glassmorphism
  Glass: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.2,
    transmission: 0.95, // High transmission for glass effect
    thickness: 1.5,     // Refraction thickness
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  }),

  // 2. Neon Emissive (Liquid/Aquatic)
  NeonCyan: new THREE.MeshPhysicalMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8,
    metalness: 0.8,
    roughness: 0.1,
    transmission: 0.8,
    thickness: 2.0
  }),

  // 3. Neon Emissive (Purple/Rift)
  NeonPurple: new THREE.MeshBasicMaterial({
    color: 0xaa00ff,
  }),

  // 4. Matte Monolith
  MonolithDark: new THREE.MeshStandardMaterial({
    color: 0x0f111a,
    roughness: 0.8,
    metalness: 0.3,
  }),

  // 5. Clean Mid-poly White Architecture
  ArchitectureWhite: new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.1,
    metalness: 0.1,
  }),

  // 6. Chrome/Mirror
  Mirror: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.0,
    metalness: 1.0,
  })
};
