import { io } from "socket.io-client";

let URL: string;
if (import.meta.env.VITE_NODE_ENV === "production") {
  URL = import.meta.env.VITE_API_URL;
} else {
  URL = "http://localhost:3000";
}

export const socket = io(`${URL}/PlayerVsBot`, {
  autoConnect: false,
  transports: ["polling", "websocket"],
});
