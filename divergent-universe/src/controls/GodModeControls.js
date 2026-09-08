import * as THREE from 'three';

export class GodModeControls {
    constructor(camera, domElement, scene, getSelectedBlockType) {
        this.camera = camera;
        this.domElement = domElement;
        this.scene = scene;
        this.getSelectedBlockType = getSelectedBlockType; // Callback to get selected block from UI

        // Settings
        this.movementSpeed = 300.0;
        this.lookSpeed = 0.005;
        this.enabled = false;

        // State
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        this.mouseX = 0;
        this.mouseY = 0;

        this.target = new THREE.Vector3();
        this.spherical = new THREE.Spherical();
        this.lat = 0;
        this.lon = 0;
        this.phi = 0;
        this.theta = 0;

        // Raycaster and Grid Helper
        this.raycaster = new THREE.Raycaster();
        this.centerCoords = new THREE.Vector2(0, 0); // Always center of screen

        this.gridGroup = new THREE.Group();
        this.gridGroup.name = 'GridHelper';

        this.gridHelper = new THREE.GridHelper(10, 10, 0x00f0ff, 0x00f0ff);
        this.gridHelper.material.transparent = true;
        this.gridHelper.material.opacity = 0.8;
        this.gridHelper.rotation.x = Math.PI / 2; // Make it flat in local space
        this.gridGroup.add(this.gridHelper);

        const planeGeo = new THREE.PlaneGeometry(10, 10);
        const planeMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.gridPlane = new THREE.Mesh(planeGeo, planeMat);
        this.gridGroup.add(this.gridPlane);

        this.gridGroup.position.y = -1000; // Hide initially
        this.scene.add(this.gridGroup);

        this.intersectionPoint = null;

        // Bindings
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
    }

    enable() {
        this.enabled = true;
        this.domElement.addEventListener('mousemove', this.onMouseMove, false);
        window.addEventListener('keydown', this.onKeyDown, false);
        window.addEventListener('keyup', this.onKeyUp, false);
        this.domElement.addEventListener('mousedown', this.onMouseDown, false);

        // Request pointer lock for better FPS controls
        this.domElement.requestPointerLock = this.domElement.requestPointerLock || this.domElement.mozRequestPointerLock;
        this.domElement.onclick = () => {
            if (this.enabled) {
                this.domElement.requestPointerLock();
            }
        };
    }

    disable() {
        this.enabled = false;
        this.domElement.removeEventListener('mousemove', this.onMouseMove, false);
        window.removeEventListener('keydown', this.onKeyDown, false);
        window.removeEventListener('keyup', this.onKeyUp, false);
        this.domElement.removeEventListener('mousedown', this.onMouseDown, false);
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
        if(document.exitPointerLock) document.exitPointerLock();

        this.gridGroup.position.y = -1000;
    }

    onMouseMove(event) {
        if (!this.enabled) return;

        if (document.pointerLockElement === this.domElement) {
            this.lon -= event.movementX * this.lookSpeed * 100;
            this.lat -= event.movementY * this.lookSpeed * 100;

            this.lat = Math.max(-85, Math.min(85, this.lat));

            this.phi = THREE.MathUtils.degToRad(90 - this.lat);
            this.theta = THREE.MathUtils.degToRad(this.lon);

            const targetPosition = this.target;
            const position = this.camera.position;

            targetPosition.setFromSphericalCoords(1, this.phi, this.theta).add(position);
            this.camera.lookAt(targetPosition);
        }
    }

    onKeyDown(event) {
        if (!this.enabled) return;
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'Space': this.moveUp = true; break;
            case 'ShiftLeft':
            case 'ShiftRight': this.moveDown = true; break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'Space': this.moveUp = false; break;
            case 'ShiftLeft':
            case 'ShiftRight': this.moveDown = false; break;
        }
    }

    onMouseDown(event) {
        if (!this.enabled) return;

        // Place block if we have an intersection and it's a left click
        if (event.button === 0 && this.intersectionPoint && document.pointerLockElement === this.domElement) {
            this.placeBlock();
        }
    }

    placeBlock() {
        if (!this.intersectionPoint) return;

        // We will implement block placement logic in main.js,
        // passing an event up or calling a callback.
        // For simplicity, we can dispatch a custom event.
        const event = new CustomEvent('placeBlock', {
            detail: {
                position: this.intersectionPoint.clone(),
                normal: this.gridGroup.position.clone() // Need to snap properly
            }
        });
        window.dispatchEvent(event);
    }

    update(delta) {
        if (!this.enabled) return;

        // Movement
        const actualMoveSpeed = this.movementSpeed * delta;
        const actualMoveSpeedSide = actualMoveSpeed * 0.8;

        if (this.moveForward) this.camera.translateZ(-actualMoveSpeed);
        if (this.moveBackward) this.camera.translateZ(actualMoveSpeed);
        if (this.moveLeft) this.camera.translateX(-actualMoveSpeedSide);
        if (this.moveRight) this.camera.translateX(actualMoveSpeedSide);

        // Global UP/DOWN movement (not relative to camera pitch)
        if (this.moveUp) this.camera.position.y += actualMoveSpeed;
        if (this.moveDown) this.camera.position.y -= actualMoveSpeed;

        // Update Raycasting
        this.raycaster.setFromCamera(this.centerCoords, this.camera);

        // Don't intersect with the grid helper or other UI elements
        const intersectableObjects = this.scene.children.filter(child => child.name !== 'GridHelper' && child !== this.gridGroup);

        const intersects = this.raycaster.intersectObjects(intersectableObjects, true);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            this.intersectionPoint = intersect.point;

            // Snap grid to the surface
            this.gridGroup.position.copy(intersect.point);

            // Align grid to normal (simplified)
            // A full implementation would align the gridGroup to intersect.face.normal
            if (intersect.face) {
                const n = intersect.face.normal.clone();
                n.transformDirection(intersect.object.matrixWorld).normalize();

                // create target position slightly above normal
                const target = this.gridGroup.position.clone().add(n);
                this.gridGroup.lookAt(target);
            }
        } else {
            this.intersectionPoint = null;
            this.gridGroup.position.y = -1000;
        }
    }
}
