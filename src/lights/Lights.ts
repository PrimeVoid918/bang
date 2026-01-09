import * as THREE from "three";

export class Lighting {
  public directionalLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;

  constructor(scene: THREE.Scene) {
    // Ambient light (soft overall lighting)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(this.ambientLight);

    // Directional light (like the sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(5, 10, 7.5);
    this.directionalLight.castShadow = true;

    scene.add(this.directionalLight);

    // Optional helper for debugging
    // const helper = new THREE.DirectionalLightHelper(this.directionalLight, 5);
    // scene.add(helper);
  }

  // Example: dynamically change light intensity
  public setIntensity(intensity: number) {
    this.directionalLight.intensity = intensity;
    this.ambientLight.intensity = intensity * 0.5;
  }
}
