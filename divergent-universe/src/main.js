import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;
let godModeParticles = null;
let explosionTime = 0;

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
        triggerGodModeExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerGodModeExplosion() {
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x;
        positions[i * 3 + 1] = camera.position.y;
        positions[i * 3 + 2] = camera.position.z;

        velocities.push({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            z: (Math.random() - 0.5) * 200
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    godModeParticles = new THREE.Points(geometry, material);
    godModeParticles.userData = { velocities: velocities };
    scene.add(godModeParticles);
    explosionTime = performance.now();
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    // Cache geometries on the function object to prevent memory leaks
    onPlaceBlock.geometries = onPlaceBlock.geometries || {
        box10: new THREE.BoxGeometry(10, 10, 10),
        box15x30: new THREE.BoxGeometry(15, 30, 15),
        box5x20: new THREE.BoxGeometry(5, 20, 5),
        pillar: new THREE.CylinderGeometry(2, 2, 20),
        bridge: new THREE.BoxGeometry(30, 2, 10),
        rock: new THREE.DodecahedronGeometry(8, 1),
        crystal: new THREE.OctahedronGeometry(6, 0),
        tree: new THREE.ConeGeometry(4, 15, 5)
    };
    const geos = onPlaceBlock.geometries;

    let mesh;
    // Ландшафт
    if (type === 'rock') {
        mesh = new THREE.Mesh(geos.rock, monolithMaterial);
        pos.y += 4;
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(geos.crystal, glassMaterial);
        pos.y += 3;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geos.tree, neonCyanMaterial);
        pos.y += 7.5;
    }
    // Архитектура WuWa
    else if (type === 'monolith') {
        mesh = new THREE.Mesh(geos.box15x30, monolithMaterial);
        pos.y += 15;
    } else if (type === 'hover-tower') {
        mesh = new THREE.Mesh(geos.box5x20, monolithMaterial);
        pos.y += 20; // floating
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geos.bridge, matteMetalMaterial);
        pos.y += 1;
    }
    // Конструктор (Блоки)
    else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geos.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-cube') {
        mesh = new THREE.Mesh(geos.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(geos.pillar, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'metal-cube') {
        mesh = new THREE.Mesh(geos.box10, matteMetalMaterial);
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

    if (godModeParticles) {
        const timeElapsed = (performance.now() - explosionTime) / 1000;
        if (timeElapsed > 2) {
            scene.remove(godModeParticles);
            godModeParticles.geometry.dispose();
            godModeParticles.material.dispose();
            godModeParticles = null;
        } else {
            const positions = godModeParticles.geometry.attributes.position.array;
            const velocities = godModeParticles.userData.velocities;
            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x * delta;
                positions[i * 3 + 1] += velocities[i].y * delta;
                positions[i * 3 + 2] += velocities[i].z * delta;
            }
            godModeParticles.geometry.attributes.position.needsUpdate = true;
            godModeParticles.material.opacity = 1 - (timeElapsed / 2);
        }
    }

    renderer.render(scene, camera);
}
