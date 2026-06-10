import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, frostedMetalMaterial } from './utils/Materials.js';

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
    camera.position.set(0, 80, 250);
    camera.lookAt(0, 120, 0); // look at CentralCore

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
    if (type === 'glass-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
        pos.y += 10; // offset so it sits on ground
    } else if (type === 'frosted-metal') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), frostedMetalMaterial);
        pos.y += 5;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        pos.y += 15;
    } else if (type === 'rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 1), new THREE.MeshStandardMaterial({color: 0x555555, roughness: 0.9}));
        pos.y += 6;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(6, 0), glassMaterial);
        mesh.scale.set(1, 2, 1);
        pos.y += 10;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10), monolithMaterial);
        trunk.position.y = 5;
        const leaves = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), neonCyanMaterial);
        leaves.position.y = 12;
        mesh.add(trunk);
        mesh.add(leaves);
    } else if (type === 'levi-tower') {
        mesh = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(12, 40, 12), monolithMaterial);
        base.position.y = 20;
        const cap = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 14), neonCyanMaterial);
        cap.position.y = 41;
        mesh.add(base);
        mesh.add(cap);
    } else if (type === 'frosted-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 40), glassMaterial);
        pos.y += 1;
    }

    if (mesh) {
        mesh.position.copy(pos);
        // Cast and receive shadows for user placed blocks (if it is a single mesh)
        if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        } else if (mesh.isGroup) {
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
