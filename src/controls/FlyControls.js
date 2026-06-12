import * as THREE from 'three';

export class FlyControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.movementSpeed = 100.0;
    this.rollSpeed = 0.5;
    this.dragToLook = true;

    this.tmpQuaternion = new THREE.Quaternion();

    this.mouseStatus = 0;
    this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
    this.moveVector = new THREE.Vector3(0, 0, 0);
    this.rotationVector = new THREE.Vector3(0, 0, 0);

    this.keydown = this.keydown.bind(this);
    this.keyup = this.keyup.bind(this);
    this.mousedown = this.mousedown.bind(this);
    this.mousemove = this.mousemove.bind(this);
    this.mouseup = this.mouseup.bind(this);
    this.contextmenu = this.contextmenu.bind(this);

    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);

    this.domElement.addEventListener('mousedown', this.mousedown);
    this.domElement.addEventListener('mousemove', this.mousemove);
    this.domElement.addEventListener('mouseup', this.mouseup);
    this.domElement.addEventListener('contextmenu', this.contextmenu);

    this.updateMovementVector();
    this.updateRotationVector();
  }

  keydown(event) {
    if (event.altKey) return;
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight': this.movementSpeedMultiplier = .1; break;
      case 'KeyW': this.moveState.forward = 1; break;
      case 'KeyS': this.moveState.back = 1; break;
      case 'KeyA': this.moveState.left = 1; break;
      case 'KeyD': this.moveState.right = 1; break;
      case 'Space': this.moveState.up = 1; break;
      case 'ControlLeft':
      case 'KeyC': this.moveState.down = 1; break; // Use Ctrl or C to go down in place of shift to allow shift for sprint if needed, but per instructions shift goes down, let's map Shift to down
    }

    // Override shift for down based on prompt
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      this.moveState.down = 1;
    }

    this.updateMovementVector();
    this.updateRotationVector();
  }

  keyup(event) {
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight': this.moveState.down = 0; break;
      case 'KeyW': this.moveState.forward = 0; break;
      case 'KeyS': this.moveState.back = 0; break;
      case 'KeyA': this.moveState.left = 0; break;
      case 'KeyD': this.moveState.right = 0; break;
      case 'Space': this.moveState.up = 0; break;
      case 'ControlLeft':
      case 'KeyC': this.moveState.down = 0; break;
    }

    this.updateMovementVector();
    this.updateRotationVector();
  }

  mousedown(event) {
    if (this.dragToLook) {
      this.mouseStatus++;
    } else {
      switch (event.button) {
        case 0: this.moveState.forward = 1; break;
        case 2: this.moveState.back = 1; break;
      }
      this.updateMovementVector();
    }
  }

  mousemove(event) {
    if (!this.dragToLook || this.mouseStatus > 0) {
      const container = this.getContainerDimensions();
      const halfWidth = container.size[0] / 2;
      const halfHeight = container.size[1] / 2;

      this.moveState.yawLeft = -((event.pageX - container.offset[0]) - halfWidth) / halfWidth;
      this.moveState.pitchDown = ((event.pageY - container.offset[1]) - halfHeight) / halfHeight;

      this.updateRotationVector();
    }
  }

  mouseup(event) {
    if (this.dragToLook) {
      this.mouseStatus--;
      this.moveState.yawLeft = this.moveState.pitchDown = 0;
    } else {
      switch (event.button) {
        case 0: this.moveState.forward = 0; break;
        case 2: this.moveState.back = 0; break;
      }
      this.updateMovementVector();
    }
    this.updateRotationVector();
  }

  contextmenu(event) {
    event.preventDefault();
  }

  update(delta) {
    const moveMult = delta * this.movementSpeed;
    const rotMult = delta * this.rollSpeed;

    this.camera.translateX(this.moveVector.x * moveMult);
    this.camera.translateY(this.moveVector.y * moveMult);
    this.camera.translateZ(this.moveVector.z * moveMult);

    this.tmpQuaternion.set(this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1).normalize();
    this.camera.quaternion.multiply(this.tmpQuaternion);

    // expose the rotation vector for convenience
    this.camera.rotation.setFromQuaternion(this.camera.quaternion, this.camera.rotation.order);
  }

  updateMovementVector() {
    const forward = (this.moveState.forward || (this.autoForward && !this.moveState.back)) ? 1 : 0;
    this.moveVector.x = (-this.moveState.left + this.moveState.right);
    this.moveVector.y = (-this.moveState.down + this.moveState.up);
    this.moveVector.z = (-forward + this.moveState.back);
  }

  updateRotationVector() {
    this.rotationVector.x = (-this.moveState.pitchDown + this.moveState.pitchUp);
    this.rotationVector.y = (-this.moveState.yawRight + this.moveState.yawLeft);
    this.rotationVector.z = (-this.moveState.rollRight + this.moveState.rollLeft);
  }

  getContainerDimensions() {
    if (this.domElement != document) {
      return {
        size: [this.domElement.offsetWidth, this.domElement.offsetHeight],
        offset: [this.domElement.offsetLeft, this.domElement.offsetTop]
      };
    } else {
      return {
        size: [window.innerWidth, window.innerHeight],
        offset: [0, 0]
      };
    }
  }

  dispose() {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
    this.domElement.removeEventListener('mousedown', this.mousedown);
    this.domElement.removeEventListener('mousemove', this.mousemove);
    this.domElement.removeEventListener('mouseup', this.mouseup);
    this.domElement.removeEventListener('contextmenu', this.contextmenu);
  }
}
