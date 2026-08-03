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

        // Slowly rotate central particles
        const particles = this.mainContinent.getObjectByName("CentralParticles");
        if (particles) {
            particles.rotation.y += 0.05 * delta;
            // Add a subtle wave to the particles
            const positions = particles.geometry.attributes.position.array;
            for(let i=1; i < positions.length; i+=3) {
                positions[i] += Math.sin(this.time + positions[i-1]) * 0.02;
            }
            particles.geometry.attributes.position.needsUpdate = true;
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
    }
}
