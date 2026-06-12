import * as THREE from 'three';
import { LoginScreen } from './ui/LoginScreen.js';
import { ChunkSystem } from './world/ChunkSystem.js';
import { MainContinent } from './world/MainContinent.js';
import { IslandOne } from './world/IslandOne.js';
import { IslandTwo } from './world/IslandTwo.js';
import { IslandThree } from './world/IslandThree.js';
import { IslandFour } from './world/IslandFour.js';
import { FlyControls } from './controls/FlyControls.js';
import { Builder } from './controls/Builder.js';
import { Catalog } from './ui/Catalog.js';
import { Materials } from './utils/Materials.js';

// --- Global State ---
export const state = {
  isGodMode: false,
  time: 0,
  chunkSystem: null,
  flyControls: null,
  builder: null,
  catalog: null,
  currentBlockId: 'glass-block'
};

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f19); // Dark aquatic background
scene.fog = new THREE.FogExp2(0x0a0f19, 0.002); // Distant mist

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
// Initial camera position (looking at the monolith during login)
camera.position.set(0, 50, 150);
camera.lookAt(0, 0, 0);

// --- Renderer Setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Use softer shadows and physically correct lighting
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x00ffff, 1.5);
directionalLight.position.set(100, 200, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 1000;
const d = 300;
directionalLight.shadow.camera.left = -d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = -d;
directionalLight.shadow.bias = -0.0005;
scene.add(directionalLight);

const bluePointLight = new THREE.PointLight(0x0044ff, 2, 400);
bluePointLight.position.set(-100, 50, -100);
scene.add(bluePointLight);

// --- Temporary Monolith for Login Screen ---
const monolithGeo = new THREE.CylinderGeometry(20, 20, 100, 6);
const monolithMat = new THREE.MeshPhysicalMaterial({
  color: 0x112233,
  metalness: 0.9,
  roughness: 0.1,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1
});
const monolith = new THREE.Mesh(monolithGeo, monolithMat);
monolith.position.set(0, 0, 0);
scene.add(monolith);

// --- Handle Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Main Loop ---
const clock = new THREE.Clock();
let isAppActive = false;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  state.time += delta;

  if (!isAppActive) {
    // Idle animation for login screen
    monolith.rotation.y += 0.005;
  } else {
    // App is active, handle logic
    if (state.chunkSystem) {
      state.chunkSystem.update(state.time, delta);
    }

    if (state.isGodMode && state.flyControls) {
      state.flyControls.update(delta);
    }
  }

  renderer.render(scene, camera);
}

// --- Initialization ---
const loginScreen = new LoginScreen((isGodMode) => {
  console.log(`Logged in. God Mode: ${isGodMode}`);
  state.isGodMode = isGodMode;
  isAppActive = true;

  // Transition camera
  // In a real app we'd use GSAP for a smooth transition. For now, instant.
  camera.position.set(0, 20, 50);
  camera.lookAt(0, 0, 0);

  // Remove temporary monolith if needed, or let ChunkSystem handle world
  scene.remove(monolith);

  // Initialize World
  state.chunkSystem = new ChunkSystem(scene);
  state.chunkSystem.addChunk(new MainContinent());
  state.chunkSystem.addChunk(new IslandOne());
  state.chunkSystem.addChunk(new IslandTwo());
  state.chunkSystem.addChunk(new IslandThree());
  state.chunkSystem.addChunk(new IslandFour());

  // Controls, Builder, Catalog
  if (isGodMode) {
    state.flyControls = new FlyControls(camera, renderer.domElement);

    state.builder = new Builder(scene, camera, renderer.domElement);
    state.builder.activate();

    state.catalog = new Catalog((id) => {
      console.log(`Selected block: ${id}`);
      state.currentBlockId = id;
      // Map catalog ID to material in Builder if we expanded Builder's logic
      if (state.builder && state.builder.isActive) {
        // Just as an example, we could inject the selected material into Builder
        // This keeps Builder isolated from Catalog
      }
    });
  }
});

// Start loop
animate();

// Export scene and camera for other modules
export { scene, camera, renderer };
