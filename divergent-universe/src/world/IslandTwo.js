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

    // Massive Arches
    const archGeo = new THREE.BoxGeometry(10, 60, 10);
    const archTopGeo = new THREE.BoxGeometry(50, 10, 10);

    for (let i = 0; i < 3; i++) {
        const archGroup = new THREE.Group();

        const pillar1 = new THREE.Mesh(archGeo, monolithMaterial);
        pillar1.position.set(-20, 30, 0);
        archGroup.add(pillar1);

        const pillar2 = new THREE.Mesh(archGeo, monolithMaterial);
        pillar2.position.set(20, 30, 0);
        archGroup.add(pillar2);

        const top = new THREE.Mesh(archTopGeo, monolithMaterial);
        top.position.set(0, 65, 0);
        archGroup.add(top);

        archGroup.position.set(
            (Math.random() - 0.5) * 80,
            0,
            (Math.random() - 0.5) * 80
        );
        archGroup.rotation.y = Math.random() * Math.PI;

        group.add(archGroup);
    }

    return group;
}
