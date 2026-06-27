import * as THREE from 'three';

export class DivergenceMath {
  constructor(islands) {
    this.islands = islands;
    // Store original distances and angles
    this.islandData = islands.map(island => {
      const vec = new THREE.Vector2(island.baseX, island.baseZ);
      return {
        island: island,
        angle: vec.angle(),
        distance: vec.length(),
        driftRate: 1.0 + Math.random() * 0.5 // Base drift rate
      };
    });
  }

  update(deltaTime, totalTime) {
    // The further away an island is, the faster it drifts (to simulate expanding universe)
    // We'll use a very slow drift for visual effect
    const globalDriftFactor = 0.5;

    this.islandData.forEach(data => {
      // Increase distance over time.
      // Distances are exaggerated slightly here for effect
      data.distance += data.driftRate * globalDriftFactor * deltaTime;

      // Small orbital rotation too
      data.angle += (0.01 / data.distance) * deltaTime;

      // Calculate new position
      const newX = Math.cos(data.angle) * data.distance;
      const newZ = Math.sin(data.angle) * data.distance;

      data.island.setPosition(newX, newZ);
    });
  }
}
