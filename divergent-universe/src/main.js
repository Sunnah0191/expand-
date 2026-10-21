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

// Explosion Effect
let explosionParticles = null;
let explosionStartTime = 0;

// Geometry Cache to prevent memory leaks
const geometryCache = {
    rockGeo: new THREE.DodecahedronGeometry(5, 1),
    crystalGeo: new THREE.OctahedronGeometry(4, 0),
    treeGeo: new THREE.ConeGeometry(3, 15, 5),
    monolithGeo: new THREE.BoxGeometry(10, 30, 10),
    towerGeo: new THREE.CylinderGeometry(8, 6, 40, 6),
    bridgeGeo: new THREE.BoxGeometry(30, 2, 8),
    cubeGeo: new THREE.BoxGeometry(10, 10, 10),
    pillarGeo: new THREE.CylinderGeometry(2, 2, 20)
};

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

function createExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 120; // roughly central core height
        positions[i * 3 + 2] = 0;

        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 50 + Math.random() * 150;

        velocities.push(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
        );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities };
    return points;
}

function updateExplosion() {
    if (!explosionParticles) return;

    const currentTime = performance.now();
    const elapsed = (currentTime - explosionStartTime) / 1000; // in seconds

    if (elapsed > 3) {
        scene.remove(explosionParticles);
        explosionParticles.geometry.dispose();
        explosionParticles.material.dispose();
        explosionParticles = null;
        return;
    }

    const positions = explosionParticles.geometry.attributes.position.array;
    const velocities = explosionParticles.userData.velocities;

    // Using a manual delta for explosion independent of the main clock
    // Using simple approx for dt assuming 60fps
    const dt = 1/60;

    for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * dt;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;

        // Gravity
        velocities[i * 3 + 1] -= 90 * dt;
    }

    explosionParticles.geometry.attributes.position.needsUpdate = true;
    explosionParticles.material.opacity = 1 - (elapsed / 3);
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();

        // Trigger Explosion
        explosionParticles = createExplosion();
        scene.add(explosionParticles);
        explosionStartTime = performance.now();
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
    switch (type) {
        case 'midpoly-rock':
            mesh = new THREE.Mesh(geometryCache.rockGeo, monolithMaterial);
            pos.y += 5;
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(geometryCache.crystalGeo, glassMaterial);
            pos.y += 4;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(geometryCache.treeGeo, glassMaterial);
            pos.y += 7.5;
            break;
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(geometryCache.monolithGeo, neonCyanMaterial);
            pos.y += 15;
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(geometryCache.towerGeo, monolithMaterial);
            pos.y += 20;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(geometryCache.bridgeGeo, matteMetalMaterial);
            pos.y += 1;
            break;
        case 'glass-block':
            mesh = new THREE.Mesh(geometryCache.cubeGeo, glassMaterial);
            pos.y += 5;
            break;
        case 'chrome-block':
            mesh = new THREE.Mesh(geometryCache.cubeGeo, chromeMaterial);
            pos.y += 5;
            break;
        case 'neon-block':
            mesh = new THREE.Mesh(geometryCache.pillarGeo, neonCyanMaterial);
            pos.y += 10;
            break;
        case 'matte-metal-block':
            mesh = new THREE.Mesh(geometryCache.cubeGeo, matteMetalMaterial);
            pos.y += 5;
            break;
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

    updateExplosion();

    renderer.render(scene, camera);
}
