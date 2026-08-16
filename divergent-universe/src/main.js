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
let godModeParticles = null;
let particleTime = 0;

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

        // Trigger 3D golden particle explosion
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        // Start slightly in front of camera
        const startPos = new THREE.Vector3(0, 0, -20);
        startPos.applyMatrix4(camera.matrixWorld);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = startPos.x;
            positions[i * 3 + 1] = startPos.y;
            positions[i * 3 + 2] = startPos.z;

            // Random outward velocity
            const v = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(Math.random() * 50 + 20);
            velocities.push(v);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 2,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        godModeParticles = new THREE.Points(geometry, material);
        godModeParticles.userData = { velocities: velocities };
        scene.add(godModeParticles);
        particleTime = 0;

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

    // Ландшафт (Landscape)
    if (type === 'landscape-rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(10, 0), monolithMaterial);
        pos.y += 8;
    } else if (type === 'landscape-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(8, 0), glassMaterial);
        pos.y += 6;
    } else if (type === 'landscape-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 2, 10), monolithMaterial);
        trunk.position.y = 5;
        const top = new THREE.Mesh(new THREE.DodecahedronGeometry(6, 1), neonCyanMaterial);
        top.position.y = 12;
        mesh.add(trunk);
        mesh.add(top);
    }
    // Архитектура WuWa
    else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        pos.y += 15;
    } else if (type === 'wuwa-tower') {
        mesh = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(20, 50, 20), monolithMaterial);
        base.position.y = 25;
        const glow = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 22), neonCyanMaterial);
        glow.position.y = 40;
        mesh.add(base);
        mesh.add(glow);
    } else if (type === 'wuwa-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 10), matteMetalMaterial);
        pos.y += 1;
    }
    // Конструктор (Блоки)
    else if (type === 'block-glass') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-metal') {
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

    if (godModeParticles) {
        particleTime += delta;
        if (particleTime > 2.0) {
            scene.remove(godModeParticles);
            godModeParticles.geometry.dispose();
            godModeParticles.material.dispose();
            godModeParticles = null;
        } else {
            const positions = godModeParticles.geometry.attributes.position.array;
            const velocities = godModeParticles.userData.velocities;

            for (let i = 0; i < velocities.length; i++) {
                positions[i * 3] += velocities[i].x * delta;
                positions[i * 3 + 1] += velocities[i].y * delta;
                positions[i * 3 + 2] += velocities[i].z * delta;
            }
            godModeParticles.geometry.attributes.position.needsUpdate = true;
            godModeParticles.material.opacity = 1.0 - (particleTime / 2.0);
        }
    }

    renderer.render(scene, camera);
}
