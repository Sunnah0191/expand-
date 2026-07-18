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

    // Particles for Wuthering Waves aesthetic on login screen
    createLoginParticles();

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

        // Golden particle flash
        if (particlesMesh) {
            particlesMesh.material.color.setHex(0xffd700);
            particlesMesh.material.size = 4.0;
        }

        setTimeout(() => {
            if (particlesMesh) {
                scene.remove(particlesMesh);
                particlesMesh.geometry.dispose();
                particlesMesh.material.dispose();
                particlesMesh = null;
            }
        }, 1000);
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
        if (particlesMesh) {
            scene.remove(particlesMesh);
            particlesMesh.geometry.dispose();
            particlesMesh.material.dispose();
            particlesMesh = null;
        }
    }
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Landscape
    if (type === 'midpoly-rock') {
        const rockGeo = new THREE.DodecahedronGeometry(8, 0);
        mesh = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, flatShading: true }));
        pos.y += 8;
        mesh.rotation.y = Math.random() * Math.PI;
    } else if (type === 'glass-crystal') {
        const crystalGeo = new THREE.OctahedronGeometry(6, 0);
        mesh = new THREE.Mesh(crystalGeo, glassMaterial);
        pos.y += 6;
        mesh.rotation.y = Math.random() * Math.PI;
    } else if (type === 'neon-tree') {
        const trunkGeo = new THREE.CylinderGeometry(1, 1, 10, 8);
        const trunk = new THREE.Mesh(trunkGeo, monolithMaterial);
        trunk.position.y = 5;

        const leavesGeo = new THREE.IcosahedronGeometry(6, 0);
        const leaves = new THREE.Mesh(leavesGeo, neonCyanMaterial);
        leaves.position.y = 12;

        mesh = new THREE.Group();
        mesh.add(trunk);
        mesh.add(leaves);
    }
    // WuWa Architecture
    else if (type === 'futuristic-monolith') {
        const monGeo = new THREE.BoxGeometry(10, 40, 10);
        mesh = new THREE.Mesh(monGeo, monolithMaterial);
        pos.y += 20;
    } else if (type === 'dark-tower') {
        const baseGeo = new THREE.CylinderGeometry(8, 12, 30, 6);
        const base = new THREE.Mesh(baseGeo, monolithMaterial);
        base.position.y = 15;

        const ringGeo = new THREE.TorusGeometry(12, 1, 8, 24);
        const ring = new THREE.Mesh(ringGeo, neonCyanMaterial);
        ring.position.y = 35;
        ring.rotation.x = Math.PI / 2;

        mesh = new THREE.Group();
        mesh.add(base);
        mesh.add(ring);
    } else if (type === 'matte-bridge') {
        const bridgeGeo = new THREE.BoxGeometry(30, 2, 8);
        mesh = new THREE.Mesh(bridgeGeo, matteMetalMaterial);
        pos.y += 1;
    }
    // Blocks
    else if (type === 'block-glass') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-metal') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), matteMetalMaterial);
        pos.y += 5;
    }
    // Fallback for old items just in case
    else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        pos.y += 15;
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

let particlesMesh;
function createLoginParticles() {
    const particlesCount = 500;
    const positions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        // Spread particles around the center
        positions[i] = (Math.random() - 0.5) * 400;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        size: 1.5,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);
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

    if (particlesMesh) {
        if (isGodMode) {
            // Speed up during the flash
            particlesMesh.rotation.y += delta * 0.5;
            particlesMesh.rotation.x += delta * 0.2;
        } else {
            particlesMesh.rotation.y += delta * 0.05;
            particlesMesh.rotation.x += delta * 0.02;
        }
    }

    renderer.render(scene, camera);
}
