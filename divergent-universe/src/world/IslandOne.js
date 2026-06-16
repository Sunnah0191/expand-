import * as THREE from 'three';
import { glassMaterial, glowingGrassMaterial } from '../utils/Materials.js';

export function createIslandOne() {
    const group = new THREE.Group();
    group.name = "IslandOne_GlassBiome";

    // Smooth, round glass hills
    const hillGeo = new THREE.DodecahedronGeometry(50, 1); // mid-poly look
    const hillMat = glassMaterial.clone();
    hillMat.color = new THREE.Color(0xaaffff);

    const hill1 = new THREE.Mesh(hillGeo, hillMat);
    hill1.scale.set(1, 0.4, 1);
    hill1.position.set(0, 0, 0);
    group.add(hill1);

    const hill2 = new THREE.Mesh(hillGeo, hillMat);
    hill2.scale.set(0.6, 0.3, 0.6);
    hill2.position.set(30, -5, 20);
    group.add(hill2);

    // Glass trees (InstancedMesh)
    const treeGeo = new THREE.ConeGeometry(3, 20, 5);
    treeGeo.translate(0, 10, 0);
    const treeCount = 50;
    const trees = new THREE.InstancedMesh(treeGeo, hillMat, treeCount);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < treeCount; i++) {
        const r = Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        dummy.position.set(r * Math.cos(theta), 10, r * Math.sin(theta));
        dummy.rotation.x = (Math.random() - 0.5) * 0.2;
        dummy.rotation.z = (Math.random() - 0.5) * 0.2;
        dummy.scale.setScalar(0.5 + Math.random() * 1.5);
        dummy.updateMatrix();
        trees.setMatrixAt(i, dummy.matrix);
    }
    group.add(trees);

    // Semi-transparent glowing grass ("полупрозрачная трава, которая светится изнутри")
    const grassGeo = new THREE.ConeGeometry(0.5, 4, 3); // low-poly blade of grass
    grassGeo.translate(0, 2, 0);
    const grassCount = 500;
    const grass = new THREE.InstancedMesh(grassGeo, glowingGrassMaterial, grassCount);

    for (let i = 0; i < grassCount; i++) {
        const r = Math.random() * 45;
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        // simple terrain height approximation based on distance from center
        let y = 10;
        if (r > 30) {
            y = 10 - (r - 30) * 0.5; // slope down
        }

        dummy.position.set(x, y, z);
        dummy.rotation.set(
            (Math.random() - 0.5) * 0.5,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.5
        );
        dummy.scale.set(
            0.5 + Math.random() * 0.5,
            0.5 + Math.random() * 1.5,
            0.5 + Math.random() * 0.5
        );
        dummy.updateMatrix();
        grass.setMatrixAt(i, dummy.matrix);
    }
    group.add(grass);

    return group;
}
