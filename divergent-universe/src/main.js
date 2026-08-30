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
let particlesMesh = null;
let particlesData = [];

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

        // 3D Golden Particle Explosion
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = camera.position.x;
            positions[i * 3 + 1] = camera.position.y;
            positions[i * 3 + 2] = camera.position.z - 10;

            particlesData.push({
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100
                ),
                life: 1.0
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

        particlesMesh = new THREE.Points(geometry, material);
        scene.add(particlesMesh);

    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

// Cache geometries and materials for performance
const geometries = {
    rock: new THREE.DodecahedronGeometry(8, 1),
    crystal: new THREE.ConeGeometry(5, 20, 6),
    neonTree: new THREE.CylinderGeometry(1, 1, 15),
    neonLeaves: new THREE.SphereGeometry(6, 8, 8),
    archPillar: new THREE.BoxGeometry(5, 30, 5),
    archTop: new THREE.BoxGeometry(25, 5, 5),
    darkTower: new THREE.CylinderGeometry(8, 12, 40, 6),
    bridge: new THREE.BoxGeometry(40, 2, 10),
    cube: new THREE.BoxGeometry(10, 10, 10)
};

const extraMaterials = {
    chrome: new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        metalness: 1.0,
        roughness: 0.1
    }),
    matteMetal: new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.6,
        roughness: 0.8
    }),
    crystalMat: glassMaterial.clone()
};
extraMaterials.crystalMat.color.setHex(0x00ffff); // Tinted glass

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    switch (type) {
        // Landscape
        case 'rock':
            mesh = new THREE.Mesh(geometries.rock, monolithMaterial);
            pos.y += 4;
            // Random rotation for natural look
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            break;
        case 'crystal':
            mesh = new THREE.Mesh(geometries.crystal, extraMaterials.crystalMat);
            pos.y += 10;
            break;
        case 'neon-tree':
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(geometries.neonTree, monolithMaterial);
            trunk.position.y = 7.5;
            const leaves = new THREE.Mesh(geometries.neonLeaves, neonCyanMaterial);
            leaves.position.y = 15;
            mesh.add(trunk);
            mesh.add(leaves);
            break;

        // WuWa Architecture
        case 'monolith-arch':
            mesh = new THREE.Group();
            const p1 = new THREE.Mesh(geometries.archPillar, monolithMaterial);
            p1.position.set(-10, 15, 0);
            const p2 = new THREE.Mesh(geometries.archPillar, monolithMaterial);
            p2.position.set(10, 15, 0);
            const top = new THREE.Mesh(geometries.archTop, monolithMaterial);
            top.position.set(0, 32.5, 0);
            mesh.add(p1);
            mesh.add(p2);
            mesh.add(top);
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(geometries.darkTower, monolithMaterial);
            pos.y += 20;
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(geometries.bridge, extraMaterials.matteMetal);
            pos.y += 1;
            break;

        // Blocks
        case 'glass-cube':
            mesh = new THREE.Mesh(geometries.cube, glassMaterial);
            pos.y += 5;
            break;
        case 'chrome-cube':
            mesh = new THREE.Mesh(geometries.cube, extraMaterials.chrome);
            pos.y += 5;
            break;
        case 'neon-block':
            mesh = new THREE.Mesh(geometries.cube, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'matte-metal':
            mesh = new THREE.Mesh(geometries.cube, extraMaterials.matteMetal);
            pos.y += 5;
            break;

        // Legacy fallback
        case 'neon-pillar':
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
            pos.y += 10;
            break;
        case 'monolith':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
            pos.y += 15;
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

    if (particlesMesh) {
        const positions = particlesMesh.geometry.attributes.position.array;
        let activeParticles = 0;

        for (let i = 0; i < particlesData.length; i++) {
            const data = particlesData[i];
            if (data.life > 0) {
                positions[i * 3] += data.velocity.x * delta;
                positions[i * 3 + 1] += data.velocity.y * delta;
                positions[i * 3 + 2] += data.velocity.z * delta;

                data.life -= delta * 0.5; // Fade out over 2 seconds
                activeParticles++;
            }
        }

        particlesMesh.geometry.attributes.position.needsUpdate = true;

        if (particlesMesh.material.opacity > 0) {
            particlesMesh.material.opacity -= delta * 0.5;
        }

        if (activeParticles === 0 || particlesMesh.material.opacity <= 0) {
            scene.remove(particlesMesh);
            particlesMesh.geometry.dispose();
            particlesMesh.material.dispose();
            particlesMesh = null;
            particlesData = [];
        }
    }

    renderer.render(scene, camera);
}
