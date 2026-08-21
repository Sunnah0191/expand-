import * as THREE from 'three';
import { World } from './world/World.js';
import { LoginScreen } from './ui/LoginScreen.js';
import { GodModeControls } from './controls/GodModeControls.js';
import { BuildMenu } from './ui/BuildMenu.js';
import { glassMaterial, neonCyanMaterial, neonWhiteMaterial, neonBlueMaterial, monolithMaterial } from './utils/Materials.js';

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

function onLoginSuccess(isAdmin) {
    isGodMode = isAdmin;
    if (isAdmin) {
        document.getElementById('ui-layer').style.display = 'block';
        controls.enable();

        // 3D golden particle explosion effect
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 1000;
        const posArray = new Float32Array(particleCount * 3);

        // Explosion origin in front of camera
        const origin = new THREE.Vector3(0, 0, -20);
        origin.applyMatrix4(camera.matrixWorld);

        for (let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 10;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.5,
            color: 0xffd700,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        const particleMesh = new THREE.Points(particleGeo, particleMat);
        particleMesh.position.copy(origin);
        scene.add(particleMesh);

        // Animate particles
        let explosionTime = 0;
        const explodeAnim = () => {
            explosionTime += 0.016; // approx delta

            const positions = particleGeo.attributes.position.array;
            for(let i=0; i<particleCount; i++) {
                // Expanding outwards
                positions[i*3] *= 1.1;
                positions[i*3+1] *= 1.1;
                positions[i*3+2] *= 1.1;
            }
            particleGeo.attributes.position.needsUpdate = true;
            particleMat.opacity -= 0.02;

            if (particleMat.opacity > 0) {
                requestAnimationFrame(explodeAnim);
            } else {
                scene.remove(particleMesh);
                particleGeo.dispose();
                particleMat.dispose();
            }
        };
        explodeAnim();

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

    // Ландшафт
    if (type === 'landscape-rock') {
        const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, flatShading: true });
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 1), mat);
        pos.y += 4;
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    } else if (type === 'landscape-crystal') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(6, 0), glassMaterial);
        pos.y += 5;
        mesh.scale.set(1, 2, 1);
        mesh.rotation.y = Math.random() * Math.PI;
    } else if (type === 'landscape-neon-tree') {
        mesh = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 2, 15), new THREE.MeshStandardMaterial({color: 0x222222}));
        trunk.position.y = 7.5;
        const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 1), neonCyanMaterial);
        leaves.position.y = 17;
        mesh.add(trunk, leaves);
    }
    // Архитектура WuWa
    else if (type === 'wuwa-monolith') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 40, 15), monolithMaterial);
        pos.y += 20;
    } else if (type === 'wuwa-tower') {
        mesh = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(10, 12, 30, 8), monolithMaterial);
        base.position.y = 15;
        const top = new THREE.Mesh(new THREE.ConeGeometry(12, 15, 8), neonBlueMaterial);
        top.position.y = 37.5;
        mesh.add(base, top);
    } else if (type === 'wuwa-bridge') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 10), new THREE.MeshStandardMaterial({color: 0x888888, roughness: 0.5, transparent: true, opacity: 0.8}));
        pos.y += 1;
    }
    // Конструктор (Блоки)
    else if (type === 'block-glass') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glassMaterial);
        pos.y += 5;
    } else if (type === 'block-chrome') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshStandardMaterial({color: 0xffffff, metalness: 1.0, roughness: 0.1}));
        pos.y += 5;
    } else if (type === 'block-neon') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), neonCyanMaterial);
        pos.y += 5;
    } else if (type === 'block-matte') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshStandardMaterial({color: 0x444444, metalness: 0.2, roughness: 0.8}));
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
