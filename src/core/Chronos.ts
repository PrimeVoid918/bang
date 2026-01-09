export class Chronos {
  private duration: number = 0;
  private currentTime: number = 0;
  private running: boolean = false;
  private tickCallback?: (time: number) => void;
  private endCallback?: () => void;
  private lastTimestamp: number = 0;

  constructor() {}

  public start(duration: number) {
    this.duration = duration;
    this.currentTime = duration;
    this.running = true;
    this.lastTimestamp = performance.now();
  }

  public pause() {
    this.running = false;
  }

  public resume() {
    if (!this.running) {
      this.running = true;
      this.lastTimestamp = performance.now();
    }
  }

  public reset() {
    this.currentTime = this.duration;
    this.running = false;
  }

  public onTick(callback: (time: number) => void) {
    this.tickCallback = callback;
  }

  public onEnd(callback: () => void) {
    this.endCallback = callback;
  }

  // Call this every frame (in animate loop)
  public update() {
    if (!this.running) return;

    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000; // convert ms → s
    this.lastTimestamp = now;

    this.currentTime -= delta;
    if (this.currentTime <= 0) {
      this.currentTime = 0;
      this.running = false;
      this.endCallback?.();
    }

    this.tickCallback?.(this.currentTime);
  }

  public getTime(): number {
    return this.currentTime;
  }
}

/**
 * const timer = new Chronos();

// Update UI every tick
timer.onTick((time) => {
  console.log("Time left:", time.toFixed(2));
});

// What happens when time ends
timer.onEnd(() => {
  console.log("Session finished!");
});

// Start 60-second session
timer.start(60);

// In your animate loop
function animate() {
  timer.update();
  world.render();
  requestAnimationFrame(animate);
}
 */
