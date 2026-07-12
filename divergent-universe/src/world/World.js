import * as THREE from 'three';
import { createOcean } from './Ocean.js';
import { createMainContinent } from './MainContinent.js';
import { updateMaterials } from '../utils/Materials.js';
import { createIslandOne } from './IslandOne.js';
import { createIslandTwo } from './IslandTwo.js';
import { createIslandThree } from './IslandThree.js';
import { createIslandFour } from './IslandFour.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.time = 0;

        // Add elements
        this.ocean = createOcean();
        this.group.add(this.ocean);

        this.mainContinent = createMainContinent();
        this.group.add(this.mainContinent);

        // Arrays to hold divergent islands
        this.islands = [];

        const i1 = createIslandOne();
        i1.position.set(400, 20, 0); // Near circle
        this.group.add(i1);
        this.islands.push({ mesh: i1, distance: 400, direction: {x: 1, z: 0} });

        const i2 = createIslandTwo();
        i2.position.set(0, 30, 800); // Mid circle
        this.group.add(i2);
        this.islands.push({ mesh: i2, distance: 800, direction: {x: 0, z: 1} });

        const i3 = createIslandThree();
        i3.position.set(-1200, 0, 0); // Far circle
        this.group.add(i3);
        this.islands.push({ mesh: i3, distance: 1200, direction: {x: -1, z: 0} });

        const i4 = createIslandFour();
        i4.position.set(0, 50, -1600); // Edge of universe
        this.group.add(i4);
        this.islands.push({ mesh: i4, distance: 1600, direction: {x: 0, z: -1} });

        // Add glowing particles
        const particleCount = 2000;
        const particleGeo = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Random position across the universe
            particlePositions[i * 3] = (Math.random() - 0.5) * 4000;
            particlePositions[i * 3 + 1] = Math.random() * 500; // Height
            particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4000;

            particleVelocities.push({
                x: (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 10,
                z: (Math.random() - 0.5) * 20
            });
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        // Simple circular glowing sprite using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(0, 240, 255, 1)');
        gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 16, 16);
        const texture = new THREE.CanvasTexture(canvas);

        const particleMat = new THREE.PointsMaterial({
            color: 0x00f0ff,
            size: 15,
            map: texture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(particleGeo, particleMat);
        this.particleVelocities = particleVelocities;
        this.group.add(this.particles);

        this.scene.add(this.group);
    }

    update(delta) {
        this.time += delta;

        // Rotate the central core slightly
        const core = this.mainContinent.getObjectByName("CentralCore");
        if (core) {
            core.rotation.y += 0.5 * delta;
            core.position.y = 120 + Math.sin(this.time * 2) * 5;
        }

        // Update custom shaders
        updateMaterials(delta, this.time);

        // Divergence logic: slowly move islands away from center
        const divergenceSpeed = 0.5; // units per second

        for (let i = 0; i < this.islands.length; i++) {
            const islandData = this.islands[i];
            const island = islandData.mesh;

            // Calculate direction vector from origin
            if (!islandData.direction) {
                // Initialize direction if not set
                const length = Math.sqrt(island.position.x * island.position.x + island.position.z * island.position.z);
                islandData.direction = {
                    x: island.position.x / length,
                    z: island.position.z / length
                };
            }

            // Move island
            island.position.x += islandData.direction.x * divergenceSpeed * delta;
            island.position.z += islandData.direction.z * divergenceSpeed * delta;

            // Float up and down slightly
            island.position.y = Math.sin(this.time + i * 1.5) * 2;
        }

        // Update particles
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < this.particleVelocities.length; i++) {
                const vel = this.particleVelocities[i];

                positions[i * 3] += vel.x * delta;
                positions[i * 3 + 1] += vel.y * delta;
                positions[i * 3 + 2] += vel.z * delta;

                // Slowly wrap particles around
                if (positions[i * 3] > 2000) positions[i * 3] = -2000;
                if (positions[i * 3] < -2000) positions[i * 3] = 2000;
                if (positions[i * 3 + 1] > 600) positions[i * 3 + 1] = 0;
                if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 600;
                if (positions[i * 3 + 2] > 2000) positions[i * 3 + 2] = -2000;
                if (positions[i * 3 + 2] < -2000) positions[i * 3 + 2] = 2000;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }
}
