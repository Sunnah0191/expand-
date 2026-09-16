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
let goldenParticles = null;
let particleTime = 0;

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

        // Trigger Golden Particle Explosion
        triggerGoldenExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerGoldenExplosion() {
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        // Start near the camera
        positions[i] = camera.position.x + (Math.random() - 0.5) * 50;
        positions[i + 1] = camera.position.y + (Math.random() - 0.5) * 50;
        positions[i + 2] = camera.position.z - 50 + (Math.random() - 0.5) * 50;

        // Explode outward
        velocities[i] = (Math.random() - 0.5) * 200;
        velocities[i + 1] = (Math.random() - 0.5) * 200;
        velocities[i + 2] = (Math.random() - 0.5) * 200;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3.0,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });

    goldenParticles = new THREE.Points(geometry, material);
    scene.add(goldenParticles);
    particleTime = 0;
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Ландшафт (Landscape)
    if (type === 'rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 1), matteMetalMaterial);
        pos.y += 8;
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(6, 0), glassMaterial);
        mesh.scale.set(1, 2, 1);
        pos.y += 12;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 15), matteMetalMaterial);
        trunk.position.y = 7.5;
        const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 0), neonCyanMaterial);
        leaves.position.y = 15;
        mesh.add(trunk);
        mesh.add(leaves);

    // Архитектура WuWa (WuWa Architecture)
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 40, 15), monolithMaterial);
        pos.y += 20;
    } else if (type === 'levitating-tower') {
        mesh = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 30, 6), monolithMaterial);
        base.position.y = 15;
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(5, 0), neonCyanMaterial);
        crystal.position.y = 35;
        mesh.add(base);
        mesh.add(crystal);
        // Elevate it slightly so it floats
        pos.y += 10;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 10), glassMaterial);
        pos.y += 1;

    // Конструктор (Блоки) (Blocks)
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'metal-cube') {
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

    // Update golden particles
    if (goldenParticles) {
        particleTime += delta;
        const positions = goldenParticles.geometry.attributes.position.array;
        const velocities = goldenParticles.geometry.attributes.velocity.array;

        for(let i=0; i < positions.length; i++) {
            positions[i] += velocities[i] * delta;
        }

        goldenParticles.geometry.attributes.position.needsUpdate = true;
        goldenParticles.material.opacity = Math.max(0, 1.0 - particleTime * 1.5);

        if (particleTime > 2.0) {
            scene.remove(goldenParticles);
            goldenParticles.geometry.dispose();
            goldenParticles.material.dispose();
            goldenParticles = null;
        }
    }

    renderer.render(scene, camera);
}
