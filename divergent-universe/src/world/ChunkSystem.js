import { MainContinent } from './MainContinent.js';
import { IslandOne } from './IslandOne.js';
import { IslandTwo } from './IslandTwo.js';
import { IslandThree } from './IslandThree.js';
import { IslandFour } from './IslandFour.js';

export class ChunkSystem {
    constructor(scene) {
        this.scene = scene;
        this.chunks = [];

        // Initialize Central Continent
        this.mainContinent = new MainContinent();
        this.scene.add(this.mainContinent.mesh);

        // Initialize Islands
        // Each island has a starting distance and an angle
        this.islandOne = new IslandOne(150, 0);       // Glass Biome
        this.islandTwo = new IslandTwo(300, Math.PI / 2);  // Monolithic Rift
        this.islandThree = new IslandThree(450, Math.PI); // Liquid Neon
        this.islandFour = new IslandFour(600, Math.PI * 1.5); // Diverged Limit

        this.chunks.push(this.islandOne);
        this.chunks.push(this.islandTwo);
        this.chunks.push(this.islandThree);
        this.chunks.push(this.islandFour);

        this.chunks.forEach(chunk => {
            if (chunk.mesh) {
                this.scene.add(chunk.mesh);
            }
        });
    }

    update(delta, time) {
        // Divergence Math: Islands slowly drift away from the center
        // The further they are, the faster they might drift or rotate
        const driftSpeedBase = 0.5;

        this.chunks.forEach((chunk, index) => {
            // Slight continuous outward movement based on delta
            chunk.distance += driftSpeedBase * delta;

            // Slow orbit around the center
            const orbitSpeed = 0.05 / (index + 1);
            chunk.angle += orbitSpeed * delta;

            // Update positions using polar coordinates
            if (chunk.mesh) {
                chunk.mesh.position.x = Math.cos(chunk.angle) * chunk.distance;
                chunk.mesh.position.z = Math.sin(chunk.angle) * chunk.distance;

                // Allow chunks to have their own internal update logic (e.g. shaders, floating)
                if (typeof chunk.update === 'function') {
                    chunk.update(delta, time);
                }
            }
        });

        // Main continent might have internal animation
        if (typeof this.mainContinent.update === 'function') {
            this.mainContinent.update(delta, time);
        }
    }
}