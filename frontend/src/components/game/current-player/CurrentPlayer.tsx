import { useContext, useState } from "react";
import type { Card, CurrentPlayerProps } from "../../../types/commonTypes";
import Hand from "./hand/Hand";
import PlayHand from "./play-hand/PlayHand";
import { RenderTurn } from "../../../api/RenderTurn";
import { useRenderIndicator } from "../../../api/helper";
import { StateReceivedBetweenHands } from "../../../api/StateReceivedBetweenHand";
// import { GameAction } from "../../../api/GameAction";

export default function CurrentPlayer({
  player,
  gridPosition,
}: CurrentPlayerProps) {
  const [pseudoPlayHand, setPseudoPlayHand] = useState<Card[]>([]);
  const [isStateReceivedBetweenHands, setIsStateReceivedBetweenHands] =
    useState<boolean>(false);

  const renderContext = useContext(RenderTurn);
  // const actionContext = useContext(GameAction);

  const { isIndicatorTurn } = useRenderIndicator(renderContext!, player);

  function isCardInPseudoPlayHand(card: Card): boolean {
    let isInHand: boolean = false;
    pseudoPlayHand.forEach((pseudoCard) => {
      if (card.id === pseudoCard.id) {
        isInHand = true;
      }
    });
    return isInHand;
  }

  const pseudoHand: Card[] = player.hand.filter((card) => {
    return !isCardInPseudoPlayHand(card);
  });

  function getIndicatorStyle(): string {
    return isIndicatorTurn ? "border-green-500" : "";
  }

  return (
    <div
      className={`${gridPosition.placement} ${getIndicatorStyle()} flex flex-col gap-1 p-1 ml-[15%] mr-[15%] border`}
    >
      <div className="border flex items-center justify-center text-center">
        <span>{player.username}</span>
      </div>
      <StateReceivedBetweenHands.Provider
        value={{ isStateReceivedBetweenHands, setIsStateReceivedBetweenHands }}
      >
        <PlayHand
          pseudoHand={pseudoHand}
          pseudoPlayHand={pseudoPlayHand}
          setPseudoPlayHand={setPseudoPlayHand}
        />
        <Hand
          pseudoHand={pseudoHand}
          pseudoPlayHand={pseudoPlayHand}
          setPseudoPlayHand={setPseudoPlayHand}
          gridPositionIndex={gridPosition.index}
        />
      </StateReceivedBetweenHands.Provider>
    </div>
  );
}
