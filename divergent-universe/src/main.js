import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial, neonBlueMaterial } from './utils/Materials.js';

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
        triggerGoldenExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerGoldenExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x + (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = camera.position.z - 20 + (Math.random() - 0.5) * 10;

        velocities.push({
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            z: (Math.random() - 0.5) * 100
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 1.5,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const explosion = new THREE.Points(geometry, material);
    scene.add(explosion);

    const startTime = performance.now();
    const duration = 2000; // 2 seconds

    function animateExplosion() {
        const elapsed = performance.now() - startTime;
        if (elapsed > duration) {
            scene.remove(explosion);
            geometry.dispose();
            material.dispose();
            return;
        }

        const delta = 0.016; // Approx 60FPS step
        const posAttr = geometry.attributes.position;
        const arr = posAttr.array;

        for (let i = 0; i < particleCount; i++) {
            arr[i * 3] += velocities[i].x * delta;
            arr[i * 3 + 1] += velocities[i].y * delta;
            arr[i * 3 + 2] += velocities[i].z * delta;

            // Slow down
            velocities[i].x *= 0.95;
            velocities[i].y *= 0.95;
            velocities[i].z *= 0.95;
        }

        posAttr.needsUpdate = true;
        material.opacity = 1.0 - (elapsed / duration);

        requestAnimationFrame(animateExplosion);
    }

    animateExplosion();
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Landscape
    if (type === 'rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(10, 1), monolithMaterial);
        pos.y += 5;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(8, 0), glassMaterial);
        mesh.scale.set(1, 2.5, 1);
        pos.y += 20;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(new THREE.ConeGeometry(5, 25, 5), neonCyanMaterial);
        pos.y += 12.5;
    }

    // WuWa Architecture
    else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 40, 15), monolithMaterial);
        pos.y += 20;
        // add neon accents
        const accent = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 16), neonBlueMaterial);
        mesh.add(accent);
    } else if (type === 'wuwa-tower') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 60, 8), monolithMaterial);
        pos.y += 30;
    } else if (type === 'wuwa-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 10), matteMetalMaterial);
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
    } else if (type === 'block-metal') {
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

    renderer.render(scene, camera);
}
