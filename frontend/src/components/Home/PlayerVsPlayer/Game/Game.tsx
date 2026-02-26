import type { GameProps } from "../../../../types/commonTypes";
import GameBoard from "./GameBoard/GameBoard";

export default function Game({ gameState }: GameProps) {
  return (
    <GameBoard
      topCard={gameState.topCard}
      enforcedColor={gameState.enforcedColor}
    />
  );
}
