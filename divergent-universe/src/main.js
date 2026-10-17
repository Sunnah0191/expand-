import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, neonBlueMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial } from './utils/Materials.js';

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

// Reusable geometries
const baseBoxGeo = new THREE.BoxGeometry(10, 10, 10);
const flatBoxGeo = new THREE.BoxGeometry(20, 2, 40);
const tallBoxGeo = new THREE.BoxGeometry(15, 40, 15);
const baseCylinderGeo = new THREE.CylinderGeometry(2, 2, 20);
const treeCanopyGeo = new THREE.BoxGeometry(10, 10, 10); // A boxy canopy for mid-poly
const crystalGeo = new THREE.CylinderGeometry(0, 4, 15, 4); // Pointy top, 4 sides

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
    if (type === 'glass-block' || type === 'glass-cube') {
        mesh = new THREE.Mesh(baseBoxGeo, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(baseBoxGeo, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(baseBoxGeo, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal-block') {
        mesh = new THREE.Mesh(baseBoxGeo, matteMetalMaterial);
        pos.y += 5;
    } else if (type === 'rock') {
        mesh = new THREE.Mesh(baseBoxGeo, monolithMaterial);
        // Make it look a bit like a random rock by scaling and rotating
        mesh.scale.set(Math.random() * 0.5 + 1, Math.random() * 0.5 + 1, Math.random() * 0.5 + 1);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        pos.y += 5;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(crystalGeo, glassMaterial);
        pos.y += 7.5;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(baseCylinderGeo, monolithMaterial);
        trunk.position.y = 10;
        const canopy = new THREE.Mesh(treeCanopyGeo, neonCyanMaterial);
        canopy.position.y = 20;
        mesh.add(trunk);
        mesh.add(canopy);
    } else if (type === 'futuristic-monolith' || type === 'monolith') {
        mesh = new THREE.Mesh(tallBoxGeo, monolithMaterial);
        pos.y += 20;
    } else if (type === 'levitating-tower') {
        mesh = new THREE.Group();
        const base = new THREE.Mesh(baseBoxGeo, monolithMaterial);
        base.position.y = 5;
        const mid = new THREE.Mesh(baseBoxGeo, monolithMaterial);
        mid.scale.set(0.8, 1.5, 0.8);
        mid.position.y = 20;
        const top = new THREE.Mesh(baseBoxGeo, neonBlueMaterial);
        top.scale.set(0.5, 0.5, 0.5);
        top.position.y = 35;
        mesh.add(base);
        mesh.add(mid);
        mesh.add(top);
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(flatBoxGeo, matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(baseCylinderGeo, neonCyanMaterial);
        pos.y += 10;
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
