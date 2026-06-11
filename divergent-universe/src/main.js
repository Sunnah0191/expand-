import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial, rockMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;
let explosionParticles = null;

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
        triggerGoldExplosion();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function triggerGoldExplosion() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        // Start roughly at camera position slightly forward
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const startPos = camera.position.clone().add(forward.multiplyScalar(20));

        positions[i * 3] = startPos.x;
        positions[i * 3 + 1] = startPos.y;
        positions[i * 3 + 2] = startPos.z;

        // Random spherical direction
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;

        velocities.push({
            x: Math.cos(theta) * Math.sin(phi) * (50 + Math.random() * 100),
            y: Math.sin(theta) * Math.sin(phi) * (50 + Math.random() * 100),
            z: Math.cos(phi) * (50 + Math.random() * 100),
            life: 1.0
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3.0,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    explosionParticles = new THREE.Points(geometry, material);
    explosionParticles.userData = { velocities: velocities };
    scene.add(explosionParticles);

    // Remove after a while
    setTimeout(() => {
        if (explosionParticles) {
            scene.remove(explosionParticles);
            explosionParticles.geometry.dispose();
            explosionParticles.material.dispose();
            explosionParticles = null;
        }
    }, 2000);
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    if (type === 'midpoly-rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(10, 0), rockMaterial);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        pos.y += 5;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(8, 0), glassMaterial);
        mesh.scale.set(1, 2, 1);
        pos.y += 16;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 2, 15), monolithMaterial);
        trunk.position.y = 7.5;
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 0), neonCyanMaterial);
        crown.position.y = 18;
        mesh.add(trunk);
        mesh.add(crown);
    } else if (type === 'futuristic-monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 40, 15), monolithMaterial);
        pos.y += 20;
    } else if (type === 'levitating-tower') {
        mesh = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 12), monolithMaterial);
        base.position.y = 5;
        const floating = new THREE.Mesh(new THREE.BoxGeometry(10, 25, 10), monolithMaterial);
        floating.position.y = 22;
        const energy = new THREE.Mesh(new THREE.BoxGeometry(11, 2, 11), neonCyanMaterial);
        energy.position.y = 13;
        mesh.add(base);
        mesh.add(floating);
        mesh.add(energy);
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 10), matteMetalMaterial);
        pos.y += 1;
    } else if (type === 'glass-cube') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'matte-metal') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), matteMetalMaterial);
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
        const positions = explosionParticles.geometry.attributes.position.array;
        const velocities = explosionParticles.userData.velocities;
        let opacity = explosionParticles.material.opacity;

        for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x * delta;
            positions[i * 3 + 1] += velocities[i].y * delta;
            positions[i * 3 + 2] += velocities[i].z * delta;

            // Add some drag
            velocities[i].x *= 0.95;
            velocities[i].y *= 0.95;
            velocities[i].z *= 0.95;
        }

        explosionParticles.material.opacity = Math.max(0, opacity - delta * 0.5);
        explosionParticles.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}
