import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, neonBlueMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let globalTime = 0;
let world;
let controls;
let buildMenu;
let isGodMode = false;
let particlesMesh;

// Custom Materials for blocks (Instantiated once for performance)
const blockChromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1.0, roughness: 0.1 });
const blockMetalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.6 });

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

    // Glowing particles for login screen
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 600;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 1.5,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

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

    // Hide particles when entering the world (optional, but looks cleaner)
    if (particlesMesh) {
        particlesMesh.visible = false;
    }

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
        // Landscape
        case 'rock':
            mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(10, 1), monolithMaterial);
            pos.y += 8;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(new THREE.ConeGeometry(5, 20, 4), glassMaterial);
            pos.y += 10;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), neonCyanMaterial);
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 10), monolithMaterial);
            trunk.position.y = -8;
            mesh.add(trunk);
            pos.y += 13;
            break;

        // WuWa
        case 'futuristic-monolith':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 10), monolithMaterial);
            const accent = new THREE.Mesh(new THREE.BoxGeometry(11, 2, 11), neonBlueMaterial);
            mesh.add(accent);
            pos.y += 20;
            break;
        case 'levitating-tower':
            mesh = new THREE.Group();
            const base = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 5, 8), monolithMaterial);
            const top = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 30, 8), monolithMaterial);
            top.position.y = 20;
            mesh.add(base);
            mesh.add(top);
            pos.y += 2; // hover slightly
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 10), glassMaterial);
            pos.y += 1;
            break;

        // Blocks
        case 'block-glass':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
            pos.y += 5;
            break;
        case 'block-chrome':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), blockChromeMat);
            pos.y += 5;
            break;
        case 'block-neon':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
            pos.y += 5;
            break;
        case 'block-metal':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), blockMetalMat);
            pos.y += 5;
            break;
    }

    if (mesh) {
        mesh.position.copy(pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
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
    globalTime += delta;

    if (!isGodMode) {
        // Rotating camera blur effect on login
        camera.position.x = Math.sin(globalTime * 0.1) * 200;
        camera.position.z = Math.cos(globalTime * 0.1) * 200;
        camera.lookAt(0, 50, 0);

        if (particlesMesh) {
            particlesMesh.rotation.y = globalTime * 0.05;
        }
    }

    if (world) {
        world.update(delta);
    }

    if (controls) {
        controls.update(delta);
    }

    renderer.render(scene, camera);
}
