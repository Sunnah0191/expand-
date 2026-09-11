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
        triggerExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerExplosion() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x;
        positions[i * 3 + 1] = camera.position.y;
        positions[i * 3 + 2] = camera.position.z - 20;

        velocities.push({
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            z: (Math.random() - 0.5) * 100,
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    explosionParticles = {
        mesh: new THREE.Points(geometry, material),
        velocities: velocities,
        life: 1.0
    };

    scene.add(explosionParticles.mesh);
}

// Geometry cache to avoid memory leaks
const geometryCache = {
    rock: new THREE.DodecahedronGeometry(8, 1),
    glassCrystal: new THREE.OctahedronGeometry(6, 0),
    neonTreeBase: new THREE.CylinderGeometry(1, 1, 10),
    neonTreeTop: new THREE.ConeGeometry(5, 15, 4),
    wuwaMonolith: new THREE.BoxGeometry(10, 40, 10),
    darkTower: new THREE.CylinderGeometry(8, 12, 50, 6),
    matteBridge: new THREE.BoxGeometry(30, 2, 10),
    block: new THREE.BoxGeometry(10, 10, 10)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    switch (type) {
        case 'rock':
            mesh = new THREE.Mesh(geometryCache.rock, monolithMaterial);
            pos.y += 8;
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(geometryCache.glassCrystal, glassMaterial);
            pos.y += 6;
            break;
        case 'neon-tree':
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(geometryCache.neonTreeBase, monolithMaterial);
            trunk.position.y = 5;
            const leaves = new THREE.Mesh(geometryCache.neonTreeTop, neonCyanMaterial);
            leaves.position.y = 15;
            mesh.add(trunk);
            mesh.add(leaves);
            break;
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(geometryCache.wuwaMonolith, monolithMaterial);
            pos.y += 20;
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(geometryCache.darkTower, monolithMaterial);
            pos.y += 25;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(geometryCache.matteBridge, matteMetalMaterial);
            pos.y += 1;
            break;
        case 'glass-block':
            mesh = new THREE.Mesh(geometryCache.block, glassMaterial);
            pos.y += 5;
            break;
        case 'chrome-block':
            mesh = new THREE.Mesh(geometryCache.block, chromeMaterial);
            pos.y += 5;
            break;
        case 'neon-block':
            mesh = new THREE.Mesh(geometryCache.block, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'metal-block':
            mesh = new THREE.Mesh(geometryCache.block, matteMetalMaterial);
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

    if (explosionParticles) {
        explosionParticles.life -= delta;
        if (explosionParticles.life <= 0) {
            scene.remove(explosionParticles.mesh);
            explosionParticles = null;
        } else {
            const positions = explosionParticles.mesh.geometry.attributes.position.array;
            for (let i = 0; i < explosionParticles.velocities.length; i++) {
                positions[i * 3] += explosionParticles.velocities[i].x * delta;
                positions[i * 3 + 1] += explosionParticles.velocities[i].y * delta;
                positions[i * 3 + 2] += explosionParticles.velocities[i].z * delta;
            }
            explosionParticles.mesh.geometry.attributes.position.needsUpdate = true;
            explosionParticles.mesh.material.opacity = explosionParticles.life;
        }
    }

    renderer.render(scene, camera);
}
