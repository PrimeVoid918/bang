import express from "express";
import { WebSocketServer } from "ws";
import path from "path";
import crypto from "node:crypto";
import { fileURLToPath } from "url";

// Replicate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static client
app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// WebSocket server for multiplayer
const wss = new WebSocketServer({ server });

interface PlayerState {
  id: string;
  x: number;
  y: number;
  z: number;
  rotY: number; // yaw rotation
  rotX: number; // yaw rotation
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

const players: Record<string, PlayerState> = {};

wss.on("connection", (ws) => {
  const id = crypto.randomUUID(); // unique id per client
  players[id] = {
    id,
    x: 0,
    y: 2,
    z: 0,
    rotY: 0,
    rotX: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
  };
  console.log(`Client connected: ${id}`);

  // Initialize new player
  players[id] = {
    id,
    x: 0,
    y: 2,
    z: 0,
    rotY: 0,
    rotX: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
  };
  console.log(`players Count: ${Object.keys(players).length}`);

  // Send existing players to new client
  ws.send(
    JSON.stringify({
      type: "init",
      players: Object.values(players),
      yourId: id,
    })
  );

  // Broadcast new player to everyone else
  broadcast({ type: "spawn", player: players[id] }, ws);

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());

    if (data.type === "shoot") {
      // Broadcast to everyone else so they see a "shot" effect
      broadcast(
        {
          type: "playerFired",
          id: id,
          origin: data.origin,
          direction: data.direction,
        },
        ws
      );
    }

    if (data.type === "input") {
      // Update the player’s position/rotation (server could run physics if you want)
      const player = players[id];
      if (!player) return;

      // For simplicity: directly accept client positions for now
      player.x = data.x;
      player.y = data.y;
      player.z = data.z;
      player.rotY = data.rotY;
      player.rotX = data.rotX;

      // Broadcast this update to other clients
      broadcast({ type: "update", player });
    }
  });

  ws.on("close", () => {
    console.log(`Client disconnected: ${id}`);
    delete players[id];
    broadcast({ type: "despawn", id });
  });
});

// Broadcast helper with optional exclusion
function broadcast(data: any, exclude?: WebSocket) {
  const str = JSON.stringify(data);
  wss.clients.forEach((c) => {
    if (exclude && c === exclude) return; // skip excluded socket
    if (c.readyState === c.OPEN) c.send(str);
  });
}
