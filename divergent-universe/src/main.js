import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial } from './utils/Materials.js';

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

// Geometry Cache
const geoCache = {
    rockGeo: new THREE.DodecahedronGeometry(10, 1),
    crystalGeo: new THREE.OctahedronGeometry(8, 0),
    treeConeGeo: new THREE.ConeGeometry(5, 20, 5),
    monolithGeo: new THREE.BoxGeometry(15, 30, 15),
    towerGeo: new THREE.CylinderGeometry(10, 8, 40, 6),
    bridgeGeo: new THREE.BoxGeometry(30, 2, 10),
    cubeGeo: new THREE.BoxGeometry(10, 10, 10),
    pillarGeo: new THREE.CylinderGeometry(2, 2, 20)
};
geoCache.treeConeGeo.translate(0, 10, 0);

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();

        // God Mode Golden Particle Explosion
        const particleCount = 1000;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 120; // Starting near central core height
            positions[i * 3 + 2] = 0;

            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200
            ));
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 1.5,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particleGeo, particleMat);
        scene.add(particleSystem);

        const startTime = performance.now();
        const duration = 2000; // 2 seconds

        function animateParticles() {
            const now = performance.now();
            const elapsed = now - startTime;

            if (elapsed > duration) {
                scene.remove(particleSystem);
                particleGeo.dispose();
                particleMat.dispose();
                return; // Stop animation
            }

            const delta = 0.016; // Approx 60fps
            const posAttr = particleSystem.geometry.attributes.position;

            for (let i = 0; i < particleCount; i++) {
                const vel = velocities[i];
                posAttr.array[i * 3] += vel.x * delta;
                posAttr.array[i * 3 + 1] += vel.y * delta;
                posAttr.array[i * 3 + 2] += vel.z * delta;

                // Add some gravity
                vel.y -= 100 * delta;
            }

            posAttr.needsUpdate = true;
            particleMat.opacity = 1.0 - (elapsed / duration);

            requestAnimationFrame(animateParticles);
        }

        animateParticles();
    } else {
        // Simple spectator mode logic could go here
        console.log("Logged in as spectator");
    }
}

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    // We get orientation if available from event
    const normal = event.detail.normal;

    let mesh;

    let offset = 0;

    switch (type) {
        case 'landscape-rock':
            mesh = new THREE.Mesh(geoCache.rockGeo, monolithMaterial);
            mesh.scale.set(1 + Math.random(), 0.5 + Math.random(), 1 + Math.random());
            mesh.rotation.y = Math.random() * Math.PI;
            break;
        case 'landscape-crystal':
            const crystalMat = glassMaterial.clone();
            crystalMat.color = new THREE.Color(0xaaffff);
            mesh = new THREE.Mesh(geoCache.crystalGeo, crystalMat);
            mesh.scale.set(0.5, 2.0, 0.5);
            offset = 8;
            break;
        case 'landscape-tree':
            const treeMat = glassMaterial.clone();
            treeMat.color = new THREE.Color(0x00aa00);
            mesh = new THREE.Mesh(geoCache.treeConeGeo, treeMat);
            break;
        case 'wuwa-monolith':
            mesh = new THREE.Mesh(geoCache.monolithGeo, monolithMaterial);
            offset = 15;
            break;
        case 'wuwa-tower':
            mesh = new THREE.Mesh(geoCache.towerGeo, monolithMaterial);
            offset = 20;
            break;
        case 'wuwa-bridge':
            mesh = new THREE.Mesh(geoCache.bridgeGeo, matteMetalMaterial);
            break;
        case 'block-glass':
            mesh = new THREE.Mesh(geoCache.cubeGeo, glassMaterial);
            offset = 5;
            break;
        case 'block-chrome':
            mesh = new THREE.Mesh(geoCache.cubeGeo, chromeMaterial);
            offset = 5;
            break;
        case 'block-neon':
            mesh = new THREE.Mesh(geoCache.pillarGeo, neonCyanMaterial);
            offset = 10;
            break;
        case 'block-metal':
            mesh = new THREE.Mesh(geoCache.cubeGeo, matteMetalMaterial);
            offset = 5;
            break;
    }

    if (mesh) {
        mesh.position.copy(pos);

        // Basic alignment to normal if applicable (e.g. for blocks)
        if (normal && (type.startsWith('block-') || type === 'landscape-rock')) {
             const quaternion = new THREE.Quaternion();
             quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
             mesh.quaternion.copy(quaternion);
        }

        // Apply normal offset instead of fixed Y offset
        if (offset > 0) {
            if (normal && (type.startsWith('block-') || type === 'landscape-rock')) {
                mesh.position.add(normal.clone().multiplyScalar(offset));
            } else {
                mesh.position.y += offset;
            }
        }

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
