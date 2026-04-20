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
}: HandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const CARD_WIDTH = 170;

  function addCardToPlayHand(card: Card) {
    setPseudoPlayHand([...pseudoPlayHand, card]);
  }

  // SET THE WIDTH THE MICROSECOND THE DOM LOADS
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  function renderHand(): React.ReactElement[] {
    const htmlList: React.ReactElement[] = [];

    // CALCULATE THE STEPS
    let step = 0;
    if (pseudoHand.length > 1 && containerWidth > 0) {
      step = (containerWidth - CARD_WIDTH) / (pseudoHand.length - 1);
      step = Math.min(step, CARD_WIDTH + 10);
      step = Math.max(step, 30);
    }

    // CENTERING THE CARDS
    const totalUsedWidth = CARD_WIDTH + (pseudoHand.length - 1) * step;
    const startOffset = (containerWidth - totalUsedWidth) / 2;

    for (let i = 0; i < pseudoHand.length; i++) {
      const dealDelay = i * 0.05;

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
          style={{ zIndex: i, width: CARD_WIDTH }}
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
            scale: { type: "tween", duration: 0.6, delay: dealDelay },
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
    <div>
      <div
        ref={containerRef}
        className="@container relative w-full border p-1 min-h-64"
      >
        {renderHand()}
      </div>
    </div>
  );
}
