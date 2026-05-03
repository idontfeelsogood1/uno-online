import type {
  GamePlayer,
  GameProps,
  GridPosition,
} from "../../types/commonTypes";
import CurrentPlayer from "./current-player/CurrentPlayer";
import GameBoard from "./game-board/GameBoard";
import OtherPlayer from "./other-player/OtherPlayer";
import { GameAction } from "../../api/GameAction";
import { useEffect, useState } from "react";
import { LayoutGroup } from "motion/react";
import { useContext } from "react";
import { GameModeSocket } from "../../api/GameModeSocket";

export default function Game({
  gameState,
  actionType,
  actionSocketId,
}: GameProps) {
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [players, setPlayers] = useState<GamePlayer[]>([]);

  const socket = useContext(GameModeSocket)!;

  function getPopppedHandPlayers(): GamePlayer[] {
    const pseudoPlayers: GamePlayer[] = structuredClone(gameState.playerOrder);
    const tmpPlayers: GamePlayer[] = [];

    pseudoPlayers.forEach((player) => {
      if (player.socketId !== socket.id) {
        if (actionSocketId === player.socketId) {
          player.hand.pop();
        }
        tmpPlayers.push(player);
      }
    });
    pseudoPlayers.forEach((player) => {
      if (player.socketId === socket.id) {
        if (actionSocketId === player.socketId) {
          player.hand.pop();
        }
        tmpPlayers.push(player);
      }
    });

    return tmpPlayers;
  }

  useEffect(() => {
    if (actionType === "played-cards") {
      setPlayers(gameState.playerOrder);
    }
    if (actionType === "draw-cards") {
      setPlayers(getPopppedHandPlayers());
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, actionType]);

  const leftPlacement: string =
    "col-start-1 row-start-1 row-span-2 flex-row-reverse h-full w-full min-h-0 min-w-0";
  const rightPlacement: string =
    "col-start-3 row-start-1 row-span-2 h-full w-full min-h-0 min-w-0";
  const topPlacement: string =
    "col-start-2 row-start-1 flex-col-reverse min-h-0 min-w-0";
  const bottomPlacement: string =
    "col-start-1 col-span-3 row-start-3 min-h-0 min-w-0";
  const middlePlacement: string = "col-start-2 row-start-2 min-h-0 min-w-0";

  const otherPlayersPlacement: GridPosition[] = [
    {
      placement: topPlacement,
      position: "top",
    },
    {
      placement: leftPlacement,
      position: "left",
    },
    {
      placement: rightPlacement,
      position: "right",
    },
  ];

  function renderPlayer(): React.ReactElement[] {
    const tmpPlayers: GamePlayer[] = [];

    players.forEach((player) => {
      if (player.socketId !== socket.id) {
        tmpPlayers.push(player);
      }
    });
    players.forEach((player) => {
      if (player.socketId === socket.id) {
        tmpPlayers.push(player);
      }
    });

    const playersHtmlList: React.ReactElement[] = [];

    for (let i = 0; i < tmpPlayers.length; i++) {
      if (i < tmpPlayers.length - 1) {
        playersHtmlList.push(
          <OtherPlayer
            otherPlayer={tmpPlayers[i]}
            gridPosition={otherPlayersPlacement[i]}
          />,
        );
      } else {
        playersHtmlList.push(
          <CurrentPlayer
            player={tmpPlayers[i]}
            gridPosition={bottomPlacement}
            hasInitialized={hasInitialized}
          />,
        );
      }
    }

    return playersHtmlList;
  }

  return (
    <GameAction.Provider value={{ actionType, actionSocketId }}>
      <LayoutGroup>
        <div className="grow h-full grid grid-cols-[1fr_1fr_1fr] grid-rows-[1fr_1fr_1.4fr] gap-4 p-1">
          <GameBoard
            topCard={gameState.topCard}
            enforcedColor={gameState.enforcedColor}
            gridPosition={middlePlacement}
            gameState={gameState}
            setPlayers={setPlayers}
            hasInitialized={hasInitialized}
            setHasInitialized={setHasInitialized}
          />
          {renderPlayer()}
        </div>
      </LayoutGroup>
    </GameAction.Provider>
  );
}
