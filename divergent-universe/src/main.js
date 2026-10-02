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
let lastExplosionTime = 0;

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
        triggerGoldenExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerGoldenExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        // Start near camera
        positions[i * 3] = camera.position.x + (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = camera.position.z - 20 + (Math.random() - 0.5) * 10;

        // Velocity radiating outwards
        velocities.push({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            z: (Math.random() - 0.5) * 200
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });

    goldenParticles = new THREE.Points(geometry, material);
    goldenParticles.userData.velocities = velocities;
    scene.add(goldenParticles);

    lastExplosionTime = performance.now();

    // Remove after some time
    setTimeout(() => {
        if (goldenParticles) {
            scene.remove(goldenParticles);
            goldenParticles.geometry.dispose();
            goldenParticles.material.dispose();
            goldenParticles = null;
        }
    }, 2000);
}

// Cache geometries
const cachedGeometries = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    cylinder2_20: new THREE.CylinderGeometry(2, 2, 20),
    box15_30: new THREE.BoxGeometry(15, 30, 15),
    rock: new THREE.DodecahedronGeometry(10, 1),
    crystal: new THREE.OctahedronGeometry(5, 0),
    neonTree: new THREE.ConeGeometry(3, 20, 5),
    darkTower: new THREE.BoxGeometry(12, 60, 12),
    matteBridge: new THREE.BoxGeometry(30, 2, 8)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    switch (type) {
        case 'glass-cube':
            mesh = new THREE.Mesh(cachedGeometries.box10, glassMaterial);
            pos.y += 5;
            break;
        case 'neon-pillar':
            mesh = new THREE.Mesh(cachedGeometries.cylinder2_20, neonCyanMaterial);
            pos.y += 10;
            break;
        case 'monolith':
            mesh = new THREE.Mesh(cachedGeometries.box15_30, monolithMaterial);
            pos.y += 15;
            break;
        case 'rock':
            mesh = new THREE.Mesh(cachedGeometries.rock, matteMetalMaterial);
            pos.y += 8;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(cachedGeometries.crystal, glassMaterial);
            mesh.scale.set(1, 2, 1);
            pos.y += 10;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(cachedGeometries.neonTree, neonCyanMaterial);
            pos.y += 10;
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(cachedGeometries.darkTower, monolithMaterial);
            pos.y += 30;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(cachedGeometries.matteBridge, matteMetalMaterial);
            pos.y += 1;
            break;
        case 'chrome-block':
            mesh = new THREE.Mesh(cachedGeometries.box10, chromeMaterial);
            pos.y += 5;
            break;
        case 'matte-metal':
            mesh = new THREE.Mesh(cachedGeometries.box10, matteMetalMaterial);
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

    if (goldenParticles) {
        const now = performance.now();
        const pDelta = (now - lastExplosionTime) / 1000;
        lastExplosionTime = now;

        const positions = goldenParticles.geometry.attributes.position.array;
        const velocities = goldenParticles.userData.velocities;

        for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x * pDelta;
            positions[i * 3 + 1] += velocities[i].y * pDelta;
            positions[i * 3 + 2] += velocities[i].z * pDelta;
        }

        goldenParticles.geometry.attributes.position.needsUpdate = true;

        if (goldenParticles.material.opacity > 0) {
            goldenParticles.material.opacity -= pDelta * 0.5;
        }
    }

    renderer.render(scene, camera);
}
