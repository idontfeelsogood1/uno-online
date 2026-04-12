import { useEffect, useState } from "react";
import type {
  Card,
  CurrentPlayerProps,
} from "../../../../../types/commonTypes";
import Hand from "./Hand/Hand";
import PlayHand from "./PlayHand/PlayHand";

export default function CurrentPlayer({
  player,
  gridPosition,
}: CurrentPlayerProps) {
  const [pseudoPlayHand, setPseudoPlayHand] = useState<Card[]>([]);
  const [pseudoHand, setPseudoHand] = useState<Card[]>(player.hand);

  function isCardInPseudoPlayHand(card: Card): boolean {
    let isInHand: boolean = false;
    pseudoPlayHand.forEach((pseudoCard) => {
      if (card.id === pseudoCard.id) {
        isInHand = true;
      }
    });
    return isInHand;
  }

  function manageHand() {
    setPseudoHand(
      player.hand.filter((card) => {
        return !isCardInPseudoPlayHand(card);
      }),
    );
  }

  // UPDATE pseudoHand ON PROP CHANGE
  useEffect(() => {
    manageHand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  return (
    <div
      className={`${gridPosition} flex flex-col gap-1 p-1 pl-120 pr-120 border`}
    >
      <div className="border">{player.username}</div>
      <PlayHand
        pseudoHand={pseudoHand}
        pseudoPlayHand={pseudoPlayHand}
        setPseudoPlayHand={setPseudoPlayHand}
        setPseudoHand={setPseudoHand}
      />
      <Hand
        pseudoHand={pseudoHand}
        pseudoPlayHand={pseudoPlayHand}
        setPseudoPlayHand={setPseudoPlayHand}
        setPseudoHand={setPseudoHand}
      />
    </div>
  );
}
