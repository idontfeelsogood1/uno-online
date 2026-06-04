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
  getCarouselSlot,
  useAnimationsOrchestrator,
  useMediaQuery,
  usePreloadCardAssets,
} from "../../api/helper";
import { RenderTurn } from "../../api/RenderTurn";
import { GameInitialize } from "../../api/GameInitialize";
import { IsMobileView } from "../../api/IsMobileView";

export default function Game({ gameState, actionContext }: GameProps) {
  const { isLoading, loadError } = usePreloadCardAssets();
  const isMobileView = useMediaQuery("(max-width: 1122px)");

  const socket = useContext(GameModeSocket)!;

  const { actionType, actionSocketId, playedCards, cardDrew, unoPenalty } =
    actionContext;

  const {
    hasInitialized,
    hasFinishedInitialAnimation,
    players,
    isActionLocked,
    animationPhase,
    cardsToDraw,
    prevTopCard,
  } = useAnimationsOrchestrator(gameState, actionContext);

  const leftPlacement: string = !isMobileView
    ? "col-start-1 row-start-1 row-span-2 flex-row-reverse h-full w-full min-h-0 min-w-0"
    : "col-start-1 row-start-1 row-span-1 flex-col-reverse h-full w-full min-h-0 min-w-0";
  const rightPlacement: string = !isMobileView
    ? "col-start-3 row-start-1 row-span-2 h-full w-full min-h-0 min-w-0"
    : "col-start-3 row-start-1 row-span-1 flex-col-reverse h-full w-full min-h-0 min-w-0";
  const topPlacement: string = !isMobileView
    ? "col-start-2 row-start-1 flex-col-reverse min-h-0 min-w-0"
    : "col-start-2 row-start-1 flex-col-reverse min-h-0 min-w-0";
  const bottomPlacement: string =
    "col-start-1 col-span-3 row-start-3 min-h-0 min-w-0";

  const middlePlacement: GridPosition = {
    index: -1,
    placement: !isMobileView
      ? "col-start-2 row-start-2 min-h-0 min-w-0"
      : "col-start-1 col-span-3 row-start-2 min-h-0 min-w-0",
    position: "middle",
  };

  // CLOCKWISE ORDER
  const playersPlacement: GridPosition[] = [
    {
      index: 1,
      placement: leftPlacement,
      position: !isMobileView ? "left" : "top",
    },
    {
      index: 2,
      placement: topPlacement,
      position: "top",
    },
    {
      index: 3,
      placement: rightPlacement,
      position: !isMobileView ? "right" : "top",
    },
    {
      index: 0,
      placement: bottomPlacement,
      position: "bottom",
    },
  ];

  function getCurrentTurnGridIndex(): number | null {
    const gridPlayerOrder: GamePlayer[] = getGridPlayerOrder();

    for (let i = 0; i < gridPlayerOrder.length; i++) {
      if (
        gridPlayerOrder[i].socketId ===
        gameState.playerOrder[gameState.currentPlayerIndex].socketId
      ) {
        return i;
      }
    }

    return null;
  }

  function getGridPlayerOrder(): GamePlayer[] {
    const gridPlayerOrder: GamePlayer[] = [];

    players.forEach((player) => {
      if (player.socketId !== socket.id) {
        gridPlayerOrder.push(player);
      }
    });
    players.forEach((player) => {
      if (player.socketId === socket.id) {
        gridPlayerOrder.push(player);
      }
    });

    return gridPlayerOrder;
  }

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

    const gridPlayerOrder: GamePlayer[] = getGridPlayerOrder();

    let prevPlayerIndex: number = 0;
    let currPlayerIndex: number = 0;

    for (let i = 0; i < gridPlayerOrder.length; i++) {
      if (gridPlayerOrder[i].socketId === prevPlayerSocketId)
        prevPlayerIndex = i;
      if (gridPlayerOrder[i].socketId === currPlayerSocketId)
        currPlayerIndex = i;
    }

    const context: { socketId: string; renderDelay: number }[] = [];
    let ms: number = hasFinishedInitialAnimation ? 0 : 9000;

    while (prevPlayerIndex !== currPlayerIndex) {
      context.push({
        socketId: gridPlayerOrder[prevPlayerIndex].socketId,
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
      socketId: gridPlayerOrder[currPlayerIndex].socketId,
      renderDelay: ms + 500,
    });

    return {
      currPlayerSocketId: currPlayerSocketId,
      turnIndicators: context,
    };
  }

  // DEPENDS ON playersPlacement AND getGridPlayerOrder
  function renderPlayer(): React.ReactElement[] {
    const gridPlayerOrder: GamePlayer[] = getGridPlayerOrder();
    const playersHtmlList: React.ReactElement[] = [];

    // This keeps the gridPosition index to be in order
    for (let i = 0; i < gridPlayerOrder.length; i++) {
      const carouselSlot = getCarouselSlot(
        playersPlacement[i].index,
        getCurrentTurnGridIndex()!,
        gameState.playerOrder.length,
      );
      if (gridPlayerOrder[i].socketId !== socket.id) {
        playersHtmlList.push(
          <OtherPlayer
            otherPlayer={gridPlayerOrder[i]}
            gridPosition={playersPlacement[i]}
            carouselSlot={carouselSlot}
          />,
        );
      } else {
        playersHtmlList.push(
          <CurrentPlayer
            player={gridPlayerOrder[i]}
            gridPosition={playersPlacement[playersPlacement.length - 1]}
            carouselSlot={carouselSlot}
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

  return (
    <IsMobileView.Provider value={isMobileView}>
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
        <GameInitialize.Provider
          value={{
            hasInitialized,
            playersSize: players.length,
            hasFinishedInitialAnimation,
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
                cardsToDraw={cardsToDraw}
                prevTopCard={prevTopCard}
              />
              <RenderTurn.Provider
                value={{ currPlayerSocketId, turnIndicators }}
              >
                {renderPlayer()}
              </RenderTurn.Provider>
            </div>
          </LayoutGroup>
        </GameInitialize.Provider>
      </GameAction.Provider>
    </IsMobileView.Provider>
  );
}
