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
    crystalMaterial
} from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;

// Geometry cache to prevent memory leaks
const geoCache = {
    rock: new THREE.IcosahedronGeometry(10, 0),
    crystal: new THREE.ConeGeometry(4, 20, 4),
    neonTreeTrunk: new THREE.CylinderGeometry(1, 1, 10),
    neonTreeLeaves: new THREE.IcosahedronGeometry(6, 1),
    monolith: new THREE.BoxGeometry(15, 30, 15),
    darkTowerBase: new THREE.CylinderGeometry(8, 6, 20, 6),
    darkTowerTop: new THREE.CylinderGeometry(6, 0, 15, 6),
    matteBridge: new THREE.BoxGeometry(40, 2, 15),
    block: new THREE.BoxGeometry(10, 10, 10)
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

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position.clone();
    const type = buildMenu.getSelectedType();

    let mesh;

    switch (type) {
        case 'rock':
            mesh = new THREE.Mesh(geoCache.rock, rockMaterial);
            pos.y += 5;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(geoCache.crystal, crystalMaterial);
            pos.y += 10;
            break;
        case 'neon-tree':
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(geoCache.neonTreeTrunk, monolithMaterial);
            trunk.position.y = 5;
            const leaves = new THREE.Mesh(geoCache.neonTreeLeaves, neonCyanMaterial);
            leaves.position.y = 12;
            mesh.add(trunk);
            mesh.add(leaves);
            break;
        case 'monolith':
            mesh = new THREE.Mesh(geoCache.monolith, monolithMaterial);
            pos.y += 15;
            break;
        case 'dark-tower':
            mesh = new THREE.Group();
            const base = new THREE.Mesh(geoCache.darkTowerBase, monolithMaterial);
            base.position.y = 10;
            const top = new THREE.Mesh(geoCache.darkTowerTop, monolithMaterial);
            top.position.y = 30; // Float slightly above
            mesh.add(base);
            mesh.add(top);
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(geoCache.matteBridge, matteMetalMaterial);
            pos.y += 1;
            break;
        case 'glass-block':
            mesh = new THREE.Mesh(geoCache.block, glassMaterial);
            pos.y += 5;
            break;
        case 'chrome-block':
            mesh = new THREE.Mesh(geoCache.block, chromeMaterial);
            pos.y += 5;
            break;
        case 'neon-block':
            mesh = new THREE.Mesh(geoCache.block, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'matte-metal-block':
            mesh = new THREE.Mesh(geoCache.block, matteMetalMaterial);
            pos.y += 5;
            break;
        default:
            // Fallback for old types if any
            mesh = new THREE.Mesh(geoCache.block, glassMaterial);
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

    renderer.render(scene, camera);
}
