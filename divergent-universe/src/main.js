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
        triggerExplosionEffect();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerExplosionEffect() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x + (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 50;
        positions[i * 3 + 2] = camera.position.z - 50 + (Math.random() - 0.5) * 50;

        velocities.push({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            z: (Math.random() - 0.5) * 200
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden particles
        size: 2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
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

    // Cache geometries to save memory
    if (!onPlaceBlock.geometries) {
        onPlaceBlock.geometries = {
            box10: new THREE.BoxGeometry(10, 10, 10),
            box15x30: new THREE.BoxGeometry(15, 30, 15),
            box15x40: new THREE.BoxGeometry(15, 40, 15),
            box20x5: new THREE.BoxGeometry(20, 5, 10),
            cylinder2x20: new THREE.CylinderGeometry(2, 2, 20, 16),
            cylinder4x15: new THREE.CylinderGeometry(4, 4, 15, 16),
            octahedron: new THREE.OctahedronGeometry(8)
        };
    }
    const geos = onPlaceBlock.geometries;

    // Landscape
    if (type === 'mid-poly-rock') {
        mesh = new THREE.Mesh(geos.box10, monolithMaterial);
        mesh.rotation.set(Math.random(), Math.random(), Math.random());
        pos.y += 5;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geos.octahedron, glassMaterial);
        pos.y += 8;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geos.cylinder2x20, neonCyanMaterial);
        pos.y += 10;
    }
    // WuWa Architecture
    else if (type === 'monolith-building') {
        mesh = new THREE.Mesh(geos.box15x30, monolithMaterial);
        pos.y += 15;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(geos.box15x40, monolithMaterial);
        pos.y += 20;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geos.box20x5, matteMetalMaterial);
        pos.y += 2.5;
    }
    // Constructor Blocks
    else if (type === 'block-glass') {
        mesh = new THREE.Mesh(geos.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(geos.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(geos.box10, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-matte') {
        mesh = new THREE.Mesh(geos.box10, matteMetalMaterial);
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

    if (explosionParticles) {
        const timeElapsed = (performance.now() - explosionStartTime) / 1000;
        if (timeElapsed > 1.5) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        } else {
            const positions = explosionParticles.geometry.attributes.position.array;
            const velocities = explosionParticles.userData.velocities;

            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x * delta;
                positions[i * 3 + 1] += velocities[i].y * delta;
                positions[i * 3 + 2] += velocities[i].z * delta;
            }
            explosionParticles.geometry.attributes.position.needsUpdate = true;
            explosionParticles.material.opacity = 1.0 - (timeElapsed / 1.5);
        }
    }

    renderer.render(scene, camera);
}
