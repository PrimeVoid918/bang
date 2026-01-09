import * as THREE from "three";

export class WalkControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private moveSpeed = 10;
  private keys: Record<string, boolean> = {};

  // Rotation state
  private pitch = 0; // up/down
  private sensitivity = 0.002;

  // FPS hierarchy
  public yawObject: THREE.Object3D; // rotates left/right
  public pitchObject: THREE.Object3D; // rotates up/down

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Create FPS hierarchy
    this.yawObject = new THREE.Object3D();
    this.pitchObject = new THREE.Object3D();

    this.pitchObject.add(this.camera);
    this.yawObject.add(this.pitchObject);

    // Keyboard
    window.addEventListener(
      "keydown",
      (e) => (this.keys[e.key.toLowerCase()] = true)
    );
    window.addEventListener(
      "keyup",
      (e) => (this.keys[e.key.toLowerCase()] = false)
    );

    // Mouse pointer lock
    this.domElement.addEventListener("click", () => {
      this.domElement.requestPointerLock();
    });

    document.addEventListener("mousemove", this.onMouseMove.bind(this));
  }

  private onMouseMove(event: MouseEvent) {
    if (document.pointerLockElement !== this.domElement) return;

    // Yaw left/right
    this.yawObject.rotation.y -= event.movementX * this.sensitivity;

    // Pitch up/down
    this.pitch -= event.movementY * this.sensitivity;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    this.pitchObject.rotation.x = this.pitch;
  }

  public isJumpPressed(): boolean {
    return !!this.keys[" "];
  }

  public getMovementDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3();

    if (this.keys["w"]) dir.z -= 1;
    if (this.keys["s"]) dir.z += 1;
    if (this.keys["a"]) dir.x -= 1;
    if (this.keys["d"]) dir.x += 1;

    // if (this.keys["space"]) dir.y += 10;

    if (dir.lengthSq() > 0) {
      dir.normalize();
    }
    return dir;
  }
}
