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

        // 3D golden particle explosion effect
        createGoldenExplosion();
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

    // Cache geometries for performance
    if (!onPlaceBlock.geometries) {
        onPlaceBlock.geometries = {
            box: new THREE.BoxGeometry(10, 10, 10),
            pillar: new THREE.CylinderGeometry(2, 2, 20),
            monolith: new THREE.BoxGeometry(15, 30, 15),
            crystal: new THREE.OctahedronGeometry(5, 0),
            rock: new THREE.DodecahedronGeometry(8, 1),
            bridge: new THREE.BoxGeometry(30, 2, 10)
        };
    }
    const geoms = onPlaceBlock.geometries;

    if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geoms.box, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-cube') {
        mesh = new THREE.Mesh(geoms.box, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-cube') {
        mesh = new THREE.Mesh(geoms.box, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-cube') {
        mesh = new THREE.Mesh(geoms.box, matteMetalMaterial);
        pos.y += 5;
    } else if (type === 'neon-tree' || type === 'neon-pillar') {
        mesh = new THREE.Mesh(geoms.pillar, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'monolith' || type === 'dark-tower') {
        mesh = new THREE.Mesh(geoms.monolith, monolithMaterial);
        pos.y += 15;
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(geoms.crystal, glassMaterial);
        pos.y += 5;
    } else if (type === 'rock') {
        mesh = new THREE.Mesh(geoms.rock, monolithMaterial);
        pos.y += 8;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geoms.bridge, matteMetalMaterial);
        pos.y += 1;
    }

    if (mesh) {
        mesh.position.copy(pos);
        scene.add(mesh);
    }
}

function createGoldenExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x;
        positions[i * 3 + 1] = camera.position.y;
        positions[i * 3 + 2] = camera.position.z - 20;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = Math.random() * 50 + 20;

        velocities.push(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
        );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let lastTime = performance.now();
    let life = 1.0;

    function animateExplosion() {
        if (life <= 0) {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
            return;
        }

        requestAnimationFrame(animateExplosion);
        const currentTime = performance.now();
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        const posAttr = particles.geometry.attributes.position;
        const posArray = posAttr.array;

        for (let i = 0; i < particleCount; i++) {
            posArray[i * 3] += velocities[i * 3] * delta;
            posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta;
            posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta;
        }

        posAttr.needsUpdate = true;

        life -= delta; // 1 second duration
        material.opacity = Math.max(0, life);
    }

    animateExplosion();
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
