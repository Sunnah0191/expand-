import * as THREE from 'three';

export class IslandThree {
    constructor(startDistance, startAngle) {
        this.distance = startDistance;
        this.angle = startAngle;

        this.mesh = new THREE.Group();
        this.waterfalls = [];

        // Base: Tiered terraces
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x0a1520,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true
        });

        for (let i = 0; i < 3; i++) {
            const rad = 40 - (i * 10);
            const yOffset = i * 15;
            const geo = new THREE.CylinderGeometry(rad, rad + 5, 10, 8);
            const tier = new THREE.Mesh(geo, baseMat);
            tier.position.y = yOffset;
            tier.receiveShadow = true;
            tier.castShadow = true;
            this.mesh.add(tier);
        }

        // Liquid Neon Material (Fake Flowing Shader)
        // Since we can't easily compile a complex GLSL shader here without external files,
        // we use a MeshPhysicalMaterial and animate its texture/emissive map (or simulate it).
        // For simplicity and aesthetic, we use a bright glowing material and animate geometry/uvs.

        this.neonLiquidMat = new THREE.MeshPhysicalMaterial({
            color: 0x00f3ff,
            emissive: 0x00f3ff,
            emissiveIntensity: 0.8,
            transmission: 0.5,
            opacity: 0.9,
            transparent: true,
            roughness: 0.1,
            metalness: 0.2
        });

        // Waterfalls connecting the tiers
        for (let i = 0; i < 4; i++) {
            const width = 8;
            const height = 25;
            const fallGeo = new THREE.PlaneGeometry(width, height, 4, 10);

            // Curve the plane slightly
            const positions = fallGeo.attributes.position;
            for(let j = 0; j < positions.count; j++) {
                const y = positions.getY(j);
                // Push the middle outwards
                const curve = Math.sin((y / height + 0.5) * Math.PI) * 2;
                positions.setZ(j, curve);
            }
            fallGeo.computeVertexNormals();

            const fallMesh = new THREE.Mesh(fallGeo, this.neonLiquidMat);

            // Position between tiers
            const angle = (Math.PI / 2) * i;
            const radius = 25;
            fallMesh.position.set(
                Math.cos(angle) * radius,
                15, // between tier 1 and 2
                Math.sin(angle) * radius
            );

            // Look away from center
            fallMesh.lookAt(fallMesh.position.x * 2, fallMesh.position.y, fallMesh.position.z * 2);

            this.mesh.add(fallMesh);
            this.waterfalls.push(fallMesh);
        }

        // Pools on the terraces
        const poolGeo = new THREE.CircleGeometry(25, 16);
        const pool = new THREE.Mesh(poolGeo, this.neonLiquidMat);
        pool.rotation.x = -Math.PI / 2;
        pool.position.y = 20.1; // Just above tier 1
        this.mesh.add(pool);

        this.mesh.position.x = Math.cos(this.angle) * this.distance;
        this.mesh.position.z = Math.sin(this.angle) * this.distance;
    }

    update(delta, time) {
        // Animate waterfall UVs to simulate flowing liquid neon
        this.waterfalls.forEach(fall => {
            // Very simple simulated flow by shifting vertices or scaling
            // To do UV animation we'd need a texture. Without one, we gently undulate the vertices
            const positions = fall.geometry.attributes.position;
            for(let j = 0; j < positions.count; j++) {
                const y = positions.getY(j);
                const x = positions.getX(j);
                // Base curve + time-based ripple
                const curve = Math.sin((y / 25 + 0.5) * Math.PI) * 2;
                const ripple = Math.sin(y * 2 - time * 10) * 0.5;
                positions.setZ(j, curve + ripple);
            }
            fall.geometry.attributes.position.needsUpdate = true;
        });

        // Pulse the emissive intensity
        this.neonLiquidMat.emissiveIntensity = 0.8 + Math.sin(time * 2) * 0.2;
    }
}