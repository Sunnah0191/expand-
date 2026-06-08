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

    // Glowing particles around the core
    const particleCount = 500;
    const particlesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);

    for(let i = 0; i < particleCount * 3; i++) {
        // Random positions around the core
        posArray[i] = (Math.random() - 0.5) * 150;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 2,
        color: 0x00f0ff, // neon cyan
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeo, particlesMat);
    particles.position.y = 100;
    particles.name = "CoreParticles";
    group.add(particles);

    return group;
}
