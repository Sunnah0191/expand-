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
    matteMetalMaterial
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
    if (type === 'rock') {
        const geo = new THREE.DodecahedronGeometry(5, 1);
        mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9 }));
        pos.y += 5;
    } else if (type === 'glass-crystal') {
        const geo = new THREE.ConeGeometry(3, 12, 4);
        const mat = glassMaterial.clone();
        mat.color.setHex(0xaaffff);
        mesh = new THREE.Mesh(geo, mat);
        pos.y += 6;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, 10), new THREE.MeshStandardMaterial({color: 0x222222}));
        trunk.position.y = 5;
        const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 0), neonCyanMaterial);
        leaves.position.y = 10;
        mesh.add(trunk);
        mesh.add(leaves);
    } else if (type === 'futuristic-monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 10), monolithMaterial);
        pos.y += 15;
    } else if (type === 'levitating-tower') {
        mesh = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(8, 20, 8), new THREE.MeshStandardMaterial({color: 0x111111}));
        base.position.y = 15;
        const core = new THREE.Mesh(new THREE.BoxGeometry(4, 25, 4), neonCyanMaterial);
        core.position.y = 15;
        mesh.add(base);
        mesh.add(core);
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 8), matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'block-glass') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), glassMaterial);
        pos.y += 2.5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), chromeMaterial);
        pos.y += 2.5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), neonCyanMaterial);
        pos.y += 2.5;
    } else if (type === 'block-matte') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), matteMetalMaterial);
        pos.y += 2.5;
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
