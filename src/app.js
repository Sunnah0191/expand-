import * as THREE from 'three';

import { ChunkManager } from './chunks/ChunkManager.js';
import { MainContinent } from './chunks/MainContinent.js';
import { IslandOne } from './chunks/IslandOne.js';
import { IslandTwo } from './chunks/IslandTwo.js';
import { IslandThree } from './chunks/IslandThree.js';
import { IslandFour } from './chunks/IslandFour.js';
import { GodControls } from './controls/GodControls.js';
import { BuilderSystem } from './systems/BuilderSystem.js';
import { CatalogUI } from './ui/CatalogUI.js';

export class App {
  constructor(container) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050508);
    // Use a slight fog to blend the horizon
    this.scene.fog = new THREE.FogExp2(0x050508, 0.002);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.set(0, 150, 400);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping to make brights pop (neon, glowing)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // Manage all updatable objects (chunks, controls, etc.)
    this.updatables = [];

    this.setupLights();

    // Initialize Chunk System
    this.chunkManager = new ChunkManager(this.scene);
    this.updatables.push(this.chunkManager);

    // Add Chunks
    this.chunkManager.addChunk(new MainContinent());
    this.chunkManager.addChunk(new IslandOne());
    this.chunkManager.addChunk(new IslandTwo());
    this.chunkManager.addChunk(new IslandThree());
    this.chunkManager.addChunk(new IslandFour());

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  initGodMode() {
    // Controls
    this.controls = new GodControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());
    this.updatables.push(this.controls);

    // Position slightly above the Main Continent
    this.controls.getObject().position.set(0, 300, 200);

    // Builder System
    this.builderSystem = new BuilderSystem(this.scene, this.camera, document.body);
    this.updatables.push(this.builderSystem);

    // Catalog UI
    this.catalogUI = new CatalogUI(this.builderSystem);

    this.controls.activate();
    this.builderSystem.activate();
  }

  setupLights() {
    // Ambient light - aquatic / deep blue feel
    const ambientLight = new THREE.AmbientLight(0x0a1525, 1.5);
    this.scene.add(ambientLight);

    // Main directional light - cool cyan/white tint
    const dirLight = new THREE.DirectionalLight(0xdcf2ff, 2.5);
    dirLight.position.set(200, 500, 300);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 2000;

    const d = 1000;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    this.scene.add(dirLight);

    // Add a slight colored rim light (neon vibe)
    const rimLight = new THREE.DirectionalLight(0x64c8ff, 1.0);
    rimLight.position.set(-200, 100, -300);
    this.scene.add(rimLight);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  render() {
    const delta = this.clock.getDelta();

    for (const updatable of this.updatables) {
      if (typeof updatable.update === 'function') {
        updatable.update(delta);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
