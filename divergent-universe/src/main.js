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
    crystalMaterial,
    neonWhiteMaterial
} from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;
let goldenParticles = null;
let explosionStartTime = 0;

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
        createGoldenExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function createGoldenExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        velocities.push({
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            z: (Math.random() - 0.5) * 100
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 1.5,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    goldenParticles = new THREE.Points(geometry, material);
    goldenParticles.userData.velocities = velocities;

    // Position particles in front of camera
    goldenParticles.position.copy(camera.position);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    goldenParticles.position.add(dir.multiplyScalar(20));

    scene.add(goldenParticles);
    explosionStartTime = performance.now();
}

// Geometry Caches
const geoCache = {
    glassCube: new THREE.BoxGeometry(10, 10, 10),
    chromeBlock: new THREE.BoxGeometry(10, 10, 10),
    metalBlock: new THREE.BoxGeometry(10, 10, 10),
    neonPillar: new THREE.CylinderGeometry(2, 2, 20),
    monolith: new THREE.BoxGeometry(15, 40, 15),
    levitatingTower: new THREE.BoxGeometry(8, 30, 8),
    matteBridge: new THREE.BoxGeometry(30, 2, 8),
    rock: new THREE.DodecahedronGeometry(10, 0),
    crystal: new THREE.OctahedronGeometry(8, 0)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geoCache.glassCube, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(geoCache.chromeBlock, chromeMaterial);
        pos.y += 5;
    } else if (type === 'metal-block') {
        mesh = new THREE.Mesh(geoCache.metalBlock, matteMetalMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(geoCache.neonPillar, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(geoCache.monolith, monolithMaterial);
        pos.y += 20;
    } else if (type === 'levitating-tower') {
        mesh = new THREE.Mesh(geoCache.levitatingTower, monolithMaterial);
        pos.y += 25; // Floating slightly above
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geoCache.matteBridge, matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'rock') {
        mesh = new THREE.Mesh(geoCache.rock, rockMaterial);
        pos.y += 5;
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(geoCache.crystal, crystalMaterial);
        pos.y += 5;
    } else if (type === 'neon-tree') {
        // Group for tree
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10), monolithMaterial);
        trunk.position.y = 5;
        const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 0), neonWhiteMaterial);
        leaves.position.y = 12;
        mesh.add(trunk);
        mesh.add(leaves);
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
        const timeElapsed = (performance.now() - explosionStartTime) / 1000;

        if (timeElapsed > 2) {
            scene.remove(goldenParticles);
            goldenParticles.geometry.dispose();
            goldenParticles.material.dispose();
            goldenParticles = null;
        } else {
            const positions = goldenParticles.geometry.attributes.position.array;
            const velocities = goldenParticles.userData.velocities;

            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += velocities[i].x * delta;
                positions[i * 3 + 1] += velocities[i].y * delta;
                positions[i * 3 + 2] += velocities[i].z * delta;
            }

            goldenParticles.geometry.attributes.position.needsUpdate = true;
            goldenParticles.material.opacity = 1 - (timeElapsed / 2);
        }
    }

    renderer.render(scene, camera);
}
