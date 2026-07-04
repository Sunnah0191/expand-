import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, metalMaterial, neonGreenMaterial } from './utils/Materials.js';

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
    camera.position.set(0, 120, 150);
    camera.lookAt(0, 120, 0);

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
    switch (type) {
        case 'rock':
            mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(5), monolithMaterial);
            pos.y += 5;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(new THREE.OctahedronGeometry(4), glassMaterial);
            pos.y += 4;
            break;
        case 'tree':
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, 10), monolithMaterial);
            trunk.position.y = 5;
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(4, 10, 8), neonGreenMaterial);
            leaves.position.y = 12;
            mesh.add(trunk);
            mesh.add(leaves);
            break;
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 10), monolithMaterial);
            pos.y += 20;
            break;
        case 'tower':
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(8, 5, 50, 8), monolithMaterial);
            pos.y += 30; // slightly floating or very tall
            break;
        case 'bridge':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 10), metalMaterial);
            pos.y += 1;
            break;
        case 'glass-cube':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
            pos.y += 5;
            break;
        case 'chrome-cube':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
            pos.y += 5;
            break;
        case 'neon-cube':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
            pos.y += 5;
            break;
        case 'metal-cube':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), metalMaterial);
            pos.y += 5;
            break;
        default:
            // Fallback for older items like neon-pillar and monolith if they were kept
            if (type === 'neon-pillar') {
                mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
                pos.y += 10;
            } else if (type === 'monolith') {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
                pos.y += 15;
            }
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
