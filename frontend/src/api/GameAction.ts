import { createContext } from "react";
import type { GameActionProps } from "../types/commonTypes";

export const GameAction = createContext<GameActionProps | null>(null);
