import * as THREE from 'three';

export class BuildingRaycaster {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.center = new THREE.Vector2(0, 0); // Always center of screen since we use pointer lock
    this.enabled = false;

    // Create the visual grid/laser reticle in 3D space
    const gridGeom = new THREE.PlaneGeometry(10, 10, 10, 10);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.gridHelper = new THREE.Mesh(gridGeom, gridMat);
    this.gridHelper.rotation.x = -Math.PI / 2;
    this.gridHelper.visible = false;
    this.scene.add(this.gridHelper);

    this.currentIntersection = null;
  }

  update() {
    if (!this.enabled) {
      this.gridHelper.visible = false;
      this.currentIntersection = null;
      return;
    }

    this.raycaster.setFromCamera(this.center, this.camera);

    // Intersect all children in scene (might need optimization to only intersect chunks)
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // Filter out the grid helper itself or non-mesh objects
    let validIntersect = null;
    for(let i=0; i<intersects.length; i++) {
      if(intersects[i].object !== this.gridHelper && intersects[i].object.visible) {
        validIntersect = intersects[i];
        break;
      }
    }

    if (validIntersect) {
      this.currentIntersection = validIntersect;
      this.gridHelper.visible = true;
      this.gridHelper.position.copy(validIntersect.point);
      // Optional: align to face normal
      // this.gridHelper.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), validIntersect.face.normal);
      // Simple align to Y up for now
      this.gridHelper.rotation.set(-Math.PI / 2, 0, 0);
    } else {
      this.gridHelper.visible = false;
      this.currentIntersection = null;
    }
  }
}
