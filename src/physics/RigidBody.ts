import * as THREE from "three";

export class RigidBody {
  public mass: number;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public acceleration: THREE.Vector3 = new THREE.Vector3();

  constructor(mass = 1) {
    this.mass = mass;
  }

  public applyForce(force: THREE.Vector3) {
    this.acceleration.add(force.clone().divideScalar(this.mass));
  }

  public update(delta: number, object: THREE.Object3D) {
    this.velocity.add(this.acceleration.clone().multiplyScalar(delta));
    object.position.add(this.velocity.clone().multiplyScalar(delta));
    this.acceleration.set(0, 0, 0); // reset forces each frame
  }
}
