import os from "os";

export class Network {
  private socket: WebSocket | null = null;
  private serverUrl: string = "";

  constructor() {
    // 1. Safe Check: Only access window if it exists
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const port = "3000";
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      this.serverUrl = `${protocol}://${host}:${port}`;
    } else {
      // 2. Server-side fallback (so it doesn't crash on import)
      this.serverUrl = "ws://localhost:3000";
    }
  }

  public connect(onMessage: (data: any) => void, onOpen: () => void): void {
    // Prevent the server from ever trying to "connect" to itself via WebSocket
    if (typeof window === "undefined") return;

    console.log(`Connecting to: ${this.serverUrl}`);
    this.socket = new WebSocket(this.serverUrl);

    this.socket.onopen = () => {
      console.log("Connected to Game Server");
      onOpen();
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    this.socket.onclose = () => {
      console.log("Disconnected. Retrying in 2s...");
      setTimeout(() => this.connect(onMessage, onOpen), 2000);
    };
  }

  public send(type: string, payload: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, ...payload }));
    }
  }

  getMachineIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return "localhost";
  }
}
