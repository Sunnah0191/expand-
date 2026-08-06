import * as THREE from 'three';

export class IslandFour {
    constructor(startDistance, startAngle) {
        this.distance = startDistance;
        this.angle = startAngle;

        this.mesh = new THREE.Group();

        // Abstract fractured base
        const baseGeo = new THREE.DodecahedronGeometry(30, 0);

        // Shader Material to simulate glitch/code effect
        this.glitchUniforms = {
            time: { value: 0.0 }
        };

        const glitchMat = new THREE.ShaderMaterial({
            uniforms: this.glitchUniforms,
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vNormal;

                void main() {
                    vUv = uv;
                    vNormal = normal;

                    vec3 pos = position;
                    // Add glitchy displacement based on time and position
                    float glitch = sin(pos.y * 10.0 + time * 5.0) * cos(pos.x * 10.0 - time * 3.0);

                    // Only apply glitch to certain bands
                    if(mod(pos.y, 10.0) < 2.0) {
                        pos.x += glitch * 1.5;
                        pos.z += glitch * 1.5;
                    }

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vNormal;

                void main() {
                    // Base color (dark space/code)
                    vec3 color = vec3(0.02, 0.05, 0.1);

                    // Glitch lines (cyan/magenta)
                    float line = step(0.9, sin(vUv.y * 50.0 + time * 10.0));
                    vec3 glitchColor = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 1.0), sin(time * 2.0));

                    // Wireframe-ish edge detection based on normals
                    float edge = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));

                    color += line * glitchColor * 0.5;
                    color += edge * vec3(0.5, 0.5, 1.0) * 0.5;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            wireframe: false,
            transparent: true,
            opacity: 0.9
        });

        const base = new THREE.Mesh(baseGeo, glitchMat);
        this.mesh.add(base);

        // Fractured floating pieces
        this.fragments = [];
        const fragGeo = new THREE.TetrahedronGeometry(5, 0);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });

        for (let i = 0; i < 50; i++) {
            const fragMat = Math.random() > 0.5 ? glitchMat : wireMat;
            const frag = new THREE.Mesh(fragGeo, fragMat);

            const radius = 40 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            frag.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
            );

            frag.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            this.mesh.add(frag);

            this.fragments.push({
                mesh: frag,
                speedX: (Math.random() - 0.5) * 0.02,
                speedY: (Math.random() - 0.5) * 0.02,
                speedZ: (Math.random() - 0.5) * 0.02
            });
        }

        this.mesh.position.x = Math.cos(this.angle) * this.distance;
        this.mesh.position.z = Math.sin(this.angle) * this.distance;
    }

    update(delta, time) {
        // Update shader uniform
        this.glitchUniforms.time.value = time;

        // Slow rotation of the whole group
        this.mesh.rotation.y += 0.05 * delta;

        // Erratic movement of fragments
        this.fragments.forEach(f => {
            f.mesh.rotation.x += f.speedX;
            f.mesh.rotation.y += f.speedY;

            // Glitchy position snapping
            if (Math.random() > 0.98) {
                f.mesh.position.x += (Math.random() - 0.5) * 5;
            }
        });
    }
}