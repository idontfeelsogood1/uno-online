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

  // FLEX-WARP DOESNT WORK
  // MIGHT BE BECAUSE THE OUTER DIVS ARE NOT FLEX

  // THINK ABOUT THE OVERALL LAYOUT AGAIN BEFORE TOUCHING ANYTHING
  // THINK ABOUT HOW TO MINIMIZE CARD USING SOME CARD OVERLAPPING METHODS
  // I CAN EVEN NOT USE FLEX-WRAP

  return (
    <div className={`${gridPosition} flex flex-col gap-3 p-3 border`}>
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
