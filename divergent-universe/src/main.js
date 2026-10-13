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

// Geometry caches
const geometries = {
    box: new THREE.BoxGeometry(10, 10, 10),
    cylinder: new THREE.CylinderGeometry(2, 2, 20),
    monolith: new THREE.BoxGeometry(15, 30, 15),
    rock: new THREE.DodecahedronGeometry(8, 1),
    crystal: new THREE.OctahedronGeometry(6, 0),
    treeBase: new THREE.CylinderGeometry(1, 1, 10),
    treeTop: new THREE.ConeGeometry(4, 15, 5),
    tower: new THREE.CylinderGeometry(8, 10, 40, 6),
    bridge: new THREE.BoxGeometry(40, 2, 10)
};

// Custom explosion particles loop array
const activeExplosions = [];

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

function createGoldenExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = Math.random() * 50 + 20;

        velocities.push({
            x: Math.sin(phi) * Math.cos(theta) * speed,
            y: Math.sin(phi) * Math.sin(theta) * speed,
            z: Math.cos(phi) * speed
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    // Position the explosion in front of the camera initially
    particles.position.copy(camera.position);
    particles.position.z -= 50;

    scene.add(particles);

    activeExplosions.push({
        mesh: particles,
        velocities: velocities,
        age: 0,
        maxAge: 2.0 // seconds
    });
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        createGoldenExplosion();
        document.getElementById('ui-layer').style.display = 'block';
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
    let group;

    switch (type) {
        // Landscape
        case 'rock':
            mesh = new THREE.Mesh(geometries.rock, monolithMaterial);
            pos.y += 4;
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(geometries.crystal, glassMaterial);
            pos.y += 6;
            break;
        case 'neon-tree':
            group = new THREE.Group();
            const trunk = new THREE.Mesh(geometries.treeBase, monolithMaterial);
            trunk.position.y = 5;
            const top = new THREE.Mesh(geometries.treeTop, neonCyanMaterial);
            top.position.y = 15;
            group.add(trunk);
            group.add(top);
            mesh = group;
            break;

        // WuWa Architecture
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(geometries.monolith, monolithMaterial);
            pos.y += 15;
            break;
        case 'wuwa-tower':
            mesh = new THREE.Mesh(geometries.tower, monolithMaterial);
            pos.y += 20;
            break;
        case 'wuwa-bridge':
            mesh = new THREE.Mesh(geometries.bridge, glassMaterial);
            pos.y += 1;
            break;

        // Constructor Blocks
        case 'block-glass':
            mesh = new THREE.Mesh(geometries.box, glassMaterial);
            pos.y += 5;
            break;
        case 'block-chrome':
            mesh = new THREE.Mesh(geometries.box, chromeMaterial);
            pos.y += 5;
            break;
        case 'block-neon':
            mesh = new THREE.Mesh(geometries.box, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'block-metal':
            mesh = new THREE.Mesh(geometries.box, matteMetalMaterial);
            pos.y += 5;
            break;

        // Fallback for old items just in case
        case 'glass-cube':
            mesh = new THREE.Mesh(geometries.box, glassMaterial);
            pos.y += 5;
            break;
        case 'neon-pillar':
            mesh = new THREE.Mesh(geometries.cylinder, neonCyanMaterial);
            pos.y += 10;
            break;
        case 'monolith':
            mesh = new THREE.Mesh(geometries.monolith, monolithMaterial);
            pos.y += 15;
            break;
    }

    if (mesh) {
        mesh.position.copy(pos);

        // Align to face normal if available from event
        if (event.detail.normal) {
            // we align by looking at the normal
            // this is basic rotation alignment
            mesh.lookAt(mesh.position.clone().add(event.detail.normal));
            // Rotate 90 degrees if it's a block/flat object so it sits on the surface
            mesh.rotateX(Math.PI / 2);
        }

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

    // Update explosions
    for (let i = activeExplosions.length - 1; i >= 0; i--) {
        const exp = activeExplosions[i];
        exp.age += delta;

        if (exp.age >= exp.maxAge) {
            scene.remove(exp.mesh);
            exp.mesh.geometry.dispose();
            exp.mesh.material.dispose();
            activeExplosions.splice(i, 1);
        } else {
            const positions = exp.mesh.geometry.attributes.position.array;
            for (let j = 0; j < exp.velocities.length; j++) {
                positions[j * 3] += exp.velocities[j].x * delta;
                positions[j * 3 + 1] += exp.velocities[j].y * delta;
                positions[j * 3 + 2] += exp.velocities[j].z * delta;

                // Add some gravity
                exp.velocities[j].y -= 20 * delta;
            }
            exp.mesh.geometry.attributes.position.needsUpdate = true;
            exp.mesh.material.opacity = 1.0 - (exp.age / exp.maxAge);
        }
    }

    renderer.render(scene, camera);
}
