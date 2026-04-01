import { useEffect, useState } from "react";
import type {
  Card,
  CurrentPlayerProps,
} from "../../../../../types/commonTypes";
import Hand from "./Hand/Hand";
import PlayHand from "./PlayHand/PlayHand";

export default function CurrentPlayer({ player }: CurrentPlayerProps) {
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
    <div className="flex flex-col gap-3 p-3 border">
      <div>{player.username}</div>
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
