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
let explosionParticles = null;
let explosionStartTime = 0;

// Cached Geometries
const geoCache = {
    rock: new THREE.DodecahedronGeometry(5, 1),
    crystal: new THREE.OctahedronGeometry(4, 0),
    tree: new THREE.ConeGeometry(2, 15, 5),
    wuwaMonolith: new THREE.BoxGeometry(10, 30, 10),
    wuwaTower: new THREE.CylinderGeometry(5, 8, 40, 8),
    wuwaBridge: new THREE.BoxGeometry(30, 2, 8),
    blockCube: new THREE.BoxGeometry(10, 10, 10)
};
// Adjust centers
geoCache.tree.translate(0, 7.5, 0);
geoCache.wuwaMonolith.translate(0, 15, 0);
geoCache.wuwaTower.translate(0, 20, 0);
geoCache.blockCube.translate(0, 5, 0);


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

function createExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 50; // starting near camera center roughly
        positions[i * 3 + 2] = 100;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 50 + Math.random() * 200;

        velocities.push({
            x: Math.sin(phi) * Math.cos(theta) * speed,
            y: Math.sin(phi) * Math.sin(theta) * speed,
            z: Math.cos(phi) * speed
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // neon gold
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    explosionParticles = new THREE.Points(geometry, material);
    explosionParticles.userData.velocities = velocities;
    scene.add(explosionParticles);
    explosionStartTime = performance.now();
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'flex';
        controls.enable();
        createExplosion();
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
            mesh = new THREE.Mesh(geoCache.rock, monolithMaterial);
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(geoCache.crystal, glassMaterial);
            mesh.position.y += 4;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(geoCache.tree, neonCyanMaterial);
            break;

        // Архитектура WuWa
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(geoCache.wuwaMonolith, monolithMaterial);
            break;
        case 'wuwa-tower':
            mesh = new THREE.Mesh(geoCache.wuwaTower, monolithMaterial);
            break;
        case 'wuwa-bridge':
            mesh = new THREE.Mesh(geoCache.wuwaBridge, monolithMaterial);
            mesh.position.y += 1;
            break;

        // Конструктор (Блоки)
        case 'block-glass':
            mesh = new THREE.Mesh(geoCache.blockCube, glassMaterial);
            break;
        case 'block-chrome':
            mesh = new THREE.Mesh(geoCache.blockCube, chromeMaterial);
            break;
        case 'block-neon':
            mesh = new THREE.Mesh(geoCache.blockCube, neonCyanMaterial);
            break;
        case 'block-metal':
            mesh = new THREE.Mesh(geoCache.blockCube, matteMetalMaterial);
            break;
    }

    if (mesh) {
        mesh.position.copy(pos);

        // Randomize rotation a bit for natural things like rocks and crystals
        if(type === 'rock' || type === 'glass-crystal') {
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
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

    if (explosionParticles) {
        const elapsedTime = (performance.now() - explosionStartTime) / 1000;
        if (elapsedTime > 2) { // 2 seconds duration
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        } else {
            const positions = explosionParticles.geometry.attributes.position.array;
            const velocities = explosionParticles.userData.velocities;

            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x * delta;
                positions[i * 3 + 1] += velocities[i].y * delta;
                positions[i * 3 + 2] += velocities[i].z * delta;
            }
            explosionParticles.geometry.attributes.position.needsUpdate = true;
            explosionParticles.material.opacity = 1 - (elapsedTime / 2);
        }
    }

    renderer.render(scene, camera);
}
