import { createContext } from "react";
import type { StateReceivedBetweenHandsProps } from "../types/commonTypes";

export const StateReceivedBetweenHands =
  createContext<StateReceivedBetweenHandsProps | null>(null);
