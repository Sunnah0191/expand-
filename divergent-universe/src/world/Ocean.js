import * as THREE from 'three';
import { oceanMaterial } from '../utils/Materials.js';

export function createOcean() {
    const group = new THREE.Group();

    const geometry = new THREE.PlaneGeometry(10000, 10000);
    const plane = new THREE.Mesh(geometry, oceanMaterial);

    // Rotate to lay flat
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -5; // slightly below 0
    plane.receiveShadow = true;

    group.add(plane);

    return group;
}
