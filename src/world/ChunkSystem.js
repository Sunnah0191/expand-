import * as THREE from 'three';

export class ChunkSystem {
  constructor(scene) {
    this.scene = scene;
    this.chunks = [];
    this.divergenceSpeed = 0.5; // Base speed of islands moving away
  }

  addChunk(chunk) {
    this.chunks.push(chunk);
    this.scene.add(chunk.group);
  }

  update(time, delta) {
    // Update each chunk logic
    for (const chunk of this.chunks) {
      if (chunk.update) {
        chunk.update(time, delta);
      }

      // Apply divergence math (if not the central continent)
      if (chunk.isDivergent) {
        // Calculate outward direction vector
        const dir = new THREE.Vector3(chunk.initialPosition.x, 0, chunk.initialPosition.z).normalize();

        // Multiplier based on distance to simulate "further away diverges faster"
        const distMult = Math.max(1, chunk.initialDistance / 200);

        // Displacement based on time
        const displacement = dir.multiplyScalar(time * this.divergenceSpeed * distMult);

        chunk.group.position.x = chunk.initialPosition.x + displacement.x;
        chunk.group.position.z = chunk.initialPosition.z + displacement.z;

        // Slight bobbing effect for the islands
        chunk.group.position.y = chunk.initialPosition.y + Math.sin(time + chunk.id) * 2;
      }
    }
  }
}
