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
let explosionActive = false;
let explosionStartTime = 0;
let explosionPoints = null;

const geometryCache = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    box15_30_15: new THREE.BoxGeometry(15, 30, 15),
    box20_60_20: new THREE.BoxGeometry(20, 60, 20),
    box10_2_30: new THREE.BoxGeometry(10, 2, 30),
    cylinder2_20: new THREE.CylinderGeometry(2, 2, 20),
    dodecahedron: new THREE.DodecahedronGeometry(10, 0)
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
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        velocities.push({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            z: (Math.random() - 0.5) * 200
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    explosionPoints = new THREE.Points(geometry, material);
    explosionPoints.userData.velocities = velocities;

    // Position it where the camera is looking initially
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    explosionPoints.position.copy(camera.position).add(dir.multiplyScalar(50));

    scene.add(explosionPoints);

    explosionActive = true;
    explosionStartTime = performance.now();
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    if (type === 'rock') {
        mesh = new THREE.Mesh(geometryCache.dodecahedron, monolithMaterial);
        pos.y += 10;
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(geometryCache.dodecahedron, glassMaterial);
        pos.y += 10;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geometryCache.cylinder2_20, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(geometryCache.box15_30_15, monolithMaterial);
        pos.y += 15;
    } else if (type === 'tower') {
        mesh = new THREE.Mesh(geometryCache.box20_60_20, monolithMaterial);
        pos.y += 30;
    } else if (type === 'bridge') {
        mesh = new THREE.Mesh(geometryCache.box10_2_30, matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'glass-block') {
        mesh = new THREE.Mesh(geometryCache.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(geometryCache.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(geometryCache.box10, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'metal-block') {
        mesh = new THREE.Mesh(geometryCache.box10, matteMetalMaterial);
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

    // Update explosion
    if (explosionActive && explosionPoints) {
        const currentTime = performance.now();
        const lifeTime = (currentTime - explosionStartTime) / 1000.0;

        if (lifeTime > 2.0) {
            scene.remove(explosionPoints);
            explosionPoints.geometry.dispose();
            explosionPoints.material.dispose();
            explosionPoints = null;
            explosionActive = false;
        } else {
            const positions = explosionPoints.geometry.attributes.position.array;
            const velocities = explosionPoints.userData.velocities;

            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x * delta;
                positions[i * 3 + 1] += velocities[i].y * delta;
                positions[i * 3 + 2] += velocities[i].z * delta;

                // Add gravity or drag if desired
                velocities[i].y -= 50 * delta; // gravity
            }
            explosionPoints.geometry.attributes.position.needsUpdate = true;
            explosionPoints.material.opacity = 1.0 - (lifeTime / 2.0);
        }
    }

    if (world) {
        world.update(delta);
    }

    if (controls) {
        controls.update(delta);
    }

    renderer.render(scene, camera);
}
