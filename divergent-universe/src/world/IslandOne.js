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

    // Glowing grass (InstancedMesh)
    const grassGeo = new THREE.ConeGeometry(0.5, 5, 4);
    grassGeo.translate(0, 2.5, 0);
    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x00ffcc,
        emissive: 0x00ffcc,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2
    });
    const grassCount = 500;
    const grass = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);

    const grassDummy = new THREE.Object3D();
    for (let i = 0; i < grassCount; i++) {
        const r = Math.random() * 45;
        const theta = Math.random() * Math.PI * 2;
        grassDummy.position.set(r * Math.cos(theta), 0, r * Math.sin(theta));
        grassDummy.rotation.x = (Math.random() - 0.5) * 0.4;
        grassDummy.rotation.z = (Math.random() - 0.5) * 0.4;
        grassDummy.scale.setScalar(0.5 + Math.random() * 1.0);
        grassDummy.updateMatrix();
        grass.setMatrixAt(i, grassDummy.matrix);
    }
    group.add(grass);

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

    return group;
}
