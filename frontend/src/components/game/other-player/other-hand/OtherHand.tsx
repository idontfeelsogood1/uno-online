import type { OtherHandProps } from "../../../../types/commonTypes";
import { getCardCoverImgPath, useCardsAnimation } from "../../../../api/helper";
import { useContext } from "react";
import { GameInitialize } from "../../../../api/GameInitialize";
// import { GameAction } from "../../../../api/GameAction";
import { motion } from "motion/react";
import { IsMobileView } from "../../../../api/IsMobileView";

export default function OtherHand({
  otherHand,
  position,
  gridPositionIndex,
}: OtherHandProps) {
  const initializeContext = useContext(GameInitialize);
  const isMobileView = useContext(IsMobileView);
  // const actionContext = useContext(GameAction);
  const {
    cardContainerRef,
    cardPhysics,
    updateStyleOnInitialAnimationComplete,
  } = useCardsAnimation(
    position,
    gridPositionIndex,
    otherHand,
    initializeContext!,
  );

  function renderHandContainer(): React.ReactElement {
    const cardElements: React.ReactElement[] = [];
    const isHorizontal = position === "top" || position === "bottom";

    cardPhysics.forEach((cardStyle) => {
      cardElements.push(
        <motion.div
          key={cardStyle.card.id}
          layoutId={cardStyle.card.id}
          className={`absolute ${
            isHorizontal
              ? "top-1/2 -translate-y-1/2"
              : "left-1/2 -translate-x-1/2"
          } shadow-md rounded-md backface-hidden z-10`}
          style={{
            zIndex: cardStyle.zIndex,
            width: cardStyle.width,
            height: cardStyle.height,
            left:
              initializeContext!.hasFinishedInitialAnimation || !isMobileView
                ? isHorizontal
                  ? cardStyle.calculatedPosition
                  : "50%"
                : "-10%",
            top:
              initializeContext!.hasFinishedInitialAnimation || !isMobileView
                ? !isHorizontal
                  ? cardStyle.calculatedPosition
                  : "50%"
                : "",
            pointerEvents: "none",
          }}
          onAnimationComplete={() => {
            updateStyleOnInitialAnimationComplete(cardStyle.card.id);
          }}
          initial={{ scale: 0.8 }}
          animate={{
            scale: 1,
          }}
          transition={{
            layout: {
              type: "spring",
              stiffness: 80,
              damping: 14,
              delay: cardStyle.dealDelay,
            },
            scale: { type: "tween", duration: 0.6, delay: cardStyle.dealDelay },
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
              delay: cardStyle.dealDelay,
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
