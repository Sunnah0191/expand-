import * as THREE from 'three';

export class FlyControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = false;
    this.movementSpeed = 50.0;
    this.lookSpeed = 0.005;

    this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0 };
    this.mousePosition = new THREE.Vector2();
    this.mouseDelta = new THREE.Vector2();

    this.isDragging = false;
    this.lastMouse = new THREE.Vector2();

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    window.addEventListener('keyup', (e) => this.onKeyUp(e), false);

    this.domElement.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      this.isDragging = true;
      this.lastMouse.set(e.clientX, e.clientY);
    }, false);

    this.domElement.addEventListener('mousemove', (e) => {
      if (!this.enabled || !this.isDragging) return;

      this.mouseDelta.set(
        e.clientX - this.lastMouse.x,
        e.clientY - this.lastMouse.y
      );
      this.lastMouse.set(e.clientX, e.clientY);

      // Rotate camera
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(this.camera.quaternion);

      euler.y -= this.mouseDelta.x * this.lookSpeed;
      euler.x -= this.mouseDelta.y * this.lookSpeed;

      // Clamp vertical rotation
      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

      this.camera.quaternion.setFromEuler(euler);

    }, false);

    this.domElement.addEventListener('mouseup', () => {
      this.isDragging = false;
    }, false);
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
    if (!this.enabled) return;
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

  update(deltaTime) {
    if (!this.enabled) return;

    const actualMoveSpeed = this.movementSpeed * deltaTime;

    const moveVector = new THREE.Vector3(
      this.moveState.right - this.moveState.left,
      this.moveState.up - this.moveState.down,
      this.moveState.back - this.moveState.forward
    );

    moveVector.applyQuaternion(this.camera.quaternion);
    moveVector.normalize().multiplyScalar(actualMoveSpeed);

    // Check if movement happens
    if (moveVector.lengthSq() > 0) {
       this.camera.position.add(moveVector);
    }
  }
}
