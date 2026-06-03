import * as THREE from 'three';
import { neonCyanMaterial, neonWhiteMaterial } from '../utils/Materials.js';

export function createIslandThree() {
    const group = new THREE.Group();
    group.name = "IslandThree_LiquidNeon";

    // Smooth flowing terraces
    const terraceGeo = new THREE.CylinderGeometry(40, 45, 5, 32);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });

    for (let i = 0; i < 4; i++) {
        const terrace = new THREE.Mesh(terraceGeo, darkMat);
        terrace.position.y = i * 15;
        terrace.scale.setScalar(1 - i * 0.15);
        group.add(terrace);

        // Neon rings (waterfalls)
        const ringGeo = new THREE.TorusGeometry(42 * (1 - i * 0.15), 1.5, 8, 32);
        const ring = new THREE.Mesh(ringGeo, i % 2 === 0 ? neonCyanMaterial : neonWhiteMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = i * 15 + 2.5;
        group.add(ring);
    }

    return group;
}
