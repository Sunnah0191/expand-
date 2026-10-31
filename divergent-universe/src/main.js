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
        triggerGoldenExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerGoldenExplosion() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;

        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = Math.random() * 5 + 2;

        velocities.push(new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
        ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const explosion = new THREE.Points(geometry, material);
    // Position explosion in front of camera
    explosion.position.copy(camera.position);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    explosion.position.add(dir.multiplyScalar(20));

    scene.add(explosion);

    let startTime = performance.now();

    function animateExplosion() {
        const currentTime = performance.now();
        const elapsed = (currentTime - startTime) / 1000;

        if (elapsed > 1.5) {
            scene.remove(explosion);
            geometry.dispose();
            material.dispose();
            return;
        }

        const positions = explosion.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
        }
        explosion.geometry.attributes.position.needsUpdate = true;

        explosion.material.opacity = 1.0 - (elapsed / 1.5);

        requestAnimationFrame(animateExplosion);
    }

    animateExplosion();
}

// Cache geometries
const geoCache = {
    rock: new THREE.DodecahedronGeometry(10, 1),
    glassCrystal: new THREE.OctahedronGeometry(8, 0),
    neonTree: new THREE.ConeGeometry(4, 25, 5),
    monolith: new THREE.BoxGeometry(15, 30, 15),
    matteBridge: new THREE.BoxGeometry(30, 2, 10),
    darkTower: new THREE.CylinderGeometry(8, 12, 40, 6),
    cube: new THREE.BoxGeometry(10, 10, 10),
    pillar: new THREE.CylinderGeometry(2, 2, 20)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    if (type === 'rock') {
        mesh = new THREE.Mesh(geoCache.rock, monolithMaterial);
        pos.y += 10;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geoCache.glassCrystal, glassMaterial);
        pos.y += 8;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geoCache.neonTree, neonCyanMaterial);
        pos.y += 12.5;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(geoCache.monolith, monolithMaterial);
        pos.y += 15;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geoCache.matteBridge, matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(geoCache.darkTower, monolithMaterial);
        pos.y += 20;
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geoCache.cube, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(geoCache.cube, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(geoCache.pillar, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'matte-metal') {
        mesh = new THREE.Mesh(geoCache.cube, matteMetalMaterial);
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
