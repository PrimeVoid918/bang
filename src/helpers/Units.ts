export class Units {
  /** 1 Unit = 1 Meter */
  static readonly METER = 1;
  static readonly CM = 0.01;

  /**
   * Returns the scale factor needed to make an object
   * exactly 'targetHeight' meters tall.
   */
  static getScaleFactor(currentHeight: number, targetHeight: number): number {
    return targetHeight / currentHeight;
  }

  /** Normalizes a CM value from Blender to Three.js Meters */
  static fromCM(cm: number): number {
    return cm * this.CM;
  }
}
