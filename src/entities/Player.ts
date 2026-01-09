import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { WalkControls } from "../controls/WalkControls";
import { Physics } from "../core/Physics";
import { Debug } from "../helpers/debug";
import { GltfLoader } from "../loaders/GltfLoader";
import { RapierRaycaster } from "./RapierRaycaster";

export interface ModelConfig {
  path: string;
  scale?: THREE.Vector3;
  offsetPosition?: THREE.Vector3;
  rotation?: THREE.Euler | THREE.Vector3; // Some models face the wrong way!
}

/**
 * BASE PLAYER CLASS
 * Contains shared logic: Visuals, Raycasting, Identity
 */
export abstract class Player {
  public readonly object: THREE.Object3D;
  public id: string | null;
  protected raycast = new THREE.Raycaster();
  protected debugMesh: THREE.Mesh | null = null;
  protected showDebugMesh = false;

  constructor(id: string | null, scene: THREE.Scene, object: THREE.Object3D) {
    this.id = id;
    this.object = object;
    scene.add(this.object);
  }

  public abstract update(delta: number): void;

  public shoot(entities: THREE.Object3D[], camera: THREE.Camera) {
    this.raycast.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = this.raycast.intersectObjects(entities, true);
    return intersects.length > 0 ? intersects[0].object : null;
  }
}

/**
 * LOCAL PLAYER
 * The actual user: Physics-driven, Input-driven
 */
export class LocalPlayer extends Player {
  private body: RAPIER.RigidBody;
  private collider: RAPIER.Collider;
  private controls: WalkControls;
  private physics: Physics;
  private groundSensor: RapierRaycaster;
  private groundDebugLine: THREE.Line | null = null;
  private wallSensor: RapierRaycaster;
  private grounded = false;
  public jumpForce = 5;
  public movementSpeed = 5;

  constructor(
    id: string | null,
    physics: Physics,
    controls: WalkControls,
    scene: THREE.Scene
  ) {
    super(id, scene, controls.yawObject);
    this.physics = physics;
    this.controls = controls;

    this.body = physics.world!.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 2, 5).lockRotations()
    );
    this.collider = physics.world!.createCollider(
      RAPIER.ColliderDesc.capsule(0.9, 0.4),
      this.body
    );

    this.groundSensor = new RapierRaycaster(
      physics.world!,
      { x: 0, y: -1, z: 0 },
      1.05
    );
    this.wallSensor = new RapierRaycaster(
      physics.world!,
      { x: 0, y: 0, z: 1 },
      0.5
    );
  }

  update(delta: number) {
    const translation = this.body.translation();
    this.grounded = !!this.groundSensor.cast(translation);

    this.applyMovement();
    this.handleJump();
    this.syncVisual();
    this.updateGrounded();
    this.syncDebugMesh();

    if (this.groundDebugLine) {
      (this.groundDebugLine.material as THREE.LineBasicMaterial).color.set(
        this.grounded ? 0xffffff : 0x00ff00
      );
    }

    if (this.showDebugMesh && this.debugMesh) {
      Debug.syncMesh(this.debugMesh, this.body);
    }
  }

  private handleJump() {
    if (!this.controls.isJumpPressed()) return;
    if (!this.grounded) return;

    const vel = this.body.linvel();
    this.body.setLinvel({ x: vel.x, y: this.jumpForce, z: vel.z }, true);

    this.grounded = false;
  }

  private updateGrounded() {
    // Simply ask the sensor for a hit
    const hit = this.groundSensor.cast(this.body.translation());
    this.grounded = !!hit;
  }

  private applyMovement() {
    const moveDir = this.controls.getMovementDirection();

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      moveDir.applyQuaternion(this.object.quaternion);

      const vel = this.body.linvel();
      this.body.setLinvel(
        {
          x: moveDir.x * this.movementSpeed,
          y: vel.y,
          z: moveDir.z * this.movementSpeed,
        },
        true
      );
    } else {
      const vel = this.body.linvel();
      this.body.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
    }
  }
  private syncVisual() {
    const pos = this.body.translation();
    this.object.position.set(pos.x, pos.y, pos.z);
  }

  private syncDebugMesh() {
    if (!this.debugMesh) return;
    const pos = this.body.translation();
    const rot = this.body.rotation();
    this.debugMesh.position.set(pos.x, pos.y, pos.z);
    this.debugMesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }

  public shoot(entities: THREE.Object3D[], camera: THREE.Camera) {
    // do raycast from the center of the screen
    this.raycast.setFromCamera(new THREE.Vector2(0, 0), camera);

    const intersects = this.raycast.intersectObjects(entities, true);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      console.log("got a hit boss,", hitObj);
      return hitObj;
    }

    return null;
  }

  public setShowDebugMesh(value: boolean) {
    this.showDebugMesh = value;

    if (value && !this.debugMesh) {
      this.debugMesh = Debug.createColliderMesh(this.collider);
      this.groundDebugLine = Debug.createRayHelper(1.05, 0x00ff00);
      this.object.add(this.debugMesh);
      this.object.add(this.groundDebugLine);
    } else if (!value && this.debugMesh) {
      this.debugMesh.visible = false;
      // this.groundDebugLine.visible = false;
    }
  }

  public getShowDebugMesh() {
    return this.showDebugMesh;
  }
}

/**
 * REMOTE PLAYER (Enemy or Ally)
 * Network-driven: Puppet/Ghost logic
 */
export class RemotePlayer extends Player {
  private body: RAPIER.RigidBody;
  private collider: RAPIER.Collider;
  private physics: Physics;
  public health = 100;

  constructor(
    id: string,
    physics: Physics,
    scene: THREE.Scene,
    position: THREE.Vector3,
    config: ModelConfig
  ) {
    const group = new THREE.Group();
    group.position.copy(position);
    super(id, scene, group);
    this.physics = physics;

    const placeholder = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x555555, wireframe: true })
    );
    this.body = this.physics.world!.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 2, 5).lockRotations()
    );
    this.collider = physics.world!.createCollider(
      RAPIER.ColliderDesc.capsule(0.9, 0.4),
      this.body
    );
    this.object.add(placeholder);

    new GltfLoader(scene, config.path, new THREE.Vector3(0, 0, 0), (model) => {
      this.object.remove(placeholder);

      if (config.scale) model.scale.copy(config.scale);
      if (config.offsetPosition) model.position.copy(config.offsetPosition);

      // HANDLE ROTATION FIX
      if (config.rotation) {
        if (config.rotation instanceof THREE.Euler) {
          model.rotation.copy(config.rotation);
        } else {
          // It's a Vector3, so we set x, y, z individually
          model.rotation.set(
            config.rotation.x,
            config.rotation.y,
            config.rotation.z
          );
        }
      }

      this.object.add(model);

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.name = `remote_player_${this.id}`;
          child.castShadow = true;
        }
      });
    });
  }

  public update(delta: number) {
    // We'll add interpolation here next!

    this.syncDebugMesh();

    if (this.showDebugMesh && this.debugMesh) {
      Debug.syncMesh(this.debugMesh, this.body);
    }
  }

  private syncDebugMesh() {
    if (!this.debugMesh) return;
    const pos = this.body.translation();
    const rot = this.body.rotation();
    this.debugMesh.position.set(pos.x, pos.y, pos.z);
    this.debugMesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }

  public setShowDebugMesh(value: boolean) {
    this.showDebugMesh = value;

    if (value && !this.debugMesh) {
      this.debugMesh = Debug.createColliderMesh(this.collider);
      this.object.add(this.debugMesh);
    } else if (!value && this.debugMesh) {
      this.debugMesh.visible = false;
    }
  }

  public getShowDebugMesh() {
    return this.showDebugMesh;
  }
}

/**
 * ENEMY PLAYER
 * Specific logic for players on the opposing team
 */
export class EnemyPlayer extends RemotePlayer {
  constructor(
    id: string,
    physics: Physics,
    scene: THREE.Scene,
    position: THREE.Vector3,
    modelConfig: ModelConfig
  ) {
    super(id, physics, scene, position, modelConfig);
    // You could add a red outline or a red nametag here
  }
}

// const soldierConfig: ModelConfig = {
//   path: "/models/medieval_soldier/scene.gltf",
//   scale: new THREE.Vector3(0.01, 0.01, 0.01),
//   offsetPosition: new THREE.Vector3(0, -0.9, 0),
//   rotation: new THREE.Euler(0, Math.PI, 0) // Face forward
// };

// function spawnRemotePlayer(p: any) {
//   if (remotePlayers[p.id]) return;
//   const pos = new THREE.Vector3(p.x, p.y, p.z);

//   // Inject the config
//   const remotePlayer = new RemotePlayer(p.id, world.scene, pos, soldierConfig);
//   remotePlayers[p.id] = remotePlayer;
// }
