import type {
  GamePlayer,
  GameProps,
  GridPosition,
} from "../../types/commonTypes";
import CurrentPlayer from "./current-player/CurrentPlayer";
import GameBoard from "./game-board/GameBoard";
import OtherPlayer from "./other-player/OtherPlayer";
import { GameAction } from "../../api/GameAction";
import { LayoutGroup } from "motion/react";
import { useContext } from "react";
import { GameModeSocket } from "../../api/GameModeSocket";
import {
  useAnimationsOrchestrator,
  usePreloadCardAssets,
} from "../../api/helper";
import { RenderTurn } from "../../api/RenderTurn";
import { GameInitialize } from "../../api/GameInitialize";

export default function Game({ gameState, actionContext }: GameProps) {
  const { isLoading, loadError } = usePreloadCardAssets();

  const socket = useContext(GameModeSocket)!;

  const { actionType, actionSocketId, playedCards, cardDrew, unoPenalty } =
    actionContext;

  const {
    hasInitialized,
    hasFinishedInitialAnimation,
    players,
    isActionLocked,
    animationPhase,
    drawCards,
    prevTopCard,
  } = useAnimationsOrchestrator(gameState, socket, actionContext);

  const leftPlacement: string =
    "col-start-1 row-start-1 row-span-2 flex-row-reverse h-full w-full min-h-0 min-w-0";
  const rightPlacement: string =
    "col-start-3 row-start-1 row-span-2 h-full w-full min-h-0 min-w-0";
  const topPlacement: string =
    "col-start-2 row-start-1 flex-col-reverse min-h-0 min-w-0";
  const bottomPlacement: string =
    "col-start-1 col-span-3 row-start-3 min-h-0 min-w-0";

  const middlePlacement: GridPosition = {
    index: -1,
    placement: "col-start-2 row-start-2 min-h-0 min-w-0",
    position: "middle",
  };

  // CLOCKWISE ORDER
  const playersPlacement: GridPosition[] = [
    {
      index: 1,
      placement: leftPlacement,
      position: "left",
    },
    {
      index: 2,
      placement: topPlacement,
      position: "top",
    },
    {
      index: 3,
      placement: rightPlacement,
      position: "right",
    },
    {
      index: 0,
      placement: bottomPlacement,
      position: "bottom",
    },
  ];

  function getTurnIndicatorContext(): {
    currPlayerSocketId: string;
    turnIndicators: { socketId: string; renderDelay: number }[];
  } {
    const prevPlayerSocketId: string = actionSocketId;
    const currPlayerSocketId: string =
      gameState.playerOrder[gameState.currentPlayerIndex].socketId;

    if (!hasInitialized) {
      return {
        currPlayerSocketId: currPlayerSocketId,
        turnIndicators: [],
      }; // ONLY GET INDICATOR WHEN THE gameState has initialized
    }

    const tmpPlayers: GamePlayer[] = [];

    let prevPlayerIndex: number = 0;
    let currPlayerIndex: number = 0;

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

    for (let i = 0; i < tmpPlayers.length; i++) {
      if (tmpPlayers[i].socketId === prevPlayerSocketId) prevPlayerIndex = i;
      if (tmpPlayers[i].socketId === currPlayerSocketId) currPlayerIndex = i;
    }

    const context: { socketId: string; renderDelay: number }[] = [];
    let ms: number = hasFinishedInitialAnimation ? 0 : 9000;

    while (prevPlayerIndex !== currPlayerIndex) {
      context.push({
        socketId: tmpPlayers[prevPlayerIndex].socketId,
        renderDelay: ms,
      });
      ms += 500;

      // GRID PLACEMENT: [bottom, left, top, right]
      if (gameState.direction === -1) {
        if (prevPlayerIndex <= 0) prevPlayerIndex = players.length - 1;
        else prevPlayerIndex--;
      }
      if (gameState.direction === 1) {
        if (prevPlayerIndex === players.length - 1) prevPlayerIndex = 0;
        else prevPlayerIndex++;
      }
    }

    context.push({
      socketId: tmpPlayers[currPlayerIndex].socketId,
      renderDelay: ms + 500,
    });

    return {
      currPlayerSocketId: currPlayerSocketId,
      turnIndicators: context,
    };
  }

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

    // This keeps the gridPosition index to be in order
    for (let i = 0; i < tmpPlayers.length; i++) {
      if (tmpPlayers[i].socketId !== socket.id) {
        playersHtmlList.push(
          <OtherPlayer
            otherPlayer={tmpPlayers[i]}
            gridPosition={playersPlacement[i]}
          />,
        );
      } else {
        playersHtmlList.push(
          <CurrentPlayer
            player={tmpPlayers[i]}
            gridPosition={playersPlacement[playersPlacement.length - 1]}
          />,
        );
      }
    }

    return playersHtmlList;
  }

  if (isLoading) {
    return <h1 className="text-center self-center">Loading game...</h1>;
  }
  if (loadError) {
    return <h1 className="text-center self-center">{loadError}</h1>;
  }

  const { currPlayerSocketId, turnIndicators } = getTurnIndicatorContext();

  // If cardsToDraw (computed from TurnEvents) > 0
  // Set the current player's hand without those cards (pop)

  // In GameBoard
  // After renderStacking
  // Set the cards that were popped (do the popping again) on top of drawPile and turn it off a few seconds later
  // Set the current player's hand with everything in Game

  // Uno

  return (
    <GameAction.Provider
      value={{
        actionType,
        actionSocketId,
        isActionLocked,
        playedCards,
        cardDrew,
        unoPenalty,
      }}
    >
      <LayoutGroup>
        <div className="grow h-full grid grid-cols-[1fr_1fr_1fr] grid-rows-[1fr_1fr_1.5fr] gap-4 p-1">
          <GameBoard
            enforcedColor={gameState.enforcedColor}
            gridPosition={middlePlacement}
            gameState={gameState}
            hasInitialized={hasInitialized}
            animationPhase={animationPhase}
            drawCards={drawCards}
            prevTopCard={prevTopCard}
          />
          <RenderTurn.Provider value={{ currPlayerSocketId, turnIndicators }}>
            <GameInitialize.Provider
              value={{
                hasInitialized,
                playersSize: players.length,
                hasFinishedInitialAnimation,
              }}
            >
              {renderPlayer()}
            </GameInitialize.Provider>
          </RenderTurn.Provider>
        </div>
      </LayoutGroup>
    </GameAction.Provider>
  );
}
