// src/objects/Crosshair.ts
import * as THREE from "three";

interface CrosshairConfig {
  thickness: number;
  length: number;
  gap: number;
  color: number;
  opacity: number;
  showDot: boolean;
  dotSize: number;
}

export class Crosshair {
  public group: THREE.Group;
  private material: THREE.LineBasicMaterial;
  private lines: THREE.LineSegments;
  private dot: THREE.Mesh | null = null;

  constructor(camera: THREE.Camera, config: CrosshairConfig) {
    this.group = new THREE.Group();

    this.material = new THREE.LineBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      linewidth: config.thickness, // Note: WebGL line width is often fixed at 1
      depthTest: false,
    });

    this.lines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      this.material
    );
    this.applyConfig(config);

    this.group.add(this.lines);
    this.group.position.set(0, 0, -1); // 1 unit in front of camera lens
    camera.add(this.group);
  }

  public applyConfig(config: CrosshairConfig) {
    const { gap, length, showDot, dotSize } = config;

    // Standard 4-line crosshair using Vector2 logic
    const vertices = new Float32Array([
      // Top line (0, gap) to (0, gap + length)
      0,
      gap,
      0,
      0,
      gap + length,
      0,
      // Bottom line
      0,
      -gap,
      0,
      0,
      -gap - length,
      0,
      // Left line
      -gap,
      0,
      0,
      -gap - length,
      0,
      0,
      // Right line
      gap,
      0,
      0,
      gap + length,
      0,
      0,
    ]);

    this.lines.geometry.dispose();
    this.lines.geometry = new THREE.BufferGeometry();
    this.lines.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );

    // Handle the Center Dot
    if (showDot && !this.dot) {
      const dotGeo = new THREE.PlaneGeometry(dotSize, dotSize);
      const dotMat = new THREE.MeshBasicMaterial({
        color: config.color,
        depthTest: false,
      });
      this.dot = new THREE.Mesh(dotGeo, dotMat);
      this.group.add(this.dot);
    } else if (!showDot && this.dot) {
      this.group.remove(this.dot);
      this.dot = null;
    }
  }

  public setColor(hex: number) {
    this.material.color.set(hex);
    if (this.dot) (this.dot.material as THREE.MeshBasicMaterial).color.set(hex);
  }
}

export const valorantConfig = {
  thickness: 2,
  length: 0.01, // How long the lines are
  gap: 0.005, // Space in the center
  color: 0x00ff00, // Green
  opacity: 1,
  showDot: false,
  dotSize: 0.002,
};
