import * as THREE from 'three';
import { ChunkSystem } from './world/ChunkSystem.js';
import { LoginLogic } from './ui/LoginLogic.js';
import { FlyControls } from './controls/FlyControls.js';
import { BuilderControls } from './controls/BuilderControls.js';

// Setup Core Engine
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Background color matching the dark digital ocean aesthetic
scene.background = new THREE.Color(0x050a15);
// Add a subtle fog for depth
scene.fog = new THREE.FogExp2(0x050a15, 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 50, 150);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// Soft shadows configuration
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Lighting for Frutiger Aero / Glassmorphism aesthetic
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(100, 200, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 1000;
dirLight.shadow.camera.left = -200;
dirLight.shadow.camera.right = 200;
dirLight.shadow.camera.top = 200;
dirLight.shadow.camera.bottom = -200;
scene.add(dirLight);

// Neon accent lights
const blueLight = new THREE.PointLight(0x00f3ff, 1, 500);
blueLight.position.set(-100, 50, -100);
scene.add(blueLight);

const emeraldLight = new THREE.PointLight(0x00ff88, 1, 500);
emeraldLight.position.set(100, -50, 100);
scene.add(emeraldLight);

// Initialize Chunk System (Modular World)
const chunkSystem = new ChunkSystem(scene);

// Global State
window.gameState = {
    isGodMode: false
};

// Initialize Controls
const flyControls = new FlyControls(camera, renderer.domElement);
const builderControls = new BuilderControls(camera, scene, renderer.domElement);

// Setup UI and Login
const loginLogic = new LoginLogic(scene, camera, () => {
    // Callback when God Mode is activated
    window.gameState.isGodMode = true;
    flyControls.enable();
    builderControls.enable();
    document.getElementById('hud-screen').classList.remove('hidden');
    document.getElementById('hud-screen').classList.add('active');
});

// Window Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (!window.gameState.isGodMode) {
        // Slow rotation of central continent for login background
        camera.position.x = Math.sin(time * 0.1) * 200;
        camera.position.z = Math.cos(time * 0.1) * 200;
        camera.lookAt(0, 0, 0);
    } else {
        flyControls.update(delta);
        builderControls.update();
    }

    // Update World Chunks (Divergence Math)
    chunkSystem.update(delta, time);

    renderer.render(scene, camera);
}

animate();
