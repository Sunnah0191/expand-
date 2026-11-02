import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial } from './utils/Materials.js';

// Geometry Cache
const geometryCache = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    box15: new THREE.BoxGeometry(15, 30, 15),
    box20: new THREE.BoxGeometry(20, 20, 20),
    dodecahedron: new THREE.DodecahedronGeometry(10, 1),
    cone: new THREE.ConeGeometry(5, 20, 8),
    bridge: new THREE.BoxGeometry(30, 2, 10),
    tower: new THREE.BoxGeometry(10, 40, 10)
};

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

// Array to hold temporary particle explosions
const activeExplosions = [];

function createGoldenExplosion() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;

        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const speed = 100 + Math.random() * 150;

        velocities.push(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
        );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    // Position explosion in front of camera
    const explosionPos = new THREE.Vector3();
    camera.getWorldDirection(explosionPos);
    explosionPos.multiplyScalar(20).add(camera.position);
    points.position.copy(explosionPos);

    scene.add(points);
    activeExplosions.push({
        points,
        velocities,
        age: 0,
        maxAge: 1.0 // seconds
    });
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
    // Category 1: Ландшафт
    if (type === 'mid-poly-rock') {
        mesh = new THREE.Mesh(geometryCache.dodecahedron, monolithMaterial);
        pos.y += 5;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geometryCache.dodecahedron, glassMaterial);
        mesh.scale.set(0.5, 2, 0.5);
        pos.y += 10;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geometryCache.cone, neonCyanMaterial);
        pos.y += 10;
    }
    // Category 2: Архитектура WuWa
    else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(geometryCache.box15, monolithMaterial);
        pos.y += 15;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(geometryCache.tower, monolithMaterial);
        pos.y += 20;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geometryCache.bridge, matteMetalMaterial);
        pos.y += 1;
    }
    // Category 3: Конструктор (Блоки)
    else if (type === 'block-glass') {
        mesh = new THREE.Mesh(geometryCache.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(geometryCache.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(geometryCache.box10, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-metal') {
        mesh = new THREE.Mesh(geometryCache.box10, matteMetalMaterial);
        pos.y += 5;
    }

    if (mesh) {
        mesh.position.copy(pos);

        // Use quaternion to align if normal is available
        if (event.detail.normal) {
           const defaultUp = new THREE.Vector3(0, 1, 0);
           const normal = event.detail.normal.clone().normalize();
           const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultUp, normal);
           mesh.quaternion.copy(quaternion);
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

    // Update temporary explosions
    for (let i = activeExplosions.length - 1; i >= 0; i--) {
        const explosion = activeExplosions[i];
        explosion.age += delta;

        if (explosion.age > explosion.maxAge) {
            scene.remove(explosion.points);
            explosion.points.geometry.dispose();
            explosion.points.material.dispose();
            activeExplosions.splice(i, 1);
        } else {
            const positions = explosion.points.geometry.attributes.position.array;
            for (let j = 0; j < positions.length / 3; j++) {
                positions[j * 3] += explosion.velocities[j * 3] * delta;
                positions[j * 3 + 1] += explosion.velocities[j * 3 + 1] * delta;
                positions[j * 3 + 2] += explosion.velocities[j * 3 + 2] * delta;
            }
            explosion.points.geometry.attributes.position.needsUpdate = true;
            explosion.points.material.opacity = 1 - (explosion.age / explosion.maxAge);
        }
    }

    renderer.render(scene, camera);
}
