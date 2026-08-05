import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import {
    glassMaterial, neonCyanMaterial, monolithMaterial,
    chromeMaterial, metalMaterial, crystalMaterial, leafMaterial
} from './utils/Materials.js';

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
        spawnGoldenParticles();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function spawnGoldenParticles() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 20;
        positions[i+1] = (Math.random() - 0.5) * 20;
        positions[i+2] = (Math.random() - 0.5) * 20;

        velocities.push((Math.random() - 0.5) * 2);
        velocities.push((Math.random() - 0.5) * 2);
        velocities.push((Math.random() - 0.5) * 2);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 1.5,
        transparent: true,
        opacity: 1
    });
    const particles = new THREE.Points(geometry, material);

    // Position near camera
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    particles.position.copy(camera.position).add(dir.multiplyScalar(30));
    scene.add(particles);

    let frame = 0;
    function animateParticles() {
        if (frame > 60) {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
            return;
        }
        const pos = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            pos[i*3] += velocities[i*3];
            pos[i*3+1] += velocities[i*3+1];
            pos[i*3+2] += velocities[i*3+2];
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.material.opacity *= 0.9;
        frame++;
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    if (type === 'landscape-rock') {
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(5, 1), monolithMaterial);
        pos.y += 5;
    } else if (type === 'landscape-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(4, 0), crystalMaterial);
        mesh.scale.set(1, 2.5, 1);
        pos.y += 10;
    } else if (type === 'landscape-neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10), metalMaterial);
        trunk.position.y = 5;
        const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 1), leafMaterial);
        leaves.position.y = 12;
        mesh.add(trunk);
        mesh.add(leaves);
        // We handle offset internally for group
    } else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 15), monolithMaterial);
        pos.y += 15;
    } else if (type === 'wuwa-levitating-tower') {
        mesh = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 10), monolithMaterial);
        base.position.y = 25; // Floating
        const core = new THREE.Mesh(new THREE.BoxGeometry(5, 30, 5), neonCyanMaterial);
        core.position.y = 25;
        mesh.add(base);
        mesh.add(core);
    } else if (type === 'wuwa-matte-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 10), monolithMaterial);
        pos.y += 1;
    } else if (type === 'block-glass') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-metal') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), metalMaterial);
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

    renderer.render(scene, camera);
}
