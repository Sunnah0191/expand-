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

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();

        // 3D Golden Particle Explosion Effect
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = camera.position.x + (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = camera.position.z - 20 + (Math.random() - 0.5) * 10;

            velocities.push({
                x: (Math.random() - 0.5) * 50,
                y: (Math.random() - 0.5) * 50,
                z: (Math.random() - 0.5) * 50
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 0.5,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        explosionParticles = new THREE.Points(geometry, material);
        explosionParticles.userData = { velocities: velocities };
        scene.add(explosionParticles);
        explosionTime = 2.0; // Life time in seconds
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    // Cache to prevent memory leaks for repeatedly placed geometries/materials
    if (!onPlaceBlock.cache) {
        onPlaceBlock.cache = {
            geometries: {
                box10: new THREE.BoxGeometry(10, 10, 10),
                box15_30: new THREE.BoxGeometry(15, 30, 15),
                box20_40: new THREE.BoxGeometry(20, 40, 20),
                box10_2: new THREE.BoxGeometry(10, 2, 20),
                cylinder: new THREE.CylinderGeometry(2, 2, 20),
                cone: new THREE.ConeGeometry(5, 15, 4),
                sphere: new THREE.SphereGeometry(6, 16, 16),
                dodecahedron: new THREE.DodecahedronGeometry(8)
            },
            materials: {
                landscapeRock: new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9, flatShading: true }),
                glassCrystal: new THREE.MeshPhysicalMaterial({ color: 0xaaccff, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.1, ior: 1.5 }),
                neonTree: new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 1 }),
                darkTower: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.8 }),
                matteBridge: new THREE.MeshPhysicalMaterial({ color: 0x666666, roughness: 0.6, transmission: 0.2, transparent: true }),
                chromeBlock: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.0, metalness: 1.0 }),
                neonBlock: new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.0 }),
                metalBlock: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.6 })
            }
        };
    }

    const cache = onPlaceBlock.cache;
    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Landscape
    if (type === 'landscape-rock') {
        mesh = new THREE.Mesh(cache.geometries.dodecahedron, cache.materials.landscapeRock);
        pos.y += 8;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(cache.geometries.cone, cache.materials.glassCrystal);
        pos.y += 7.5;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(cache.geometries.sphere, cache.materials.neonTree);
        pos.y += 6;

    // Architecture WuWa
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(cache.geometries.box15_30, monolithMaterial);
        pos.y += 15;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(cache.geometries.box20_40, cache.materials.darkTower);
        pos.y += 20;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(cache.geometries.box10_2, cache.materials.matteBridge);
        pos.y += 1;

    // Blocks
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(cache.geometries.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(cache.geometries.box10, cache.materials.chromeBlock);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(cache.geometries.box10, cache.materials.neonBlock);
        pos.y += 5;
    } else if (type === 'metal-block') {
        mesh = new THREE.Mesh(cache.geometries.box10, cache.materials.metalBlock);
        pos.y += 5;

    // Legacy support just in case
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(cache.geometries.cylinder, neonCyanMaterial);
        pos.y += 10;
    }

    if (mesh) {
        mesh.position.copy(pos);
        // Add slight random rotation for rocks/crystals
        if (type === 'landscape-rock' || type === 'glass-crystal') {
             mesh.rotation.y = Math.random() * Math.PI;
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

    // Update Explosion Particles
    if (explosionParticles && explosionTime > 0) {
        explosionTime -= delta;
        const positions = explosionParticles.geometry.attributes.position.array;
        const velocities = explosionParticles.userData.velocities;

        for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x * delta;
            positions[i * 3 + 1] += velocities[i].y * delta;
            positions[i * 3 + 2] += velocities[i].z * delta;

            // Apply drag
            velocities[i].x *= 0.95;
            velocities[i].y *= 0.95;
            velocities[i].z *= 0.95;
        }
        explosionParticles.geometry.attributes.position.needsUpdate = true;

        // Fade out
        explosionParticles.material.opacity = Math.max(0, explosionTime / 2.0);

        if (explosionTime <= 0) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        }
    }

    renderer.render(scene, camera);
}
