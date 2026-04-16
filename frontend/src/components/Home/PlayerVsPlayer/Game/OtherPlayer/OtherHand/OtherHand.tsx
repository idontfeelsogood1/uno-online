import type { OtherHandProps } from "../../../../../../types/commonTypes";
import { getCardCoverImgPath } from "../../../../../../api/helper";
import { motion } from "motion/react";

export default function OtherHand({ otherHand, rotation }: OtherHandProps) {
  function renderHand(): React.ReactElement {
    const img: React.ReactElement[] = [];
    for (let i = 0; i < otherHand.length; i++) {
      const dealDelay = i * 0.05;

      if (otherHand[i] !== undefined) {
        img.push(
          <motion.div
            key={otherHand[i].id}
            layoutId={otherHand[i].id}
            className="relative shrink w-full h-full max-h-46 backface-hidden aspect-2/3 z-10"
            initial={{ scale: 1 }}
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
            <img
              src={getCardCoverImgPath()}
              alt="Card cover"
              className="absolute h-full rounded-md shadow-md"
            />
          </motion.div>,
        );
      }
    }
    return (
      <div
        className={`relative flex ${rotation} justify-center items-center border`}
      >
        {img}
      </div>
    );
  }

  return <>{renderHand()}</>;
}
