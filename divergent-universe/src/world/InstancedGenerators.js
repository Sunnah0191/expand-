import * as THREE from 'three';

/**
 * Utility for generating highly optimized InstancedMeshes
 */
export class InstancedGenerators {
  /**
   * Generates an instanced mesh of trees/columns
   * @param {THREE.Scene|THREE.Group} targetGroup Where to add the instanced mesh
   * @param {number} count Number of instances
   * @param {THREE.BufferGeometry} geometry Base geometry
   * @param {THREE.Material} material Base material
   * @param {Function} positionCallback A function(index) that returns a THREE.Vector3 for the position
   * @param {Function} scaleCallback A function(index) that returns a THREE.Vector3 for the scale
   */
  static create(targetGroup, count, geometry, material, positionCallback, scaleCallback = null) {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const pos = positionCallback(i);
      dummy.position.copy(pos);

      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0); // Random Y rotation

      if (scaleCallback) {
        const scale = scaleCallback(i);
        dummy.scale.copy(scale);
      } else {
        dummy.scale.set(1, 1, 1);
      }

      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    targetGroup.add(instancedMesh);
    return instancedMesh;
  }
}
