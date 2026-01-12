import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Physics } from "../core/Physics";
import { RGBELoader } from "three/examples/jsm/Addons.js";

export class GameMap {
  public scene: THREE.Group;
  private parentScene: THREE.Scene;
  public physics: Physics;

  constructor(parentScene: THREE.Scene, physics: Physics) {
    this.parentScene = parentScene;
    this.physics = physics;
  }

  public async load(path: string): Promise<void> {
    const loader = new GLTFLoader();

    try {
      const gltf = await loader.loadAsync(path);
      this.scene = gltf.scene;

      // 1. Get all meshes first
      const meshes: THREE.Mesh[] = [];
      this.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh);
      });

      console.log(`Processing ${meshes.length} meshes...`);

      // 2. Loop with "Breathers"
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];

        // --- VISUAL TWEAKS START ---
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          const mat = mesh.material;

          mat.side = THREE.FrontSide; // Use FrontSide for better performance than DoubleSide

          // Fix the "Flat/Dead" look
          mat.roughness = 0.8; // Valorant is matte, not shiny like plastic
          mat.metalness = 0.1; // Most map parts aren't metallic

          // Make textures crisp
          if (mat.map) {
            mat.map.anisotropy = 8; // Sharpens textures at a distance
            mat.map.colorSpace = THREE.SRGBColorSpace; // Corrects "washed out" colors
          }

          // If it's a window or glass, make it look better
          if (mat.name.toLowerCase().includes("glass")) {
            mat.transparent = true;
            mat.opacity = 0.5;
          }
        }
        // Performance: Stop the CPU from calculating movement for static walls
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        // --- VISUAL TWEAKS END ---

        if (this.isCollidable(mesh)) {
          this.physics.createTrimeshCollider(mesh);
        }

        if (i % 25 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      if (this.scene) this.parentScene.add(this.scene);
      console.log("Map Loaded Successfully!");
    } catch (error) {
      console.error("Failed to load map:", error);
    }
  }

  private isCollidable(mesh: THREE.Mesh): boolean {
    // If the object name includes "floor" or "wall", always collide
    const name = mesh.name.toLowerCase();
    if (
      name.includes("floor") ||
      name.includes("wall") ||
      name.includes("ground")
    )
      return true;

    // Or, check size: don't create physics for tiny objects (saves RAM)
    mesh.geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    mesh.geometry.boundingBox?.getSize(size);
    return size.length() > 0.5;
  }
}
