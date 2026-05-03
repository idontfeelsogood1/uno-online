import { createContext } from "react";
import type { Socket } from "socket.io-client";

export const GameModeSocket = createContext<Socket | null>(null);
