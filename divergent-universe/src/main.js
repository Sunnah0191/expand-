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
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x;
        positions[i * 3 + 1] = camera.position.y;
        positions[i * 3 + 2] = camera.position.z - 20;

        velocities.push({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            z: (Math.random() - 0.5) * 200
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden color
        size: 1.5,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const explosionParticles = new THREE.Points(geometry, material);
    scene.add(explosionParticles);

    let lastTime = performance.now();
    let duration = 0;
    const maxDuration = 2000;

    function animateExplosion(time) {
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        duration += delta * 1000;

        if (duration > maxDuration) {
            scene.remove(explosionParticles);
            geometry.dispose();
            material.dispose();
            return;
        }

        const currentPositions = explosionParticles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            currentPositions[i * 3] += velocities[i].x * delta;
            currentPositions[i * 3 + 1] += velocities[i].y * delta;
            currentPositions[i * 3 + 2] += velocities[i].z * delta;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;
        explosionParticles.material.opacity = 1.0 - (duration / maxDuration);

        requestAnimationFrame(animateExplosion);
    }

    requestAnimationFrame((t) => {
        lastTime = t;
        requestAnimationFrame(animateExplosion);
    });
}

// Cached geometries
const boxGeom = new THREE.BoxGeometry(10, 10, 10);
const tallBoxGeom = new THREE.BoxGeometry(15, 40, 15);
const cylinderGeom = new THREE.CylinderGeometry(2, 2, 20, 16);
const treeGeom = new THREE.CylinderGeometry(0, 4, 15, 8);
const dodecahedronGeom = new THREE.DodecahedronGeometry(8);
const octahedronGeom = new THREE.OctahedronGeometry(6);
const bridgeGeom = new THREE.BoxGeometry(30, 2, 10);

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    if (type === 'rock') {
        mesh = new THREE.Mesh(dodecahedronGeom, monolithMaterial);
        pos.y += 4;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(octahedronGeom, glassMaterial);
        pos.y += 6;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(treeGeom, neonCyanMaterial);
        pos.y += 7.5;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(tallBoxGeom, monolithMaterial);
        pos.y += 20;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 50, 6), monolithMaterial);
        pos.y += 25;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(bridgeGeom, glassMaterial);
        pos.y += 1;
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(boxGeom, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-cube') {
        mesh = new THREE.Mesh(boxGeom, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-cube') {
        mesh = new THREE.Mesh(boxGeom, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal-cube') {
        mesh = new THREE.Mesh(boxGeom, matteMetalMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        // Leaving this in case it's used elsewhere or default
        mesh = new THREE.Mesh(cylinderGeom, neonCyanMaterial);
        pos.y += 10;
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
