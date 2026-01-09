import * as THREE from "three";
import type * as RAPIERType from "@dimforge/rapier3d-compat";
import RAPIER from "@dimforge/rapier3d-compat";

export class Debug {
  /**
   * Create a Three.js mesh that visually represents a Rapier collider.
   * Returns the mesh; syncing with RigidBody is up to the caller.
   */
  static createColliderMesh(
    collider: RAPIERType.Collider,
    color = 0xff00ff
  ): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    const shape = collider.shape;

    switch (shape.type) {
      case RAPIER.ShapeType.Capsule: {
        const capsule = shape as RAPIER.Capsule; // cast to Capsule
        geometry = new THREE.CapsuleGeometry(
          capsule.halfHeight,
          capsule.radius * 2,
          4,
          8
        );
        break;
      }
      case RAPIER.ShapeType.Cuboid: {
        const cuboid = shape as RAPIER.Cuboid;
        geometry = new THREE.BoxGeometry(
          cuboid.halfExtents.x * 2,
          cuboid.halfExtents.y * 2,
          cuboid.halfExtents.z * 2
        );
        break;
      }
      case RAPIER.ShapeType.Ball: {
        const ball = shape as RAPIER.Ball;
        geometry = new THREE.SphereGeometry(ball.radius, 8, 8);
        break;
      }
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = new THREE.MeshBasicMaterial({ color, wireframe: true });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Sync a debug mesh with its RigidBody.
   */
  static syncMesh(mesh: THREE.Mesh, body: RAPIER.RigidBody) {
    const pos = body.translation();
    const rot = body.rotation();
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }

  /**
   * Ray helper for debugging
   */
  static createRayHelper(length: number, color = 0x00ff00): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -length, 0), // Default pointing down
    ]);
    const material = new THREE.LineBasicMaterial({ color });
    return new THREE.Line(geometry, material);
  }

  static syncRayHelper(
    line: THREE.Line,
    origin: RAPIER.Vector,
    direction: RAPIER.Vector
  ) {
    line.position.set(origin.x, origin.y, origin.z);
    // You would need to update the line's rotation to match the direction
    // Or simply update the geometry points
  }
}
