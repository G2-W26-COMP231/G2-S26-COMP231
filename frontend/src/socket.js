import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const token = localStorage.getItem("crewup_token");
  socket = io(import.meta.env.VITE_API_URL || "/", {
    autoConnect: false,
    auth: { token },
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}