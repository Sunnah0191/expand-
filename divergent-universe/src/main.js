import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial, rockMaterial, crystalMaterial } from './utils/Materials.js';

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
        // Need to make it flex based on the style changes if build menu was changed
        const catalog = document.getElementById('build-catalog');
        if (catalog && buildMenu.isVisible) {
            catalog.style.display = 'flex';
        }
        controls.enable();

        // Golden particle explosion
        const particleCount = 1000;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        const particleVel = [];

        for (let i = 0; i < particleCount; i++) {
            particlePos[i*3] = camera.position.x + (Math.random() - 0.5) * 10;
            particlePos[i*3+1] = camera.position.y + (Math.random() - 0.5) * 10;
            particlePos[i*3+2] = camera.position.z - 20 + (Math.random() - 0.5) * 10;

            particleVel.push({
                x: (Math.random() - 0.5) * 50,
                y: (Math.random() - 0.5) * 50,
                z: (Math.random() - 0.5) * 50
            });
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 0.5,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particleGeo, particleMat);
        scene.add(particleSystem);

        let lastTime = performance.now();
        let age = 0;

        function animateParticles() {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            age += dt;

            const positions = particleGeo.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                positions[i*3] += particleVel[i].x * dt;
                positions[i*3+1] += particleVel[i].y * dt;
                positions[i*3+2] += particleVel[i].z * dt;
            }
            particleGeo.attributes.position.needsUpdate = true;
            particleMat.opacity = Math.max(0, 1 - age / 2); // Fade out over 2 seconds

            if (age < 2) {
                requestAnimationFrame(animateParticles);
            } else {
                scene.remove(particleSystem);
                particleGeo.dispose();
                particleMat.dispose();
            }
        }
        animateParticles();

    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

// Cache geometries
const geoCache = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    box15_30: new THREE.BoxGeometry(15, 30, 15),
    dodecahedron: new THREE.DodecahedronGeometry(10, 1),
    cone: new THREE.ConeGeometry(3, 20, 5),
    cylinder: new THREE.CylinderGeometry(2, 2, 20),
    tower: new THREE.BoxGeometry(10, 50, 10),
    bridge: new THREE.BoxGeometry(30, 2, 10)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    switch (type) {
        // Ландшафт
        case 'rock':
            mesh = new THREE.Mesh(geoCache.dodecahedron, rockMaterial);
            mesh.scale.set(1, 1.5, 1);
            pos.y += 7.5;
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(geoCache.dodecahedron, crystalMaterial);
            mesh.scale.set(0.5, 2, 0.5);
            pos.y += 10;
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(geoCache.cone, neonCyanMaterial);
            pos.y += 10;
            break;

        // Архитектура WuWa
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(geoCache.box15_30, monolithMaterial);
            pos.y += 15;
            break;
        case 'wuwa-tower':
            mesh = new THREE.Mesh(geoCache.tower, monolithMaterial);
            pos.y += 25;
            break;
        case 'wuwa-bridge':
            mesh = new THREE.Mesh(geoCache.bridge, matteMetalMaterial);
            break;

        // Конструктор (Блоки)
        case 'glass-cube':
            mesh = new THREE.Mesh(geoCache.box10, glassMaterial);
            pos.y += 5;
            break;
        case 'chrome-block':
            mesh = new THREE.Mesh(geoCache.box10, chromeMaterial);
            pos.y += 5;
            break;
        case 'neon-block':
            mesh = new THREE.Mesh(geoCache.box10, neonCyanMaterial);
            pos.y += 5;
            break;
        case 'matte-block':
            mesh = new THREE.Mesh(geoCache.box10, matteMetalMaterial);
            pos.y += 5;
            break;

        // Fallback for original types
        case 'neon-pillar':
            mesh = new THREE.Mesh(geoCache.cylinder, neonCyanMaterial);
            pos.y += 10;
            break;
        case 'monolith':
            mesh = new THREE.Mesh(geoCache.box15_30, monolithMaterial);
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

    renderer.render(scene, camera);
}
