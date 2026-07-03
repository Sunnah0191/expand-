import * as THREE from 'three';
import { setupUI } from './ui/UIManager.js';
import { initWorld, updateWorld } from './world/WorldManager.js';
import { initControls, updateControls } from './controls/ControlsManager.js';

// Global application state
const appState = {
  isGodMode: false,
  isCatalogOpen: false,
  selectedBlock: null
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050a10); // Deep dark ocean blue
scene.fog = new THREE.FogExp2(0x050a10, 0.001);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 50, 150);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// renderer.shadowMap.enabled = true; // Disabled for performance, using baked/fake shadows
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);
// Start with blur for login screen
renderer.domElement.classList.add('blur-canvas');

// Initial lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xe0ffff, 1);
directionalLight.position.set(100, 200, 50);
scene.add(directionalLight);

// Clock for animations
const clock = new THREE.Clock();

// Initialize components
initWorld(scene);
initControls(camera, renderer.domElement, scene, appState);
setupUI(appState, renderer.domElement, camera, scene);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  updateWorld(delta, elapsedTime);
  updateControls(delta);

  renderer.render(scene, camera);
}

animate();
