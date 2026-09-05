import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial, darkTowerMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;
let explosionParticles = null;
let explosionVelocities = [];

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

        // Golden explosion effect
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        explosionVelocities = [];

        // Camera lookAt direction approximation for explosion center
        const center = camera.position.clone().add(new THREE.Vector3(0, 0, -50).applyQuaternion(camera.quaternion));

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = center.x + (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = center.y + (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = center.z + (Math.random() - 0.5) * 10;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(50 + Math.random() * 50);

            explosionVelocities.push(velocity);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffd700, // Golden
            size: 1.5,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        explosionParticles = new THREE.Points(geometry, material);
        scene.add(explosionParticles);
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

// Geometry Cache
const geomCache = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    box15_30: new THREE.BoxGeometry(15, 30, 15),
    box20_60: new THREE.BoxGeometry(20, 60, 20),
    box30_2_10: new THREE.BoxGeometry(30, 2, 10),
    cone: new THREE.ConeGeometry(3, 20, 5),
    dodecahedron: new THREE.DodecahedronGeometry(5, 1),
    icosahedron: new THREE.IcosahedronGeometry(4, 0),
};

// Offset center for tree
geomCache.cone.translate(0, 10, 0);

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Landscape
    if (type === 'rock') {
        mesh = new THREE.Mesh(geomCache.dodecahedron, monolithMaterial);
        pos.y += 5;
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(geomCache.icosahedron, glassMaterial);
        pos.y += 4;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geomCache.cone, neonCyanMaterial);
    }
    // Architecture
    else if (type === 'monolith') {
        mesh = new THREE.Mesh(geomCache.box15_30, monolithMaterial);
        pos.y += 15;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(geomCache.box20_60, darkTowerMaterial);
        pos.y += 30;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geomCache.box30_2_10, matteMetalMaterial);
        pos.y += 1;
    }
    // Constructor (Blocks)
    else if (type === 'glass-block' || type === 'glass-cube') {
        mesh = new THREE.Mesh(geomCache.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(geomCache.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(geomCache.box10, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'metal-block') {
        mesh = new THREE.Mesh(geomCache.box10, matteMetalMaterial);
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

    if (explosionParticles) {
        const positions = explosionParticles.geometry.attributes.position.array;
        for (let i = 0; i < explosionVelocities.length; i++) {
            positions[i * 3] += explosionVelocities[i].x * delta;
            positions[i * 3 + 1] += explosionVelocities[i].y * delta;
            positions[i * 3 + 2] += explosionVelocities[i].z * delta;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;

        // Fade out
        explosionParticles.material.opacity -= delta * 1.5;
        if (explosionParticles.material.opacity <= 0) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
            explosionVelocities = [];
        }
    }

    renderer.render(scene, camera);
}
