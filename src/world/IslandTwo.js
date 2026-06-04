import * as THREE from 'three';
import { monolithMaterial, neonBlueMaterial } from '../utils/Materials.js';

export function createIslandTwo() {
    const group = new THREE.Group();
    group.name = "IslandTwo_MonolithicRift";

    // Massive floating cubes
    const cubeGeo = new THREE.BoxGeometry(30, 30, 30);
    const cubeCount = 20;

    for (let i = 0; i < cubeCount; i++) {
        const mesh = new THREE.Mesh(cubeGeo, monolithMaterial);

        mesh.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 100
        );

        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        mesh.scale.setScalar(0.5 + Math.random() * 2);

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        group.add(mesh);

        // Add neon cracks/accents to some cubes
        if (Math.random() > 0.5) {
            const crackGeo = new THREE.BoxGeometry(32, 2, 32);
            const crack = new THREE.Mesh(crackGeo, neonBlueMaterial);
            mesh.add(crack);
        }
    }

    return group;
}
