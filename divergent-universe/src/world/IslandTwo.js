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

    // Giant geometric arches
    const archGeo = new THREE.TorusGeometry(40, 5, 8, 4, Math.PI);
    for (let i = 0; i < 3; i++) {
        const arch = new THREE.Mesh(archGeo, monolithMaterial);
        arch.position.set(
            (Math.random() - 0.5) * 50,
            20 + Math.random() * 20,
            (Math.random() - 0.5) * 50
        );
        arch.rotation.set(
            Math.random() * 0.5,
            Math.random() * Math.PI,
            (Math.random() - 0.5) * 0.5
        );

        // Neon trim inside arch
        const neonTrimGeo = new THREE.TorusGeometry(39, 1, 8, 4, Math.PI);
        const neonTrim = new THREE.Mesh(neonTrimGeo, neonBlueMaterial);
        arch.add(neonTrim);

        group.add(arch);
    }

    return group;
}
