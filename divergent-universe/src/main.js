import * as THREE from 'three';

let scene, camera, renderer;

export function init() {
  const container = document.getElementById('canvas-container');

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050a15); // Deep dark ocean blue
  scene.fog = new THREE.FogExp2(0x050a15, 0.002);

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 50, 100);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Basic Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(100, 200, 50);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 500;
  dirLight.shadow.camera.left = -200;
  dirLight.shadow.camera.right = 200;
  dirLight.shadow.camera.top = 200;
  dirLight.shadow.camera.bottom = -200;
  scene.add(dirLight);

  const hemisphereLight = new THREE.HemisphereLight(0x00ffff, 0x050a15, 0.5); // Cyan sky, dark ground
  scene.add(hemisphereLight);

  // Window Resize
  window.addEventListener('resize', onWindowResize);

  // Start Animation Loop
  renderer.setAnimationLoop(animate);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  if (chunkSystem) chunkSystem.update(delta);
  if (divergenceMath) divergenceMath.update(delta, elapsedTime);
  if (flyControls) flyControls.update(delta);
  if (raycastingGrid) raycastingGrid.update();

  renderer.render(scene, camera);
}

import { LoginScreen } from './ui/LoginScreen.js';
import { ChunkSystem } from './world/ChunkSystem.js';
import { DivergenceMath } from './utils/DivergenceMath.js';
import { FlyControls } from './controls/FlyControls.js';
import { RaycastingGrid } from './controls/RaycastingGrid.js';
import { BuildingCatalog } from './ui/BuildingCatalog.js';
import * as Materials from './world/Materials.js';

// Global getters for other modules
export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }

let isGodMode = false;
let chunkSystem;
let divergenceMath;
let flyControls;
let raycastingGrid;
let buildingCatalog;
let clock = new THREE.Clock();

let currentBuildItem = null;

// Initialize
init();

chunkSystem = new ChunkSystem(scene);
divergenceMath = new DivergenceMath(chunkSystem.getIslands());
flyControls = new FlyControls(camera, renderer.domElement);
raycastingGrid = new RaycastingGrid(scene, camera, renderer.domElement);

buildingCatalog = new BuildingCatalog((item) => {
  currentBuildItem = item;
  if (isGodMode && currentBuildItem) {
    raycastingGrid.setEnabled(true);
  } else {
    raycastingGrid.setEnabled(false);
  }
});

const loginScreen = new LoginScreen((godMode) => {
  isGodMode = godMode;
  if (isGodMode) {
    console.log("God mode activated");
    flyControls.enabled = true;
    // Building catalog is toggled with '1' key automatically by its class
  }
});

// Click to place
renderer.domElement.addEventListener('mousedown', (e) => {
  if (!isGodMode || !currentBuildItem || !raycastingGrid.enabled || e.button !== 0) return;

  // Don't build if we clicked UI
  if (e.target !== renderer.domElement) return;

  const pos = raycastingGrid.getPosition();
  placeBuilding(currentBuildItem, pos);
});

function placeBuilding(item, position) {
  let geo, mat;

  switch(item.type) {
    case 'rock':
      geo = new THREE.DodecahedronGeometry(2, 1);
      mat = Materials.monolithicMaterial;
      break;
    case 'crystal':
      geo = new THREE.OctahedronGeometry(1.5, 0);
      mat = Materials.glassTreeMaterial;
      break;
    case 'tree':
      geo = new THREE.CylinderGeometry(0.5, 1, 5, 6);
      mat = Materials.glassTreeMaterial;
      break;
    case 'monolith':
      geo = new THREE.BoxGeometry(3, 10, 3);
      mat = Materials.monolithicMaterial;
      break;
    case 'tower':
      geo = new THREE.CylinderGeometry(2, 3, 15, 8);
      mat = Materials.glassFacadeMaterial;
      break;
    case 'bridge':
      geo = new THREE.BoxGeometry(10, 0.5, 3);
      mat = Materials.glassFacadeMaterial;
      break;
    case 'block_glass':
      geo = new THREE.BoxGeometry(1, 1, 1);
      mat = Materials.glassFacadeMaterial;
      break;
    case 'block_neon':
      geo = new THREE.BoxGeometry(1, 1, 1);
      mat = Materials.neonGlowMaterial;
      break;
    case 'block_metal':
      geo = new THREE.BoxGeometry(1, 1, 1);
      mat = Materials.whiteBuildingMaterial;
      break;
    default:
      geo = new THREE.BoxGeometry(1, 1, 1);
      mat = Materials.whiteBuildingMaterial;
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // If it's a tree or tower, shift up by half height so it sits on grid
  if (geo.parameters && geo.parameters.height) {
     mesh.position.y += geo.parameters.height / 2;
  } else if (item.type === 'rock' || item.type === 'crystal') {
     mesh.position.y += 1;
  }

  // Random slight rotation for organics
  if (['rock', 'crystal', 'tree'].includes(item.type)) {
    mesh.rotation.y = Math.random() * Math.PI;
  }

  scene.add(mesh);
}
