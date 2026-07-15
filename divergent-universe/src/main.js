import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, rockMaterial, crystalMaterial, chromeMaterial, metalMaterial } from './utils/Materials.js';

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
    switch (type) {
        // Ландшафт
        case 'rock':
            mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 1), rockMaterial);
            pos.y += 6;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(new THREE.OctahedronGeometry(6, 0), crystalMaterial);
            mesh.scale.set(1, 2, 1);
            pos.y += 12;
            break;
        case 'neon-tree':
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 10), monolithMaterial);
            trunk.position.y = 5;
            const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 0), neonCyanMaterial);
            foliage.position.y = 12;
            mesh.add(trunk, foliage);
            break;

        // Архитектура WuWa
        case 'monolith':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
            pos.y += 15;
            break;
        case 'tower':
            mesh = new THREE.Group();
            const base = new THREE.Mesh(new THREE.BoxGeometry(12, 40, 12), monolithMaterial);
            base.position.y = 20;
            const core = new THREE.Mesh(new THREE.BoxGeometry(4, 30, 4), neonCyanMaterial);
            core.position.y = 20;
            const top = new THREE.Mesh(new THREE.OctahedronGeometry(8, 0), chromeMaterial);
            top.position.y = 45;
            mesh.add(base, core, top);
            break;
        case 'bridge':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 10), glassMaterial);
            pos.y += 1;
            break;

        // Конструктор (Блоки)
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
    }

    if (mesh) {
        mesh.position.copy(pos);
        if (mesh.type !== 'Group') {
             mesh.castShadow = true;
             mesh.receiveShadow = true;
        } else {
             mesh.children.forEach(c => {
                 c.castShadow = true;
                 c.receiveShadow = true;
             });
        }
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
