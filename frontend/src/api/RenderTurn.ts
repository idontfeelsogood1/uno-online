import { createContext } from "react";
import type { RenderTurnProps } from "../types/commonTypes";

export const RenderTurn = createContext<RenderTurnProps | null>(null);
