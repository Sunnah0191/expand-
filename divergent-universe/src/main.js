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

function createGoldenExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x;
        positions[i * 3 + 1] = camera.position.y;
        positions[i * 3 + 2] = camera.position.z - 20;

        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = Math.random() * 50 + 20;

        velocities.push({
            x: Math.sin(phi) * Math.cos(theta) * speed,
            y: Math.sin(phi) * Math.sin(theta) * speed,
            z: Math.cos(phi) * speed
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let lastTime = performance.now();
    let opacity = 1.0;

    function animateExplosion() {
        if (opacity <= 0) {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
            return;
        }

        requestAnimationFrame(animateExplosion);
        const currentTime = performance.now();
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        const posAttr = particles.geometry.attributes.position;
        const posArray = posAttr.array;

        for (let i = 0; i < particleCount; i++) {
            const vel = velocities[i];
            posArray[i * 3] += vel.x * delta;
            posArray[i * 3 + 1] += vel.y * delta;
            posArray[i * 3 + 2] += vel.z * delta;
        }

        posAttr.needsUpdate = true;

        opacity -= delta * 0.5; // Fade out over 2 seconds
        material.opacity = Math.max(0, opacity);
    }

    animateExplosion();
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();
        createGoldenExplosion();
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
    if (type === 'glass-cube') {
        if (!onPlaceBlock.glassGeo) onPlaceBlock.glassGeo = new THREE.BoxGeometry(10, 10, 10);
        mesh = new THREE.Mesh(onPlaceBlock.glassGeo, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-cube') {
        if (!onPlaceBlock.chromeGeo) onPlaceBlock.chromeGeo = new THREE.BoxGeometry(10, 10, 10);
        mesh = new THREE.Mesh(onPlaceBlock.chromeGeo, chromeMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal') {
        if (!onPlaceBlock.matteGeo) onPlaceBlock.matteGeo = new THREE.BoxGeometry(10, 10, 10);
        mesh = new THREE.Mesh(onPlaceBlock.matteGeo, matteMetalMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        if (!onPlaceBlock.neonPillarGeo) onPlaceBlock.neonPillarGeo = new THREE.CylinderGeometry(2, 2, 20);
        mesh = new THREE.Mesh(onPlaceBlock.neonPillarGeo, neonCyanMaterial);
        pos.y += 10; // offset so it sits on ground
    } else if (type === 'monolith') {
        if (!onPlaceBlock.monolithGeo) onPlaceBlock.monolithGeo = new THREE.BoxGeometry(15, 30, 15);
        mesh = new THREE.Mesh(onPlaceBlock.monolithGeo, monolithMaterial);
        pos.y += 15;
    } else if (type === 'rock') {
        if (!onPlaceBlock.rockGeo) onPlaceBlock.rockGeo = new THREE.DodecahedronGeometry(8, 0);
        mesh = new THREE.Mesh(onPlaceBlock.rockGeo, monolithMaterial);
        pos.y += 8;
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    } else if (type === 'crystal') {
        if (!onPlaceBlock.crystalGeo) onPlaceBlock.crystalGeo = new THREE.OctahedronGeometry(6, 0);
        mesh = new THREE.Mesh(onPlaceBlock.crystalGeo, glassMaterial);
        pos.y += 6;
        mesh.rotation.y = Math.random() * Math.PI;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        if (!onPlaceBlock.treeTrunkGeo) onPlaceBlock.treeTrunkGeo = new THREE.CylinderGeometry(1, 1.5, 10);
        const trunk = new THREE.Mesh(onPlaceBlock.treeTrunkGeo, monolithMaterial);
        trunk.position.y = 5;
        mesh.add(trunk);

        if (!onPlaceBlock.treeLeavesGeo) onPlaceBlock.treeLeavesGeo = new THREE.IcosahedronGeometry(4, 0);
        const leaves = new THREE.Mesh(onPlaceBlock.treeLeavesGeo, neonCyanMaterial);
        leaves.position.y = 10;
        mesh.add(leaves);
    } else if (type === 'dark-tower') {
        if (!onPlaceBlock.towerGeo) onPlaceBlock.towerGeo = new THREE.BoxGeometry(10, 50, 10);
        mesh = new THREE.Mesh(onPlaceBlock.towerGeo, monolithMaterial);
        pos.y += 25;
    } else if (type === 'matte-bridge') {
        if (!onPlaceBlock.bridgeGeo) onPlaceBlock.bridgeGeo = new THREE.BoxGeometry(30, 2, 10);
        mesh = new THREE.Mesh(onPlaceBlock.bridgeGeo, matteMetalMaterial);
        pos.y += 1;
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
