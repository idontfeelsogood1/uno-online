import { useEffect, useRef, useState } from "react";
import type {
  Card,
  GameActionProps,
  GameData,
  GameInitializeProps,
  GamePlayer,
  RenderTurnProps,
} from "../types/commonTypes";
import { motion } from "motion/react";
import type { Socket } from "socket.io-client";

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
  newStateReceived: boolean = false,
  actionCallback: CallableFunction,
  isCurrentPlayerHand: boolean,
): { renderHandContainer: CallableFunction } {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [landedCardIds, setLandedCardIds] = useState<string[]>([]);

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

  function renderHand(): React.ReactElement[] {
    const isHorizontal = position === "top" || position === "bottom";
    const elements: React.ReactElement[] = [];

    //  DYNAMIC DIMENSIONS
    let cardWidth = 0;
    let cardHeight = 0;

    if (isHorizontal) {
      cardHeight = Math.min(containerSize.height, 256);
      cardWidth = cardHeight * (2 / 3);
    } else {
      cardWidth = Math.min(containerSize.width, 170);
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

      if (isCurrentPlayerHand) {
        elements.push(
          <motion.div
            key={hand[i].id}
            layoutId={hand[i].id}
            onClick={() => {
              actionCallback(hand[i]);
            }}
            className="absolute top-1/2 -translate-y-1/2 h-full max-h-64 aspect-2/3 cursor-pointer shadow-lg"
            style={{
              zIndex: i,
              width: cardWidth + 10,
              left: calculatedPosition,
              pointerEvents:
                initializeContext!.hasFinishedInitialAnimation ||
                !newStateReceived
                  ? "auto"
                  : "none",
            }}
            whileHover={{ y: "-10%", zIndex: 100, scale: 1.1 }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              layout: {
                type: "spring",
                stiffness: 80,
                damping: 14,
                delay: dealDelay,
              },
              scale: { type: "tween", duration: 0.6, delay: dealDelay },
              left: { type: "spring", stiffness: 200, damping: 20 },
            }}
          >
            <motion.div
              className="absolute w-full h-full transform-3d"
              initial={{ rotateY: newStateReceived ? 180 : 0 }}
              animate={{ rotateY: 0 }}
              transition={{
                type: "tween",
                duration: 0.6,
                ease: "easeInOut",
                delay: dealDelay,
              }}
            >
              <img
                src={getCardImgPath(hand[i])}
                alt={hand[i].name}
                className="absolute inset-0 w-full h-full object-cover backface-hidden rounded-md shadow-lg"
              />
              <img
                src={getCardCoverImgPath()}
                alt="Card cover"
                className="absolute inset-0 w-full h-full object-cover backface-hidden rotate-y-180 rounded-md shadow-lg"
              />
            </motion.div>
          </motion.div>,
        );
      } else {
        elements.push(
          <motion.div
            key={hand[i].id}
            layoutId={hand[i].id}
            className={`absolute ${
              isHorizontal
                ? "top-1/2 -translate-y-1/2"
                : "left-1/2 -translate-x-1/2"
            } shadow-md rounded-md backface-hidden z-10`}
            style={{
              zIndex: currentZIndex,
              width: cardWidth,
              height: cardHeight,
              left: isHorizontal ? calculatedPosition : "50%",
              top: !isHorizontal ? calculatedPosition : "50%",
              pointerEvents: "none",
            }}
            onAnimationComplete={() => {
              if (!landedCardIds.includes(hand[i].id)) {
                setLandedCardIds([...landedCardIds, hand[i].id]);
              }
            }}
            initial={{ scale: 0.8 }}
            animate={{
              scale: 1,
              zIndex: currentZIndex,
            }}
            transition={{
              layout: {
                type: "spring",
                stiffness: 80,
                damping: 14,
                delay: dealDelay,
              },
              scale: { type: "tween", duration: 0.6, delay: dealDelay },
              left: { type: "spring", stiffness: 200, damping: 20 },
              top: { type: "spring", stiffness: 200, damping: 20 },
            }}
          >
            <motion.div
              className="absolute w-full h-full transform-3d"
              transition={{
                type: "tween",
                duration: 0.6,
                ease: "easeInOut",
                delay: dealDelay,
              }}
            >
              <img
                src={getCardCoverImgPath()}
                alt="Card cover"
                className="absolute inset-0 w-full h-full object-cover rounded-md shadow-lg"
              />
            </motion.div>
          </motion.div>,
        );
      }
    }
    return elements;
  }

  function renderHandContainer(): React.ReactElement {
    return (
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full min-h-0 min-w-0 border"
      >
        {renderHand()}
      </div>
    );
  }

  return { renderHandContainer };
}

export function useAnimationsOrchestrator(
  gameState: GameData,
  socket: Socket,
  actionContext: GameActionProps,
) {
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [hasFinishedInitialAnimation, setHasFinishedInitialAnimation] =
    useState<boolean>(false);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [isActionLocked, setIsActionLocked] = useState<boolean>(false);
  const [newStateReceived, setNewStateReceived] = useState<boolean>(false);

  const [animationPhase, setAnimationPhase] = useState<
    "idle" | "showcase" | "stacking"
  >("idle");

  const [drawCards, setDrawCards] = useState<boolean>(false);
  const [prevTopCard, setPrevTopCard] = useState<Card>(gameState.topCard);

  const { actionType, actionSocketId } = actionContext;

  useEffect(() => {
    function getEmptyHandPlayers(): GamePlayer[] {
      const pseudoPlayers: GamePlayer[] = structuredClone(
        gameState.playerOrder,
      );
      const tmpPlayers: GamePlayer[] = [];

      pseudoPlayers.forEach((player) => {
        if (player.socketId !== socket.id) {
          player.hand = [];
          tmpPlayers.push(player);
        }
      });
      pseudoPlayers.forEach((player) => {
        if (player.socketId === socket.id) {
          player.hand = [];
          tmpPlayers.push(player);
        }
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
      setNewStateReceived(true);

      const unlockActionTimer = setTimeout(() => {
        setIsActionLocked(false);
        setNewStateReceived(false);
      }, ms);

      return () => {
        clearTimeout(unlockActionTimer);
      };
    }
    function getPopppedHandPlayers(): GamePlayer[] {
      const pseudoPlayers: GamePlayer[] = structuredClone(
        gameState.playerOrder,
      );
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

    if (actionType === "create-game") {
      return handleActionLockAndUnlock(9000);
    }

    if (actionType === "played-cards") {
      setPlayers(gameState.playerOrder);
      handleActionLockAndUnlock(4000);

      setAnimationPhase("showcase");

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
      setPlayers(getPopppedHandPlayers());
      handleActionLockAndUnlock(2000);

      const disappearTimer = setTimeout(() => {
        setDrawCards(false);
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
    drawCards,
    prevTopCard,
    newStateReceived,
  };
}
