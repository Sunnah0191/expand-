import * as THREE from 'three';

/**
 * Helper function to create Glassmorphism materials for the project.
 * Uses MeshPhysicalMaterial with high transmission.
 */
export function createGlassMaterial(options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: options.color || 0xffffff,
    metalness: options.metalness !== undefined ? options.metalness : 0.1,
    roughness: options.roughness !== undefined ? options.roughness : 0.2, // slight frosting
    transmission: options.transmission !== undefined ? options.transmission : 0.9, // high transparency
    ior: options.ior || 1.5, // index of refraction for glass
    thickness: options.thickness || 2.0, // volume
    transparent: true,
    opacity: 1, // for transmission to work, opacity is typically 1
    side: options.side || THREE.DoubleSide,
    emissive: options.emissive || 0x000000,
    emissiveIntensity: options.emissiveIntensity || 0
  });
}

/**
 * Pre-configured presets for different islands
 */

export const GlassPresets = {
  // Pure white/clean glass for Main Continent
  CoreGlass: () => createGlassMaterial({
    color: 0xffffff,
    roughness: 0.1,
    transmission: 0.95,
    thickness: 5.0
  }),

  // Crystal clear, slightly blueish glass for Island One
  BiomeGlass: () => createGlassMaterial({
    color: 0xe0f7fa,
    roughness: 0.05,
    transmission: 0.98,
    ior: 1.6,
    thickness: 1.0
  }),

  // Darker, rougher monolithic glass for Island Two
  MonolithGlass: () => createGlassMaterial({
    color: 0x111827,
    roughness: 0.4,
    transmission: 0.8,
    metalness: 0.3,
    thickness: 10.0,
    emissive: 0x0f172a,
    emissiveIntensity: 0.2
  }),

  // Neon glowing glass for accents
  NeonGlass: (colorHex) => createGlassMaterial({
    color: colorHex,
    roughness: 0.2,
    transmission: 0.7,
    emissive: colorHex,
    emissiveIntensity: 0.8
  })
};
