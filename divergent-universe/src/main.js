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
        triggerGoldExplosion();
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerGoldExplosion() {
    const particleCount = 1000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        // Start near camera
        positions[i*3] = camera.position.x + (Math.random() - 0.5) * 5;
        positions[i*3+1] = camera.position.y + (Math.random() - 0.5) * 5;
        positions[i*3+2] = camera.position.z + (Math.random() - 0.5) * 5;

        // Explode outward
        velocities.push({
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            z: (Math.random() - 0.5) * 100
        });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const explosion = new THREE.Points(geo, mat);
    scene.add(explosion);

    // Simple animation loop for explosion
    let age = 0;
    function animateExplosion() {
        if (age > 60) {
            scene.remove(explosion);
            explosion.geometry.dispose();
            explosion.material.dispose();
            return;
        }
        const pos = explosion.geometry.attributes.position.array;
        for(let i=0; i<particleCount; i++) {
            pos[i*3] += velocities[i].x * 0.016;
            pos[i*3+1] += velocities[i].y * 0.016;
            pos[i*3+2] += velocities[i].z * 0.016;
            velocities[i].y -= 2; // gravity
        }
        explosion.geometry.attributes.position.needsUpdate = true;
        explosion.material.opacity = 1 - (age / 60);
        age++;
        requestAnimationFrame(animateExplosion);
    }
    animateExplosion();
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    // Ландшафт
    if (type === 'rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 0), monolithMaterial);
        pos.y += 8;
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(4, 0), glassMaterial);
        pos.y += 4;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(new THREE.ConeGeometry(4, 15, 8), neonCyanMaterial);
        pos.y += 7.5;
    }
    // Архитектура WuWa
    else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 40, 8), monolithMaterial);
        pos.y += 20;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 8), matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'hover-tower') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 10), monolithMaterial);
        pos.y += 20; // leaves a gap from ground implicitly or floats high
    }
    // Конструктор (Блоки)
    else if (type === 'glass-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), matteMetalMaterial);
        pos.y += 5;
    }

    if (mesh) {
        mesh.position.copy(pos);
        // snap to grid
        mesh.position.x = Math.round(mesh.position.x / 10) * 10;
        mesh.position.z = Math.round(mesh.position.z / 10) * 10;
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
