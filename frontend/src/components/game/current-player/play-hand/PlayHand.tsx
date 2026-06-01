import {
  getCardCoverImgPath,
  getCardImgPath,
  useCardsAnimation,
} from "../../../../api/helper";
import type { Card, PlayHandProps } from "../../../../types/commonTypes";
import ChooseColor from "../choose-color/ChooseColor";
import { useContext, useState } from "react";
import { GameAction } from "../../../../api/GameAction";
import { GameModeSocket } from "../../../../api/GameModeSocket";
import { GameInitialize } from "../../../../api/GameInitialize";
import { motion } from "motion/react";

export default function PlayHand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
}: PlayHandProps) {
  const actionContext = useContext(GameAction);
  const [showChooseColor, setShowChooseColor] = useState<boolean>(false);
  const [showChooseColorActionCb, setShowChooseColorActionCb] =
    useState<CallableFunction | null>(null);

  const [canUno, setCanUno] = useState<boolean>(false);

  const socket = useContext(GameModeSocket)!;
  const initializeContext = useContext(GameInitialize);

  const { cardContainerRef, cardPhysics } = useCardsAnimation(
    "bottom",
    0,
    pseudoPlayHand,
    initializeContext!,
  );

  function removeCardFromPlayHand(card: Card) {
    setPseudoPlayHand(
      pseudoPlayHand.filter((pseudoCard) => {
        return card.id !== pseudoCard.id;
      }),
    );
    setCanUno(false);
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
        uno: canUno,
      });

      setPseudoPlayHand([]);
      setCanUno(false);
      setShowChooseColor(false);
    };
    playCondition(callback);
  }

  function uno() {
    if (pseudoHand.length <= 1) {
      setCanUno(true);
    }
  }

  function renderHandContainer(): React.ReactElement {
    const cardElements: React.ReactElement[] = [];

    cardPhysics.forEach((cardStyle) => {
      cardElements.push(
        <motion.div
          key={cardStyle.card.id}
          layoutId={cardStyle.card.id}
          onClick={() => {
            removeCardFromPlayHand(cardStyle.card);
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

  return (
    <>
      <div className="border p-1 flex flex-1 justify-center">
        <div className="grow flex flex-col min-h-0">
          {renderHandContainer()}
          <div className="flex justify-center border p-1 gap-1 shrink-0">
            <button
              onClick={playCards}
              className="border"
              disabled={actionContext!.isActionLocked}
            >
              PLAY CARDS
            </button>
            <button
              className={`border ${canUno ? "opacity-50" : "opacity-100"}`}
              onClick={uno}
              disabled={canUno || actionContext!.isActionLocked}
            >
              UNO
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
