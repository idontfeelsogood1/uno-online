import { useContext, useEffect, useState } from "react";
import type { Card, CurrentPlayerProps } from "../../../types/commonTypes";
import Hand from "./hand/Hand";
import PlayHand from "./play-hand/PlayHand";
import { RenderTurn } from "../../../api/RenderTurn";
import { useRenderIndicator } from "../../../api/helper";

export default function CurrentPlayer({
  player,
  gridPosition,
  hasInitialized,
}: CurrentPlayerProps) {
  const [pseudoPlayHand, setPseudoPlayHand] = useState<Card[]>([]);
  const [newStateReceived, setNewStateReceived] = useState<boolean>(true);

  const renderContext = useContext(RenderTurn);

  const { isIndicatorTurn } = useRenderIndicator(renderContext!, player);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewStateReceived(true);
  }, [player]);

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
      className={`${gridPosition} ${getIndicatorStyle()} flex flex-col gap-1 p-1 ml-[25%] mr-[25%] border`}
    >
      <div className="border flex items-center justify-center text-center">
        <span>{player.username}</span>
      </div>
      <PlayHand
        pseudoHand={pseudoHand}
        pseudoPlayHand={pseudoPlayHand}
        setPseudoPlayHand={setPseudoPlayHand}
        setNewStateReceived={setNewStateReceived}
      />
      <Hand
        pseudoHand={pseudoHand}
        pseudoPlayHand={pseudoPlayHand}
        setPseudoPlayHand={setPseudoPlayHand}
        newStateReceived={newStateReceived}
        hasInitialized={hasInitialized}
      />
    </div>
  );
}
