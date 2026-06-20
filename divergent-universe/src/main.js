import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;
let bgGroup;

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

    // 3D Background for Login Screen
    bgGroup = new THREE.Group();
    scene.add(bgGroup);

    // Monolith
    const bgMonolithGeo = new THREE.BoxGeometry(40, 80, 40);
    const bgMonolith = new THREE.Mesh(bgMonolithGeo, monolithMaterial);
    bgGroup.add(bgMonolith);

    // Particles
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 500;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 150;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
        size: 0.5,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const bgParticles = new THREE.Points(particlesGeo, particlesMat);
    bgGroup.add(bgParticles);

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('placeBlock', onPlaceBlock);
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;

    // Hide login background
    if (bgGroup) {
        bgGroup.visible = false;
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
    if (type === 'glass-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
        pos.y += 10; // offset so it sits on ground
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        pos.y += 15;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(5), glassMaterial);
        pos.y += 5;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(new THREE.ConeGeometry(3, 15), neonCyanMaterial);
        pos.y += 7.5;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 40), monolithMaterial);
        pos.y += 20;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 5), glassMaterial);
        pos.y += 1;
    } else if (type === 'metal-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshStandardMaterial({color: 0x888888, metalness: 0.9, roughness: 0.2}));
        pos.y += 5;
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

    if (bgGroup && bgGroup.visible) {
        bgGroup.rotation.y += delta * 0.1;
        bgGroup.rotation.x += delta * 0.05;
    }

    renderer.render(scene, camera);
}
