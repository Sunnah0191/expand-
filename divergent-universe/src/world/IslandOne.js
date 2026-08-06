import * as THREE from 'three';

export class IslandOne {
    constructor(startDistance, startAngle) {
        this.distance = startDistance;
        this.angle = startAngle;

        this.mesh = new THREE.Group();

        // Base: Smooth, rounded mid-poly hills
        const baseGeo = new THREE.IcosahedronGeometry(40, 2);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.6,
            flatShading: true
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.scale.set(1, 0.4, 1);
        base.receiveShadow = true;
        this.mesh.add(base);

        // Glass Trees using InstancedMesh for performance
        const treeCount = 100;
        const trunkGeo = new THREE.CylinderGeometry(0.5, 1, 10, 5);
        const leavesGeo = new THREE.IcosahedronGeometry(4, 1);

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x00ffcc,
            transmission: 0.9,
            opacity: 1,
            metalness: 0.2,
            roughness: 0.05,
            ior: 1.5,
            thickness: 2,
            transparent: true,
            flatShading: true
        });

        this.treeInstancedMesh = new THREE.InstancedMesh(leavesGeo, glassMat, treeCount);
        this.trunkInstancedMesh = new THREE.InstancedMesh(trunkGeo, baseMat, treeCount);

        const dummy = new THREE.Object3D();

        for (let i = 0; i < treeCount; i++) {
            // Random position on the hemisphere
            const r = Math.random() * 35;
            const theta = Math.random() * Math.PI * 2;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            // Approximate height on the flattened icosahedron
            const y = Math.sqrt(Math.max(0, 40*40 - x*x - z*z)) * 0.4;

            // Trunk
            dummy.position.set(x, y + 5, z);
            dummy.scale.set(1, 1 + Math.random(), 1);
            dummy.rotation.set(0, Math.random() * Math.PI, 0);
            dummy.updateMatrix();
            this.trunkInstancedMesh.setMatrixAt(i, dummy.matrix);

            // Leaves (Glass)
            dummy.position.set(x, y + 10 + Math.random() * 2, z);
            dummy.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, 1 + Math.random() * 0.5);
            dummy.updateMatrix();
            this.treeInstancedMesh.setMatrixAt(i, dummy.matrix);
        }

        this.mesh.add(this.trunkInstancedMesh);
        this.mesh.add(this.treeInstancedMesh);

        // Initial positioning based on ChunkSystem polar coordinates
        this.mesh.position.x = Math.cos(this.angle) * this.distance;
        this.mesh.position.z = Math.sin(this.angle) * this.distance;
    }

    update(delta, time) {
        // The glass trees could slowly pulsate or rotate if desired,
        // but InstancedMesh requires updating the matrix and setting instanceMatrix.needsUpdate = true.
        // For performance, we keep them static relative to the island.
    }
}