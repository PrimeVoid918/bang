import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class GltfLoader {
  public object: THREE.Object3D;

  constructor(
    scene: THREE.Scene,
    path: string,
    position = new THREE.Vector3(),
    onLoad?: (obj: THREE.Object3D) => void
  ) {
    const loader = new GLTFLoader();

    loader.load(
      path,
      (gltf) => {
        this.object = gltf.scene;
        this.object.position.copy(position);
        scene.add(this.object);

        if (onLoad) onLoad(this.object); // notify main.ts
      },
      undefined,
      (error) => console.error(error)
    );
  }
}
