import { getCardImgPath } from "../../../../../../api/helper";
import type { Card, PlayHandProps } from "../../../../../../types/commonTypes";
import { socket } from "../../../../../../api/socket";
import ChooseColor from "../ChooseColor/ChooseColor";
import { useState } from "react";

export default function PlayHand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
  setPseudoHand,
}: PlayHandProps) {
  const [showChooseColor, setShowChooseColor] = useState<boolean>(false);
  const [showChooseColorActionCb, setShowChooseColorActionCb] =
    useState<CallableFunction | null>(null);

  function removeCardFromPlayHand(card: Card) {
    setPseudoPlayHand(
      pseudoPlayHand.filter((pseudoCard) => {
        return card.id !== pseudoCard.id;
      }),
    );
    setPseudoHand([...pseudoHand, card]);
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

  function uno() {
    const callback = (wildColor?: string) => {
      const cardIds: string[] = [];
      pseudoPlayHand.forEach((card) => {
        cardIds.push(card.id);
      });

      socket.emit("uno", {
        cardsToPlayIds: cardIds,
        wildColor: wildColor,
      });

      setShowChooseColor(false);
    };
    playCondition(callback);
  }

  return (
    <>
      <div>
        <div>
          {pseudoPlayHand.map((card) => {
            return (
              <img
                src={getCardImgPath(card)}
                onClick={() => {
                  removeCardFromPlayHand(card);
                }}
                alt={card.name}
              />
            );
          })}
        </div>
        <div>
          <button onClick={playCards}>PLAY CARDS</button>
          <button onClick={uno}>UNO (Play cards while yelling uno)</button>
        </div>
      </div>
      {showChooseColor && (
        <ChooseColor actionCallback={showChooseColorActionCb!} />
      )}
    </>
  );
}
