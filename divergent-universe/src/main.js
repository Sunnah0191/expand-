import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import {
    glassMaterial, neonCyanMaterial, monolithMaterial,
    chromeMaterial, matteMetalMaterial
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


function triggerExplosion() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    // Emit from center/camera
    const startPos = camera.position.clone();

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = startPos.x;
        positions[i * 3 + 1] = startPos.y;
        positions[i * 3 + 2] = startPos.z - 10;

        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
        ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffd700, // Gold
        size: 3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);


    // Simple animation loop for explosion
    let age = 0;
    let lastTime = performance.now();
    const animateExplosion = () => {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        age += delta;

        if (age > 2) {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
            return;
        }

        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x * 0.05;
            positions[i * 3 + 1] += velocities[i].y * 0.05;
            positions[i * 3 + 2] += velocities[i].z * 0.05;

            // Gravity and slow down
            velocities[i].y -= 0.5;
            velocities[i].multiplyScalar(0.95);
        }
        particles.geometry.attributes.position.needsUpdate = true;
        material.opacity = 1 - (age / 2);

        requestAnimationFrame(animateExplosion);
    };

    animateExplosion();
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();
        triggerExplosion();
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

    // Lazy initialize geometries
    if (!onPlaceBlock.geometries) {
        onPlaceBlock.geometries = {
            rock: new THREE.DodecahedronGeometry(8, 1),
            crystal: new THREE.ConeGeometry(5, 20, 4),
            tree: new THREE.CylinderGeometry(1, 1, 30),
            monolith: new THREE.BoxGeometry(15, 30, 15),
            tower: new THREE.CylinderGeometry(8, 12, 50, 4),
            bridge: new THREE.BoxGeometry(40, 2, 10),
            cube: new THREE.BoxGeometry(10, 10, 10)
        };
        // Transform some geometries so their origin is at the bottom
        onPlaceBlock.geometries.crystal.translate(0, 10, 0);
        onPlaceBlock.geometries.tree.translate(0, 15, 0);
        onPlaceBlock.geometries.monolith.translate(0, 15, 0);
        onPlaceBlock.geometries.tower.translate(0, 25, 0);
        onPlaceBlock.geometries.cube.translate(0, 5, 0);
    }

    const geos = onPlaceBlock.geometries;

    switch (type) {
        case 'rock':
            mesh = new THREE.Mesh(geos.rock, chromeMaterial);
            break;
        case 'glass-crystal':
            mesh = new THREE.Mesh(geos.crystal, glassMaterial);
            break;
        case 'neon-tree':
            mesh = new THREE.Mesh(geos.tree, neonCyanMaterial);
            break;
        case 'monolith':
            mesh = new THREE.Mesh(geos.monolith, monolithMaterial);
            break;
        case 'dark-tower':
            mesh = new THREE.Mesh(geos.tower, monolithMaterial);
            break;
        case 'matte-bridge':
            mesh = new THREE.Mesh(geos.bridge, matteMetalMaterial);
            break;
        case 'glass-cube':
            mesh = new THREE.Mesh(geos.cube, glassMaterial);
            break;
        case 'chrome-cube':
            mesh = new THREE.Mesh(geos.cube, chromeMaterial);
            break;
        case 'neon-cube':
            mesh = new THREE.Mesh(geos.cube, neonCyanMaterial);
            break;
        case 'metal-cube':
            mesh = new THREE.Mesh(geos.cube, matteMetalMaterial);
            break;
        case 'neon-pillar':
            // legacy catch
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), neonCyanMaterial);
            pos.y += 10;
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
