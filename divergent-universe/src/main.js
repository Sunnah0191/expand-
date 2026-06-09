import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, matteMetalMaterial, chromeMaterial } from './utils/Materials.js';

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

    let mesh = new THREE.Group();
    let meshContent = null;
    let yOffset = 0;

    if (type === 'glass-cube') {
        meshContent = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        yOffset = 5;
    } else if (type === 'neon-block') {
        meshContent = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        yOffset = 5;
    } else if (type === 'chrome-block') {
        meshContent = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        yOffset = 5;
    } else if (type === 'matte-metal-block') {
        meshContent = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), matteMetalMaterial);
        yOffset = 5;
    } else if (type === 'monolith') {
        meshContent = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        yOffset = 15;
    } else if (type === 'dark-tower') {
        meshContent = new THREE.Mesh(new THREE.CylinderGeometry(5, 8, 40, 8), monolithMaterial);
        yOffset = 20;
    } else if (type === 'matte-bridge') {
        meshContent = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 10), matteMetalMaterial);
        const neonLine = new THREE.Mesh(new THREE.BoxGeometry(30.2, 0.5, 0.5), neonCyanMaterial);
        neonLine.position.y = 1;
        meshContent.add(neonLine);
        yOffset = 1;
    } else if (type === 'rock') {
        const geo = new THREE.DodecahedronGeometry(8, 1);
        meshContent = new THREE.Mesh(geo, monolithMaterial);
        meshContent.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        yOffset = 5;
    } else if (type === 'crystal') {
        const geo = new THREE.OctahedronGeometry(6, 0);
        const mat = glassMaterial.clone();
        mat.color = new THREE.Color(0x00ffff);
        meshContent = new THREE.Mesh(geo, mat);
        meshContent.scale.set(1, 2, 1);
        yOffset = 10;
    } else if (type === 'neon-tree') {
        const trunkGeo = new THREE.CylinderGeometry(1, 1.5, 10);
        const trunkMat = monolithMaterial;
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 5;

        const leavesGeo = new THREE.SphereGeometry(6, 8, 8);
        const leavesMat = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8,
            roughness: 0.2
        });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 12;

        meshContent = new THREE.Group();
        meshContent.add(trunk);
        meshContent.add(leaves);
        // yOffset already accounted for in local positions of trunk/leaves
    }

    if (meshContent) {
        if (meshContent instanceof THREE.Mesh) {
            mesh.add(meshContent);
            meshContent.position.y = yOffset;
        } else {
            // Already a group (e.g. tree)
            mesh = meshContent;
        }

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
