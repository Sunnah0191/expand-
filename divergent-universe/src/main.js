import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, neonBlueMaterial, neonWhiteMaterial } from './utils/Materials.js';

// Global variables
let camera, scene, renderer;
let clock;
let world;
let controls;
let buildMenu;
let isGodMode = false;

// Custom Materials for missing ones
const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.1,
    metalness: 0.9
});
const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true
});
const matteMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.7,
    metalness: 0.5
});

// Cache Geometries
const geometries = {
    box10: new THREE.BoxGeometry(10, 10, 10),
    box15: new THREE.BoxGeometry(15, 30, 15),
    box20: new THREE.BoxGeometry(20, 10, 20),
    cylinder2: new THREE.CylinderGeometry(2, 2, 20),
    dodecahedron: new THREE.DodecahedronGeometry(8),
    octahedron: new THREE.OctahedronGeometry(6),
    cone: new THREE.ConeGeometry(5, 20, 8),
    bridge: new THREE.BoxGeometry(30, 2, 10),
    tower: new THREE.BoxGeometry(10, 50, 10)
};

let activeParticles = null;

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

    // Create particles near the camera
    const cameraPos = camera.position.clone();
    // Offset slightly forward
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const spawnCenter = cameraPos.clone().add(forward.multiplyScalar(20));

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = spawnCenter.x + (Math.random() - 0.5) * 5;
        positions[i * 3 + 1] = spawnCenter.y + (Math.random() - 0.5) * 5;
        positions[i * 3 + 2] = spawnCenter.z + (Math.random() - 0.5) * 5;

        velocities.push({
            x: (Math.random() - 0.5) * 20,
            y: (Math.random() - 0.5) * 20,
            z: (Math.random() - 0.5) * 20
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

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    activeParticles = {
        points: points,
        velocities: velocities,
        life: 1.0
    };
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;
    if (type === 'glass-cube') {
        mesh = new THREE.Mesh(geometries.box10, glassMaterial);
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(geometries.cylinder2, neonCyanMaterial);
        pos.y += 10; // offset so it sits on ground
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(geometries.box15, monolithMaterial);
        pos.y += 15;
    } else if (type === 'rock') {
        mesh = new THREE.Mesh(geometries.dodecahedron, rockMaterial);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        pos.y += 8;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(geometries.octahedron, glassMaterial);
        mesh.scale.set(1, 2, 1);
        pos.y += 12;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geometries.cone, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(geometries.tower, monolithMaterial);
        pos.y += 25;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(geometries.bridge, monolithMaterial);
        // add a neon accent
        const accent = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 0.5), neonCyanMaterial);
        accent.position.y = 1;
        accent.position.z = 5;
        mesh.add(accent);
        const accent2 = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 0.5), neonCyanMaterial);
        accent2.position.y = 1;
        accent2.position.z = -5;
        mesh.add(accent2);
        pos.y += 1;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(geometries.box10, chromeMaterial);
        pos.y += 5;
    } else if (type === 'neon-block') {
        mesh = new THREE.Mesh(geometries.box10, neonBlueMaterial);
        pos.y += 5;
    } else if (type === 'matte-metal-block') {
        mesh = new THREE.Mesh(geometries.box20, matteMetalMaterial);
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

    if (activeParticles) {
        const p = activeParticles.points;
        const positions = p.geometry.attributes.position.array;

        for (let i = 0; i < activeParticles.velocities.length; i++) {
            positions[i * 3] += activeParticles.velocities[i].x * delta;
            positions[i * 3 + 1] += activeParticles.velocities[i].y * delta;
            positions[i * 3 + 2] += activeParticles.velocities[i].z * delta;
        }
        p.geometry.attributes.position.needsUpdate = true;

        activeParticles.life -= delta * 1.5;
        p.material.opacity = activeParticles.life;

        if (activeParticles.life <= 0) {
            scene.remove(p);
            p.geometry.dispose();
            p.material.dispose();
            activeParticles = null;
        }
    }

    renderer.render(scene, camera);
}
