import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, neonWhiteMaterial, monolithMaterial } from './utils/Materials.js';

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

    // Initialize Explosion Particles
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        explosionVelocities.push({
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
        opacity: 1
    });
    explosionParticles = new THREE.Points(geometry, material);
    explosionParticles.visible = false;
    scene.add(explosionParticles);

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('placeBlock', onPlaceBlock);
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();

        // Trigger explosion
        explosionParticles.position.copy(camera.position);
        explosionParticles.position.z -= 10; // slightly in front of camera

        // Reset positions
        const positions = explosionParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i++) {
            positions[i] = 0;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;
        explosionParticles.material.opacity = 1;
        explosionParticles.visible = true;
        explosionActive = true;
        explosionStartTime = clock.getElapsedTime();

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
    if (type === 'glass-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
        pos.y += 10; // offset so it sits on ground
    } else if (type === 'metal-block') {
        // Only create the material once and store it on the function object to avoid memory leaks
        onPlaceBlock.metalMaterial = onPlaceBlock.metalMaterial || new THREE.MeshStandardMaterial({color: 0xaaaaaa, metalness: 0.9, roughness: 0.2});
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), onPlaceBlock.metalMaterial);
        pos.y += 5;
    } else if (type === 'rock') {
        mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 0), monolithMaterial);
        pos.y += 5;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(6, 0), glassMaterial);
        pos.y += 6;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 15), monolithMaterial);
        trunk.position.y = 7.5;
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(8, 20, 5), neonCyanMaterial);
        leaves.position.y = 20;
        mesh.add(trunk);
        mesh.add(leaves);
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        pos.y += 15;
    } else if (type === 'levitating-tower') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 50, 10), monolithMaterial);
        pos.y += 35; // floats slightly above
    } else if (type === 'monolith-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 15), monolithMaterial);
        pos.y += 1;
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

    // Update Explosion
    if (explosionActive) {
        const timeElapsed = clock.getElapsedTime() - explosionStartTime;
        if (timeElapsed > 1.5) {
            explosionActive = false;
            explosionParticles.visible = false;
        } else {
            const positions = explosionParticles.geometry.attributes.position.array;
            for (let i = 0; i < explosionVelocities.length; i++) {
                positions[i * 3] += explosionVelocities[i].x * delta;
                positions[i * 3 + 1] += explosionVelocities[i].y * delta;
                positions[i * 3 + 2] += explosionVelocities[i].z * delta;
            }
            explosionParticles.geometry.attributes.position.needsUpdate = true;
            explosionParticles.material.opacity = 1.0 - (timeElapsed / 1.5);
        }
    }

    renderer.render(scene, camera);
}
