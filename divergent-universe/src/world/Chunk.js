import * as THREE from 'three';

export class Chunk {
  constructor(scene, name, initialPosition, divergenceVector) {
    this.scene = scene;
    this.name = name;
    this.group = new THREE.Group();
    this.group.position.copy(initialPosition);
    this.initialPosition = initialPosition.clone();
    this.divergenceVector = divergenceVector.clone().normalize(); // Direction of drifting

    this.scene.add(this.group);
  }

  generate() {
    // To be overridden by subclasses
  }

  update(dt, divergenceSpeed, totalElapsedTime) {
    // Slowly drift away based on divergence vector and speed
    // The further it gets, we might apply shaders or effects, but for now we update position
    this.group.position.addScaledVector(this.divergenceVector, divergenceSpeed * dt);
  }
}
