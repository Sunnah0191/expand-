import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, rockMaterial, crystalMaterial, chromeMaterial, matteMetalMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;

// Geometry cache
const geoCache = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    box15_30: new THREE.BoxGeometry(15, 30, 15),
    cyl2_20: new THREE.CylinderGeometry(2, 2, 20),
    rock: new THREE.DodecahedronGeometry(8, 1),
    crystal: new THREE.OctahedronGeometry(6, 0),
    bridge: new THREE.BoxGeometry(30, 2, 10),
    tower: new THREE.BoxGeometry(8, 40, 8)
};

// Particles
let particleSystem = null;
let particleStartTime = 0;

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

        // Create golden particles
        const particleCount = 1000;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(particleCount * 3);
        const pVel = [];

        for (let i = 0; i < particleCount; i++) {
            pPos[i * 3] = camera.position.x;
            pPos[i * 3 + 1] = camera.position.y;
            pPos[i * 3 + 2] = camera.position.z - 20;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = Math.random() * 50 + 20;

            pVel.push(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
            );
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 1.5,
            transparent: true,
            opacity: 1
        });

        particleSystem = new THREE.Points(pGeo, pMat);
        particleSystem.userData = { velocities: pVel };
        scene.add(particleSystem);
        particleStartTime = performance.now();
    } else {
        // Spectator mode
        console.log("Logged in as spectator");
        document.getElementById('ui-layer').style.display = 'none';
        controls.gridGroup.visible = false;
        controls.enable();
    }
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    // Ландшафт
    if (type === 'rock') {
        mesh = new THREE.Mesh(geoCache.rock, rockMaterial);
        pos.y += 8;
        mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(geoCache.crystal, crystalMaterial);
        pos.y += 6;
        mesh.rotation.y = Math.random()*Math.PI;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geoCache.cyl2_20, neonCyanMaterial);
        pos.y += 10;
    // Архитектура WuWa
    } else if (type === 'hover-tower') {
        mesh = new THREE.Mesh(geoCache.tower, monolithMaterial);
        pos.y += 25; // hover
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(geoCache.box15_30, monolithMaterial);
        pos.y += 15;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geoCache.bridge, matteMetalMaterial);
        pos.y += 1;
    // Конструктор
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geoCache.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-cube') {
        mesh = new THREE.Mesh(geoCache.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-cube') {
        mesh = new THREE.Mesh(geoCache.box10, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-cube') {
        mesh = new THREE.Mesh(geoCache.box10, matteMetalMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(geoCache.cyl2_20, neonCyanMaterial);
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

    if (particleSystem) {
        const now = performance.now();
        const elapsed = (now - particleStartTime) / 1000;
        if (elapsed > 2) {
            scene.remove(particleSystem);
            particleSystem.geometry.dispose();
            particleSystem.material.dispose();
            particleSystem = null;
        } else {
            const positions = particleSystem.geometry.attributes.position.array;
            const vels = particleSystem.userData.velocities;
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += vels[i * 3] * delta;
                positions[i * 3 + 1] += vels[i * 3 + 1] * delta;
                positions[i * 3 + 2] += vels[i * 3 + 2] * delta;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
            particleSystem.material.opacity = 1 - (elapsed / 2);
        }
    }

    renderer.render(scene, camera);
}
