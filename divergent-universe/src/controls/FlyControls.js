import * as THREE from 'three';

export class FlyControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        this.enabled = false;

        this.movementSpeed = 300.0;
        this.lookSpeed = 0.005;

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        this.mouseX = 0;
        this.mouseY = 0;

        this.lat = 0;
        this.lon = 0;
        this.phi = 0;
        this.theta = 0;

        this.target = new THREE.Vector3();

        this._onKeyDown = this.onKeyDown.bind(this);
        this._onKeyUp = this.onKeyUp.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
    }

    enable() {
        this.enabled = true;
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        this.domElement.addEventListener('mousemove', this._onMouseMove);

        // Reset look angles based on current camera rotation
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.lon = Math.atan2(direction.x, -direction.z) * (180 / Math.PI);
        this.lat = Math.asin(direction.y) * (180 / Math.PI);
    }

    disable() {
        this.enabled = false;
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        this.domElement.removeEventListener('mousemove', this._onMouseMove);
    }

    onKeyDown(event) {
        if (!this.enabled) return;
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'Space': this.moveUp = true; break;
            case 'ShiftLeft':
            case 'ShiftRight': this.moveDown = true; break;
        }
    }

    onKeyUp(event) {
        if (!this.enabled) return;
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'Space': this.moveUp = false; break;
            case 'ShiftLeft':
            case 'ShiftRight': this.moveDown = false; break;
        }
    }

    onMouseMove(event) {
        if (!this.enabled) return;

        // Use movementX/Y if pointer lock is desired, otherwise relative to center
        // We'll use simple click-drag or just movement relative to center for simplicity
        // But for true "fly", pointerlock is best. We'll simulate by checking if mouse is down,
        // or just free-look if it's over the canvas.

        // Assuming free look for simplicity when enabled
        const halfWidth = window.innerWidth / 2;
        const halfHeight = window.innerHeight / 2;

        this.mouseX = event.pageX - halfWidth;
        this.mouseY = event.pageY - halfHeight;
    }

    update(delta) {
        if (!this.enabled) return;

        const moveMult = delta * this.movementSpeed;

        // Local movement vectors
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0);

        if (this.moveForward) this.camera.position.addScaledVector(forward, moveMult);
        if (this.moveBackward) this.camera.position.addScaledVector(forward, -moveMult);
        if (this.moveLeft) this.camera.position.addScaledVector(right, -moveMult);
        if (this.moveRight) this.camera.position.addScaledVector(right, moveMult);
        if (this.moveUp) this.camera.position.addScaledVector(up, moveMult);
        if (this.moveDown) this.camera.position.addScaledVector(up, -moveMult);

        // Look logic
        this.lon -= this.mouseX * this.lookSpeed;
        this.lat -= this.mouseY * this.lookSpeed;

        this.lat = Math.max(-85, Math.min(85, this.lat));

        this.phi = THREE.MathUtils.degToRad(90 - this.lat);
        this.theta = THREE.MathUtils.degToRad(this.lon);

        this.target.x = this.camera.position.x + 100 * Math.sin(this.phi) * Math.cos(this.theta);
        this.target.y = this.camera.position.y + 100 * Math.cos(this.phi);
        this.target.z = this.camera.position.z + 100 * Math.sin(this.phi) * Math.sin(this.theta);

        this.camera.lookAt(this.target);

        // Reset mouse to avoid spinning if stopped moving mouse (friction-like)
        this.mouseX *= 0.9;
        this.mouseY *= 0.9;
    }
}