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

    // Mid-poly arches
    const archCount = 5;
    for (let i = 0; i < archCount; i++) {
        const archGroup = new THREE.Group();

        // Pillars
        const pillarGeo = new THREE.BoxGeometry(10, 40, 10);
        const pillar1 = new THREE.Mesh(pillarGeo, monolithMaterial);
        pillar1.position.set(-15, 20, 0);
        const pillar2 = new THREE.Mesh(pillarGeo, monolithMaterial);
        pillar2.position.set(15, 20, 0);

        // Top cross piece
        const topGeo = new THREE.BoxGeometry(40, 10, 10);
        const top = new THREE.Mesh(topGeo, monolithMaterial);
        top.position.set(0, 45, 0);

        archGroup.add(pillar1);
        archGroup.add(pillar2);
        archGroup.add(top);

        archGroup.position.set(
            (Math.random() - 0.5) * 120,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 120
        );

        archGroup.rotation.y = Math.random() * Math.PI;

        // Add neon accents to arches sometimes
        if (Math.random() > 0.5) {
            const crackGeo = new THREE.BoxGeometry(42, 2, 12);
            const crack = new THREE.Mesh(crackGeo, neonBlueMaterial);
            crack.position.set(0, 45, 0);
            archGroup.add(crack);
        }

        group.add(archGroup);
    }

    return group;
}
