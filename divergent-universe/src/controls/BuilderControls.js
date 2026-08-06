import * as THREE from 'three';

export class BuilderControls {
    constructor(camera, scene, domElement) {
        this.camera = camera;
        this.scene = scene;
        this.domElement = domElement;

        this.enabled = false;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Raycasting Grid (Visual indicator)
        const gridGeo = new THREE.PlaneGeometry(10, 10);
        const gridMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.5,
            wireframe: true,
            side: THREE.DoubleSide
        });
        this.gridMesh = new THREE.Mesh(gridGeo, gridMat);
        this.gridMesh.rotation.x = -Math.PI / 2;
        this.gridMesh.visible = false;
        this.scene.add(this.gridMesh);

        this.selectedBlockType = 'block-glass';

        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseClick = this.onMouseClick.bind(this);

        // Shared materials for building
        this.materials = {
            'block-glass': new THREE.MeshPhysicalMaterial({
                color: 0xffffff, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.1, thickness: 1
            }),
            'block-chrome': new THREE.MeshStandardMaterial({
                color: 0xcccccc, metalness: 1.0, roughness: 0.1
            }),
            'block-neon': new THREE.MeshBasicMaterial({
                color: 0x00f3ff
            }),
            'block-matte': new THREE.MeshStandardMaterial({
                color: 0x222222, metalness: 0.2, roughness: 0.8
            })
        };
    }

    enable() {
        this.enabled = true;
        this.domElement.addEventListener('mousemove', this._onMouseMove);
        this.domElement.addEventListener('click', this._onMouseClick);
        this.gridMesh.visible = true;

        // Setup catalog listeners
        document.querySelectorAll('.build-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.build-item').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedBlockType = e.target.getAttribute('data-type');
            });
        });
    }

    disable() {
        this.enabled = false;
        this.domElement.removeEventListener('mousemove', this._onMouseMove);
        this.domElement.removeEventListener('click', this._onMouseClick);
        this.gridMesh.visible = false;
    }

    onMouseMove(event) {
        if (!this.enabled) return;

        // Normalize mouse coordinates for raycasting
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    onMouseClick(event) {
        if (!this.enabled || !this.gridMesh.visible) return;

        // Prevent building if clicking on UI
        if (event.target !== this.domElement) return;

        this.onPlaceBlock(this.gridMesh.position);
    }

    onPlaceBlock(position) {
        // Simple 10x10x10 block building logic based on selected type
        // In a full implementation, we'd have different geometries for 'landscape-rock', 'wuwa-monolith', etc.
        // For brevity, we map most to boxes or specific primitives.

        let geo, mat;

        if (this.selectedBlockType.startsWith('block-')) {
            geo = new THREE.BoxGeometry(10, 10, 10);
            mat = this.materials[this.selectedBlockType];
        } else if (this.selectedBlockType === 'landscape-rock') {
            geo = new THREE.DodecahedronGeometry(8, 0);
            mat = new THREE.MeshStandardMaterial({ color: 0x555555, flatShading: true });
        } else if (this.selectedBlockType === 'landscape-crystal') {
            geo = new THREE.OctahedronGeometry(6, 0);
            geo.scale(1, 2, 1);
            mat = this.materials['block-glass'];
        } else if (this.selectedBlockType === 'landscape-tree') {
            geo = new THREE.CylinderGeometry(1, 1, 20);
            mat = this.materials['block-neon'];
        } else if (this.selectedBlockType === 'wuwa-monolith') {
            geo = new THREE.BoxGeometry(15, 40, 15);
            mat = this.materials['block-matte'];
        } else if (this.selectedBlockType === 'wuwa-tower') {
            geo = new THREE.CylinderGeometry(5, 10, 50, 6);
            mat = this.materials['block-chrome'];
        } else if (this.selectedBlockType === 'wuwa-bridge') {
            geo = new THREE.BoxGeometry(40, 2, 10);
            mat = this.materials['block-glass'];
        } else {
            geo = new THREE.BoxGeometry(10, 10, 10);
            mat = this.materials['block-matte'];
        }

        const mesh = new THREE.Mesh(geo, mat);

        // Snap to grid
        mesh.position.copy(position);
        mesh.position.y += (geo.parameters && geo.parameters.height ? geo.parameters.height / 2 : 5);

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.scene.add(mesh);
    }

    update() {
        if (!this.enabled) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Intersect against all scene children (can be optimized by grouping terrain)
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // Find first intersection that is not the grid itself or HUD
        let found = false;
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object !== this.gridMesh && intersects[i].object.type === 'Mesh') {
                // Snap position to a 10x10 grid
                const p = intersects[i].point;
                const gridX = Math.round(p.x / 10) * 10;
                const gridZ = Math.round(p.z / 10) * 10;

                // Position grid slightly above surface to prevent Z-fighting
                this.gridMesh.position.set(gridX, p.y + 0.1, gridZ);

                // Align grid normal to face normal
                const n = intersects[i].face.normal.clone();
                n.transformDirection(intersects[i].object.matrixWorld);
                // For simplicity, we just keep the grid flat (y-up), but for walls we might want to rotate it.
                // Keeping it flat for now.

                this.gridMesh.visible = true;
                found = true;
                break;
            }
        }

        if (!found) {
            this.gridMesh.visible = false;
        }
    }
}