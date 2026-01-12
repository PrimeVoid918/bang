import { io, Socket } from "socket.io-client";
import type { LocalPlayer } from "../entities/Player";
import type { WalkControls } from "../controls/WalkControls";

export class ClientIO {
  public socket: Socket;
  public playerId: string | null = null;

  constructor(handlers: {
    onInit: (data: any) => void;
    onSpawn: (data: any) => void;
    onUpdate: (data: any) => void;
    onDespawn: (id: string) => void;
  }) {
    // Automatically connects to the host that served the page
    this.socket = io();

    this.socket.on("init", (data) => {
      this.playerId = data.yourId;
      handlers.onInit(data);
    });

    this.socket.on("spawn", (data) => handlers.onSpawn(data));
    this.socket.on("update", (data) => handlers.onUpdate(data));
    this.socket.on("despawn", (id) => handlers.onDespawn(id));
  }

  public sendUpdate(player: LocalPlayer, controls: WalkControls) {
    if (!this.socket.connected) return;

    const pos = player.object.position;
    const rotY = player.object.rotation.y;
    const rotX = controls.pitchObject.rotation.x;

    this.socket.emit("input", {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      rotY: rotY,
      rotX: rotX,
    });
  }

  public sendShoot(origin: any, direction: any, hitId?: string) {
    this.socket.emit("shoot", { origin, direction, hitId });
  }
}
