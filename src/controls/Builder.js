import * as THREE from 'three';

export class Builder {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.isActive = false;
    this.gridSize = 5; // Snap grid size

    this.buildGhost();

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);

    // We only attach these events when God Mode is active
  }

  activate() {
    if (this.isActive) return;
    this.isActive = true;
    this.scene.add(this.ghostMesh);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onClick);
  }

  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;
    this.scene.remove(this.ghostMesh);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onClick);
  }

  buildGhost() {
    // Semi-transparent laser grid cube indicating placement
    const geo = new THREE.BoxGeometry(this.gridSize, this.gridSize, this.gridSize);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    this.ghostMesh = new THREE.Mesh(geo, mat);

    // Create an inner glowing core
    const coreGeo = new THREE.BoxGeometry(this.gridSize * 0.8, this.gridSize * 0.8, this.gridSize * 0.8);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.2
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.ghostMesh.add(coreMesh);
  }

  onMouseMove(event) {
    if (!this.isActive) return;

    // Only update if not dragging the camera
    // We can infer this if buttons == 0
    if (event.buttons !== 0) {
      this.ghostMesh.visible = false;
      return;
    }

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Intersect against all meshes in the scene except the ghost
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)
      .filter(i => i.object !== this.ghostMesh && i.object.parent !== this.ghostMesh);

    if (intersects.length > 0) {
      this.ghostMesh.visible = true;
      const point = intersects[0].point;
      const normal = intersects[0].face.normal.clone();

      // Transform normal to world space
      normal.transformDirection(intersects[0].object.matrixWorld);

      // Offset by half grid size along normal so it sits ON the surface
      const pos = point.clone().add(normal.multiplyScalar(this.gridSize / 2));

      // Snap to grid
      this.ghostMesh.position.x = Math.round(pos.x / this.gridSize) * this.gridSize;
      this.ghostMesh.position.y = Math.round(pos.y / this.gridSize) * this.gridSize;
      this.ghostMesh.position.z = Math.round(pos.z / this.gridSize) * this.gridSize;
    } else {
      this.ghostMesh.visible = false;
    }
  }

  onClick(event) {
    if (!this.isActive || !this.ghostMesh.visible) return;
    if (event.button !== 0) return; // Only left click

    // We place a block
    // TODO: Pull material/geometry from current Catalog selection
    // Default block for now
    const geo = new THREE.BoxGeometry(this.gridSize, this.gridSize, this.gridSize);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 1.5,
    });

    const block = new THREE.Mesh(geo, mat);
    block.position.copy(this.ghostMesh.position);
    this.scene.add(block);
  }
}
