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
let explosionParticles;

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
        // Start near camera
        positions[i * 3] = camera.position.x + (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = camera.position.z - 20;

        velocities.push({
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 500,
            z: (Math.random() - 0.5) * 500
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden particles
        size: 2.0,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });

    explosionParticles = new THREE.Points(geometry, material);
    explosionParticles.userData.velocities = velocities;
    explosionParticles.userData.life = 1.0;
    scene.add(explosionParticles);
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Landscape
    if (type === 'landscape-rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(5, 0), monolithMaterial);
        pos.y += 5;
    } else if (type === 'landscape-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(4, 0), glassMaterial);
        mesh.scale.set(1, 2, 1);
        pos.y += 8;
    } else if (type === 'landscape-tree') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10), monolithMaterial);
        const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 0), neonCyanMaterial);
        leaves.position.y = 7;
        mesh = new THREE.Group();
        mesh.add(trunk);
        mesh.add(leaves);
        pos.y += 5;
    }
    // WuWa Architecture
    else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 40, 15), monolithMaterial);
        pos.y += 20;
    } else if (type === 'wuwa-tower') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(5, 8, 50, 4), matteMetalMaterial);
        pos.y += 25;
    } else if (type === 'wuwa-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 10), glassMaterial);
        pos.y += 1;
    }
    // Constructor Blocks
    else if (type === 'block-glass') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-matte') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), matteMetalMaterial);
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

    if (explosionParticles) {
        const positions = explosionParticles.geometry.attributes.position.array;
        const velocities = explosionParticles.userData.velocities;

        for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x * delta;
            positions[i * 3 + 1] += velocities[i].y * delta;
            positions[i * 3 + 2] += velocities[i].z * delta;

            velocities[i].x *= 0.95; // drag
            velocities[i].y *= 0.95;
            velocities[i].z *= 0.95;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;

        explosionParticles.userData.life -= delta * 0.5;
        explosionParticles.material.opacity = Math.max(0, explosionParticles.userData.life);

        if (explosionParticles.userData.life <= 0) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        }
    }

    renderer.render(scene, camera);
}
