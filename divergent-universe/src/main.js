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
let explosionParticles;
let explosionActive = false;
let explosionStartTime = 0;

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
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        // Start near camera
        positions[i * 3] = camera.position.x + (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = camera.position.z - 20 + (Math.random() - 0.5) * 10;

        velocities.push({
            x: (Math.random() - 0.5) * 150,
            y: (Math.random() - 0.5) * 150,
            z: (Math.random() - 0.5) * 150
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 3,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });

    explosionParticles = new THREE.Points(geometry, material);
    explosionParticles.userData.velocities = velocities;
    scene.add(explosionParticles);

    explosionActive = true;
    explosionStartTime = performance.now();
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    // Cache geometries on the function object to prevent memory leaks
    if (!onPlaceBlock.geometries) {
        onPlaceBlock.geometries = {
            rock: new THREE.DodecahedronGeometry(8, 1),
            crystal: new THREE.OctahedronGeometry(5, 0),
            tree: new THREE.ConeGeometry(3, 20, 5),
            monolith: new THREE.BoxGeometry(15, 40, 15),
            tower: new THREE.CylinderGeometry(8, 10, 50, 6),
            bridge: new THREE.BoxGeometry(40, 2, 10),
            block: new THREE.BoxGeometry(10, 10, 10)
        };
        // Fix tree origin
        onPlaceBlock.geometries.tree.translate(0, 10, 0);
    }

    const geos = onPlaceBlock.geometries;
    let mesh;

    switch (type) {
        case 'rock':
            mesh = new THREE.Mesh(geos.rock, monolithMaterial);
            pos.y += 8;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(geos.crystal, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'tree':
            mesh = new THREE.Mesh(geos.tree, neonCyanMaterial);
            break;
        case 'monolith':
            mesh = new THREE.Mesh(geos.monolith, monolithMaterial);
            pos.y += 20;
            break;
        case 'tower':
            mesh = new THREE.Mesh(geos.tower, monolithMaterial);
            pos.y += 25;
            break;
        case 'bridge':
            mesh = new THREE.Mesh(geos.bridge, monolithMaterial);
            break;
        case 'block-glass':
            mesh = new THREE.Mesh(geos.block, glassMaterial);
            pos.y += 5;
            break;
        case 'block-chrome':
            mesh = new THREE.Mesh(geos.block, chromeMaterial);
            pos.y += 5;
            break;
        case 'block-neon':
            mesh = new THREE.Mesh(geos.block, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'block-metal':
            mesh = new THREE.Mesh(geos.block, matteMetalMaterial);
            pos.y += 5;
            break;
    }

    if (mesh) {
        mesh.position.copy(pos);

        // Random rotation for natural objects
        if (['rock', 'crystal', 'tree'].includes(type)) {
            mesh.rotation.y = Math.random() * Math.PI * 2;
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;
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

    if (explosionActive && explosionParticles) {
        const currentTime = performance.now();
        const elapsed = (currentTime - explosionStartTime) / 1000;

        if (elapsed > 2) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
            explosionActive = false;
        } else {
            // Delta from frame loop is fine here as it matches rendering,
            // but we track life with performance.now()
            const positions = explosionParticles.geometry.attributes.position.array;
            const velocities = explosionParticles.userData.velocities;
            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x * delta;
                positions[i * 3 + 1] += velocities[i].y * delta;
                positions[i * 3 + 2] += velocities[i].z * delta;
            }
            explosionParticles.geometry.attributes.position.needsUpdate = true;
            explosionParticles.material.opacity = 1 - (elapsed / 2);
        }
    }

    renderer.render(scene, camera);
}
