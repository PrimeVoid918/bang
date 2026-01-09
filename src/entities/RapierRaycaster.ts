import RAPIER from "@dimforge/rapier3d-compat";

export class RapierRaycaster {
  public ray: RAPIER.Ray;
  private world: RAPIER.World;
  private length: number;

  constructor(
    world: RAPIER.World,
    direction: { x: number; y: number; z: number },
    length: number
  ) {
    this.world = world;
    this.length = length;
    // Create the ray once and reuse it
    this.ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, direction);
  }

  public cast(origin: RAPIER.Vector): RAPIER.RayColliderHit | null {
    // Update existing ray origin to avoid Garbage Collection
    this.ray.origin.x = origin.x;
    this.ray.origin.y = origin.y;
    this.ray.origin.z = origin.z;

    return this.world.castRay(this.ray, this.length, true);
  }
}
