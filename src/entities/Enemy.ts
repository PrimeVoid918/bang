import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { BaseEntity } from "./BaseEntity";
import { GltfLoader } from "../loaders/GltfLoader";
import { Physics } from "../core/Physics";
import { Debug } from "../helpers/debug";

export class Enemy extends BaseEntity {
  public readonly object: THREE.Group; // Container for model and debug
  private body: RAPIER.RigidBody;
  private collider: RAPIER.Collider;
  private debugMesh: THREE.Mesh | null = null;

  public health = 100;

  constructor(
    scene: THREE.Scene,
    physics: Physics, // Pass the same physics instance as Player
    assetPath: string,
    position: THREE.Vector3 = new THREE.Vector3(),
    scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
  ) {
    // Create a container group
    const group = new THREE.Group();
    super(group);
    this.object = group;
    scene.add(this.object);

    // 1. Setup Rapier Physics (Same as Player)
    this.body = physics.world!.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y + 2, position.z)
        .lockRotations() // Stop enemies from tipping over
    );

    this.collider = physics.world!.createCollider(
      RAPIER.ColliderDesc.capsule(0.9, 0.4),
      this.body
    );

    // 2. Debug Hitbox
    this.debugMesh = Debug.createColliderMesh(this.collider, 0xff0000); // Red for enemies
    scene.add(this.debugMesh);

    // 3. Load GLTF Model
    new GltfLoader(scene, assetPath, position, (model) => {
      model.scale.copy(scale);
      // Remove placeholder logic and add model to our group
      this.object.add(model);

      // Setup shadows and name the mesh so Raycaster can identify it
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.name = "enemy_hitbox"; // Useful for your shoot() function
        }
      });
    });
  }

  public takeDamage(amount: number) {
    this.health -= amount;
    console.log(`Enemy health: ${this.health}`);

    // Visual feedback: Flash the debug mesh red
    if (this.debugMesh) {
      (this.debugMesh.material as THREE.MeshBasicMaterial).color.set(0xffffff);
      setTimeout(() => {
        if (this.debugMesh)
          (this.debugMesh.material as THREE.MeshBasicMaterial).color.set(
            0xffFFFF
          );
      }, 100);
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  private die() {
    console.log("Enemy eliminated");
    // You would add logic here to remove from scene/physics world
  }

  public update(delta: number) {
    // Sync Visuals with Physics
    const pos = this.body.translation();
    this.object.position.set(pos.x, pos.y, pos.z);

    // Sync Debug Hitbox
    if (this.debugMesh) {
      Debug.syncMesh(this.debugMesh, this.body);
    }

    // AI Logic (Example: rotate the model inside the group)
    this.object.children.forEach((child) => {
      if (child instanceof THREE.Group) child.rotation.y += delta;
    });
  }
}
