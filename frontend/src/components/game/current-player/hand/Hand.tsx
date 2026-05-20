import { useContext } from "react";
import { useCardsAnimation } from "../../../../api/helper";
import type { Card, HandProps } from "../../../../types/commonTypes";
import { GameInitialize } from "../../../../api/GameInitialize";
import { GameAction } from "../../../../api/GameAction";

export default function Hand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
  gridPositionIndex,
}: HandProps) {
  const initializeContext = useContext(GameInitialize);
  const action = useContext(GameAction);
  const { renderHandContainer } = useCardsAnimation(
    "bottom",
    gridPositionIndex,
    pseudoHand,
    initializeContext!,
    action!,
    addCardToPlayHand,
    true,
  );

  function addCardToPlayHand(card: Card) {
    setPseudoPlayHand([...pseudoPlayHand, card]);
  }

  return <div className="flex-1">{renderHandContainer()}</div>;
}
