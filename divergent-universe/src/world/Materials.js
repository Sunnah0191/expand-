import * as THREE from 'three';

// White Mid-poly metropolis material
export const whiteBuildingMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.1,
  metalness: 0.2,
  flatShading: true,
});

export const glassFacadeMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x88ccff,
  metalness: 0.9,
  roughness: 0.1,
  transmission: 0.8, // glass-like
  ior: 1.5,
  thickness: 2.0,
  transparent: true,
  opacity: 0.8
});

// Glass Biome Materials
export const glassTreeMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xaaffcc,
  metalness: 0.1,
  roughness: 0.05,
  transmission: 0.9,
  ior: 1.4,
  thickness: 1.5,
  transparent: true,
  flatShading: true
});

export const glassGroundMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x224433,
  metalness: 0.5,
  roughness: 0.3,
  transmission: 0.4,
  ior: 1.3,
  thickness: 5.0,
  flatShading: true
});

// Monolithic Rift Materials
export const monolithicMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true
});

export const neonGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0055,
  colorWrite: true
});

// Liquid Neon Materials
export const liquidNeonMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00ffff,
  metalness: 0.8,
  roughness: 0.1,
  transmission: 0.9,
  ior: 1.2,
  thickness: 1.0,
  emissive: 0x0044aa,
  emissiveIntensity: 0.5,
  flatShading: true
});

export const oasisGroundMaterial = new THREE.MeshStandardMaterial({
  color: 0x0a1a1a,
  roughness: 0.7,
  metalness: 0.3,
  flatShading: true
});

// Diverged Limit (Glitch) Materials
export const glitchMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.5,
  metalness: 0.8,
  wireframe: true,
  emissive: 0x5500ff,
  emissiveIntensity: 0.2
});

export const abstractFractalMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x330055,
  metalness: 0.9,
  roughness: 0.2,
  transmission: 0.6,
  ior: 2.0,
  thickness: 0.5,
  flatShading: true
});

// Grid Material for God Mode
export const gridMaterial = new THREE.LineBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.5
});
