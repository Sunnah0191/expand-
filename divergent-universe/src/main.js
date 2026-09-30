import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, neonWhiteMaterial, chromeMaterial, matteMetalMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;

// Geometry Cache to prevent memory leaks
const geometryCache = {
    rock: new THREE.DodecahedronGeometry(5, 1),
    crystal: new THREE.OctahedronGeometry(4, 0),
    neonTreeBase: new THREE.CylinderGeometry(1, 1, 10),
    neonTreeTop: new THREE.SphereGeometry(4, 8, 8),
    tower: new THREE.BoxGeometry(8, 40, 8),
    bridge: new THREE.BoxGeometry(20, 2, 8),
    block: new THREE.BoxGeometry(10, 10, 10),
    pillar: new THREE.CylinderGeometry(2, 2, 20)
};

// Particles reference for explosion
let explosionParticles = null;
let explosionStartTime = 0;

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

function triggerGoldenExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 50; // Camera start height
        positions[i * 3 + 2] = 100; // Near camera

        velocities.push({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            z: (Math.random() - 0.5) * 200
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    explosionParticles = new THREE.Points(geometry, material);
    explosionParticles.userData.velocities = velocities;
    scene.add(explosionParticles);
    explosionStartTime = performance.now();
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        triggerGoldenExplosion();
        // Delay UI layer slightly for effect
        setTimeout(() => {
            document.getElementById('ui-layer').style.display = 'block';
            controls.enable();
        }, 500);
    } else {
        console.log("Logged in as spectator");
    }
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    switch (type) {
        case 'rock':
            mesh = new THREE.Mesh(geometryCache.rock, monolithMaterial);
            pos.y += 5;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(geometryCache.crystal, glassMaterial);
            pos.y += 4;
            break;
        case 'neon-tree':
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(geometryCache.neonTreeBase, monolithMaterial);
            const top = new THREE.Mesh(geometryCache.neonTreeTop, neonCyanMaterial);
            top.position.y = 7;
            mesh.add(trunk);
            mesh.add(top);
            pos.y += 5;
            break;
        case 'monolith':
            mesh = new THREE.Mesh(geometryCache.tower, monolithMaterial);
            mesh.scale.set(1.5, 0.75, 1.5);
            pos.y += 15;
            break;
        case 'tower':
            mesh = new THREE.Mesh(geometryCache.tower, monolithMaterial);
            pos.y += 20;
            break;
        case 'bridge':
            mesh = new THREE.Mesh(geometryCache.bridge, matteMetalMaterial);
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
            mesh = new THREE.Mesh(geometryCache.pillar, neonCyanMaterial);
            pos.y += 10;
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

    // Update explosion
    if (explosionParticles) {
        const timeElapsed = (performance.now() - explosionStartTime) / 1000;
        if (timeElapsed > 2) {
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
            explosionParticles.material.opacity = 1.0 - (timeElapsed / 2);
        }
    }

    renderer.render(scene, camera);
}
