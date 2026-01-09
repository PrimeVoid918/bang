import * as THREE from "three";

export abstract class BaseEntity {
  public mesh: THREE.Object3D;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public alive: boolean = true;

  constructor(mesh: THREE.Object3D) {
    this.mesh = mesh;
  }

  // Called every frame
  public update(delta: number) {
    this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
  }

  public onDestroy() {
    this.mesh.parent?.remove(this.mesh);
  }
}
