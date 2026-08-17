import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;
let godModeParticles = null;

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

        // Create Golden Particle Explosion Effect
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        // Start particles roughly at camera position or center
        const startPos = camera.position.clone();

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = startPos.x;
            positions[i * 3 + 1] = startPos.y;
            positions[i * 3 + 2] = startPos.z - 10; // slightly in front

            velocities.push({
                x: (Math.random() - 0.5) * 50,
                y: (Math.random() - 0.5) * 50,
                z: (Math.random() - 0.5) * 50
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

        godModeParticles = new THREE.Points(geometry, material);
        godModeParticles.userData.velocities = velocities;
        scene.add(godModeParticles);

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

    // Default material fallbacks if not imported
    const basicChrome = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.2 });
    const basicMatteMetal = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.8 });

    if (type === 'mid-poly-rock') {
        mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), monolithMaterial);
        mesh.rotation.y = Math.random() * Math.PI;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(4, 0), glassMaterial);
        pos.y += 4;
    } else if (type === 'neon-tree') {
        // Group for tree
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5), monolithMaterial);
        trunk.position.y = 2.5;
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(4, 10, 5), neonCyanMaterial);
        leaves.position.y = 10;
        mesh.add(trunk);
        mesh.add(leaves);
    } else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 10), monolithMaterial);
        pos.y += 20;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 50, 6), monolithMaterial);
        pos.y += 25;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 8), monolithMaterial);
        pos.y += 1;
    } else if (type === 'glass-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), basicChrome);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), basicMatteMetal);
        pos.y += 5;
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        pos.y += 15;
    }

    if (mesh) {
        mesh.position.copy(pos);
        // Add random rotation to rocks
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

    // Update Golden Particles
    if (godModeParticles) {
        const positions = godModeParticles.geometry.attributes.position.array;
        const velocities = godModeParticles.userData.velocities;

        for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x * delta;
            positions[i * 3 + 1] += velocities[i].y * delta;
            positions[i * 3 + 2] += velocities[i].z * delta;
        }
        godModeParticles.geometry.attributes.position.needsUpdate = true;

        godModeParticles.material.opacity -= delta * 0.5;
        if (godModeParticles.material.opacity <= 0) {
            scene.remove(godModeParticles);
            godModeParticles.geometry.dispose();
            godModeParticles.material.dispose();
            godModeParticles = null;
        }
    }

    renderer.render(scene, camera);
}
