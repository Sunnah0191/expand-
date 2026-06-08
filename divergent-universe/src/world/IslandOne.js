import * as THREE from 'three';
import { glassMaterial } from '../utils/Materials.js';

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

    // Glowing semi-transparent grass (InstancedMesh)
    const grassGeo = new THREE.ConeGeometry(0.5, 5, 3);
    grassGeo.translate(0, 2.5, 0);
    const grassMat = new THREE.MeshPhysicalMaterial({
        color: 0x55ffaa,
        emissive: 0x11aa55,
        emissiveIntensity: 0.5,
        transmission: 0.8,
        transparent: true,
        opacity: 0.9,
        roughness: 0.2
    });

    const grassCount = 300;
    const grass = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);

    for (let i = 0; i < grassCount; i++) {
        const r = Math.random() * 45;
        const theta = Math.random() * Math.PI * 2;
        // Basic height estimation to sit roughly on the hills
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = 10 - (r/45)*5 + Math.random()*2;

        dummy.position.set(x, y, z);
        dummy.rotation.x = (Math.random() - 0.5) * 0.5;
        dummy.rotation.z = (Math.random() - 0.5) * 0.5;
        dummy.scale.setScalar(0.5 + Math.random() * 1.0);
        dummy.updateMatrix();
        grass.setMatrixAt(i, dummy.matrix);
    }
    group.add(grass);

    return group;
}
