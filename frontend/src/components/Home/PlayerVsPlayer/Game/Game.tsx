import type {
  GamePlayer,
  GameProps,
  GridPosition,
} from "../../../../types/commonTypes";
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
  const leftPlacement: string =
    "col-start-1 row-start-2 row-span-2 flex-row-reverse";
  const rightPlacement: string = "col-start-4 row-start-2 row-span-2";
  const topPlacement: string =
    "col-start-2 row-start-1 col-span-2 flex-col-reverse";
  const bottomPlacement: string = "col-start-2 row-start-4 col-span-2";
  const middlePlacement: string =
    "col-start-2 col-span-2 row-start-2 row-span-2";

  const cardRotationSide: string = "flex-col -space-y-41";
  const cardRotationTop: string = "-space-x-20";

  // FIGURE OUT HOW TO LIMIT THE HEIGHT/WIDTH (use max-width min-height, etc...)
  // OF EACH GRID ITEMS AND HOW TO STACK CARDS CLOSER DYNAMICALLY
  // DO THIS FOR CurrentPlayer first

  const otherPlayersPlacement: GridPosition[] = [
    {
      placement: topPlacement,
      rotation: cardRotationTop,
      position: "top",
    },
    {
      placement: leftPlacement,
      rotation: cardRotationSide,
      position: "left",
    },
    {
      placement: rightPlacement,
      rotation: cardRotationSide,
      position: "right",
    },
  ];

  function renderPlayer(): React.ReactElement[] {
    const players: GamePlayer[] = [];

    gameState.playerOrder.forEach((player) => {
      if (player.socketId !== socket.id) {
        players.push(player);
      }
    });
    gameState.playerOrder.forEach((player) => {
      if (player.socketId === socket.id) {
        players.push(player);
      }
    });

    const playersHtmlList: React.ReactElement[] = [];

    for (let i = 0; i < gameState.playerOrder.length; i++) {
      if (i < gameState.playerOrder.length - 1) {
        playersHtmlList.push(
          <OtherPlayer
            otherPlayer={players[i]}
            gridPosition={otherPlayersPlacement[i]}
          />,
        );
      } else {
        playersHtmlList.push(
          <CurrentPlayer player={players[i]} gridPosition={bottomPlacement} />,
        );
      }
    }

    return playersHtmlList;
  }

  return (
    <GameAction.Provider value={{ actionType, actionSocketId }}>
      <div className="grid grid-cols-4 grid-rows-4 gap-6 p-3">
        <GameBoard
          topCard={gameState.topCard}
          enforcedColor={gameState.enforcedColor}
          gridPosition={middlePlacement}
        />
        {renderPlayer()}
      </div>
    </GameAction.Provider>
  );
}
