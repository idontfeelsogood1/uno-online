import { getCardImgPath } from "../../../../../api/helper";
import type { Card, PlayHandProps } from "../../../../../types/commonTypes";
import ChooseColor from "../ChooseColor/ChooseColor";
import { useContext, useEffect, useState, useRef } from "react";
import { GameAction } from "../../../../../api/GameAction";
import { motion } from "motion/react";
import { GameModeSocket } from "../../../../../api/GameModeSocket";

export default function PlayHand({
  pseudoPlayHand,
  setPseudoPlayHand,
  setNewStateReceived,
}: PlayHandProps) {
  const action = useContext(GameAction);
  const [showChooseColor, setShowChooseColor] = useState<boolean>(false);
  const [showChooseColorActionCb, setShowChooseColorActionCb] =
    useState<CallableFunction | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const socket = useContext(GameModeSocket)!;

  useEffect(() => {
    if (
      action!.actionType === "played-cards" &&
      socket.id === action!.actionSocketId
    ) {
      setPseudoPlayHand([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

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

    const actualCardHeight = Math.min(containerSize.height + 15, 256);
    const dynamicCardWidth = actualCardHeight * (2 / 3);

    // CALCULATE THE STEPS
    let step = 0;
    if (pseudoPlayHand.length > 1 && containerSize.width > 0) {
      step =
        (containerSize.width - dynamicCardWidth) / (pseudoPlayHand.length - 1);
      step = Math.min(step, dynamicCardWidth + 10);
      step = Math.max(step, 30);
    }

    // CENTERING THE CARDS
    const totalUsedWidth =
      dynamicCardWidth + (pseudoPlayHand.length - 1) * step;
    const startOffset = (containerSize.width - totalUsedWidth) / 2;

    for (let i = 0; i < pseudoPlayHand.length; i++) {
      const dealDelay = i * 0.05;

      // CALCULATE PIXEL POSITION
      const leftPosition = startOffset + i * step;

      htmlList.push(
        <motion.div
          key={pseudoPlayHand[i].id}
          layoutId={pseudoPlayHand[i].id}
          onClick={() => {
            removeCardFromPlayHand(pseudoPlayHand[i]);
          }}
          className="absolute top-1/2 -translate-y-1/2 h-full max-h-64 aspect-2/3 cursor-pointer shadow-lg"
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
            scale: { type: "tween", duration: 0.6, delay: dealDelay },
            left: { type: "spring", stiffness: 200, damping: 20 },
          }}
        >
          <motion.div
            className="absolute w-full h-full transform-3d"
            transition={{
              type: "tween",
              duration: 0.6,
              ease: "easeInOut",
              delay: dealDelay,
            }}
          >
            <img
              src={getCardImgPath(pseudoPlayHand[i])}
              alt={pseudoPlayHand[i].name}
              className="absolute inset-0 w-full h-full object-cover backface-hidden rounded-md shadow-md"
            />
          </motion.div>
        </motion.div>,
      );
    }
    return htmlList;
  }

  function removeCardFromPlayHand(card: Card) {
    setPseudoPlayHand(
      pseudoPlayHand.filter((pseudoCard) => {
        return card.id !== pseudoCard.id;
      }),
    );
    setNewStateReceived(false);
  }

  function playCondition(action: CallableFunction) {
    if (
      pseudoPlayHand[pseudoPlayHand.length - 1].value === "WILD" ||
      pseudoPlayHand[pseudoPlayHand.length - 1].value === "+4"
    ) {
      setShowChooseColor(true);
      setShowChooseColorActionCb(() => action);
    } else {
      action();
    }
  }

  function playCards() {
    const callback = (wildColor?: string) => {
      const cardIds: string[] = [];
      pseudoPlayHand.forEach((card) => {
        cardIds.push(card.id);
      });

      socket.emit("play-cards", {
        cardsToPlayIds: cardIds,
        wildColor: wildColor,
      });

      setShowChooseColor(false);
    };
    playCondition(callback);
  }

  // function uno() {
  //   const callback = (wildColor?: string) => {
  //     const cardIds: string[] = [];
  //     pseudoPlayHand.forEach((card) => {
  //       cardIds.push(card.id);
  //     });

  //     socket.emit("uno", {
  //       cardsToPlayIds: cardIds,
  //       wildColor: wildColor,
  //     });

  //     setShowChooseColor(false);
  //   };
  //   playCondition(callback);
  // }

  return (
    <>
      <div className="border p-1 flex flex-1 justify-center">
        <div className="grow flex flex-col min-h-0">
          <div ref={containerRef} className="relative w-full border h-full">
            {renderHand()}
          </div>
          <div className="flex justify-center border p-1 gap-1 shrink-0">
            <button onClick={playCards} className="border">
              PLAY CARDS
            </button>
            <button className="border">
              UNO (Currently disabled for tweaking)
            </button>
          </div>
        </div>
      </div>
      {showChooseColor && (
        <ChooseColor actionCallback={showChooseColorActionCb!} />
      )}
    </>
  );
}
