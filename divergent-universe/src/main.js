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
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 50; // Camera height approx
        positions[i * 3 + 2] = 140; // Just in front of camera

        const v = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(50 + Math.random() * 50);
        velocities.push(v);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden particles
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let lastTime = performance.now();
    let elapsed = 0;

    function animateParticles() {
        const time = performance.now();
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        elapsed += delta;

        const posAttribute = particles.geometry.attributes.position;
        const array = posAttribute.array;

        for (let i = 0; i < particleCount; i++) {
            array[i * 3] += velocities[i].x * delta;
            array[i * 3 + 1] += velocities[i].y * delta;
            array[i * 3 + 2] += velocities[i].z * delta;
        }

        posAttribute.needsUpdate = true;
        material.opacity = Math.max(0, 1 - (elapsed / 2)); // Fade out over 2 seconds

        if (elapsed < 2) {
            requestAnimationFrame(animateParticles);
        } else {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    }

    animateParticles();
}

// Cache for geometries to avoid memory leaks
const geometryCache = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    box15x30: new THREE.BoxGeometry(15, 30, 15),
    box20x40: new THREE.BoxGeometry(20, 40, 20),
    box40x5: new THREE.BoxGeometry(40, 5, 10),
    dodecahedron: new THREE.DodecahedronGeometry(10, 1),
    cone: new THREE.ConeGeometry(5, 20, 8)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();
    let mesh;

    // Ландшафт
    if (type === 'rock') {
        mesh = new THREE.Mesh(geometryCache.dodecahedron, matteMetalMaterial);
        mesh.scale.set(1 + Math.random(), 0.5 + Math.random() * 0.5, 1 + Math.random());
        pos.y += 5;
    } else if (type === 'crystal') {
        const crystalGeo = new THREE.ConeGeometry(3, 15 + Math.random() * 10, 6);
        mesh = new THREE.Mesh(crystalGeo, glassMaterial);
        pos.y += 10;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geometryCache.cone, neonCyanMaterial);
        pos.y += 10;
    }
    // Архитектура WuWa
    else if (type === 'monolith') {
        mesh = new THREE.Mesh(geometryCache.box15x30, monolithMaterial);
        pos.y += 15;
    } else if (type === 'tower') {
        mesh = new THREE.Mesh(geometryCache.box20x40, monolithMaterial);
        pos.y += 20;
    } else if (type === 'bridge') {
        mesh = new THREE.Mesh(geometryCache.box40x5, matteMetalMaterial);
        pos.y += 2.5;
    }
    // Конструктор (Блоки)
    else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geometryCache.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-cube') {
        mesh = new THREE.Mesh(geometryCache.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-cube') {
        mesh = new THREE.Mesh(geometryCache.box10, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'metal-cube') {
        mesh = new THREE.Mesh(geometryCache.box10, matteMetalMaterial);
        pos.y += 5;
    }

    if (mesh) {
        mesh.position.copy(pos);
        // Align with normal if available
        if (event.detail.normal) {
            const up = new THREE.Vector3(0, 1, 0);
            mesh.quaternion.setFromUnitVectors(up, event.detail.normal);
        }
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
