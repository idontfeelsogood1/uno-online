import type { OtherHandProps } from "../../../../types/commonTypes";
import { getCardCoverImgPath } from "../../../../api/helper";
import { motion } from "motion/react";
import { useContext, useEffect, useRef, useState } from "react";
import { GameInitialize } from "../../../../api/GameInitialize";

export default function OtherHand({
  otherHand,
  position,
  gridPositionIndex,
}: OtherHandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [landedCardIds, setLandedCardIds] = useState<string[]>([]);

  const initializeContext = useContext(GameInitialize);

  // Measure the container instantly
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
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  function renderHand(): React.ReactElement[] {
    const isHorizontal = position === "top";
    const elements: React.ReactElement[] = [];

    //  DYNAMIC DIMENSIONS
    let cardWidth = 0;
    let cardHeight = 0;

    if (isHorizontal) {
      cardHeight = Math.min(containerSize.height - 10, 160);
      cardWidth = cardHeight * (2 / 3);
    } else {
      cardWidth = Math.min(containerSize.width - 10, 110);
      cardHeight = cardWidth * (3 / 2);
    }

    // DYNAMIC SPACING MATH
    let step = 0;
    if (otherHand.length > 1) {
      if (isHorizontal && containerSize.width > 0) {
        step = (containerSize.width - cardWidth) / (otherHand.length - 1);
        step = Math.min(step, cardWidth * 0.8);
        step = Math.max(step, 10);
      } else if (!isHorizontal && containerSize.height > 0) {
        step = (containerSize.height - cardHeight) / (otherHand.length - 1);
        step = Math.min(step, cardHeight * 0.8);
        step = Math.max(step, 10);
      }
    }

    // CENTERING OFFSETS
    let startOffset = 0;
    if (isHorizontal) {
      const totalUsedWidth = cardWidth + (otherHand.length - 1) * step;
      startOffset = (containerSize.width - totalUsedWidth) / 2;
    } else {
      const totalUsedHeight = cardHeight + (otherHand.length - 1) * step;
      startOffset = (containerSize.height - totalUsedHeight) / 2;
    }

    for (let i = 0; i < otherHand.length; i++) {
      const dealDelay = initializeContext!.hasFinishedInitialAnimation
        ? 0.15
        : (i * initializeContext!.playersSize + gridPositionIndex) * 0.25; // THE NUMBER 4 IS THE LENGTH OF THE PLAYERS, INDEX MIGHT NEED SHIFTING LATER

      const calculatedPosition = startOffset + i * step;

      // CALCULATE Z INDEX FOR INITIAL ANIMATION (GLOBAL ROUND ROBIN)
      const totalCardsInDeck =
        otherHand.length * initializeContext!.playersSize;
      const globalDeckIndex =
        i * initializeContext!.playersSize + gridPositionIndex;

      const flightZIndex = totalCardsInDeck - globalDeckIndex;

      const isLanded =
        landedCardIds.includes(otherHand[i].id) ||
        initializeContext!.hasFinishedInitialAnimation;

      const currentZIndex = isLanded ? i : flightZIndex;

      elements.push(
        <motion.div
          key={otherHand[i].id}
          layoutId={otherHand[i].id}
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
          }}
          onAnimationComplete={() => {
            if (!landedCardIds.includes(otherHand[i].id)) {
              setLandedCardIds([...landedCardIds, otherHand[i].id]);
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
          <img
            src={getCardCoverImgPath()}
            alt="Card cover"
            className="absolute inset-0 w-full h-full rounded-md shadow-lg object-cover"
          />
        </motion.div>,
      );
    }
    return elements;
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full min-h-0 min-w-0"
    >
      {renderHand()}
    </div>
  );
}
