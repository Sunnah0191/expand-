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

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = camera.position.x;
        positions[i + 1] = camera.position.y;
        positions[i + 2] = camera.position.z - 50; // spawn in front of camera

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = Math.random() * 200 + 50;

        velocities.push(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
        );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let lastTime = performance.now();
    let life = 2.0;

    function updateExplosion() {
        const time = performance.now();
        const delta = (time - lastTime) / 1000;
        lastTime = time;

        life -= delta;

        const posAttr = particles.geometry.attributes.position;
        const posArray = posAttr.array;

        for (let i = 0, j = 0; i < particleCount; i++, j += 3) {
            posArray[j] += velocities[j] * delta;
            posArray[j + 1] += velocities[j + 1] * delta;
            posArray[j + 2] += velocities[j + 2] * delta;

            velocities[j + 1] -= 98 * delta; // gravity
        }

        posAttr.needsUpdate = true;
        material.opacity = life / 2.0;

        if (life > 0) {
            requestAnimationFrame(updateExplosion);
        } else {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    }

    requestAnimationFrame(updateExplosion);
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

// Geometry cache to prevent memory leaks
const geometryCache = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    cyl2_20: new THREE.CylinderGeometry(2, 2, 20),
    box15_30: new THREE.BoxGeometry(15, 30, 15),
    cone10_20: new THREE.ConeGeometry(10, 20, 8),
    octa10: new THREE.OctahedronGeometry(10, 0),
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    // Ландшафт
    if (type === 'mid-poly-rock') {
        mesh = new THREE.Mesh(geometryCache.octa10, monolithMaterial);
        pos.y += 5;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geometryCache.cone10_20, glassMaterial);
        pos.y += 10;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geometryCache.cyl2_20, neonCyanMaterial);
        pos.y += 10;
    }
    // Архитектура WuWa
    else if (type === 'future-monolith') {
        mesh = new THREE.Mesh(geometryCache.box15_30, monolithMaterial);
        pos.y += 15;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(geometryCache.cyl2_20, monolithMaterial);
        pos.y += 10;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geometryCache.box15_30, matteMetalMaterial);
        mesh.scale.set(1, 0.1, 3);
        pos.y += 1.5;
    }
    // Конструктор (Блоки)
    else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geometryCache.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(geometryCache.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(geometryCache.box10, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal-block') {
        mesh = new THREE.Mesh(geometryCache.box10, matteMetalMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(geometryCache.cyl2_20, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(geometryCache.box15_30, monolithMaterial);
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
