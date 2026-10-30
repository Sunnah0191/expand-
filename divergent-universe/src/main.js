import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, monolithMaterial, chromeMaterial, matteMetalMaterial, neonBlueMaterial } from './utils/Materials.js';

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

function createGoldenExplosion() {
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 2000;
    const posArray = new Float32Array(particleCount * 3);
    const velArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i+=3) {
        posArray[i] = (Math.random() - 0.5) * 5;
        posArray[i+1] = (Math.random() - 0.5) * 5;
        posArray[i+2] = (Math.random() - 0.5) * 5;

        velArray[i] = (Math.random() - 0.5) * 100;
        velArray[i+1] = (Math.random() - 0.5) * 100;
        velArray[i+2] = (Math.random() - 0.5) * 100;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particleGeo.setAttribute('velocity', new THREE.BufferAttribute(velArray, 3));

    const particleMat = new THREE.PointsMaterial({
        size: 1.5,
        color: 0xffd700,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    particleSystem.position.copy(camera.position);
    particleSystem.position.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(20));
    scene.add(particleSystem);

    let lastTime = performance.now();
    let lifeTime = 0;

    function animateParticles() {
        const timeNow = performance.now();
        const delta = (timeNow - lastTime) / 1000;
        lastTime = timeNow;
        lifeTime += delta;

        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = particleSystem.geometry.attributes.velocity.array;

        for (let i = 0; i < particleCount * 3; i+=3) {
            positions[i] += velocities[i] * delta;
            positions[i+1] += velocities[i+1] * delta;
            positions[i+2] += velocities[i+2] * delta;

            // drag
            velocities[i] *= 0.95;
            velocities[i+1] *= 0.95;
            velocities[i+2] *= 0.95;
        }

        particleSystem.geometry.attributes.position.needsUpdate = true;

        particleSystem.material.opacity = Math.max(0, 1.0 - lifeTime / 2.0);

        if (lifeTime < 2.0) {
            requestAnimationFrame(animateParticles);
        } else {
            scene.remove(particleSystem);
            particleGeo.dispose();
            particleMat.dispose();
        }
    }

    animateParticles();
}

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    controls.enable();

    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        if (controls.gridGroup) controls.gridGroup.visible = true;
        createGoldenExplosion();

        // Play activation sound
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
            osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.warn("AudioContext not supported or blocked");
        }
    } else {
        document.getElementById('ui-layer').style.display = 'none';
        if (controls.gridGroup) controls.gridGroup.visible = false;
        console.log("Logged in as spectator");
    }
}

// Cache geometries for better performance
const geometryCache = {
    rock: new THREE.DodecahedronGeometry(10, 1),
    crystal: new THREE.OctahedronGeometry(8, 0),
    neonTree: new THREE.ConeGeometry(3, 20, 5),
    wuwaMonolith: new THREE.BoxGeometry(15, 40, 15),
    wuwaTower: new THREE.CylinderGeometry(8, 12, 60, 6),
    wuwaBridge: new THREE.BoxGeometry(30, 2, 8),
    cube: new THREE.BoxGeometry(10, 10, 10)
};

function onPlaceBlock(event) {
    if (!isGodMode) return;

    const pos = event.detail.position;
    const type = buildMenu.getSelectedType();

    let mesh;

    // Landscape
    if (type === 'rock') {
        mesh = new THREE.Mesh(geometryCache.rock, monolithMaterial);
    } else if (type === 'crystal') {
        mesh = new THREE.Mesh(geometryCache.crystal, glassMaterial);
        mesh.scale.set(1, 2, 1);
        pos.y += 8;
    } else if (type === 'neon-tree') {
        mesh = new THREE.Mesh(geometryCache.neonTree, neonBlueMaterial);
        pos.y += 10;
    }
    // WuWa Architecture
    else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(geometryCache.wuwaMonolith, monolithMaterial);
        pos.y += 20;
    } else if (type === 'wuwa-tower') {
        mesh = new THREE.Mesh(geometryCache.wuwaTower, monolithMaterial);
        pos.y += 30;
    } else if (type === 'wuwa-bridge') {
        mesh = new THREE.Mesh(geometryCache.wuwaBridge, glassMaterial);
    }
    // Constructor (Blocks)
    else if (type === 'block-glass') {
        mesh = new THREE.Mesh(geometryCache.cube, glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(geometryCache.cube, chromeMaterial);
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(geometryCache.cube, neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-metal') {
        mesh = new THREE.Mesh(geometryCache.cube, matteMetalMaterial);
        pos.y += 5;
    }

    if (mesh) {
        mesh.position.copy(pos);

        // Orient to normal if provided
        if (event.detail.normal) {
             const up = new THREE.Vector3(0, 1, 0);
             const normal = new THREE.Vector3(event.detail.normal.x, event.detail.normal.y, event.detail.normal.z).normalize();
             mesh.quaternion.setFromUnitVectors(up, normal);
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
