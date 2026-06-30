import { io, type Socket } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000";

export const socket: Socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: true,
});