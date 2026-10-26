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
        positions[i * 3 + 1] = 120; // Start at core height
        positions[i * 3 + 2] = 0;

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
        color: 0xffd700,
        size: 3,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 1
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let startTime = performance.now();

    function animateExplosion() {
        const currentTime = performance.now();
        const elapsed = (currentTime - startTime) / 1000;
        const delta = 1/60; // Approximate delta for this isolated loop

        if (elapsed > 2.0) { // 2 second duration
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
            return;
        }

        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x * delta;
            positions[i * 3 + 1] += velocities[i].y * delta;
            positions[i * 3 + 2] += velocities[i].z * delta;

            // Add gravity effect
            velocities[i].y -= 98 * delta;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Fade out
        material.opacity = 1.0 - (elapsed / 2.0);

        requestAnimationFrame(animateExplosion);
    }

    animateExplosion();
}

// Cache geometries for block placement
const blockGeometries = {
    box: new THREE.BoxGeometry(10, 10, 10),
    pillar: new THREE.CylinderGeometry(2, 2, 20),
    monolith: new THREE.BoxGeometry(15, 30, 15),
    rock: new THREE.DodecahedronGeometry(8, 1),
    crystal: new THREE.ConeGeometry(4, 15, 6),
    tree: new THREE.ConeGeometry(3, 20, 5),
    tower: new THREE.CylinderGeometry(8, 12, 40, 8),
    bridge: new THREE.BoxGeometry(30, 2, 8)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    switch (type) {
        case 'glass-cube': // legacy fallback
        case 'glass-block':
            mesh = new THREE.Mesh(blockGeometries.box, glassMaterial);
            pos.y += 5;
            break;
        case 'chrome-block':
            mesh = new THREE.Mesh(blockGeometries.box, chromeMaterial);
            pos.y += 5;
            break;
        case 'neon-block':
            mesh = new THREE.Mesh(blockGeometries.box, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'metal-block':
            mesh = new THREE.Mesh(blockGeometries.box, matteMetalMaterial);
            pos.y += 5;
            break;
        case 'neon-pillar': // legacy fallback
            mesh = new THREE.Mesh(blockGeometries.pillar, neonCyanMaterial);
            pos.y += 10;
            break;
        case 'monolith':
            mesh = new THREE.Mesh(blockGeometries.monolith, monolithMaterial);
            pos.y += 15;
            break;
        case 'rock':
            mesh = new THREE.Mesh(blockGeometries.rock, monolithMaterial);
            pos.y += 8;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(blockGeometries.crystal, glassMaterial);
            pos.y += 7.5;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(blockGeometries.tree, neonCyanMaterial);
            pos.y += 10;
            break;
        case 'tower':
            mesh = new THREE.Mesh(blockGeometries.tower, monolithMaterial);
            pos.y += 20;
            break;
        case 'bridge':
            mesh = new THREE.Mesh(blockGeometries.bridge, matteMetalMaterial);
            pos.y += 1;
            break;
    }

    if (mesh) {
        mesh.position.copy(pos);
        // Align to normal if passed
        if (event.detail.normal) {
            const normal = event.detail.normal.clone();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
            mesh.quaternion.copy(quaternion);
            // Re-adjust position based on rotation and offset
            mesh.position.copy(event.detail.position).add(normal.multiplyScalar(mesh.geometry.boundingBox ? mesh.geometry.boundingBox.max.y : 5));
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
