import * as THREE from 'three';

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = [];

    // Time tracker for divergence math
    this.totalTime = 0;

    // Divergence speed multiplier (very slow, barely noticeable)
    this.divergenceSpeed = 0.5;
  }

  addChunk(chunk) {
    this.chunks.push(chunk);
    if (chunk.group) {
      this.scene.add(chunk.group);
    }
  }

  update(delta) {
    this.totalTime += delta * this.divergenceSpeed;

    for (const chunk of this.chunks) {
      // Divergence Math:
      // If a chunk has a defined 'divergenceBaseRadius', we push it outwards
      // from the center (0,0) based on time.
      if (chunk.divergenceBaseRadius > 0 && chunk.divergenceAngle !== undefined) {
        // Distance increases slowly over time.
        // Formula: currentRadius = baseRadius + time * distanceMultiplier
        // The further away it started (larger base radius), the faster it might diverge (optional styling)
        const currentRadius = chunk.divergenceBaseRadius + (this.totalTime * (chunk.divergenceBaseRadius * 0.05));

        // Add a very slow orbital rotation to make it feel alive
        const currentAngle = chunk.divergenceAngle + (this.totalTime * 0.02 * (1 / chunk.divergenceBaseRadius));

        // Calculate new X and Z
        const newX = Math.cos(currentAngle) * currentRadius;
        const newZ = Math.sin(currentAngle) * currentRadius;

        chunk.group.position.x = newX;
        chunk.group.position.z = newZ;

        // Slight vertical bobbing based on time and distance
        chunk.group.position.y = Math.sin(this.totalTime + chunk.divergenceBaseRadius) * 5;
      }

      // Also call individual chunk updates (for animation of liquid, rotation, etc.)
      if (typeof chunk.update === 'function') {
        chunk.update(delta, this.totalTime);
      }
    }
  }
}
