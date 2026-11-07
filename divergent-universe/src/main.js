import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import {
    glassMaterial, neonCyanMaterial, neonBlueMaterial, monolithMaterial,
    rockMaterial, crystalMaterial, chromeMaterial, matteMetalMaterial
} from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;

const geoCache = {
    'glass-cube': new THREE.BoxGeometry(10, 10, 10),
    'rock': new THREE.DodecahedronGeometry(10, 1),
    'crystal': new THREE.ConeGeometry(5, 20, 5),
    'neon-tree': new THREE.ConeGeometry(4, 25, 8),
    'monolith': new THREE.BoxGeometry(15, 30, 15),
    'hover-tower': new THREE.BoxGeometry(10, 50, 10),
    'matte-bridge': new THREE.BoxGeometry(40, 2, 10),
    'chrome-block': new THREE.BoxGeometry(10, 10, 10),
    'neon-block': new THREE.BoxGeometry(10, 10, 10),
    'metal-block': new THREE.BoxGeometry(10, 10, 10)
};

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

function triggerExplosion() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    const center = new THREE.Vector3();
    camera.getWorldDirection(center);
    center.multiplyScalar(30).add(camera.position);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = center.x;
        positions[i * 3 + 1] = center.y;
        positions[i * 3 + 2] = center.z;

        const r = Math.random() * 150 + 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        velocities.push({
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi)
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 1.5,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const explosion = new THREE.Points(geometry, material);
    scene.add(explosion);

    let lastTime = performance.now();

    function animateExplosion() {
        const currentTime = performance.now();
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        if (material.opacity <= 0) {
            scene.remove(explosion);
            geometry.dispose();
            material.dispose();
            return;
        }

        const posArray = geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            posArray[i * 3] += velocities[i].x * delta;
            posArray[i * 3 + 1] += velocities[i].y * delta;
            posArray[i * 3 + 2] += velocities[i].z * delta;
        }
        geometry.attributes.position.needsUpdate = true;

        material.opacity -= delta * 0.8;

        requestAnimationFrame(animateExplosion);
    }

    animateExplosion();
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

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    const geometry = geoCache[type];
    let material;
    let yOffset = 0;

    switch (type) {
        case 'glass-cube':
            material = glassMaterial;
            yOffset = 5;
            break;
        case 'rock':
            material = rockMaterial;
            yOffset = 5;
            break;
        case 'crystal':
            material = crystalMaterial;
            yOffset = 10;
            break;
        case 'neon-tree':
            material = neonCyanMaterial;
            yOffset = 12.5;
            break;
        case 'monolith':
            material = monolithMaterial;
            yOffset = 15;
            break;
        case 'hover-tower':
            material = monolithMaterial;
            yOffset = 25;
            break;
        case 'matte-bridge':
            material = matteMetalMaterial;
            yOffset = 1;
            break;
        case 'chrome-block':
            material = chromeMaterial;
            yOffset = 5;
            break;
        case 'neon-block':
            material = neonBlueMaterial;
            yOffset = 5;
            break;
        case 'metal-block':
            material = matteMetalMaterial;
            yOffset = 5;
            break;
    }

    if (geometry && material) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(pos);
        mesh.position.y += yOffset;
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
