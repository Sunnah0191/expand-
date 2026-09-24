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

// God mode explosion effect
let explosionParticles = null;
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
        positions[i * 3] = camera.position.x;
        positions[i * 3 + 1] = camera.position.y;
        positions[i * 3 + 2] = camera.position.z - 10; // slightly in front

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 50 + Math.random() * 150;

        velocities.push({
            x: Math.sin(phi) * Math.cos(theta) * speed,
            y: Math.sin(phi) * Math.sin(theta) * speed,
            z: Math.cos(phi) * speed
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden particles
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    explosionParticles = new THREE.Points(geometry, material);
    explosionParticles.userData.velocities = velocities;
    scene.add(explosionParticles);
    explosionStartTime = performance.now();
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Create/cache geometries on the function to prevent memory leaks
    onPlaceBlock.geometries = onPlaceBlock.geometries || {
        box: new THREE.BoxGeometry(10, 10, 10),
        monolith: new THREE.BoxGeometry(15, 30, 15),
        pillar: new THREE.CylinderGeometry(2, 2, 20),
        rock: new THREE.DodecahedronGeometry(8, 0), // Mid-poly rock
        crystal: new THREE.OctahedronGeometry(6, 0), // Mid-poly crystal
        tower: new THREE.BoxGeometry(20, 60, 20),
        bridge: new THREE.BoxGeometry(40, 2, 10)
    };

    const geos = onPlaceBlock.geometries;

    switch (type) {
        case 'glass-cube':
            mesh = new THREE.Mesh(geos.box, glassMaterial);
            pos.y += 5;
            break;
        case 'chrome-block':
            mesh = new THREE.Mesh(geos.box, chromeMaterial);
            pos.y += 5;
            break;
        case 'neon-block':
            mesh = new THREE.Mesh(geos.box, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'matte-metal-block':
            mesh = new THREE.Mesh(geos.box, matteMetalMaterial);
            pos.y += 5;
            break;
        case 'rock':
            mesh = new THREE.Mesh(geos.rock, monolithMaterial);
            pos.y += 8;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(geos.crystal, glassMaterial);
            pos.y += 6;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(geos.pillar, neonCyanMaterial);
            pos.y += 10;
            break;
        case 'monolith':
            mesh = new THREE.Mesh(geos.monolith, monolithMaterial);
            pos.y += 15;
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(geos.tower, monolithMaterial);
            pos.y += 30;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(geos.bridge, glassMaterial);
            pos.y += 1;
            break;
    }

    if (mesh) {
        mesh.position.copy(pos);
        // Add random rotation to natural objects for variety
        if (type === 'rock' || type === 'crystal') {
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
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

    // Update explosion particles
    if (explosionParticles) {
        const now = performance.now();
        const elapsed = (now - explosionStartTime) / 1000;

        if (elapsed > 2.0) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        } else {
            const positions = explosionParticles.geometry.attributes.position.array;
            const velocities = explosionParticles.userData.velocities;

            // local delta for smooth animation independent of global clock
            const expDelta = 0.016;

            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x * expDelta;
                positions[i * 3 + 1] += velocities[i].y * expDelta;
                positions[i * 3 + 2] += velocities[i].z * expDelta;

                // Add some gravity
                velocities[i].y -= 50 * expDelta;
            }
            explosionParticles.geometry.attributes.position.needsUpdate = true;
            explosionParticles.material.opacity = 1.0 - (elapsed / 2.0);
        }
    }

    renderer.render(scene, camera);
}
