import * as THREE from 'three';

let cameraRef, domElementRef, sceneRef, appStateRef;
let isGodModeEnabled = false;

// Movement state
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false
};

// Mouse look state
let euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;
const lookSpeed = 0.002;
const moveSpeed = 200.0; // Fast flight

// Building / Raycasting
const raycaster = new THREE.Raycaster();
const centerVector = new THREE.Vector2(0, 0); // Center of screen
let gridHelper;
let placementMarker;

export function initControls(camera, domElement, scene, appState) {
  cameraRef = camera;
  domElementRef = domElement;
  sceneRef = scene;
  appStateRef = appState;

  // Building grid/marker setup
  const markerGeo = new THREE.BoxGeometry(10, 10, 10);
  const markerMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
  placementMarker = new THREE.Mesh(markerGeo, markerMat);
  placementMarker.visible = false;
  scene.add(placementMarker);

  // Set up event listeners (only active when in God Mode)
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mousedown', onMouseDown);

  // Handle pointer lock
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === document.body) {
      // Locked
    } else {
      // Unlocked
    }
  });
}

export function enableGodMode() {
  isGodModeEnabled = true;
  document.body.requestPointerLock();
}

function onKeyDown(e) {
  if (!isGodModeEnabled || appStateRef.isCatalogOpen) return;

  switch(e.code) {
    case 'KeyW': moveState.forward = true; break;
    case 'KeyS': moveState.backward = true; break;
    case 'KeyA': moveState.left = true; break;
    case 'KeyD': moveState.right = true; break;
    case 'Space': moveState.up = true; break;
    case 'ShiftLeft':
    case 'ShiftRight': moveState.down = true; break;
  }
}

function onKeyUp(e) {
  if (!isGodModeEnabled) return;

  switch(e.code) {
    case 'KeyW': moveState.forward = false; break;
    case 'KeyS': moveState.backward = false; break;
    case 'KeyA': moveState.left = false; break;
    case 'KeyD': moveState.right = false; break;
    case 'Space': moveState.up = false; break;
    case 'ShiftLeft':
    case 'ShiftRight': moveState.down = false; break;
  }
}

function onMouseMove(e) {
  if (!isGodModeEnabled || document.pointerLockElement !== document.body) return;

  euler.setFromQuaternion(cameraRef.quaternion);

  euler.y -= e.movementX * lookSpeed;
  euler.x -= e.movementY * lookSpeed;

  euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));

  cameraRef.quaternion.setFromEuler(euler);
}

function onMouseDown(e) {
  if (!isGodModeEnabled || document.pointerLockElement !== document.body || e.button !== 0) return;

  if (appStateRef.selectedBlock && placementMarker.visible) {
    placeBlock();
  }
}

function placeBlock() {
  // Simple block placement based on current selection
  let color = 0xffffff;
  let material;

  switch(appStateRef.selectedBlock) {
    case 'glass_block':
    case 'crystal':
      material = new THREE.MeshPhysicalMaterial({
        color: 0xe0ffff,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 2.0,
      });
      break;
    case 'neon_block':
    case 'neon_tree':
      material = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1
      });
      break;
    case 'monolith':
      material = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.8
      });
      break;
    default:
      material = new THREE.MeshStandardMaterial({ color: 0x888888 });
  }

  const geo = new THREE.BoxGeometry(10, 10, 10);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(placementMarker.position);
  sceneRef.add(mesh);
}

export function updateControls(delta) {
  if (!isGodModeEnabled) {
    // If just viewer or in login screen, slowly rotate camera
    const time = Date.now() * 0.0001;
    cameraRef.position.x = Math.cos(time) * 400;
    cameraRef.position.z = Math.sin(time) * 400;
    cameraRef.lookAt(0, 0, 0);
    return;
  }

  // Handle flying
  const actualMoveSpeed = moveSpeed * delta;

  const direction = new THREE.Vector3();
  const right = new THREE.Vector3();

  cameraRef.getWorldDirection(direction);
  right.crossVectors(cameraRef.up, direction).normalize();

  if (moveState.forward) cameraRef.position.addScaledVector(direction, actualMoveSpeed);
  if (moveState.backward) cameraRef.position.addScaledVector(direction, -actualMoveSpeed);
  if (moveState.left) cameraRef.position.addScaledVector(right, actualMoveSpeed);
  if (moveState.right) cameraRef.position.addScaledVector(right, -actualMoveSpeed);
  if (moveState.up) cameraRef.position.y += actualMoveSpeed;
  if (moveState.down) cameraRef.position.y -= actualMoveSpeed;

  // Handle Raycasting for building grid
  if (appStateRef.selectedBlock && document.pointerLockElement === document.body) {
    raycaster.setFromCamera(centerVector, cameraRef);

    // We want to intersect with everything except the placement marker itself
    const intersectables = sceneRef.children.filter(obj => obj !== placementMarker);
    const intersects = raycaster.intersectObjects(intersectables, true);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      placementMarker.visible = true;

      // Snap to grid (10 unit size)
      const gridSize = 10;
      placementMarker.position.copy(intersect.point).add(intersect.face.normal.clone().multiplyScalar(gridSize / 2));
      placementMarker.position.x = Math.round(placementMarker.position.x / gridSize) * gridSize;
      placementMarker.position.y = Math.round(placementMarker.position.y / gridSize) * gridSize;
      placementMarker.position.z = Math.round(placementMarker.position.z / gridSize) * gridSize;

    } else {
      placementMarker.visible = false;
    }
  } else {
    placementMarker.visible = false;
  }
}
