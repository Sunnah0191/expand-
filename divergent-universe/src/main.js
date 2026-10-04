import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial, neonBlueMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;
let explosionParticles = null;
let explosionTime = 0;

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

function createExplosionEffect() {
    const particleCount = 1000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const vel = [];

    for (let i = 0; i < particleCount; i++) {
        // start at camera roughly
        pos[i * 3] = camera.position.x + (Math.random() - 0.5) * 5;
        pos[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 5;
        pos[i * 3 + 2] = camera.position.z - 20;

        vel.push(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.userData = { velocities: vel };

    const mat = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    explosionParticles = new THREE.Points(geo, mat);
    scene.add(explosionParticles);
    explosionTime = 0;
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    const appEl = document.getElementById('app');
    if (appEl) {
        appEl.classList.remove('blur-active');
    }
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        createExplosionEffect();
        controls.enable();
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
    if (type === 'rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 0), monolithMaterial);
        pos.y += 8;
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(5, 1), glassMaterial);
        pos.y += 5;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10), monolithMaterial);
        trunk.position.y = 5;
        const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 0), neonCyanMaterial);
        leaves.position.y = 12;
        mesh.add(trunk);
        mesh.add(leaves);
    } else if (type === 'monolith-wuwa') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 10), monolithMaterial);
        pos.y += 20;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(5, 8, 50, 4), monolithMaterial);
        pos.y += 25;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 10), matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'block-glass') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonBlueMaterial);
        pos.y += 5;
    } else if (type === 'block-metal') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), matteMetalMaterial);
        pos.y += 5;
    }

    if (mesh) {
        mesh.position.copy(pos);
        // We will align orientation based on normal if needed, but for now just place it.
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
        explosionTime += delta;
        const pos = explosionParticles.geometry.attributes.position.array;
        const vel = explosionParticles.geometry.userData.velocities;
        for (let i = 0; i < pos.length / 3; i++) {
            pos[i * 3] += vel[i * 3] * delta;
            pos[i * 3 + 1] += vel[i * 3 + 1] * delta;
            pos[i * 3 + 2] += vel[i * 3 + 2] * delta;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;
        explosionParticles.material.opacity = Math.max(0, 1 - explosionTime);
        if (explosionTime > 1.0) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        }
    }

    renderer.render(scene, camera);
}
