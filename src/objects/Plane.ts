import * as THREE from "three";

export class Plane {
  public mesh: THREE.Mesh;

  constructor(scene: THREE.Scene, width = 20, height = 20) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      side: THREE.DoubleSide,
    });
    material.color = new THREE.Color(0x888888);
    material.side = THREE.DoubleSide;

    const gridHelper = new THREE.GridHelper(width, height, 0xffffff, 0x444444);

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to lie flat
    this.mesh.receiveShadow = true;

    scene.add(this.mesh, gridHelper);
  }
}
