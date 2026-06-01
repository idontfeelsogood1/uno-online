import { useContext } from "react";
import {
  getCardCoverImgPath,
  getCardImgPath,
  useCardsAnimation,
} from "../../../../api/helper";
import type { Card, HandProps } from "../../../../types/commonTypes";
import { GameInitialize } from "../../../../api/GameInitialize";
import { GameAction } from "../../../../api/GameAction";
import { motion } from "motion/react";

export default function Hand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
  gridPositionIndex,
}: HandProps) {
  const initializeContext = useContext(GameInitialize);
  const actionContext = useContext(GameAction);
  const {
    cardContainerRef,
    cardPhysics,
    updateStyleOnInitialAnimationComplete,
  } = useCardsAnimation(
    "bottom",
    gridPositionIndex,
    pseudoHand,
    initializeContext!,
  );

  function addCardToPlayHand(card: Card) {
    setPseudoPlayHand([...pseudoPlayHand, card]);
  }

  function renderHandContainer(): React.ReactElement {
    const cardElements: React.ReactElement[] = [];

    cardPhysics.forEach((cardStyle) => {
      cardElements.push(
        <motion.div
          key={cardStyle.card.id}
          layoutId={cardStyle.card.id}
          onClick={() => {
            addCardToPlayHand(cardStyle.card);
          }}
          className="absolute top-1/2 -translate-y-1/2 h-full max-h-64 aspect-2/3 cursor-pointer shadow-lg"
          style={{
            zIndex: cardStyle.zIndex,
            width: cardStyle.width + 10,
            left: cardStyle.calculatedPosition,
            pointerEvents:
              !initializeContext!.hasFinishedInitialAnimation ||
              actionContext!.isActionLocked
                ? "none"
                : "auto",
          }}
          whileHover={{ y: "-10%", zIndex: 100, scale: 1.1 }}
          onAnimationComplete={() => {
            updateStyleOnInitialAnimationComplete(cardStyle.card.id);
          }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            layout: {
              type: "spring",
              stiffness: 80,
              damping: 14,
              delay: cardStyle.dealDelay,
            },
            scale: { type: "tween", duration: 0.6, delay: cardStyle.dealDelay },
            left: { type: "spring", stiffness: 200, damping: 20 },
          }}
        >
          <motion.div
            className="absolute w-full h-full transform-3d"
            initial={{ rotateY: actionContext!.isActionLocked ? 180 : 0 }}
            animate={{ rotateY: 0 }}
            transition={{
              type: "tween",
              duration: 0.6,
              ease: "easeInOut",
              delay: cardStyle.dealDelay,
            }}
          >
            <img
              src={getCardImgPath(cardStyle.card)}
              alt={cardStyle.card.name}
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
    });

    return (
      <div
        ref={cardContainerRef}
        className="relative flex-1 w-full h-full min-h-0 min-w-0 border"
      >
        {cardElements}
      </div>
    );
  }

  return <div className="flex-1">{renderHandContainer()}</div>;
}
