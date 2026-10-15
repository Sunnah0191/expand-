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
        triggerGoldenExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerGoldenExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = camera.position.x;
        positions[i * 3 + 1] = camera.position.y;
        positions[i * 3 + 2] = camera.position.z - 50; // spawn slightly in front of camera

        // random spherical velocities
        const r = Math.random() * 50 + 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        velocities.push({
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi)
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Golden
        size: 2.0,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const explosion = new THREE.Points(geometry, material);
    scene.add(explosion);

    let startTime = performance.now();
    const duration = 2000; // 2 seconds

    function animateExplosion(time) {
        const elapsed = time - startTime;
        if (elapsed > duration) {
            scene.remove(explosion);
            geometry.dispose();
            material.dispose();
            return;
        }

        const delta = 0.016; // approx 60fps for simple physics
        const positionsAttr = geometry.attributes.position;
        const positionsArray = positionsAttr.array;

        for (let i = 0; i < particleCount; i++) {
            positionsArray[i * 3] += velocities[i].x * delta;
            positionsArray[i * 3 + 1] += velocities[i].y * delta;
            positionsArray[i * 3 + 2] += velocities[i].z * delta;

            // slow down
            velocities[i].x *= 0.95;
            velocities[i].y *= 0.95;
            velocities[i].z *= 0.95;
        }

        positionsAttr.needsUpdate = true;
        material.opacity = 1.0 - (elapsed / duration);

        requestAnimationFrame(animateExplosion);
    }

    requestAnimationFrame(animateExplosion);
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    // Cache geometries on the function object to prevent memory leaks
    if (!onPlaceBlock.geometries) {
        onPlaceBlock.geometries = {
            box10: new THREE.BoxGeometry(10, 10, 10),
            box15x30: new THREE.BoxGeometry(15, 30, 15),
            box20x40: new THREE.BoxGeometry(20, 40, 20),
            box5x1x20: new THREE.BoxGeometry(5, 1, 20),
            cylinder2x20: new THREE.CylinderGeometry(2, 2, 20),
            icosahedron10: new THREE.IcosahedronGeometry(10, 1),
            octahedron8: new THREE.OctahedronGeometry(8, 0)
        };
    }
    const geos = onPlaceBlock.geometries;

    let mesh;
    let offset = new THREE.Vector3();

    switch (type) {
        case 'rock-midpoly':
            mesh = new THREE.Mesh(geos.icosahedron10, monolithMaterial);
            offset.y = 8;
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(geos.octahedron8, glassMaterial);
            offset.y = 8;
            break;
        case 'neon-tree':
            // Group for tree
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(geos.cylinder2x20, monolithMaterial);
            trunk.position.y = 10;
            const leaves = new THREE.Mesh(geos.icosahedron10, neonCyanMaterial);
            leaves.position.y = 20;
            mesh.add(trunk);
            mesh.add(leaves);
            break;
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(geos.box15x30, monolithMaterial);
            offset.y = 15;
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(geos.box20x40, monolithMaterial);
            offset.y = 20;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(geos.box5x1x20, matteMetalMaterial);
            offset.y = 0.5;
            break;
        case 'glass-block':
            mesh = new THREE.Mesh(geos.box10, glassMaterial);
            offset.y = 5;
            break;
        case 'chrome-block':
            mesh = new THREE.Mesh(geos.box10, chromeMaterial);
            offset.y = 5;
            break;
        case 'neon-block':
            mesh = new THREE.Mesh(geos.box10, neonCyanMaterial);
            offset.y = 5;
            break;
        case 'metal-block':
            mesh = new THREE.Mesh(geos.box10, matteMetalMaterial);
            offset.y = 5;
            break;
    }

    if (mesh) {
        mesh.position.copy(pos).add(offset);
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
