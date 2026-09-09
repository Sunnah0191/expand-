import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import {
    glassMaterial, neonCyanMaterial, neonGreenMaterial,
    monolithMaterial, chromeMaterial, matteMetalMaterial
} from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;

// Explosion state
let explosionParticles = null;
let explosionTime = 0;

// Caches for block placement geometries
const geoCache = {
    rock: new THREE.DodecahedronGeometry(5, 1),
    crystal: new THREE.OctahedronGeometry(4, 0),
    treeBase: new THREE.CylinderGeometry(1, 1, 10),
    treeTop: new THREE.ConeGeometry(4, 10, 5),
    monolith: new THREE.BoxGeometry(10, 30, 10),
    tower: new THREE.CylinderGeometry(8, 6, 40, 6),
    bridge: new THREE.BoxGeometry(20, 2, 8),
    block: new THREE.BoxGeometry(10, 10, 10)
};

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
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        // Start near center core
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = 120 + (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        // Spherical explosion velocity
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;

        const speed = 50 + Math.random() * 150;
        velocities[i * 3] = speed * Math.cos(theta) * Math.sin(phi);
        velocities[i * 3 + 1] = speed * Math.sin(theta) * Math.sin(phi);
        velocities[i * 3 + 2] = speed * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    explosionParticles = new THREE.Points(geometry, material);
    scene.add(explosionParticles);
    explosionTime = 0;
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
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

    // Landscape
    if (type === 'mid-poly-rock') {
        mesh = new THREE.Mesh(geoCache.rock, monolithMaterial);
        pos.y += 3;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geoCache.crystal, glassMaterial);
        pos.y += 4;
        mesh.scale.set(1, 2, 1);
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(geoCache.treeBase, monolithMaterial);
        trunk.position.y = 5;
        const leaves = new THREE.Mesh(geoCache.treeTop, neonGreenMaterial);
        leaves.position.y = 15;
        mesh.add(trunk);
        mesh.add(leaves);
    }
    // WuWa Architecture
    else if (type === 'monolith-building') {
        mesh = new THREE.Mesh(geoCache.monolith, monolithMaterial);
        pos.y += 15;
    } else if (type === 'levitating-tower') {
        mesh = new THREE.Mesh(geoCache.tower, monolithMaterial);
        pos.y += 25; // float slightly

        // Add neon ring
        const ringGeo = new THREE.TorusGeometry(10, 0.5, 8, 24);
        const ring = new THREE.Mesh(ringGeo, neonCyanMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -15;
        mesh.add(ring);
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geoCache.bridge, matteMetalMaterial);
        pos.y += 1;
    }
    // Blocks
    else if (type === 'glass-block') {
        mesh = new THREE.Mesh(geoCache.block, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(geoCache.block, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(geoCache.block, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal-block') {
        mesh = new THREE.Mesh(geoCache.block, matteMetalMaterial);
        pos.y += 5;
    }

    if (mesh) {
        mesh.position.copy(pos);

        // Add random rotation to natural objects
        if (type === 'mid-poly-rock' || type === 'glass-crystal') {
            mesh.rotation.y = Math.random() * Math.PI * 2;
        } else if (type === 'matte-bridge') {
            // align bridge to current camera look direction roughly
            mesh.rotation.y = Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z);
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
        explosionTime += delta;
        const positions = explosionParticles.geometry.attributes.position.array;
        const velocities = explosionParticles.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3] += velocities[i * 3] * delta;
            positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
            positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

            // Add some gravity
            velocities[i * 3 + 1] -= 90 * delta;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;

        // Fade out
        const lifeRatio = explosionTime / 3.0; // 3 seconds total
        explosionParticles.material.opacity = 1.0 - lifeRatio;

        if (explosionTime > 3.0) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        }
    }

    renderer.render(scene, camera);
}
