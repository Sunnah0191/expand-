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

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = 0;
        positions[i + 1] = 50; // spawn point
        positions[i + 2] = 0;

        velocities.push(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200
        );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // golden
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const explosion = new THREE.Points(geometry, material);
    scene.add(explosion);

    let startTime = performance.now();
    let prevTime = startTime;

    function animateExplosion() {
        const currentTime = performance.now();
        const delta = (currentTime - prevTime) / 1000;
        prevTime = currentTime;

        const positions = explosion.geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i * 3] * delta;
            positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
            positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;
        }

        explosion.geometry.attributes.position.needsUpdate = true;
        explosion.material.opacity -= 0.5 * delta; // fade out

        if (explosion.material.opacity > 0) {
            requestAnimationFrame(animateExplosion);
        } else {
            scene.remove(explosion);
            geometry.dispose();
            material.dispose();
        }
    }

    animateExplosion();
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    if (type === 'glass-cube') {
        if (!onPlaceBlock.glassCubeGeo) onPlaceBlock.glassCubeGeo = new THREE.BoxGeometry(10, 10, 10);
        mesh = new THREE.Mesh(onPlaceBlock.glassCubeGeo, glassMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        if (!onPlaceBlock.neonPillarGeo) onPlaceBlock.neonPillarGeo = new THREE.CylinderGeometry(2, 2, 20);
        mesh = new THREE.Mesh(onPlaceBlock.neonPillarGeo, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'monolith' || type === 'wuwa-monolith') {
        if (!onPlaceBlock.monolithGeo) onPlaceBlock.monolithGeo = new THREE.BoxGeometry(15, 30, 15);
        mesh = new THREE.Mesh(onPlaceBlock.monolithGeo, monolithMaterial);
        pos.y += 15;
    } else if (type === 'mid-poly-rock') {
        if (!onPlaceBlock.rockGeo) onPlaceBlock.rockGeo = new THREE.DodecahedronGeometry(8, 1);
        mesh = new THREE.Mesh(onPlaceBlock.rockGeo, monolithMaterial);
        pos.y += 4;
    } else if (type === 'glass-crystal') {
        if (!onPlaceBlock.crystalGeo) onPlaceBlock.crystalGeo = new THREE.OctahedronGeometry(6, 0);
        mesh = new THREE.Mesh(onPlaceBlock.crystalGeo, glassMaterial);
        pos.y += 6;
    } else if (type === 'neon-tree') {
        if (!onPlaceBlock.treeGeo) {
            onPlaceBlock.treeGeo = new THREE.ConeGeometry(4, 15, 5);
            onPlaceBlock.treeGeo.translate(0, 7.5, 0);
        }
        mesh = new THREE.Mesh(onPlaceBlock.treeGeo, glassMaterial);
        const colorMaterial = glassMaterial.clone();
        colorMaterial.color = new THREE.Color(0x00ff66);
        mesh.material = colorMaterial;
    } else if (type === 'dark-tower') {
        if (!onPlaceBlock.towerGeo) onPlaceBlock.towerGeo = new THREE.CylinderGeometry(5, 8, 40, 6);
        mesh = new THREE.Mesh(onPlaceBlock.towerGeo, monolithMaterial);
        pos.y += 20;
    } else if (type === 'matte-bridge') {
        if (!onPlaceBlock.bridgeGeo) onPlaceBlock.bridgeGeo = new THREE.BoxGeometry(30, 2, 8);
        mesh = new THREE.Mesh(onPlaceBlock.bridgeGeo, matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'chrome-block') {
        if (!onPlaceBlock.chromeBlockGeo) onPlaceBlock.chromeBlockGeo = new THREE.BoxGeometry(10, 10, 10);
        mesh = new THREE.Mesh(onPlaceBlock.chromeBlockGeo, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-block') {
        if (!onPlaceBlock.neonBlockGeo) onPlaceBlock.neonBlockGeo = new THREE.BoxGeometry(10, 10, 10);
        mesh = new THREE.Mesh(onPlaceBlock.neonBlockGeo, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal-block') {
        if (!onPlaceBlock.matteMetalBlockGeo) onPlaceBlock.matteMetalBlockGeo = new THREE.BoxGeometry(10, 10, 10);
        mesh = new THREE.Mesh(onPlaceBlock.matteMetalBlockGeo, matteMetalMaterial);
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

    if (world) {
        world.update(delta);
    }

    if (controls) {
        controls.update(delta);
    }

    renderer.render(scene, camera);
}
