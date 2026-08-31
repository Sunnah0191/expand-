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

let explosionParticles;
let explosionTime = 0;
const EXPLOSION_DURATION = 1.0;

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();

        // Trigger 3D golden particle explosion
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 1000;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for(let i=0; i<particleCount; i++) {
            positions[i*3] = camera.position.x;
            positions[i*3+1] = camera.position.y;
            positions[i*3+2] = camera.position.z - 10; // Slightly in front of camera

            // Random spherical velocities
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = Math.random() * 50 + 20;

            velocities.push(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta),
                speed * Math.cos(phi)
            );
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 1.5,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        explosionParticles = new THREE.Points(particleGeo, particleMat);
        explosionParticles.userData.velocities = velocities;
        scene.add(explosionParticles);
        explosionTime = EXPLOSION_DURATION;

    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

// Cached Geometries for performance
const geometries = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    box15: new THREE.BoxGeometry(15, 30, 15),
    box20_10_20: new THREE.BoxGeometry(20, 10, 20),
    cylinder2_20: new THREE.CylinderGeometry(2, 2, 20, 8),
    cylinder5_30: new THREE.CylinderGeometry(5, 5, 30, 6),
    dodecahedron: new THREE.DodecahedronGeometry(8),
    octahedron: new THREE.OctahedronGeometry(6)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Landscape
    if (type === 'midpoly-rock') {
        mesh = new THREE.Mesh(geometries.dodecahedron, monolithMaterial);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        pos.y += 8;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geometries.octahedron, glassMaterial);
        pos.y += 6;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geometries.cylinder2_20, neonCyanMaterial);
        pos.y += 10;

    // WuWa Architecture
    } else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(geometries.box15, monolithMaterial);
        pos.y += 15;
    } else if (type === 'wuwa-tower') {
        mesh = new THREE.Mesh(geometries.cylinder5_30, chromeMaterial);
        pos.y += 15;
    } else if (type === 'wuwa-bridge') {
        mesh = new THREE.Mesh(geometries.box20_10_20, matteMetalMaterial);
        pos.y += 5;

    // Constructor (Blocks)
    } else if (type === 'block-glass') {
        mesh = new THREE.Mesh(geometries.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(geometries.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(geometries.box10, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-matte') {
        mesh = new THREE.Mesh(geometries.box10, matteMetalMaterial);
        pos.y += 5;
    // Fallbacks for previous types if needed
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geometries.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(geometries.cylinder2_20, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(geometries.box15, monolithMaterial);
        pos.y += 15;
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

    // Update explosion particles
    if (explosionParticles && explosionTime > 0) {
        explosionTime -= delta;
        const positions = explosionParticles.geometry.attributes.position.array;
        const velocities = explosionParticles.userData.velocities;

        for (let i = 0; i < positions.length / 3; i++) {
            positions[i*3] += velocities[i*3] * delta;
            positions[i*3+1] += velocities[i*3+1] * delta;
            positions[i*3+2] += velocities[i*3+2] * delta;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;

        explosionParticles.material.opacity = explosionTime / EXPLOSION_DURATION;

        if (explosionTime <= 0) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        }
    }

    renderer.render(scene, camera);
}
