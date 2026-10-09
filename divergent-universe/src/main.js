import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import {
    glassMaterial,
    neonCyanMaterial,
    monolithMaterial,
    chromeMaterial,
    matteMetalMaterial,
    rockMaterial,
    leafMaterial
} from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;

init();
animate();

function init() {
    const container = document.getElementById('app');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a10);
    scene.fog = new THREE.FogExp2(0x050a10, 0.002);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 50, 150);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Clock
    clock = new THREE.Clock();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xaaccff, 2);
    dirLight.position.set(-100, 200, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;
    dirLight.shadow.camera.left = -200;
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1000;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Initialize World
    world = new World(scene);

    // Initialize UI
    buildMenu = new BuildMenu();
    const login = new LoginScreen(onLoginSuccess);

    // Initialize Controls (disabled initially)
    controls = new GodModeControls(camera, renderer.domElement, scene, () => buildMenu.getSelectedType());

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('placeBlock', onPlaceBlock);
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();

        // Trigger 3D golden particle explosion
        createGoldenExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

let goldenExplosion = null;
let explosionStartTime = 0;

function createGoldenExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        // Start near origin
        positions[i * 3] = (Math.random() - 0.5) * 5;
        positions[i * 3 + 1] = 120 + (Math.random() - 0.5) * 5; // Near central core
        positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

        // Spherical explosion velocity
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 50 + Math.random() * 100;

        velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        velocities[i * 3 + 1] = Math.cos(phi) * speed;
        velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    goldenExplosion = new THREE.Points(geometry, material);
    scene.add(goldenExplosion);
    explosionStartTime = performance.now();
}

// Cache geometries to prevent memory leaks
const geometries = {
    cube: new THREE.BoxGeometry(10, 10, 10),
    pillar: new THREE.CylinderGeometry(2, 2, 20, 16),
    monolith: new THREE.BoxGeometry(15, 30, 15),
    rock: new THREE.DodecahedronGeometry(8, 1),
    treeTrunk: new THREE.CylinderGeometry(1, 2, 15, 8),
    treeLeaves: new THREE.IcosahedronGeometry(8, 1),
    bridge: new THREE.BoxGeometry(40, 2, 10),
    crystal: new THREE.OctahedronGeometry(5, 0)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    let offset = 5; // Default offset half of cube

    switch (type) {
        // Landscape
        case 'rock':
            mesh = new THREE.Mesh(geometries.rock, rockMaterial);
            offset = 8;
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(geometries.crystal, glassMaterial);
            offset = 5;
            mesh.scale.set(1, 2, 1);
            break;
        case 'neon-tree':
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(geometries.treeTrunk, monolithMaterial);
            trunk.position.y = 7.5;
            const leaves = new THREE.Mesh(geometries.treeLeaves, leafMaterial);
            leaves.position.y = 15;

            // Add some neon accents
            const accent = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), neonCyanMaterial);
            accent.position.y = 15;

            mesh.add(trunk);
            mesh.add(leaves);
            mesh.add(accent);
            offset = 0; // The group handles its own vertical offsets
            break;

        // WuWa Architecture
        case 'monolith':
            mesh = new THREE.Mesh(geometries.monolith, monolithMaterial);
            offset = 15;
            break;
        case 'dark-tower':
            mesh = new THREE.Group();
            const base = new THREE.Mesh(new THREE.BoxGeometry(20, 60, 20), monolithMaterial);
            base.position.y = 30;
            const glow = new THREE.Mesh(new THREE.BoxGeometry(21, 2, 21), neonCyanMaterial);
            glow.position.y = 50;
            mesh.add(base);
            mesh.add(glow);
            offset = 0;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(geometries.bridge, matteMetalMaterial);
            offset = 1;
            break;

        // Constructor Blocks
        case 'glass-cube':
            mesh = new THREE.Mesh(geometries.cube, glassMaterial);
            break;
        case 'chrome-cube':
            mesh = new THREE.Mesh(geometries.cube, chromeMaterial);
            break;
        case 'neon-cube':
            mesh = new THREE.Mesh(geometries.cube, neonCyanMaterial);
            break;
        case 'matte-metal-cube':
            mesh = new THREE.Mesh(geometries.cube, matteMetalMaterial);
            break;
    }

    if (mesh) {
        mesh.position.copy(pos);
        mesh.position.y += offset;
        scene.add(mesh);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (world) {
        world.update(delta);
    }

    if (controls) {
        controls.update(delta);
    }

    // Update golden explosion
    if (goldenExplosion) {
        const now = performance.now();
        const elapsed = (now - explosionStartTime) / 1000; // in seconds

        if (elapsed > 2.0) { // Life time of 2 seconds
            scene.remove(goldenExplosion);
            goldenExplosion.geometry.dispose();
            goldenExplosion.material.dispose();
            goldenExplosion = null;
        } else {
            // Explode particles outwards
            const positions = goldenExplosion.geometry.attributes.position.array;
            const velocities = goldenExplosion.geometry.attributes.velocity.array;

            // local delta for manual update
            const dt = 0.016;

            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += velocities[i * 3] * dt;
                positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
                positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;

                // Add gravity
                velocities[i * 3 + 1] -= 9.8 * dt * 10;

                // Add drag
                velocities[i * 3] *= 0.95;
                velocities[i * 3 + 2] *= 0.95;
            }
            goldenExplosion.geometry.attributes.position.needsUpdate = true;

            // Fade out
            goldenExplosion.material.opacity = 1.0 - (elapsed / 2.0);
        }
    }

    renderer.render(scene, camera);
}
