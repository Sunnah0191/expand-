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

function triggerExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 20 + Math.random() * 80;

        velocities.push({
            x: Math.sin(phi) * Math.cos(theta) * speed,
            y: Math.sin(phi) * Math.sin(theta) * speed,
            z: Math.cos(phi) * speed
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);

    // Position it slightly in front of camera start pos
    particles.position.copy(camera.position);
    particles.position.z -= 50;

    scene.add(particles);

    const startTime = performance.now();
    const duration = 2000; // 2 seconds

    function animateParticles() {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;

        if (elapsed > duration) {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
            return;
        }

        const delta = 0.016; // Approx 60fps delta for this simple animation
        const positionsAttr = geometry.attributes.position;
        const positionsArray = positionsAttr.array;

        for (let i = 0; i < particleCount; i++) {
            positionsArray[i * 3] += velocities[i].x * delta;
            positionsArray[i * 3 + 1] += velocities[i].y * delta;
            positionsArray[i * 3 + 2] += velocities[i].z * delta;

            // Add some gravity/drag
            velocities[i].y -= 20 * delta;
        }

        material.opacity = 1 - (elapsed / duration);

        positionsAttr.needsUpdate = true;
        requestAnimationFrame(animateParticles);
    }

    animateParticles();
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

// Cache geometries for block placement
const blockGeometries = {
    box: new THREE.BoxGeometry(10, 10, 10),
    pillar: new THREE.CylinderGeometry(2, 2, 20),
    monolith: new THREE.BoxGeometry(15, 30, 15),
    rock: new THREE.DodecahedronGeometry(8, 1),
    crystal: new THREE.OctahedronGeometry(5, 0),
    bridge: new THREE.BoxGeometry(20, 2, 8),
    tower: new THREE.BoxGeometry(10, 50, 10)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    switch (type) {
        case 'glass-cube': // Fallback for old default
        case 'glass-block':
            mesh = new THREE.Mesh(blockGeometries.box, glassMaterial);
            break;
        case 'neon-pillar': // Fallback for old default
        case 'neon-block':
            mesh = new THREE.Mesh(blockGeometries.box, neonCyanMaterial);
            break;
        case 'monolith':
            mesh = new THREE.Mesh(blockGeometries.monolith, monolithMaterial);
            pos.y += 15;
            break;
        case 'rock':
            mesh = new THREE.Mesh(blockGeometries.rock, monolithMaterial);
            pos.y += 8;
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(blockGeometries.crystal, glassMaterial);
            pos.y += 5;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(blockGeometries.pillar, neonCyanMaterial);
            pos.y += 10;
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(blockGeometries.tower, monolithMaterial);
            pos.y += 25;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(blockGeometries.bridge, monolithMaterial);
            break;
        case 'chrome-block':
            mesh = new THREE.Mesh(blockGeometries.box, chromeMaterial);
            break;
        case 'matte-metal-block':
            mesh = new THREE.Mesh(blockGeometries.box, matteMetalMaterial);
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

    renderer.render(scene, camera);
}
