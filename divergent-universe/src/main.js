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

// Cached geometries for performance
const cachedGeometries = {
    box: new THREE.BoxGeometry(10, 10, 10),
    crystal: new THREE.OctahedronGeometry(5, 0),
    treeCone: new THREE.ConeGeometry(3, 15, 8),
    treeTrunk: new THREE.CylinderGeometry(1, 1, 5, 8),
    rock: new THREE.DodecahedronGeometry(8, 1),
    monolith: new THREE.BoxGeometry(15, 30, 15),
    tower: new THREE.BoxGeometry(20, 60, 20),
    bridge: new THREE.BoxGeometry(40, 2, 10)
};

// Explosion particles global
let explosionParticles = null;
let explosionTime = 0;

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
        triggerExplosionEffect();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerExplosionEffect() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x;
        positions[i * 3 + 1] = camera.position.y;
        positions[i * 3 + 2] = camera.position.z - 20;

        velocities.push(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200
        );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    explosionParticles = new THREE.Points(geometry, material);
    explosionParticles.userData.velocities = velocities;
    scene.add(explosionParticles);
    explosionTime = 0;
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    switch(type) {
        case 'glass-crystal':
            mesh = new THREE.Mesh(cachedGeometries.crystal, glassMaterial);
            mesh.scale.set(1, 2, 1);
            pos.y += 5;
            break;
        case 'neon-tree':
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(cachedGeometries.treeTrunk, monolithMaterial);
            trunk.position.y = 2.5;
            const leaves = new THREE.Mesh(cachedGeometries.treeCone, neonCyanMaterial);
            leaves.position.y = 10;
            mesh.add(trunk);
            mesh.add(leaves);
            break;
        case 'rock':
            mesh = new THREE.Mesh(cachedGeometries.rock, monolithMaterial);
            pos.y += 8;
            break;
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(cachedGeometries.monolith, monolithMaterial);
            pos.y += 15;
            break;
        case 'levitating-tower':
            mesh = new THREE.Mesh(cachedGeometries.tower, monolithMaterial);
            pos.y += 40;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(cachedGeometries.bridge, matteMetalMaterial);
            break;
        case 'glass-cube':
            mesh = new THREE.Mesh(cachedGeometries.box, glassMaterial);
            pos.y += 5;
            break;
        case 'chrome-cube':
            mesh = new THREE.Mesh(cachedGeometries.box, chromeMaterial);
            pos.y += 5;
            break;
        case 'neon-cube':
            mesh = new THREE.Mesh(cachedGeometries.box, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'matte-cube':
            mesh = new THREE.Mesh(cachedGeometries.box, matteMetalMaterial);
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

    if (explosionParticles) {
        explosionTime += delta;
        const positions = explosionParticles.geometry.attributes.position.array;
        const velocities = explosionParticles.userData.velocities;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * delta;
            positions[i+1] += velocities[i+1] * delta;
            positions[i+2] += velocities[i+2] * delta;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;

        explosionParticles.material.opacity = Math.max(0, 1 - explosionTime / 2);

        if (explosionTime > 2) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        }
    }

    renderer.render(scene, camera);
}
