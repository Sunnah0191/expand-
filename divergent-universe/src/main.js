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

let goldenParticles = null;

// Block Geometries and Materials Cache
const blockCache = {
    geometries: {
        cube: new THREE.BoxGeometry(10, 10, 10),
        pillar: new THREE.CylinderGeometry(2, 2, 20),
        monolith: new THREE.BoxGeometry(15, 30, 15),
        rock: new THREE.DodecahedronGeometry(8, 0),
        crystal: new THREE.OctahedronGeometry(6, 0),
        treeTrunk: new THREE.CylinderGeometry(1, 1, 15),
        treeCrown: new THREE.IcosahedronGeometry(8, 1),
        towerBase: new THREE.BoxGeometry(10, 40, 10),
        towerTop: new THREE.ConeGeometry(8, 15, 4),
        bridgeSpan: new THREE.BoxGeometry(30, 2, 8)
    },
    materials: {
        chrome: new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 1.0, roughness: 0.1 }),
        metal: new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.5 }),
        rock: new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9, flatShading: true }),
        crystal: new THREE.MeshPhysicalMaterial({ color: 0x64c8ff, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.1, ior: 1.5 }),
        neonTree: new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 1.5 }),
        wood: new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.9 }),
        tower: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.3, flatShading: true }),
        bridge: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8, flatShading: true })
    }
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

function createGoldenParticles() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        // Start roughly near the camera
        positions[i * 3] = camera.position.x + (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 10 - 20;

        velocities.push({
            x: (Math.random() - 0.5) * 50,
            y: (Math.random() - 0.5) * 50,
            z: (Math.random() - 0.5) * 50
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Golden glow material
    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 0.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData.velocities = velocities;
    particles.userData.age = 0;

    scene.add(particles);
    return particles;
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();
        goldenParticles = createGoldenParticles();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh = null;
    let yOffset = 0;

    switch(type) {
        case 'glass-cube':
            mesh = new THREE.Mesh(blockCache.geometries.cube, glassMaterial);
            yOffset = 5;
            break;
        case 'chrome-cube':
            mesh = new THREE.Mesh(blockCache.geometries.cube, blockCache.materials.chrome);
            yOffset = 5;
            break;
        case 'metal-cube':
            mesh = new THREE.Mesh(blockCache.geometries.cube, blockCache.materials.metal);
            yOffset = 5;
            break;
        case 'neon-pillar':
            mesh = new THREE.Mesh(blockCache.geometries.pillar, neonCyanMaterial);
            yOffset = 10;
            break;
        case 'monolith':
            mesh = new THREE.Mesh(blockCache.geometries.monolith, monolithMaterial);
            yOffset = 15;
            break;
        case 'rock':
            mesh = new THREE.Mesh(blockCache.geometries.rock, blockCache.materials.rock);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            yOffset = 4;
            break;
        case 'crystal':
            mesh = new THREE.Mesh(blockCache.geometries.crystal, blockCache.materials.crystal);
            mesh.rotation.y = Math.random() * Math.PI;
            yOffset = 4;
            break;
        case 'neon-tree':
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(blockCache.geometries.treeTrunk, blockCache.materials.wood);
            trunk.position.y = 7.5;
            const crown = new THREE.Mesh(blockCache.geometries.treeCrown, blockCache.materials.neonTree);
            crown.position.y = 15;
            mesh.add(trunk);
            mesh.add(crown);
            break;
        case 'tower':
            mesh = new THREE.Group();
            const tBase = new THREE.Mesh(blockCache.geometries.towerBase, blockCache.materials.tower);
            tBase.position.y = 20;
            const tTop = new THREE.Mesh(blockCache.geometries.towerTop, neonCyanMaterial);
            tTop.position.y = 47.5;
            mesh.add(tBase);
            mesh.add(tTop);
            break;
        case 'bridge':
            mesh = new THREE.Mesh(blockCache.geometries.bridgeSpan, blockCache.materials.bridge);
            yOffset = 1;
            break;
    }

    if (mesh) {
        mesh.position.copy(pos);
        mesh.position.y += yOffset;
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

    // Update golden particles
    if (goldenParticles) {
        goldenParticles.userData.age += delta;

        const positions = goldenParticles.geometry.attributes.position.array;
        const velocities = goldenParticles.userData.velocities;

        for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x * delta;
            positions[i * 3 + 1] += velocities[i].y * delta;
            positions[i * 3 + 2] += velocities[i].z * delta;
        }

        goldenParticles.geometry.attributes.position.needsUpdate = true;

        // Fade out
        if (goldenParticles.userData.age > 1.5) {
            goldenParticles.material.opacity = Math.max(0, 1.0 - (goldenParticles.userData.age - 1.5));
        }

        // Remove after 2.5 seconds
        if (goldenParticles.userData.age > 2.5) {
            scene.remove(goldenParticles);
            goldenParticles.geometry.dispose();
            goldenParticles.material.dispose();
            goldenParticles = null;
        }
    }

    renderer.render(scene, camera);
}
