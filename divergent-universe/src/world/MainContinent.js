import * as THREE from 'three';
import { glassMaterial, neonCyanMaterial } from '../utils/Materials.js';

export function createMainContinent() {
    const group = new THREE.Group();
    group.name = "MainContinent";

    // Base island
    const baseGeo = new THREE.CylinderGeometry(200, 250, 20, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.2 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -10;
    base.receiveShadow = true;
    group.add(base);

    // City Buildings (InstancedMesh for optimization)
    const buildingGeo = new THREE.BoxGeometry(10, 1, 10);
    // Move geometry center to bottom so scaling scales upwards
    buildingGeo.translate(0, 0.5, 0);

    // We'll create some glass buildings and some solid white buildings
    const buildingCount = 100;
    const glassBuildings = new THREE.InstancedMesh(buildingGeo, glassMaterial, Math.floor(buildingCount * 0.6));
    const solidBuildings = new THREE.InstancedMesh(buildingGeo, baseMat, Math.floor(buildingCount * 0.4));

    glassBuildings.castShadow = true;
    glassBuildings.receiveShadow = true;
    solidBuildings.castShadow = true;
    solidBuildings.receiveShadow = true;

    let glassIndex = 0;
    let solidIndex = 0;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < buildingCount; i++) {
        // Random position within radius
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 150;

        dummy.position.set(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        );

        // Random height
        const height = 10 + Math.random() * 80;
        // Make center buildings taller
        const distFactor = 1.0 - (radius / 150);
        const finalHeight = height + distFactor * 100;

        dummy.scale.set(
            1 + Math.random() * 3,
            finalHeight,
            1 + Math.random() * 3
        );

        dummy.updateMatrix();

        if (Math.random() > 0.4 && glassIndex < glassBuildings.count) {
            glassBuildings.setMatrixAt(glassIndex++, dummy.matrix);
        } else if (solidIndex < solidBuildings.count) {
            solidBuildings.setMatrixAt(solidIndex++, dummy.matrix);
        }
    }

    group.add(glassBuildings);
    group.add(solidBuildings);

    // Central core (God mode monolith)
    const coreGeo = new THREE.OctahedronGeometry(20, 0);
    const core = new THREE.Mesh(coreGeo, neonCyanMaterial);
    core.position.y = 120;
    core.name = "CentralCore";
    group.add(core);

    // Glowing particles for the background
    const particleCount = 2000;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 500;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 300 + 100;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 500;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
        color: 0x00f0ff,
        size: 1.5,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(pGeo, pMat);
    particles.name = "GlowingParticles";
    group.add(particles);

    return group;
}
