import { io } from "socket.io-client";

let URL: string;
if (import.meta.env.VITE_NODE_ENV === "dev") {
  URL = "http://localhost:3000";
} else {
  URL = import.meta.env.VITE_API_URL;
}

export const socket = io(`${URL}/game`, {
  autoConnect: false,
  transports: ["polling", "websocket"],
});
