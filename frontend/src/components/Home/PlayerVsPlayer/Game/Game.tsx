import type { GameProps } from "../../../../types/commonTypes";
import CurrentPlayer from "./CurrentPlayer/CurrentPlayer";
import GameBoard from "./GameBoard/GameBoard";
import OtherPlayer from "./OtherPlayer/OtherPlayer";
import { socket } from "../../../../api/socket";
import { GameAction } from "../../../../api/GameAction";

export default function Game({
  gameState,
  actionType,
  actionSocketId,
}: GameProps) {
  return (
    <GameAction.Provider value={{ actionType, actionSocketId }}>
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
            return <CurrentPlayer player={player} />;
          }
        })}
      </div>
    </GameAction.Provider>
  );
}
