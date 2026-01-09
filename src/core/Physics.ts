import RAPIER from "@dimforge/rapier3d-compat";

export class Physics {
  public world!: RAPIER.World;

  async init() {
    await RAPIER.init();
    // The current version of Rapier is happy with this
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    console.log("Rapier World Initialized");
  }

  step(delta: number) {
    // Guard clause: Don't step if the world isn't ready yet
    if (!this.world) return;

    this.world.timestep = delta;
    this.world.step();
  }

  addGround(width: number, depth: number) {
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0)
    );

    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(width / 2, 0.1, depth / 2),
      body
    );
  }
}
