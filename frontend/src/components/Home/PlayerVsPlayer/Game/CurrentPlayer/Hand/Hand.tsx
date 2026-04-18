import {
  getCardCoverImgPath,
  getCardImgPath,
} from "../../../../../../api/helper";
import type {
  Card,
  GameActionProps,
  GameStateActionType,
  HandProps,
  PageProps,
} from "../../../../../../types/commonTypes";
import { useContext, useEffect, useState } from "react";
import { motion } from "motion/react";
import { GameAction } from "../../../../../../api/GameAction";

export default function Hand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
  hasInitialized,
}: HandProps) {
  const action: GameActionProps = useContext(GameAction)!;
  const actionType: GameStateActionType = action.actionType;
  const [hasEditCard, setHasEditCard] = useState<boolean>(false);
  const [page, setPage] = useState<PageProps>({
    startIndex: 0,
    endIndex: 6,
    currentPage: 1,
  });

  useEffect(() => {
    onHandChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pseudoHand]);

  function onHandChange() {
    const pseudoHandEndIndex: number = pseudoHand.length - 1;

    if (pseudoHandEndIndex - page.startIndex <= -1) {
      switchPage("left");
    }
    if (pseudoHandEndIndex - page.startIndex >= 7 && !hasEditCard) {
      switchPage("right");
    }

    setHasEditCard(false);
  }

  function switchPage(direction: "left" | "right") {
    let start: number = page.startIndex;
    let end: number = page.endIndex;
    const offset: number = page.endIndex - (pseudoHand.length - 1);
    let currentPage: number = page.currentPage;

    if (direction === "left" && start > 0) {
      end = start - 1;
      start = end - 6;
      currentPage--;
    }

    if (direction === "right" && offset < 0) {
      start = end + 1;
      end = start + 6;
      currentPage++;
    }

    setPage({
      startIndex: start,
      endIndex: end,
      currentPage: currentPage,
    });
  }

  function addCardToPlayHand(card: Card) {
    setPseudoPlayHand([...pseudoPlayHand, card]);
    setHasEditCard(true);
  }

  function renderHand(): React.ReactElement[] {
    const htmlList: React.ReactElement[] = [];
    let pseudoHandOffset: number = page.endIndex - (pseudoHand.length - 1);

    if (pseudoHandOffset <= -1) pseudoHandOffset = 0;

    for (let i = page.startIndex; i <= page.endIndex - pseudoHandOffset; i++) {
      const staggerIndex = i - page.startIndex;
      const dealDelay = staggerIndex * 0.05;

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
              rotateY: !hasInitialized || actionType === "draw-cards" ? 180 : 0,
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

            {(!hasInitialized || actionType === "draw-cards") && (
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
      <button onClick={() => switchPage("left")} className="border shrink-0">
        PREV
      </button>
      {/* FIGURE OUT NEGATIVE SPACING BREAKPOINT FOR EACH SCREEN DIMENSIONS */}
      <div
        className="flex justify-center items-center p-1 border grow min-h-0 
        -space-x-2"
      >
        {renderHand()}
      </div>
      <button onClick={() => switchPage("right")} className="border shrink-0">
        NEXT
      </button>
    </div>
  );
}
