import * as THREE from "three";

export interface RemotePlayer {
  id: string;
  object: THREE.Object3D;
}

export const remotePlayers: Record<string, RemotePlayer> = {};
