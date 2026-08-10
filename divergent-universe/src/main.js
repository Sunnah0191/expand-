import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, neonWhiteMaterial, neonBlueMaterial, monolithMaterial } from './utils/Materials.js';

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
    const baseGeo = new THREE.BoxGeometry(10, 10, 10);
    const matteMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.1, metalness: 0.9 });

    switch (type) {
        case 'mid-poly-rock':
            mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 0), matteMat);
            pos.y += 8;
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(new THREE.OctahedronGeometry(6, 0), glassMaterial);
            pos.y += 6;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(new THREE.ConeGeometry(4, 15, 5), neonCyanMaterial);
            pos.y += 7.5;
            break;
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 10), monolithMaterial);
            pos.y += 20;
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(5, 8, 50, 6), monolithMaterial);
            pos.y += 25;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 10), matteMat);
            pos.y += 1;
            break;
        case 'block-glass':
            mesh = new THREE.Mesh(baseGeo, glassMaterial);
            pos.y += 5;
            break;
        case 'block-chrome':
            mesh = new THREE.Mesh(baseGeo, chromeMat);
            pos.y += 5;
            break;
        case 'block-neon':
            mesh = new THREE.Mesh(baseGeo, neonBlueMaterial);
            pos.y += 5;
            break;
        case 'block-matte':
            mesh = new THREE.Mesh(baseGeo, matteMat);
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
