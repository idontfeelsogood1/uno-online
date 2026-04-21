import { useEffect, useRef, useState } from "react";
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
  hasInitialized,
}: HandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  function addCardToPlayHand(card: Card) {
    setPseudoPlayHand([...pseudoPlayHand, card]);
  }

  // SET WIDTH/HEIGHT OF CONTAINER THE MICROSECOND THE DIV APPEARS
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

    return () => {
      observer.disconnect();
    };
  }, []);

  function renderHand(): React.ReactElement[] {
    const htmlList: React.ReactElement[] = [];

    const actualCardHeight = Math.min(containerSize.height + 30, 256);
    const dynamicCardWidth = actualCardHeight * (2 / 3);

    // CALCULATE THE STEPS
    let step = 0;
    if (pseudoHand.length > 1 && containerSize.width > 0) {
      step = (containerSize.width - dynamicCardWidth) / (pseudoHand.length - 1);
      step = Math.min(step, dynamicCardWidth + 10);
      step = Math.max(step, 30);
    }

    // CENTERING THE CARDS
    const totalUsedWidth = dynamicCardWidth + (pseudoHand.length - 1) * step;
    const startOffset = (containerSize.width - totalUsedWidth) / 2;

    for (let i = 0; i < pseudoHand.length; i++) {
      const dealDelay = i * (!hasInitialized ? 1.2 : 0.05);

      // CALCULATE PIXEL POSITION
      const leftPosition = startOffset + i * step;

      htmlList.push(
        <motion.div
          key={pseudoHand[i].id}
          layoutId={pseudoHand[i].id}
          onClick={() => {
            addCardToPlayHand(pseudoHand[i]);
          }}
          className="absolute top-1/2 -translate-y-1/2 h-full max-h-64 aspect-2/3 cursor-pointer"
          style={{ zIndex: i, width: dynamicCardWidth }}
          whileHover={{ y: "-10%", zIndex: 100, scale: 1.1 }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1, left: leftPosition }}
          transition={{
            layout: {
              type: "spring",
              stiffness: 80,
              damping: 14,
              delay: dealDelay,
            },
            scale: { type: "tween", duration: 0.4, delay: dealDelay },
            left: { type: "spring", stiffness: 200, damping: 20 },
          }}
        >
          <motion.div
            className="w-full h-full absolute transform-3d"
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
              src={getCardImgPath(pseudoHand[i])}
              alt={pseudoHand[i].name}
              className="absolute inset-0 w-full h-full object-cover backface-hidden rounded-md shadow-lg"
            />

            {newStateReceived && (
              <img
                src={getCardCoverImgPath()}
                alt="Card cover"
                className="absolute inset-0 w-full h-full object-cover backface-hidden rotate-y-180 rounded-md shadow-lg"
              />
            )}
          </motion.div>
        </motion.div>,
      );
    }

    return htmlList;
  }

  return (
    <div className="flex-1">
      <div
        ref={containerRef}
        className="relative w-full h-full min-h-0 border p-1"
      >
        {renderHand()}
      </div>
    </div>
  );
}
