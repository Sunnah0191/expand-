import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;

// God Mode explosion particles
let godModeParticles = null;
let godModeExplosionTime = 0;

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
        triggerGodModeExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerGodModeExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 50; // Camera height approx
        positions[i * 3 + 2] = 140; // Slightly in front of camera

        // Random spherical velocities
        const r = Math.random() * 50 + 10;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);

        velocities.push({
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi)
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    godModeParticles = new THREE.Points(geometry, material);
    godModeParticles.userData = { velocities: velocities };
    scene.add(godModeParticles);

    godModeExplosionTime = performance.now();
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    if (type === 'rock') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), monolithMaterial);
        mesh.rotation.set(Math.random(), Math.random(), Math.random());
        pos.y += 10;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0, 10, 30, 4, 1), glassMaterial);
        pos.y += 15;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 15), monolithMaterial);
        trunk.position.y = 7.5;
        const leaves = new THREE.Mesh(new THREE.CylinderGeometry(0, 12, 20, 8), neonCyanMaterial);
        leaves.position.y = 25;
        mesh.add(trunk);
        mesh.add(leaves);
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        pos.y += 15;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 80, 20), monolithMaterial);
        pos.y += 40;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(100, 5, 20), matteMetalMaterial);
        pos.y += 2.5;
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'matte-metal') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), matteMetalMaterial);
        pos.y += 5;
    }

    if (mesh) {
        mesh.position.copy(pos);
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

    // Update god mode explosion
    if (godModeParticles) {
        const timeElapsed = (performance.now() - godModeExplosionTime) / 1000; // in seconds

        if (timeElapsed > 3) {
            scene.remove(godModeParticles);
            godModeParticles.geometry.dispose();
            godModeParticles.material.dispose();
            godModeParticles = null;
        } else {
            const positions = godModeParticles.geometry.attributes.position.array;
            const vels = godModeParticles.userData.velocities;

            for (let i = 0; i < vels.length; i++) {
                positions[i * 3] += vels[i].x * delta * (1 - timeElapsed/3);
                positions[i * 3 + 1] += vels[i].y * delta * (1 - timeElapsed/3);
                positions[i * 3 + 2] += vels[i].z * delta * (1 - timeElapsed/3);
            }

            godModeParticles.geometry.attributes.position.needsUpdate = true;
            godModeParticles.material.opacity = 1 - (timeElapsed / 3);
        }
    }

    renderer.render(scene, camera);
}
