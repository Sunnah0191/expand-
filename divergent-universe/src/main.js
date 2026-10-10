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
let goldenParticles = null;
let particleStartTime = 0;

// Cache geometries to prevent memory leaks
const geometries = {
    rock: new THREE.DodecahedronGeometry(5, 1),
    crystal: new THREE.OctahedronGeometry(5, 0),
    neonTree: new THREE.ConeGeometry(2, 15, 5),
    darkTower: new THREE.BoxGeometry(10, 40, 10),
    matteBridge: new THREE.BoxGeometry(20, 2, 5),
    block: new THREE.BoxGeometry(10, 10, 10)
};

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

        // Trigger golden particle explosion
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 50;
            positions[i * 3 + 2] = 0;

            velocities.push({
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100,
                z: (Math.random() - 0.5) * 100
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 2,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        goldenParticles = new THREE.Points(geometry, material);
        goldenParticles.userData.velocities = velocities;
        scene.add(goldenParticles);
        particleStartTime = performance.now();
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

    // Instantiation logic based on HTML catalog
    switch (type) {
        case 'rock':
            mesh = new THREE.Mesh(geometries.rock, monolithMaterial);
            pos.y += 5;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(geometries.crystal, glassMaterial);
            mesh.material.color = new THREE.Color(0xaaffff);
            pos.y += 5;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(geometries.neonTree, neonCyanMaterial);
            pos.y += 7.5;
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(geometries.darkTower, monolithMaterial);
            pos.y += 20;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(geometries.matteBridge, matteMetalMaterial);
            pos.y += 1;
            break;
        case 'block-glass':
            mesh = new THREE.Mesh(geometries.block, glassMaterial);
            pos.y += 5;
            break;
        case 'block-chrome':
            mesh = new THREE.Mesh(geometries.block, chromeMaterial);
            pos.y += 5;
            break;
        case 'block-neon':
            mesh = new THREE.Mesh(geometries.block, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'block-matte':
            mesh = new THREE.Mesh(geometries.block, matteMetalMaterial);
            pos.y += 5;
            break;
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

    if (goldenParticles) {
        const timeElapsed = (performance.now() - particleStartTime) / 1000;
        if (timeElapsed > 2) {
            scene.remove(goldenParticles);
            goldenParticles.geometry.dispose();
            goldenParticles.material.dispose();
            goldenParticles = null;
        } else {
            const positions = goldenParticles.geometry.attributes.position.array;
            const velocities = goldenParticles.userData.velocities;

            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += velocities[i].x * delta;
                positions[i * 3 + 1] += velocities[i].y * delta;
                positions[i * 3 + 2] += velocities[i].z * delta;

                // Add some gravity or drag if desired
                velocities[i].y -= 50 * delta; // simple gravity
            }
            goldenParticles.geometry.attributes.position.needsUpdate = true;
            goldenParticles.material.opacity = 1 - (timeElapsed / 2);
        }
    }

    renderer.render(scene, camera);
}
