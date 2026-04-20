import {
  getCardCoverImgPath,
  getCardImgPath,
} from "../../../../../../api/helper";
import type { Card, HandProps } from "../../../../../../types/commonTypes";
import { motion } from "motion/react";

export default function Hand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
  newStateReceived,
}: HandProps) {
  function addCardToPlayHand(card: Card) {
    setPseudoPlayHand([...pseudoPlayHand, card]);
  }

  function renderHand(): React.ReactElement[] {
    const htmlList: React.ReactElement[] = [];

    for (let i = 0; i < pseudoHand.length; i++) {
      const dealDelay = i * 0.05;

      htmlList.push(
        <motion.div
          key={pseudoHand[i].id}
          layoutId={pseudoHand[i].id}
          onClick={() => {
            addCardToPlayHand(pseudoHand[i]);
          }}
          className="shrink h-full max-h-64 aspect-2/3 cursor-pointer z-10"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            layout: {
              type: "spring",
              stiffness: 80,
              damping: 14,
              delay: dealDelay,
            },
            scale: {
              type: "tween",
              duration: 0.6,
              delay: dealDelay,
            },
          }}
        >
          {/* FIGURE OUT THE CONDITION TO MAKE THE ANIMATION CONSISTENT */}
          <motion.div
            className="w-full h-full relative transform-3d"
            initial={{
              rotateY: newStateReceived ? 180 : 0,
            }}
            animate={{ rotateY: 0 }}
            transition={{
              type: "tween",
              duration: 0.6,
              ease: "easeInOut",
              delay: dealDelay,
            }}
          >
            <img
              src={getCardImgPath(pseudoHand[i])}
              alt={pseudoHand[i].name}
              className="absolute inset-0 w-full h-full object-cover backface-hidden rounded-md shadow-md"
            />

            {newStateReceived && (
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

    return htmlList;
  }

  return (
    <div className="@container flex flex-1 border p-1 justify-center min-h-34 min-w-0">
      {/* FIGURE OUT NEGATIVE SPACING BREAKPOINT FOR EACH SCREEN DIMENSIONS */}
      <div
        className="flex justify-center items-center p-1 border grow min-h-0 
        -space-x-2"
      >
        {renderHand()}
      </div>
    </div>
  );
}
