import * as THREE from "three";

export class Lighting {
  private scene: THREE.Scene;
  private sun: THREE.DirectionalLight;
  private ambient: THREE.HemisphereLight;
  private flash: THREE.PointLight; // For muzzle flashes or small lights

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.init();
  }

  private init(): void {
    // 1. Hemisphere Light: Sky (0x87ceeb) and Ground (0x444444)
    // This gives the map "bounce light" so shadows aren't pitch black.
    this.ambient = new THREE.HemisphereLight(0x87ceeb, 0x444444, 1.2);
    this.scene.add(this.ambient);

    // 2. The Sun
    this.sun = new THREE.DirectionalLight(0xffffff, 2.0);
    this.sun.position.set(50, 100, 50);
    this.sun.castShadow = true;

    // 3. Shadow Camera Optimization
    // Only render shadows in a 60m box around the sun's target
    const shadowSize = 60;
    this.sun.shadow.camera.left = -shadowSize;
    this.sun.shadow.camera.right = shadowSize;
    this.sun.shadow.camera.top = shadowSize;
    this.sun.shadow.camera.bottom = -shadowSize;
    this.sun.shadow.camera.far = 500;

    // Higher resolution = crisper shadows but more lag
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0001; // Prevents "Shadow Acne" patterns on floors

    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // 4. Muzzle Flash Light (Starts invisible)
    this.flash = new THREE.PointLight(0xffaa00, 0, 10);
    this.scene.add(this.flash);
  }

  /**
   * Keep the Sun's "Shadow Box" centered on the player.
   */
  public update(playerPosition: THREE.Vector3): void {
    const sunOffset = new THREE.Vector3(50, 100, 50);

    // Move sun position relative to player
    this.sun.position.copy(playerPosition).add(sunOffset);

    // Point sun target at the player
    this.sun.target.position.copy(playerPosition);

    // Important: manually update target matrix since it's added to scene
    this.sun.target.updateMatrixWorld();
  }

  /**
   * Call this when the player fires a weapon!
   */
  public triggerMuzzleFlash(position: THREE.Vector3): void {
    this.flash.position.copy(position);
    this.flash.intensity = 15; // Bright burst

    // Fade out quickly
    const fade = setInterval(() => {
      this.flash.intensity *= 0.8;
      if (this.flash.intensity < 0.1) {
        this.flash.intensity = 0;
        clearInterval(fade);
      }
    }, 20);
  }
}
