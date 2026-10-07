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
        createExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function createExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x;
        positions[i * 3 + 1] = camera.position.y;
        positions[i * 3 + 2] = camera.position.z - 20;

        // Random spherical explosion velocity
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const speed = 50 + Math.random() * 100;

        velocities.push({
            x: speed * Math.sin(phi) * Math.cos(theta),
            y: speed * Math.sin(phi) * Math.sin(theta),
            z: speed * Math.cos(phi)
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 2,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const startTime = performance.now();
    let lastTime = startTime;
    const duration = 2000; // ms

    function animateExplosion() {
        const time = performance.now();
        const delta = (time - lastTime) / 1000;
        lastTime = time;

        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x * delta;
            positions[i * 3 + 1] += velocities[i].y * delta;
            positions[i * 3 + 2] += velocities[i].z * delta;

            // Gravity
            velocities[i].y -= 50 * delta;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        const progress = (time - startTime) / duration;
        material.opacity = 1 - progress;

        if (progress < 1) {
            requestAnimationFrame(animateExplosion);
        } else {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    }

    animateExplosion();
}

// Initialize cache on function to prevent memory leaks
onPlaceBlock.cache = {
    boxGeo: new THREE.BoxGeometry(10, 10, 10),
    dodecahedronGeo: new THREE.DodecahedronGeometry(8, 1),
    coneGeo: new THREE.ConeGeometry(3, 20, 5),
    monolithGeo: new THREE.BoxGeometry(15, 40, 15),
    cylinderGeo: new THREE.CylinderGeometry(4, 4, 30, 8),
    bridgeGeo: new THREE.BoxGeometry(20, 2, 10)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    const c = onPlaceBlock.cache;

    // Ландшафт
    if (type === 'rock-midpoly') {
        mesh = new THREE.Mesh(c.dodecahedronGeo, matteMetalMaterial);
        pos.y += 8;
        mesh.rotation.set(Math.random(), Math.random(), Math.random());
    } else if (type === 'crystal-glass') {
        mesh = new THREE.Mesh(c.dodecahedronGeo, glassMaterial);
        pos.y += 8;
        mesh.scale.set(0.5, 2, 0.5);
    } else if (type === 'tree-neon') {
        mesh = new THREE.Mesh(c.coneGeo, neonCyanMaterial);
        pos.y += 10;
    }
    // Архитектура WuWa
    else if (type === 'monolith-wuwa') {
        mesh = new THREE.Mesh(c.monolithGeo, monolithMaterial);
        pos.y += 20;
    } else if (type === 'tower-dark') {
        mesh = new THREE.Mesh(c.cylinderGeo, monolithMaterial);
        pos.y += 15;
    } else if (type === 'bridge-matte') {
        mesh = new THREE.Mesh(c.bridgeGeo, matteMetalMaterial);
        pos.y += 1;
    }
    // Конструктор (Блоки)
    else if (type === 'block-glass') {
        mesh = new THREE.Mesh(c.boxGeo, glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(c.boxGeo, chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(c.boxGeo, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-metal') {
        mesh = new THREE.Mesh(c.boxGeo, matteMetalMaterial);
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
