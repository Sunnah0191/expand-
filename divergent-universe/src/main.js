import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, rockMaterial, chromeMaterial, matteMetalMaterial } from './utils/Materials.js';

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

function createGoldenParticles() {
    const particleCount = 1000;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
        particlePositions[i] = (Math.random() - 0.5) * 200;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 1.5,
        transparent: true,
        opacity: 0.8
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Fade out particles over time
    const fadeInterval = setInterval(() => {
        particleMat.opacity -= 0.05;
        if (particleMat.opacity <= 0) {
            scene.remove(particles);
            particleGeom.dispose();
            particleMat.dispose();
            clearInterval(fadeInterval);
        }
    }, 100);
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();
        createGoldenParticles();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

// Geometry Cache
const geomCache = {
    box: new THREE.BoxGeometry(10, 10, 10),
    monolith: new THREE.BoxGeometry(15, 30, 15),
    rock: new THREE.DodecahedronGeometry(8, 0),
    crystal: new THREE.OctahedronGeometry(6, 0),
    tower: new THREE.CylinderGeometry(5, 8, 40, 6),
    bridge: new THREE.BoxGeometry(30, 2, 10)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Ландшафт
    if (type === 'rock') {
        mesh = new THREE.Mesh(geomCache.rock, rockMaterial);
        pos.y += 6;
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geomCache.crystal, glassMaterial);
        pos.y += 6;
        mesh.scale.set(1, 1.5, 1);
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10), monolithMaterial);
        trunk.position.y = 5;
        const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 0), neonCyanMaterial);
        leaves.position.y = 12;
        mesh.add(trunk);
        mesh.add(leaves);
    }
    // Архитектура WuWa
    else if (type === 'monolith') {
        mesh = new THREE.Mesh(geomCache.monolith, monolithMaterial);
        pos.y += 15;
    } else if (type === 'levitating-tower') {
        mesh = new THREE.Mesh(geomCache.tower, monolithMaterial);
        pos.y += 25; // Floats slightly

        // Add neon ring
        const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.5, 16, 32), neonCyanMaterial);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geomCache.bridge, matteMetalMaterial);
        pos.y += 1;
    }
    // Конструктор (Блоки)
    else if (type === 'block-glass') {
        mesh = new THREE.Mesh(geomCache.box, glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(geomCache.box, chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(geomCache.box, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-matte') {
        mesh = new THREE.Mesh(geomCache.box, matteMetalMaterial);
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

    renderer.render(scene, camera);
}
