import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial } from './utils/Materials.js';

// Additional materials for the new blocks
const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9, flatShading: true });
const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.2 });
const matteBridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
const chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 1.0 });

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

function triggerGodModeExplosion() {
    const explosionGeo = new THREE.BufferGeometry();
    const particleCount = 1000;
    const posArray = new Float32Array(particleCount * 3);
    const velArray = [];

    for(let i = 0; i < particleCount * 3; i+=3) {
        posArray[i] = 0;
        posArray[i+1] = 120; // Center core height
        posArray[i+2] = 0;

        // Random velocity sphere
        const phi = Math.acos( -1 + ( 2 * i ) / (particleCount*3) );
        const theta = Math.sqrt( particleCount*3 * Math.PI ) * phi;
        const v = new THREE.Vector3(
            Math.cos(theta) * Math.sin(phi),
            Math.sin(theta) * Math.sin(phi),
            Math.cos(phi)
        );
        v.multiplyScalar(Math.random() * 5 + 2);
        velArray.push(v);
    }

    explosionGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const explosionMat = new THREE.PointsMaterial({
        size: 3,
        color: 0xffd700,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const explosion = new THREE.Points(explosionGeo, explosionMat);
    scene.add(explosion);

    let lastTime = performance.now();
    let life = 1.0;

    function animateExplosion() {
        if (life <= 0) {
            scene.remove(explosion);
            explosionGeo.dispose();
            explosionMat.dispose();
            return;
        }

        requestAnimationFrame(animateExplosion);

        const now = performance.now();
        const dTime = (now - lastTime) / 1000;
        lastTime = now;

        life -= dTime * 0.5;
        explosionMat.opacity = life;

        const positions = explosion.geometry.attributes.position.array;
        for(let i = 0; i < particleCount; i++) {
            positions[i*3] += velArray[i].x * dTime * 60;
            positions[i*3+1] += velArray[i].y * dTime * 60;
            positions[i*3+2] += velArray[i].z * dTime * 60;
            // Add slight gravity
            velArray[i].y -= 0.05;
        }
        explosion.geometry.attributes.position.needsUpdate = true;
    }

    animateExplosion();
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();
        triggerGodModeExplosion();
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
    // Cache geometries on the function object to prevent memory leaks
    onPlaceBlock.geos = onPlaceBlock.geos || {
        box10: new THREE.BoxGeometry(10, 10, 10),
        box15: new THREE.BoxGeometry(15, 30, 15),
        boxBridge: new THREE.BoxGeometry(30, 2, 10),
        cyl20: new THREE.CylinderGeometry(2, 2, 20),
        octa: new THREE.OctahedronGeometry(10, 0),
        sphere: new THREE.SphereGeometry(6, 16, 16),
        cone: new THREE.ConeGeometry(8, 20, 6)
    };

    if (type === 'glass-cube') {
        mesh = new THREE.Mesh(onPlaceBlock.geos.box10, glassMaterial);
        pos.y += 5;
    } else if (type === 'neon-pillar') {
        mesh = new THREE.Mesh(onPlaceBlock.geos.cyl20, neonCyanMaterial);
        pos.y += 10;
    } else if (type === 'monolith') {
        mesh = new THREE.Mesh(onPlaceBlock.geos.box15, monolithMaterial);
        pos.y += 15;
    } else if (type === 'glass-crystal') {
        mesh = new THREE.Mesh(onPlaceBlock.geos.octa, glassMaterial);
        pos.y += 10;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(onPlaceBlock.geos.sphere, neonCyanMaterial);
        pos.y += 6;
    } else if (type === 'rock-midpoly') {
        mesh = new THREE.Mesh(onPlaceBlock.geos.cone, rockMaterial);
        pos.y += 10;
    } else if (type === 'dark-tower') {
        mesh = new THREE.Mesh(onPlaceBlock.geos.box15, darkMaterial);
        mesh.scale.set(1, 2, 1);
        pos.y += 30;
    } else if (type === 'matte-bridge') {
        mesh = new THREE.Mesh(onPlaceBlock.geos.boxBridge, matteBridgeMaterial);
        pos.y += 1;
    } else if (type === 'chrome-block') {
        mesh = new THREE.Mesh(onPlaceBlock.geos.box10, chromeMaterial);
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
