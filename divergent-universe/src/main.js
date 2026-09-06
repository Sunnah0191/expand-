import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import {
    glassMaterial, neonCyanMaterial, monolithMaterial,
    rockMaterial, darkTowerMaterial, matteBridgeMaterial,
    chromeMaterial, matteMetalMaterial
} from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;

// Cached Geometries
const geoCache = {
    rock: new THREE.DodecahedronGeometry(5, 1),
    crystal: new THREE.OctahedronGeometry(5, 0),
    neonTree: new THREE.ConeGeometry(2, 15, 5),
    darkTower: new THREE.BoxGeometry(8, 40, 8),
    matteBridge: new THREE.BoxGeometry(30, 2, 10),
    glassCube: new THREE.BoxGeometry(10, 10, 10),
    chromeBlock: new THREE.BoxGeometry(10, 10, 10),
    neonBlock: new THREE.BoxGeometry(10, 10, 10),
    matteMetal: new THREE.BoxGeometry(10, 10, 10)
};

// Explosion particle system
let explosionParticles = null;

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
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Start at camera position
            positions[i * 3] = camera.position.x;
            positions[i * 3 + 1] = camera.position.y;
            positions[i * 3 + 2] = camera.position.z;

            // Random spherical velocity
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(Math.random() * 2 - 1);
            const speed = 50 + Math.random() * 100;

            velocities.push(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta),
                speed * Math.cos(phi)
            );
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 1.5,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        explosionParticles = new THREE.Points(geometry, material);
        explosionParticles.userData.velocities = velocities;
        explosionParticles.userData.age = 0;
        scene.add(explosionParticles);

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

    // Landscape
    if (type === 'rock') {
        mesh = new THREE.Mesh(geoCache.rock, rockMaterial);
        pos.y += 5;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geoCache.crystal, glassMaterial);
        mesh.scale.set(1, 2, 1);
        pos.y += 10;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geoCache.neonTree, neonCyanMaterial);
        pos.y += 7.5;

    // WuWa Architecture
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        pos.y += 15;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(geoCache.darkTower, darkTowerMaterial);
        pos.y += 20;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geoCache.matteBridge, matteBridgeMaterial);
        pos.y += 1;

    // Blocks
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geoCache.glassCube, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(geoCache.chromeBlock, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(geoCache.neonBlock, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal') {
        mesh = new THREE.Mesh(geoCache.matteMetal, matteMetalMaterial);
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
        explosionParticles.userData.age += delta;
        const positions = explosionParticles.geometry.attributes.position.array;
        const vels = explosionParticles.userData.velocities;

        for(let i=0; i<vels.length/3; i++) {
            positions[i*3] += vels[i*3] * delta;
            positions[i*3+1] += vels[i*3+1] * delta;
            positions[i*3+2] += vels[i*3+2] * delta;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;

        // Fade out
        explosionParticles.material.opacity = Math.max(0, 1.0 - (explosionParticles.userData.age / 2.0));

        if (explosionParticles.userData.age > 2.0) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        }
    }

    renderer.render(scene, camera);
}
