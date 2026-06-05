import * as THREE from 'three';
import { glitchMaterial } from '../utils/Materials.js';

export function createIslandFour() {
    const group = new THREE.Group();
    group.name = "IslandFour_GlitchEdge";

    // Abstract fractals / complex geometry
    const icosahedronGeo = new THREE.IcosahedronGeometry(15, 0);

    // We will just create a chaotic cluster
    for (let i = 0; i < 30; i++) {
        const mesh = new THREE.Mesh(icosahedronGeo, glitchMaterial);

        mesh.position.set(
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 80
        );

        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        // Sometimes wireframe
        if (Math.random() > 0.7) {
            const wireframeGeo = new THREE.WireframeGeometry(icosahedronGeo);
            const wireframeMat = new THREE.LineBasicMaterial({ color: 0xff00ff });
            const line = new THREE.LineSegments(wireframeGeo, wireframeMat);
            mesh.add(line);
            mesh.material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
        }

        group.add(mesh);
    }

    return group;
}
