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
    "col-start-1 row-start-2 flex-row-reverse h-full w-full min-h-0 min-w-0";
  const rightPlacement: string =
    "col-start-3 row-start-2 h-full w-full min-h-0 min-w-0";
  const topPlacement: string =
    "col-start-2 row-start-1 flex-col-reverse min-h-0 min-w-0 pb-30";
  const bottomPlacement: string =
    "col-start-1 col-span-3 row-start-3 min-h-0 min-w-0";
  const middlePlacement: string = "col-start-2 row-start-2 min-h-0 min-w-0";

  const cardRotationSide: string = "flex-col -space-y-29 h-full min-h-0";
  const cardRotationTop: string = "-space-x-6 h-full min-h-0";

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
    // EACH SCREEN DIMENSTIONS HAS ITS OWN FR AND LAYOUT
    // FIGURE THAT OUT LATER
    <GameAction.Provider value={{ actionType, actionSocketId }}>
      <div className="grow h-full grid grid-cols-[1fr_1fr_1fr] grid-rows-[1fr_1fr_1.4fr] gap-4 p-1">
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
