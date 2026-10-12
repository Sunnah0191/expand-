import * as THREE from 'three';

// 1. Glassmorphism Material (High transmission, some roughness, thickness)
export const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.2,
    transmission: 0.95, // glass-like transparency
    ior: 1.5,
    thickness: 2.0,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide
});

// 2. Monolith/Dark Stone Material
export const monolithMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a24,
    roughness: 0.8,
    metalness: 0.2,
    flatShading: true
});

// 3. Neon/Emissive Materials
export const neonCyanMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.0,
    roughness: 0.2,
    metalness: 0.8
});

export const neonBlueMaterial = new THREE.MeshStandardMaterial({
    color: 0x0055ff,
    emissive: 0x0055ff,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.8
});

export const neonWhiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.5,
    roughness: 0.1,
    metalness: 0.5
});

// 4. Glitch Material (Custom Shader)
const glitchVertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;

    // Simplex noise function approximation for displacement
    float random (vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        vUv = uv;
        vPosition = position;

        vec3 pos = position;

        // Simple glitch displacement on X axis based on time and Y position
        float glitchAmt = random(vec2(pos.y * 10.0, time)) * 0.5;
        if (glitchAmt > 0.45) {
            pos.x += (random(vec2(time, pos.z)) - 0.5) * 2.0;
        }

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const glitchFragmentShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;
    uniform vec3 color;

    void main() {
        // Scanline effect
        float scanline = sin(vPosition.y * 50.0 - time * 10.0) * 0.04;
        vec3 finalColor = color + vec3(scanline);

        // Color aberration
        float r = finalColor.r;
        float g = finalColor.g;
        float b = finalColor.b;

        if (sin(time * 5.0 + vPosition.y) > 0.9) {
            r = color.g; // shift colors
            b = color.r;
        }

        gl_FragColor = vec4(r, g, b, 0.8);
    }
`;

export const glitchMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
        color: { value: new THREE.Color(0x8800ff) }
    },
    vertexShader: glitchVertexShader,
    fragmentShader: glitchFragmentShader,
    transparent: true,
    wireframe: false
});

// Helper function to update shader uniforms
export function updateMaterials(delta, time) {
    glitchMaterial.uniforms.time.value = time;
}

// 5. Ocean Material (Dark, slightly reflective)
export const oceanMaterial = new THREE.MeshStandardMaterial({
    color: 0x02050a,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.9
});

// 6. Chrome / Mirror Material
export const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 1.0
});

// 7. Matte Metal Material
export const matteMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.6,
    metalness: 0.8
});
