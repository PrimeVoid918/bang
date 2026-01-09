import { World } from "./core/World.ts";
import { Lighting } from "./lights/Lights.ts";
import * as THREE from "three";
import "./assets/styles/index.css";
import { Plane } from "./objects/Plane.ts";
import { WalkControls } from "./controls/WalkControls.ts";
import type { Enemy as EnemyType } from "./entities/Enemy.ts";
import { Chronos } from "./core/Chronos.ts";
import { Physics } from "./core/Physics.ts";
import {
  LocalPlayer,
  Player,
  RemotePlayer,
  type ModelConfig,
} from "./entities/Player.ts";
import { remotePlayers } from "./core/Server.ts";
import { Crosshair, valorantConfig } from "./objects/Crosshair.ts";

const posDisplay = document.createElement("div");
posDisplay.style.position = "absolute";
posDisplay.style.top = "10px";
posDisplay.style.left = "10px";
posDisplay.style.color = "white";
posDisplay.style.fontFamily = "Arial";
document.body.appendChild(posDisplay);

// Init world
const world = new World();
const timer = new Chronos();
const physics = new Physics();

await physics.init();
let lastTime = performance.now();

// Lights
const lights = new Lighting(world.scene);
// Plane (floor)
const floor = new Plane(world.scene, 100, 25);
physics.addGround(100, 25);

// Camera controls
const controls = new WalkControls(world.camera, world.renderer.domElement);
world.scene.add(controls.yawObject); // IMPORTANT: add the yaw container to the scene

let player: LocalPlayer | RemotePlayer | null = null;
let playerId: string | null = null;
const crosshair = new Crosshair(world.camera, valorantConfig);

const enemies: EnemyType[] = [];

window.addEventListener("mousedown", (event) => {
  if (event.button === 0 && player) {
    // Left click
    // 1. Check local hits (for visual feedback)
    const enemyMeshes = enemies.map((e) => e.object); // Adjust based on your Enemy class
    const hit = player.shoot(enemyMeshes, world.camera);

    // 2. Tell the server we fired!
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "shoot",
          origin: world.camera.position,
          direction: world.camera.getWorldDirection(new THREE.Vector3()),
          // If we hit an enemy locally, send their ID for validation
          hitId: hit?.name, // Assuming you set mesh.name = enemy.id
        })
      );
    }
  }
});

const socket = new WebSocket("ws://localhost:3000");

socket.addEventListener("open", () => {
  console.log("Connected to server");
});
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "init":
      const me = data.players.find((p: any) => p.id === data.yourId);
      playerId = me?.id ?? crypto.randomUUID();

      // REMOVE 'const' or 'let' here!
      player = new LocalPlayer(playerId, physics, controls, world.scene);
      // player.setShowDebugMesh(true);

      data.players.forEach((p: any) => {
        if (p.id !== playerId) spawnRemotePlayer(p);
      });

      sendPlayerUpdate();
      break;

    case "spawn":
      if (data.player.id !== playerId) spawnRemotePlayer(data.player);
      break;

    case "update":
      const remote = remotePlayers[data.player.id];
      // Change RemotePlayback to RemotePlayer
      if (remote instanceof RemotePlayer) {
        // Sync the position received from server
        remote.object.position.set(data.player.x, data.player.y, data.player.z);
        remote.object.rotation.y = data.player.rotY;
      }
      break;

    case "despawn":
      const toRemove = remotePlayers[data.id];
      if (toRemove) {
        world.scene.remove(toRemove.object);
        delete remotePlayers[data.id];
      }
      break;
  }
});

function spawnRemotePlayer(p: any) {
  if (remotePlayers[p.id]) return;

  const pos = new THREE.Vector3(p.x, p.y, p.z);
  // const scale = new THREE.Vector3(p.scaleX, p.scaleY, p.scaleZ);

  // You can now pick the model based on server data
  const soldierConfig: ModelConfig = {
    // path: "./models/medieval_soldier/scene.gltf",
    path: "./models/face-22.glb",
    offsetPosition: new THREE.Vector3(0, -1.35, 0),
    rotation: new THREE.Vector3(0, Math.PI, 0),
    // scale: new THREE.Euler(1, 1, 1),
  };

  const remotePlayer = new RemotePlayer(
    p.id,
    physics,
    world.scene,
    pos,
    soldierConfig
  );
  remotePlayer.setShowDebugMesh(true);
  remotePlayers[p.id] = remotePlayer;
}

// Send local player update each frame
function sendPlayerUpdate() {
  if (player && socket.readyState === WebSocket.OPEN) {
    const pos = player.object.position;
    const rotY = player.object.rotation.y;
    // If your camera is a child of the player object:
    const rotX = world.camera.rotation.x;

    socket.send(
      JSON.stringify({
        type: "input",
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotY: rotY,
        rotX: rotX, // Send vertical look too!
      })
    );
  }
}

function animate() {
  const now = performance.now();
  const delta = (now - lastTime) / 1000; // seconds
  lastTime = now;

  physics.step(delta);
  // player.update(delta);
  if (player) {
    player.update(delta);
  }
  timer.update(); // Chronos uses its own delta internally

  // Capture input
  // const pressedKeys = controls.getPressedKeys();
  // socket.send(JSON.stringify({ type: "input", keys: pressedKeys }));
  sendPlayerUpdate();

  world.render();
  requestAnimationFrame(animate);

  posDisplay.textContent = `X:${controls.yawObject.position.x.toFixed(
    2
  )} Z:${controls.yawObject.position.z.toFixed(2)}`;
}

animate();
