import type {
  Card,
  GameBoardProps,
  GamePlayer,
} from "../../../types/commonTypes";
import { getCardImgPath, getCardCoverImgPath } from "../../../api/helper";
import { GameAction } from "../../../api/GameAction";
import { useContext, useEffect, useState } from "react";
import { motion } from "motion/react";
import { GameModeSocket } from "../../../api/GameModeSocket";

export default function GameBoard({
  topCard,
  enforcedColor,
  gridPosition,
  gameState,
  setPlayers,
  hasInitialized,
  setHasInitialized,
  setHasFinishedInitialAnimation,
}: GameBoardProps) {
  const actionContext = useContext(GameAction);
  const {
    actionType,
    actionSocketId,
    isActionLocked,
    playedCards,
    cardDrew,
    // unoPenalty,
  } = actionContext!;

  const [animationPhase, setAnimationPhase] = useState<
    "idle" | "showcase" | "stacking"
  >("idle");

  const [drawCards, setDrawCards] = useState<boolean>(false);
  const [prevTopCard, setPrevTopCard] = useState<Card>(topCard);

  const socket = useContext(GameModeSocket)!;

  useEffect(() => {
    if (
      actionType === "played-cards" &&
      playedCards &&
      playedCards.length > 0
    ) {
      setAnimationPhase("showcase");

      const stackTimer = setTimeout(() => {
        setAnimationPhase("stacking");
      }, 2000);

      const cleanupTimer = setTimeout(() => {
        setPrevTopCard(topCard);
        setAnimationPhase("idle");
      }, 3000);

      return () => {
        clearTimeout(stackTimer);
        clearTimeout(cleanupTimer);
      };
    }

    if (actionType === "draw-cards") {
      setDrawCards(true);

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

  useEffect(() => {
    function setCardsForPlayers(): void {
      setTimeout(() => {
        setPlayers(gameState.playerOrder);
        setHasInitialized(true);
      }, 50); // WAIT FOR DOM TO LOAD AND ResizeObservers TO SET THE NECCESSARY DATA FOR STYLE
      setTimeout(() => {
        setHasFinishedInitialAnimation(true);
      }, 9000);
    }
    setCardsForPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // THIS RENDERS THE HAND IN A CLOCKWISE ORDER
  function renderTempHand(): React.ReactElement {
    const elements: React.ReactElement[] = [];
    const players: GamePlayer[] = gameState.playerOrder;
    // const clockwiseHand: Card[] = [];

    // const cardEndLength = players[0].hand.length; // Number of cards in each hand
    // let cardIndex: number = 0;
    // let playerIndex: number = 0;

    // while (cardIndex < cardEndLength) {
    //   while ((playerIndex + 1) % players.length !== 0) {
    //     clockwiseHand.push(players[playerIndex].hand[cardIndex]);
    //     playerIndex = (playerIndex + 1) % players.length;
    //   }
    //   clockwiseHand.push(players[playerIndex].hand[cardIndex]);
    //   cardIndex++;
    //   playerIndex = 0;
    // }
    players.forEach((player) => {
      player.hand.forEach((card) => {
        elements.push(
          <motion.div
            key={card.id}
            layoutId={card.id}
            className="absolute inset-0 w-full h-full shadow-sm"
          >
            <div className="w-full h-full relative transform-3d rotate-y-180">
              <img
                src={getCardCoverImgPath()}
                alt="Card cover"
                className="absolute inset-0 w-full h-full object-cover backface-hidden rounded-md"
              />
            </div>
          </motion.div>,
        );
      });
    });

    return (
      <div className="relative shrink h-full max-h-64 aspect-2/3">
        {elements}
      </div>
    );
  }

  function renderShowcase(): React.ReactElement[] {
    const elements: React.ReactElement[] = [];

    for (let i = 0; i < playedCards!.length; i++) {
      const dealDelay = i * 0.25;
      elements.push(
        <motion.div
          key={playedCards![i].id}
          layoutId={playedCards![i].id}
          className="shrink h-full max-h-64 aspect-2/3 z-20"
          style={{ zIndex: i }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1.2 }}
          transition={{
            layout: {
              type: "spring",
              stiffness: 80,
              damping: 14,
              delay: dealDelay,
            },
            scale: { type: "tween", duration: 0.6, delay: dealDelay },
          }}
        >
          <motion.div
            className="w-full h-full relative transform-3d"
            initial={{ rotateY: actionSocketId !== socket.id! ? 180 : 0 }}
            animate={{ rotateY: 0 }}
            transition={{
              type: "tween",
              duration: 0.6,
              ease: "easeInOut",
              delay: dealDelay,
            }}
          >
            <img
              src={getCardImgPath(playedCards![i])}
              alt={playedCards![i].name}
              className="absolute inset-0 w-full h-full object-cover backface-hidden rounded-md shadow-md"
            />

            {actionSocketId !== socket.id! && (
              <img
                src={getCardCoverImgPath()}
                alt="Card cover"
                className="absolute inset-0 w-full h-full object-cover backface-hidden rotate-y-180 rounded-md shadow-md"
              />
            )}
          </motion.div>
        </motion.div>,
      );
    }
    return elements;
  }

  function renderStacking(): React.ReactElement[] {
    const elements: React.ReactElement[] = [];

    for (let i = 0; i < playedCards!.length; i++) {
      elements.push(
        <motion.div
          key={playedCards![i].id}
          layoutId={playedCards![i].id}
          className="absolute inset-0 w-full h-full z-10"
          style={{ zIndex: i }}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{
            layout: { type: "spring", stiffness: 100, damping: 15 },
            scale: { type: "tween", duration: 0.4 },
          }}
        >
          <div className="w-full h-full relative transform-3d">
            <img
              src={getCardImgPath(playedCards![i])}
              alt={playedCards![i].name}
              className="absolute inset-0 w-full h-full object-cover backface-hidden rounded-md shadow-md"
            />
          </div>
        </motion.div>,
      );
    }
    return elements;
  }

  return (
    <div
      className={`${gridPosition.placement} relative flex justify-center items-center gap-1 p-1 text-center border`}
    >
      {!hasInitialized ? (
        renderTempHand()
      ) : (
        <button
          onClick={() => socket.emit("draw-card")}
          className="relative h-full shrink-0"
          disabled={isActionLocked}
        >
          <img
            src={getCardCoverImgPath()}
            alt="Draw cards"
            className="w-full h-full max-h-64 aspect-2/3 object-cover rounded-md shadow-md"
          />
          {drawCards && (
            <motion.div
              key={cardDrew!.id}
              layoutId={cardDrew!.id}
              className="absolute inset-0 w-full h-full shadow-sm"
            >
              <div className="w-full h-full relative transform-3d rotate-y-180">
                <img
                  src={getCardCoverImgPath()}
                  alt="Card cover"
                  className="absolute inset-0 w-full h-full object-cover backface-hidden rounded-md"
                />
              </div>
            </motion.div>
          )}
        </button>
      )}

      <div className="relative shrink h-full max-h-64 aspect-2/3">
        <img
          src={getCardImgPath(prevTopCard!)}
          alt={prevTopCard!.color + " " + prevTopCard!.value}
          className="absolute inset-0 w-full h-full object-cover rounded-md shadow-md"
        />
        {animationPhase === "stacking" && renderStacking()}
      </div>

      <div className="border">{prevTopCard!.color}</div>

      <div className="border">
        {topCard.color === "BLACK" ? enforcedColor : "No enforced color"}
      </div>

      {animationPhase === "showcase" && (
        <div className="absolute inset-0 flex justify-center items-center -space-x-2 pointer-events-none z-50 border">
          {renderShowcase()}
        </div>
      )}
    </div>
  );
}
