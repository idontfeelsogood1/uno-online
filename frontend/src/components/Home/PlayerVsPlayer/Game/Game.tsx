import type { GameProps } from "../../../../types/commonTypes";
import CurrentPlayer from "./CurrentPlayer/CurrentPlayer";
import GameBoard from "./GameBoard/GameBoard";
import OtherPlayer from "./OtherPlayer/OtherPlayer";
import { socket } from "../../../../api/socket";

// PROVIDE GLOBAL STATE FOR gameState FOR CHILD COMPONENTS
// RESET playHand AND MAYBE SOME OTHER VIEWS THROUGH actionType

export default function Game({ gameState, actionSocketId }: GameProps) {
  return (
    <div>
      <GameBoard
        topCard={gameState.topCard}
        enforcedColor={gameState.enforcedColor}
      />
      {gameState.playerOrder.map((player) => {
        if (player.socketId !== socket.id) {
          return <OtherPlayer otherPlayer={player} />;
        }
      })}
      {gameState.playerOrder.map((player) => {
        if (player.socketId === socket.id) {
          console.log("CurrentPlayer called");
          return <CurrentPlayer player={player} />;
        }
      })}
    </div>
  );
}
