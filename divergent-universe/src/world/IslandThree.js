import * as THREE from 'three';
import { neonCyanMaterial, neonWhiteMaterial, neonGreenMaterial } from '../utils/Materials.js';

export function createIslandThree() {
    const group = new THREE.Group();
    group.name = "IslandThree_LiquidNeon";

    // Smooth flowing terraces
    const terraceGeo = new THREE.CylinderGeometry(40, 45, 5, 32);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.3 });

    for (let i = 0; i < 4; i++) {
        const terrace = new THREE.Mesh(terraceGeo, darkMat);
        terrace.position.y = i * 15;
        terrace.scale.setScalar(1 - i * 0.15);
        group.add(terrace);

        // Neon pools on top of terraces
        const poolGeo = new THREE.CylinderGeometry(39 * (1 - i * 0.15), 39 * (1 - i * 0.15), 5.2, 32);
        const pool = new THREE.Mesh(poolGeo, neonGreenMaterial);
        pool.position.y = i * 15;
        group.add(pool);

        // Neon rings (waterfalls edge)
        const ringGeo = new THREE.TorusGeometry(42 * (1 - i * 0.15), 1.5, 8, 32);
        const ring = new THREE.Mesh(ringGeo, i % 2 === 0 ? neonCyanMaterial : neonGreenMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = i * 15 + 2.5;
        group.add(ring);

        // Vertical waterfall streams
        if (i < 3) {
            const streamGeo = new THREE.CylinderGeometry(1.5, 1.5, 15, 8);
            const numStreams = 4 + i * 2;
            for (let j = 0; j < numStreams; j++) {
                const stream = new THREE.Mesh(streamGeo, neonGreenMaterial);
                const angle = (j / numStreams) * Math.PI * 2;
                const radius = 42 * (1 - (i+1) * 0.15); // Connect to next terrace radius roughly
                stream.position.set(
                    Math.cos(angle) * radius,
                    i * 15 + 7.5,
                    Math.sin(angle) * radius
                );
                group.add(stream);
            }
        }
    }

    return group;
}
