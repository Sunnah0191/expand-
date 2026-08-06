import * as THREE from 'three';

export class IslandTwo {
    constructor(startDistance, startAngle) {
        this.distance = startDistance;
        this.angle = startAngle;

        this.mesh = new THREE.Group();
        this.blocks = [];

        // Dark monolithic material
        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a24,
            roughness: 0.7,
            metalness: 0.3,
            flatShading: true
        });

        // Neon accent material
        const neonMat = new THREE.MeshBasicMaterial({
            color: 0xff0055,
        });

        const blockGeo = new THREE.BoxGeometry(10, 10, 10);

        // Generate floating blocks forming an abstract rift structure
        for (let i = 0; i < 40; i++) {
            const block = new THREE.Mesh(blockGeo, darkMat);

            // Randomly scale blocks to look like monoliths or plates
            block.scale.set(
                1 + Math.random() * 3,
                1 + Math.random() * 5,
                1 + Math.random() * 3
            );

            block.position.set(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60
            );

            block.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            block.castShadow = true;
            block.receiveShadow = true;

            this.mesh.add(block);

            // Save initial Y and rotation for floating animation
            this.blocks.push({
                mesh: block,
                initialY: block.position.y,
                phaseOffset: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.5
            });

            // Add neon accents to some blocks
            if (Math.random() > 0.7) {
                const accentGeo = new THREE.BoxGeometry(block.scale.x * 10.1, 1, block.scale.z * 10.1);
                const accent = new THREE.Mesh(accentGeo, neonMat);
                accent.position.copy(block.position);
                accent.rotation.copy(block.rotation);
                this.mesh.add(accent);

                this.blocks.push({
                    mesh: accent,
                    initialY: accent.position.y,
                    phaseOffset: this.blocks[this.blocks.length - 1].phaseOffset,
                    rotSpeed: this.blocks[this.blocks.length - 1].rotSpeed,
                    isAccent: true,
                    parentBlock: block
                });
            }
        }

        // Central massive arch/ring
        const ringGeo = new THREE.TorusGeometry(30, 4, 8, 12);
        const ring = new THREE.Mesh(ringGeo, darkMat);
        ring.rotation.x = Math.PI / 2;
        this.mesh.add(ring);
        this.ring = ring;

        this.mesh.position.x = Math.cos(this.angle) * this.distance;
        this.mesh.position.z = Math.sin(this.angle) * this.distance;
    }

    update(delta, time) {
        // Slow rotation of the central ring
        if (this.ring) {
            this.ring.rotation.z += 0.2 * delta;
        }

        // Float the blocks up and down slightly
        this.blocks.forEach(b => {
            if (!b.isAccent) {
                b.mesh.position.y = b.initialY + Math.sin(time + b.phaseOffset) * 2;
                b.mesh.rotation.y += b.rotSpeed * delta;
                b.mesh.rotation.x += b.rotSpeed * delta * 0.5;
            } else {
                // Sync accent with parent block
                b.mesh.position.copy(b.parentBlock.position);
                b.mesh.rotation.copy(b.parentBlock.rotation);
            }
        });
    }
}