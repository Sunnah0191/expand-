import * as THREE from 'three';

export class FlyControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.movementSpeed = 100.0;
    this.rollSpeed = 1.5;

    this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0 };
    this.rotationVector = new THREE.Vector3(0, 0, 0);

    this.enabled = false;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mousedown', this.onMouseDown);
  }

  onMouseDown(event) {
    if(!this.enabled) return;
    if (document.pointerLockElement !== this.domElement) {
      this.domElement.requestPointerLock();
    }
  }

  onMouseMove(event) {
    if (!this.enabled || document.pointerLockElement !== this.domElement) return;

    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // Apply rotation to camera
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.camera.quaternion);

    euler.y -= movementX * 0.002 * this.rollSpeed;
    euler.x -= movementY * 0.002 * this.rollSpeed;

    // Clamp vertical rotation
    euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

    this.camera.quaternion.setFromEuler(euler);
  }

  onKeyDown(event) {
    if (!this.enabled) return;
    switch (event.code) {
      case 'KeyW': this.moveState.forward = 1; break;
      case 'KeyS': this.moveState.back = 1; break;
      case 'KeyA': this.moveState.left = 1; break;
      case 'KeyD': this.moveState.right = 1; break;
      case 'Space': this.moveState.up = 1; break;
      case 'ShiftLeft':
      case 'ShiftRight': this.moveState.down = 1; break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': this.moveState.forward = 0; break;
      case 'KeyS': this.moveState.back = 0; break;
      case 'KeyA': this.moveState.left = 0; break;
      case 'KeyD': this.moveState.right = 0; break;
      case 'Space': this.moveState.up = 0; break;
      case 'ShiftLeft':
      case 'ShiftRight': this.moveState.down = 0; break;
    }
  }

  update(dt) {
    if (!this.enabled) return;

    const moveMult = dt * this.movementSpeed;

    const vector = new THREE.Vector3(
      this.moveState.right - this.moveState.left,
      this.moveState.up - this.moveState.down,
      this.moveState.back - this.moveState.forward
    );

    vector.applyQuaternion(this.camera.quaternion);
    this.camera.position.addScaledVector(vector, moveMult);
  }
}
