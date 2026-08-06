import * as THREE from 'three';

export class MainContinent {
    constructor() {
        this.mesh = new THREE.Group();

        // Base foundation
        const baseGeometry = new THREE.CylinderGeometry(80, 100, 20, 6);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.1,
            flatShading: true
        });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.receiveShadow = true;
        baseMesh.castShadow = true;
        this.mesh.add(baseMesh);

        // Core Monolith
        const coreGeometry = new THREE.BoxGeometry(20, 100, 20);
        const coreMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00f3ff,
            metalness: 0.9,
            roughness: 0.1,
            transmission: 0.9,
            thickness: 2,
            emissive: 0x004455,
            emissiveIntensity: 0.5
        });
        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        coreMesh.position.y = 50;
        coreMesh.castShadow = true;
        this.mesh.add(coreMesh);

        // White mid-poly buildings
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            roughness: 0.3,
            metalness: 0.2,
            flatShading: true
        });

        for (let i = 0; i < 20; i++) {
            const width = Math.random() * 10 + 5;
            const height = Math.random() * 60 + 20;
            const depth = Math.random() * 10 + 5;

            const bGeo = new THREE.BoxGeometry(width, height, depth);
            const bMesh = new THREE.Mesh(bGeo, buildingMaterial);

            const radius = Math.random() * 50 + 25;
            const theta = Math.random() * Math.PI * 2;

            bMesh.position.x = Math.cos(theta) * radius;
            bMesh.position.z = Math.sin(theta) * radius;
            bMesh.position.y = height / 2 + 10; // above base

            // Look slightly towards center
            bMesh.lookAt(0, bMesh.position.y, 0);

            bMesh.castShadow = true;
            bMesh.receiveShadow = true;
            this.mesh.add(bMesh);
        }

        // Floating glass platforms
        const platformMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.8,
            opacity: 1,
            transparent: true,
            roughness: 0.1,
            thickness: 0.5
        });

        for (let i = 0; i < 10; i++) {
            const pGeo = new THREE.BoxGeometry(15, 1, 15);
            const pMesh = new THREE.Mesh(pGeo, platformMat);

            pMesh.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 80 + 30,
                (Math.random() - 0.5) * 100
            );

            this.mesh.add(pMesh);
        }
    }

    update(delta, time) {
        // Monolith pulsing or subtle floating platform movement can be added here
        this.mesh.children.forEach(child => {
            if (child.geometry.type === 'BoxGeometry' && child.scale.y === 1) { // Hacky check for platforms
                child.position.y += Math.sin(time * 2 + child.position.x) * 0.02;
            }
        });
    }
}