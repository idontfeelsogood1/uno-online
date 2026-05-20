import type { GameBoardProps } from "../../../types/commonTypes";
import { getCardImgPath, getCardCoverImgPath } from "../../../api/helper";
import { GameAction } from "../../../api/GameAction";
import { useContext } from "react";
import { motion } from "motion/react";
import { GameModeSocket } from "../../../api/GameModeSocket";

export default function GameBoard({
  enforcedColor,
  gridPosition,
  gameState,
  hasInitialized,
  animationPhase,
  drawCards,
  prevTopCard,
}: GameBoardProps) {
  const actionContext = useContext(GameAction);
  const {
    actionSocketId,
    isActionLocked,
    playedCards,
    cardDrew,
    // unoPenalty,
  } = actionContext!;

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
        {prevTopCard.color === "BLACK" ? enforcedColor : "No enforced color"}
      </div>

      {animationPhase === "showcase" && (
        <div className="absolute inset-0 flex justify-center items-center -space-x-2 pointer-events-none z-50 border">
          {renderShowcase()}
        </div>
      )}
    </div>
  );
}
