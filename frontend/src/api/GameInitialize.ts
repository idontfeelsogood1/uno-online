import { createContext } from "react";
import type { GameInitializeProps } from "../types/commonTypes";

export const GameInitialize = createContext<GameInitializeProps | null>(null);
