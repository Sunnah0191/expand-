import * as THREE from 'three';
import { MainContinent } from './world/MainContinent.js';
import { IslandOne } from './world/IslandOne.js';
import { IslandTwo } from './world/IslandTwo.js';
import { IslandThree } from './world/IslandThree.js';
import { IslandFour } from './world/IslandFour.js';
import { FlyControls } from './controls/FlyControls.js';
import { BuildingRaycaster } from './controls/BuildingRaycaster.js';
import { Auth } from './ui/Auth.js';
import { Catalog } from './ui/Catalog.js';
import { Builder } from './utils/Builder.js';

// --------------------------------------------------------
// GLOBAL APP STATE
// --------------------------------------------------------
export const APP = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  isGodMode: false,
  divergenceSpeed: 0.1,
  chunks: [],
  controls: null,
  raycaster: null,
  builder: null,
  catalog: null
};

// --------------------------------------------------------
// INITIALIZATION
// --------------------------------------------------------
function init() {
  const container = document.getElementById('canvas-container');

  // Scene
  APP.scene = new THREE.Scene();
  APP.scene.background = new THREE.Color(0x050a15);
  APP.scene.fog = new THREE.FogExp2(0x050a15, 0.0015);

  // Camera
  APP.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
  APP.camera.position.set(0, 50, 200);

  // Renderer
  APP.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  APP.renderer.setSize(window.innerWidth, window.innerHeight);
  APP.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  APP.renderer.shadowMap.enabled = true;
  APP.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  APP.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  APP.renderer.toneMappingExposure = 1.0;
  container.appendChild(APP.renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  APP.scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xdfffff, 1.2);
  directionalLight.position.set(200, 400, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 10;
  directionalLight.shadow.camera.far = 1000;
  const d = 300;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;
  APP.scene.add(directionalLight);

  // Clock
  APP.clock = new THREE.Clock();

  // Background Monolith for Login
  const geom = new THREE.OctahedronGeometry(40, 0);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.2,
    transmission: 0.9,
    thickness: 2.0,
  });
  APP.bgMonolith = new THREE.Mesh(geom, mat);
  APP.bgMonolith.position.set(0, 20, 0);
  APP.scene.add(APP.bgMonolith);

  // Initialize UI and Core Logic
  const auth = new Auth((isGod) => {
    if(isGod) enableGodMode();
  });

  window.addEventListener('resize', onWindowResize);

  // Builder
  APP.builder = new Builder(APP.scene);

  animate();
}

function enableGodMode() {
  APP.isGodMode = true;

  // Remove login background monolith
  APP.scene.remove(APP.bgMonolith);

  // Generate World
  APP.chunks.push(new MainContinent(APP.scene));
  APP.chunks.push(new IslandOne(APP.scene));
  APP.chunks.push(new IslandTwo(APP.scene));
  APP.chunks.push(new IslandThree(APP.scene));
  APP.chunks.push(new IslandFour(APP.scene));

  APP.chunks.forEach(c => c.generate());

  // Setup Controls
  APP.controls = new FlyControls(APP.camera, APP.renderer.domElement);
  APP.controls.enabled = true;
  APP.camera.position.set(0, 100, 300);

  // Setup Raycaster for building
  APP.raycaster = new BuildingRaycaster(APP.camera, APP.scene);
  APP.raycaster.enabled = true;

  // Setup Catalog UI
  APP.catalog = new Catalog((type) => {
    // On select type
  });
  APP.catalog.showReticle(true);

  // Build Click Listener
  APP.renderer.domElement.addEventListener('mousedown', (e) => {
    // Only build if we are pointer locked (meaning catalog is closed and we are flying)
    if(document.pointerLockElement === APP.renderer.domElement && APP.catalog.selectedType) {
      if(e.button === 0 && APP.raycaster.currentIntersection) {
        APP.builder.placeBlock(APP.catalog.selectedType, APP.raycaster.currentIntersection.point);
      }
    }
  });
}

function onWindowResize() {
  APP.camera.aspect = window.innerWidth / window.innerHeight;
  APP.camera.updateProjectionMatrix();
  APP.renderer.setSize(window.innerWidth, window.innerHeight);
}

// --------------------------------------------------------
// RENDER LOOP
// --------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  const dt = APP.clock.getDelta();
  const elapsedTime = APP.clock.getElapsedTime();

  if (!APP.isGodMode && APP.bgMonolith) {
    APP.bgMonolith.rotation.y += 0.2 * dt;
    APP.bgMonolith.rotation.x += 0.1 * dt;
  } else if (APP.isGodMode) {
    // Update Chunks Divergence
    APP.chunks.forEach(chunk => {
      chunk.update(dt, APP.divergenceSpeed, elapsedTime);
    });

    // Update Controls
    if (APP.controls) APP.controls.update(dt);
    if (APP.raycaster) APP.raycaster.update();
  }

  APP.renderer.render(APP.scene, APP.camera);
}

init();
