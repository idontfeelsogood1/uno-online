import { useEffect, useRef, useState, type RefObject } from "react";
import type {
  Card,
  CardStyle,
  GameActionProps,
  GameData,
  GameInitializeProps,
  GamePlayer,
  RenderTurnProps,
} from "../types/commonTypes";

export function getCardImgPath(card: Card) {
  return `/card-images/${card.color + "_" + card.value + ".jpg"}`;
}

export function getCardCoverImgPath() {
  return `/card-images/${"COVER" + ".jpg"}`;
}

export function generateCardPaths(): string[] {
  const colors = ["RED", "BLUE", "GREEN", "YELLOW"];
  const values = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "SKIP",
    "REVERSE",
    "+2",
  ];

  const deckPaths: string[] = [];

  // Generate normal cards
  colors.forEach((color) => {
    values.forEach((value) => {
      deckPaths.push(`/card-images/${color + "_" + value + ".jpg"}`);
    });
  });

  // Generate wild cards
  deckPaths.push(`/card-images/${"BLACK" + "_" + "WILD" + ".jpg"}`);
  deckPaths.push(`/card-images/${"BLACK" + "_" + "+4" + ".jpg"}`);

  // Generate card's cover
  deckPaths.push(`/card-images/${"COVER" + ".jpg"}`);

  return deckPaths;
}

export function preloadCardImages(imagesPath: string[]): Promise<void[]> {
  const promises: Promise<void>[] = imagesPath.map((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      // When the image finishes downloading to RAM, resolve the promise
      img.onload = () => resolve();
      img.onerror = () => reject();
    });
  });
  return Promise.all(promises);
}

export function usePreloadCardAssets(): {
  isLoading: boolean;
  loadError: string | null;
} {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function preloadCardAssets(): Promise<void> {
      try {
        await preloadCardImages(generateCardPaths());
        setIsLoading(false);
        console.log("Card's images successfully pre-loaded.");
      } catch (err) {
        setLoadError("An error happened while loading component.");
        setIsLoading(false);
        console.log(`An error happened while pre-loading card images: ${err}`);
      }
    }

    preloadCardAssets();
  }, []);

  return { isLoading, loadError };
}

export function useRenderIndicator(
  renderContext: RenderTurnProps,
  player: GamePlayer,
): { isIndicatorTurn: boolean } {
  const [isIndicatorTurn, setIsIndicatorTurn] = useState<boolean>(false);

  function renderIndicator(): (() => void) | null {
    for (const indicator of renderContext!.turnIndicators) {
      // IF PLAYER IS IN THE ROTATING TURN CAROUSEL
      if (indicator.socketId === player.socketId) {
        // IF PLAYER IS THE CURRENT PLAYER
        if (player.socketId === renderContext!.currPlayerSocketId) {
          // RENDER THE BOX AND DONT TURN IT OFF
          const renderTimeout = setTimeout(() => {
            setIsIndicatorTurn(true);
          }, indicator.renderDelay);

          return () => clearTimeout(renderTimeout);
        } else {
          // RENDER THE BOX AND TURN IT OFF AFTER 1 SECOND
          const renderTimeout = setTimeout(() => {
            setIsIndicatorTurn(true);
          }, indicator.renderDelay);
          const renderOffTimeout = setTimeout(() => {
            setIsIndicatorTurn(false);
          }, 1000);

          return () => {
            clearTimeout(renderTimeout);
            clearTimeout(renderOffTimeout);
          };
        }
      }
    }
    return null;
  }

  useEffect(() => {
    renderIndicator(); // PROCESS THE INDICATOR
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  return { isIndicatorTurn };
}

export function useCardsAnimation(
  position: string,
  gridPositionIndex: number,
  hand: Card[],
  initializeContext: GameInitializeProps,
): {
  cardContainerRef: RefObject<HTMLDivElement | null>;
  cardPhysics: CardStyle[];
  updateStyleOnInitialAnimationComplete: CallableFunction;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [landedCardIds, setLandedCardIds] = useState<string[]>([]);

  // PLANNING:

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    // Measure the container instantly on ref render
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  function getCardStyles(): CardStyle[] {
    const isHorizontal = position === "top" || position === "bottom";
    const cardStyle: CardStyle[] = [];

    //  DYNAMIC DIMENSIONS
    let cardWidth = 0;
    let cardHeight = 0;

    if (isHorizontal) {
      cardHeight = Math.min(containerSize.height, 256);
      cardWidth = cardHeight * (2 / 3);
    } else {
      cardWidth = Math.min(containerSize.width, 160);
      cardHeight = cardWidth * (3 / 2);
    }

    // DYNAMIC SPACING MATH
    let step = 0;
    if (hand.length > 1) {
      if (isHorizontal && containerSize.width > 0) {
        step = (containerSize.width - cardWidth) / (hand.length - 1);
        step = Math.min(step, cardWidth * 0.8);
        step = Math.max(step, 10);
      } else if (!isHorizontal && containerSize.height > 0) {
        step = (containerSize.height - cardHeight) / (hand.length - 1);
        step = Math.min(step, cardHeight * 0.8);
        step = Math.max(step, 10);
      }
    }

    // CENTERING OFFSETS
    let startOffset = 0;
    if (isHorizontal) {
      const totalUsedWidth = cardWidth + (hand.length - 1) * step;
      startOffset = (containerSize.width - totalUsedWidth) / 2;
    } else {
      const totalUsedHeight = cardHeight + (hand.length - 1) * step;
      startOffset = (containerSize.height - totalUsedHeight) / 2;
    }

    for (let i = 0; i < hand.length; i++) {
      const dealDelay = initializeContext!.hasFinishedInitialAnimation
        ? 0.15
        : (i * initializeContext!.playersSize + gridPositionIndex) * 0.25; // THE NUMBER 4 IS THE LENGTH OF THE PLAYERS, INDEX MIGHT NEED SHIFTING LATER

      const calculatedPosition = startOffset + i * step;

      // CALCULATE Z INDEX FOR INITIAL ANIMATION (GLOBAL ROUND ROBIN)
      const totalCardsInDeck = hand.length * initializeContext!.playersSize;
      const globalDeckIndex =
        i * initializeContext!.playersSize + gridPositionIndex;

      const flightZIndex = totalCardsInDeck - globalDeckIndex;

      const isLanded =
        landedCardIds.includes(hand[i].id) ||
        initializeContext!.hasFinishedInitialAnimation;

      const currentZIndex = isLanded ? i : flightZIndex;

      cardStyle.push({
        card: hand[i],
        zIndex: currentZIndex,
        width: cardWidth,
        height: cardHeight,
        calculatedPosition: calculatedPosition,
        dealDelay: dealDelay,
      });
    }

    return cardStyle;
  }

  function updateStyleOnInitialAnimationComplete(cardId: string): void {
    setLandedCardIds([...landedCardIds, cardId]);
  }

  return {
    cardContainerRef: containerRef,
    cardPhysics: getCardStyles(),
    updateStyleOnInitialAnimationComplete,
  };
}

// ANIMATIONS GOTTA BE IN THE SAME RENDERING CYCLE FOR THEM TO WORK CORRECTLY
// (BEING CALLED IN THE CALLSTACK AT THE SAME TIME)
export function useAnimationsOrchestrator(
  gameState: GameData,
  actionContext: GameActionProps,
) {
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [hasFinishedInitialAnimation, setHasFinishedInitialAnimation] =
    useState<boolean>(false);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [isActionLocked, setIsActionLocked] = useState<boolean>(false);

  const [animationPhase, setAnimationPhase] = useState<
    "idle" | "showcase" | "stacking"
  >("idle");

  const [cardsToDraw, setCardsToDraw] = useState<Card[]>([]);
  const [prevTopCard, setPrevTopCard] = useState<Card>(gameState.topCard);

  const { actionType, actionSocketId } = actionContext;

  useEffect(() => {
    function getEmptyHandPlayers(): GamePlayer[] {
      const pseudoPlayers: GamePlayer[] = structuredClone(
        gameState.playerOrder,
      );
      const tmpPlayers: GamePlayer[] = [];

      pseudoPlayers.forEach((player) => {
        player.hand = [];
        tmpPlayers.push(player);
      });

      return tmpPlayers;
    }

    function setCardsForPlayers(): void {
      setTimeout(() => {
        setPlayers(gameState.playerOrder);
        setHasInitialized(true);
      }, 50); // WAIT FOR DOM TO LOAD AND ResizeObservers TO SET THE NECCESSARY DATA FOR STYLE
      setTimeout(() => {
        setHasFinishedInitialAnimation(true);
      }, 9000);
    }

    setPlayers(getEmptyHandPlayers());
    setCardsForPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleActionLockAndUnlock(ms: number): () => void {
      setIsActionLocked(true);

      const unlockActionTimer = setTimeout(() => {
        setIsActionLocked(false);
      }, ms);

      return () => {
        clearTimeout(unlockActionTimer);
      };
    }

    // THIS IS FOR THE PREVIOUS PLAYER WHO DID THE ACTION
    function popPreviousTurnPlayerHand(amount: number): {
      tmpPlayers: GamePlayer[];
      cardsToDraw: Card[];
    } {
      const pseudoPlayers: GamePlayer[] = structuredClone(
        gameState.playerOrder,
      );
      const tmpPlayers: GamePlayer[] = [];
      const cardsToDraw: Card[] = [];

      pseudoPlayers.forEach((player) => {
        if (actionSocketId === player.socketId) {
          for (let i = 0; i < amount; i++) cardsToDraw.push(player.hand.pop()!);
        }
        tmpPlayers.push(player);
      });

      return {
        tmpPlayers: tmpPlayers,
        cardsToDraw: cardsToDraw,
      };
    }

    // THIS IS FOR THE CURRENT PLAYER THE ACTION AFFECTS
    function popCurrentTurnPlayerHand(amount: number): {
      tmpPlayers: GamePlayer[];
      cardsToDraw: Card[];
    } {
      const pseudoPlayers: GamePlayer[] = structuredClone(
        gameState.playerOrder,
      );
      const currentPlayer: GamePlayer =
        gameState.playerOrder[gameState.currentPlayerIndex];
      const tmpPlayers: GamePlayer[] = [];
      const cardsToDraw: Card[] = [];

      pseudoPlayers.forEach((player) => {
        if (player.socketId === currentPlayer.socketId) {
          for (let i = 0; i < amount; i++) cardsToDraw.push(player.hand.pop()!);
        }
        tmpPlayers.push(player);
      });

      return {
        tmpPlayers: tmpPlayers,
        cardsToDraw: cardsToDraw,
      };
    }

    // THIS IS FOR THE PREVIOUS AND CURRENT PLAYER
    function popPrevAndCurrentPlayerHand(
      prevAmount: number,
      currAmount: number,
    ): {
      tmpPlayers: GamePlayer[];
      prevCardsToDraw: Card[];
      currCardsToDraw: Card[];
    } {
      const pseudoPlayers: GamePlayer[] = structuredClone(
        gameState.playerOrder,
      );
      const currentPlayer: GamePlayer =
        gameState.playerOrder[gameState.currentPlayerIndex];
      const tmpPlayers: GamePlayer[] = [];

      const prevCardsToDraw: Card[] = [];
      const currCardsToDraw: Card[] = [];

      pseudoPlayers.forEach((player) => {
        if (player.socketId === actionSocketId) {
          for (let i = 0; i < prevAmount; i++)
            prevCardsToDraw.push(player.hand.pop()!);
        }
        if (player.socketId === currentPlayer.socketId) {
          for (let i = 0; i < currAmount; i++)
            currCardsToDraw.push(player.hand.pop()!);
        }
        tmpPlayers.push(player);
      });

      return {
        tmpPlayers: tmpPlayers,
        prevCardsToDraw: prevCardsToDraw,
        currCardsToDraw: currCardsToDraw,
      };
    }

    if (actionType === "create-game") {
      return handleActionLockAndUnlock(9000);
    }

    if (actionType === "played-cards") {
      const { draw_two_amount, wild_draw_four_amount } = gameState.turnEvents;
      const cardsToDrawAmount: number =
        draw_two_amount * 2 + wild_draw_four_amount * 4;

      if (actionContext.unoPenalty && cardsToDrawAmount > 0) {
        const { tmpPlayers, prevCardsToDraw, currCardsToDraw } =
          popPrevAndCurrentPlayerHand(2, cardsToDrawAmount);

        // Get the initial state with both player's hand missing the cards
        setPlayers(tmpPlayers);
        setCardsToDraw(prevCardsToDraw);

        // Get the final state for unoPenalty (missing draw cards)
        setTimeout(() => {
          setPlayers(popCurrentTurnPlayerHand(cardsToDrawAmount).tmpPlayers);
          setCardsToDraw(currCardsToDraw);
        }, 50);

        // Get the final state for drawCards (default state)
        setTimeout(() => {
          setPlayers(gameState.playerOrder);
          setCardsToDraw([]);
        }, 3500);
      } else if (actionContext.unoPenalty) {
        const { tmpPlayers, cardsToDraw } = popPreviousTurnPlayerHand(2);
        setPlayers(tmpPlayers);
        setCardsToDraw(cardsToDraw);
        // INSTANTLY PENALIZE THE PLAYER FOR NOT UNOING
        setTimeout(() => {
          setPlayers(gameState.playerOrder);
          setCardsToDraw([]);
        }, 50);
      } else if (cardsToDrawAmount > 0) {
        const { tmpPlayers, cardsToDraw } =
          popCurrentTurnPlayerHand(cardsToDrawAmount);
        setPlayers(tmpPlayers);
        setCardsToDraw(cardsToDraw);
        // DRAW CARDS FOR PLAYER AFTER CLEANUP ANIMATION
        setTimeout(() => {
          setPlayers(gameState.playerOrder);
          setCardsToDraw([]);
        }, 3050);
      } else {
        // BASE CASE
        setPlayers(gameState.playerOrder);
      }

      setAnimationPhase("showcase");
      handleActionLockAndUnlock(3000);

      const stackTimer = setTimeout(() => {
        setAnimationPhase("stacking");
      }, 2000);

      const cleanupTimer = setTimeout(() => {
        setPrevTopCard(gameState.topCard);
        setAnimationPhase("idle");
      }, 3000);

      return () => {
        clearTimeout(stackTimer);
        clearTimeout(cleanupTimer);
      };
    }
    if (actionType === "draw-cards") {
      const { tmpPlayers, cardsToDraw } = popPreviousTurnPlayerHand(1);
      setPlayers(tmpPlayers);
      setCardsToDraw(cardsToDraw);

      handleActionLockAndUnlock(2000);

      const disappearTimer = setTimeout(() => {
        setCardsToDraw([]);
        setPlayers(gameState.playerOrder);
      }, 50);

      return () => {
        clearTimeout(disappearTimer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, actionType]);

  return {
    hasInitialized,
    hasFinishedInitialAnimation,
    players,
    isActionLocked,
    animationPhase,
    cardsToDraw,
    prevTopCard,
  };
}
