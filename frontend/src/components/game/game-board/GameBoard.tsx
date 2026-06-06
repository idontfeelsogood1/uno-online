import type { GameBoardProps } from "../../../types/commonTypes";
import {
  getCardImgPath,
  getCardCoverImgPath,
  useCardsAnimation,
} from "../../../api/helper";
import { GameAction } from "../../../api/GameAction";
import { useContext } from "react";
import { motion } from "motion/react";
import { GameModeSocket } from "../../../api/GameModeSocket";
import { GameInitialize } from "../../../api/GameInitialize";

export default function GameBoard({
  enforcedColor,
  gridPosition,
  gameState,
  hasInitialized,
  animationPhase,
  cardsToDraw,
  prevTopCard,
}: GameBoardProps) {
  const actionContext = useContext(GameAction);
  const initializeContext = useContext(GameInitialize);
  const { actionSocketId, isActionLocked, playedCards } = actionContext!;
  const { cardContainerRef, cardPhysics } = useCardsAnimation(
    gridPosition.position,
    gridPosition.index,
    playedCards ? playedCards : [],
    initializeContext!,
  );

  const socket = useContext(GameModeSocket)!;

  // THIS RENDERS THE HAND IN A CLOCKWISE ORDER
  function renderTempHand(): React.ReactElement {
    const elements: React.ReactElement[] = [];

    gameState.playerOrder.forEach((player) => {
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

    for (let i = 0; i < cardPhysics.length; i++) {
      const dealDelay = i * 0.25;
      elements.push(
        <motion.div
          key={cardPhysics[i].card.id}
          layoutId={cardPhysics[i].card.id}
          className="absolute shrink h-full max-h-64 aspect-2/3 z-20"
          style={{
            zIndex: cardPhysics[i].zIndex,
            left: cardPhysics[i].calculatedPosition,
          }}
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
            className="relative w-full h-full transform-3d"
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
              className="absolute inset-0 w-full h-full object-contain backface-hidden rounded-md shadow-md"
            />

            {actionSocketId !== socket.id! && (
              <img
                src={getCardCoverImgPath()}
                alt="Card cover"
                className="absolute inset-0 w-full h-full object-contain backface-hidden rotate-y-180 rounded-md shadow-md"
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
              className="absolute inset-0 w-full h-full object-contain backface-hidden rounded-md shadow-md"
            />
          </div>
        </motion.div>,
      );
    }
    return elements;
  }

  return (
    <div
      className={`${gridPosition.placement} relative flex flex-col justify-center items-center gap-2 p-1 text-center border w-full h-full min-h-0 min-w-0`}
    >
      <div className="flex flex-row justify-center items-center gap-2 w-full h-full min-h-0 min-w-0 shrink">
        {!hasInitialized ? (
          renderTempHand()
        ) : (
          <button
            onClick={() => socket.emit("draw-card")}
            className="relative h-full max-h-64 aspect-2/3 min-h-0 min-w-0 shrink"
            disabled={isActionLocked}
          >
            <img
              src={getCardCoverImgPath()}
              alt="Draw cards"
              className="absolute inset-0 w-full h-full object-contain rounded-md shadow-md"
            />
            {cardsToDraw &&
              cardsToDraw.length > 0 &&
              cardsToDraw.map((card, i) => {
                return (
                  <motion.div
                    key={card.id}
                    layoutId={card.id}
                    className="absolute inset-0 w-full h-full shadow-sm"
                    style={{ zIndex: i }}
                  >
                    <div className="w-full h-full relative transform-3d rotate-y-180">
                      <img
                        src={getCardCoverImgPath()}
                        alt="Card cover"
                        className="absolute inset-0 w-full h-full object-contain backface-hidden rounded-md"
                      />
                    </div>
                  </motion.div>
                );
              })}
          </button>
        )}

        {/* Stacking */}
        <div className="relative h-full max-h-64 aspect-2/3 min-h-0 min-w-0 shrink">
          <img
            src={getCardImgPath(prevTopCard!)}
            alt={prevTopCard!.color + " " + prevTopCard!.value}
            className="absolute inset-0 w-full h-full object-contain rounded-md shadow-md"
          />
          {animationPhase === "stacking" && renderStacking()}
        </div>
      </div>

      <div className="flex flex-row justify-center items-center gap-2 w-full shrink-0 text-xs sm:text-sm font-semibold">
        <div className="border px-2 py-1 rounded bg-white/50 truncate">
          {prevTopCard.color === "BLACK"
            ? `Choosen color: ${enforcedColor}`
            : "No choosen color"}
        </div>
        <div className="border px-2 py-1 rounded bg-white/50 truncate">
          {prevTopCard!.color}
        </div>
      </div>

      {/* Showcase */}
      <div
        ref={cardContainerRef}
        className={`absolute inset-0 pointer-events-none z-50 p-2`}
      >
        {animationPhase === "showcase" && renderShowcase()}
      </div>
    </div>
  );
}
