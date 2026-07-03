import * as THREE from 'three';
import { createMainContinent } from './MainContinent.js';
import { createIslandOne } from './IslandOne.js';
import { createIslandTwo } from './IslandTwo.js';
import { createIslandThree } from './IslandThree.js';
import { createIslandFour } from './IslandFour.js';

// The Math of Divergence
// Islands drift away from center over time based on an exponential/linear curve
const BASE_DIVERGENCE_RATE = 0.5; // units per second

let islands = [];

export function initWorld(scene) {
  // Center
  const mainContinent = createMainContinent();
  scene.add(mainContinent);

  // Distances: inner, middle, outer, limit
  islands.push({
    mesh: createIslandOne(),
    angle: 0,
    baseDist: 200,
    divergenceMultiplier: 1.0
  });

  islands.push({
    mesh: createIslandTwo(),
    angle: Math.PI / 2,
    baseDist: 400,
    divergenceMultiplier: 1.5
  });

  islands.push({
    mesh: createIslandThree(),
    angle: Math.PI,
    baseDist: 700,
    divergenceMultiplier: 2.2
  });

  islands.push({
    mesh: createIslandFour(),
    angle: (3 * Math.PI) / 2,
    baseDist: 1200,
    divergenceMultiplier: 3.5
  });

  islands.forEach(island => {
    scene.add(island.mesh);
    // Initial position
    updateIslandPosition(island, 0);
  });

  // Add some ambient particles globally
  createGlobalParticles(scene);
}

export function updateWorld(delta, elapsedTime) {
  islands.forEach(island => {
    updateIslandPosition(island, elapsedTime);

    // Call custom update method if module has one (e.g. for waterfalls, glitches)
    if (island.mesh.userData.update) {
      island.mesh.userData.update(delta, elapsedTime);
    }
  });
}

function updateIslandPosition(island, time) {
  // Distance = Base + (Rate * Multiplier * Time)
  const currentDist = island.baseDist + (BASE_DIVERGENCE_RATE * island.divergenceMultiplier * time);

  // They drift outwards, maintaining their angle
  island.mesh.position.x = Math.cos(island.angle) * currentDist;
  island.mesh.position.z = Math.sin(island.angle) * currentDist;
}

function createGlobalParticles(scene) {
  const particleCount = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for(let i=0; i<particleCount*3; i++) {
    positions[i] = (Math.random() - 0.5) * 3000;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 2,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
}
