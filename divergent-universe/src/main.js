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
let explosionParticles = null;
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

function createExplosionEffect() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        // random sphere points
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;

        const x = Math.cos(theta) * Math.sin(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(phi);

        positions[i * 3] = 0;
        positions[i * 3 + 1] = 50; // origin somewhat above
        positions[i * 3 + 2] = 100; // in front of camera start pos

        const speed = Math.random() * 200 + 50;
        velocities.push({ x: x * speed, y: y * speed, z: z * speed });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    explosionParticles = new THREE.Points(geometry, material);
    explosionParticles.userData.velocities = velocities;
    scene.add(explosionParticles);
    particleTime = 0;
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();
        createExplosionEffect();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    // Ландшафт
    if (type === 'rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 0), monolithMaterial);
        pos.y += 6;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(new THREE.ConeGeometry(5, 20, 4), glassMaterial);
        pos.y += 10;
    } else if (type === 'neon-tree') {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 15), monolithMaterial);
        trunk.position.y = 7.5;
        const leaves = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8), neonCyanMaterial);
        leaves.position.y = 15;
        group.add(trunk);
        group.add(leaves);
        mesh = group;
        pos.y += 0;
    }
    // Архитектура WuWa
    else if (type === 'floating-tower') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 10), glassMaterial);
        pos.y += 20; // It floats or just sits there
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(12, 50, 12), monolithMaterial);
        pos.y += 25;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 10), matteMetalMaterial);
        pos.y += 1;
    }
    // Конструктор (Блоки)
    else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-cube') {
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

    // Update explosion particles
    if (explosionParticles) {
        particleTime += delta;
        const positions = explosionParticles.geometry.attributes.position.array;
        const velocities = explosionParticles.userData.velocities;

        for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x * delta;
            positions[i * 3 + 1] += velocities[i].y * delta;
            positions[i * 3 + 2] += velocities[i].z * delta;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;

        // Fade out
        explosionParticles.material.opacity = Math.max(0, 1 - (particleTime / 2.0));

        if (particleTime > 2.0) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        }
    }

    renderer.render(scene, camera);
}
