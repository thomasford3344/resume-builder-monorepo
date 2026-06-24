import { io, type Socket } from "socket.io-client";

export const socket: Socket = io("http://192.168.4.175:3000", {
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: true,
});