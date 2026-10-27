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
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 120; // Start at core height
        positions[i * 3 + 2] = 0;

        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const speed = Math.random() * 200 + 50;
        velocities.push(new THREE.Vector3(
            Math.sin(theta) * Math.cos(phi) * speed,
            Math.cos(theta) * speed,
            Math.sin(theta) * Math.sin(phi) * speed
        ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden
        size: 3.0,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });

    const explosion = new THREE.Points(geometry, material);
    scene.add(explosion);

    let lastTime = performance.now();
    let opacity = 1.0;

    function animateExplosion() {
        const time = performance.now();
        const delta = (time - lastTime) / 1000;
        lastTime = time;

        const positions = explosion.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x * delta;
            positions[i * 3 + 1] += velocities[i].y * delta;
            positions[i * 3 + 2] += velocities[i].z * delta;
        }
        explosion.geometry.attributes.position.needsUpdate = true;

        opacity -= delta * 0.5;
        explosion.material.opacity = Math.max(0, opacity);

        if (opacity > 0) {
            requestAnimationFrame(animateExplosion);
        } else {
            scene.remove(explosion);
            explosion.geometry.dispose();
            explosion.material.dispose();
        }
    }

    animateExplosion();
}

// Geometry Cache for blocks
const geoCache = {
    box: new THREE.BoxGeometry(10, 10, 10),
    pillar: new THREE.CylinderGeometry(2, 2, 20),
    monolith: new THREE.BoxGeometry(15, 30, 15),
    rock: new THREE.DodecahedronGeometry(8, 1),
    crystal: new THREE.OctahedronGeometry(5, 0),
    bridge: new THREE.BoxGeometry(20, 2, 5),
    tower: new THREE.BoxGeometry(10, 40, 10),
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    if (type === 'landscape-rock') {
        mesh = new THREE.Mesh(geoCache.rock, monolithMaterial);
        pos.y += 4;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geoCache.crystal, glassMaterial);
        pos.y += 5;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geoCache.pillar, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(geoCache.monolith, monolithMaterial);
        pos.y += 15;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(geoCache.tower, monolithMaterial);
        pos.y += 20;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geoCache.bridge, matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'block-glass') {
        mesh = new THREE.Mesh(geoCache.box, glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(geoCache.box, chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(geoCache.box, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-matte') {
        mesh = new THREE.Mesh(geoCache.box, matteMetalMaterial);
        pos.y += 5;
    }

    if (mesh) {
        mesh.position.copy(pos);

        // Use normal if passed for basic orientation (e.g. for crystals or rocks)
        if (event.detail.normal) {
           const quaternion = new THREE.Quaternion();
           quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), event.detail.normal);
           mesh.applyQuaternion(quaternion);
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
