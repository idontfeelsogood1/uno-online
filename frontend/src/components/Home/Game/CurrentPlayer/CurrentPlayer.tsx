import { useEffect, useState } from "react";
import type { Card, CurrentPlayerProps } from "../../../../types/commonTypes";
import Hand from "./Hand/Hand";
import PlayHand from "./PlayHand/PlayHand";

export default function CurrentPlayer({
  player,
  gridPosition,
  hasInitialized,
}: CurrentPlayerProps) {
  const [pseudoPlayHand, setPseudoPlayHand] = useState<Card[]>([]);
  const [newStateReceived, setNewStateReceived] = useState<boolean>(true);

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

  // FIX THE CURRENT PLAYER COMPONENT'S HAND AND PLAYHAND NOT DISTRIBUTED EVENLY ON DIFFERENT SCREEN SIZE

  return (
    <div
      className={`${gridPosition} flex flex-col gap-1 p-1 ml-[25%] mr-[25%] border`}
    >
      <div className="border flex items-center justify-center text-center">
        <span>{player.username}</span>
      </div>
      <PlayHand
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
