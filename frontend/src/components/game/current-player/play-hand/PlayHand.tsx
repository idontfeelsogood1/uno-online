import { useCardsAnimation } from "../../../../api/helper";
import type { Card, PlayHandProps } from "../../../../types/commonTypes";
import ChooseColor from "../choose-color/ChooseColor";
import { useContext, useState } from "react";
import { GameAction } from "../../../../api/GameAction";
import { GameModeSocket } from "../../../../api/GameModeSocket";
import { GameInitialize } from "../../../../api/GameInitialize";

export default function PlayHand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
}: PlayHandProps) {
  const action = useContext(GameAction);
  const [showChooseColor, setShowChooseColor] = useState<boolean>(false);
  const [showChooseColorActionCb, setShowChooseColorActionCb] =
    useState<CallableFunction | null>(null);

  const [canUno, setCanUno] = useState<boolean>(false);

  const socket = useContext(GameModeSocket)!;
  const initializeContext = useContext(GameInitialize);

  const { renderHandContainer } = useCardsAnimation(
    "bottom",
    0,
    pseudoPlayHand,
    initializeContext!,
    action!.newStateReceived,
    removeCardFromPlayHand,
    true,
  );

  function removeCardFromPlayHand(card: Card) {
    setPseudoPlayHand(
      pseudoPlayHand.filter((pseudoCard) => {
        return card.id !== pseudoCard.id;
      }),
    );
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
      setShowChooseColor(false);
    };
    playCondition(callback);
  }

  function uno() {
    if (pseudoHand.length <= 1) {
      setCanUno(true);
    }
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
              disabled={action!.isActionLocked}
            >
              PLAY CARDS
            </button>
            <button
              className={`border ${canUno ? "opacity-50" : "opacity-100"}`}
              onClick={uno}
              disabled={canUno || action!.isActionLocked}
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
