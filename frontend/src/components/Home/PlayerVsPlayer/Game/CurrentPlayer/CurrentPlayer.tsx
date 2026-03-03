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

  // UPDATE pseudoHand ON PROP CHANGE
  useEffect(() => {
    // IMPLEMENT A WAY TO ONLY SHOW THE CARDS THAT IS NOT IN pseudoPlayHand WHEN THE STATE CHANGES WHILE THE PLAYER HAS CARDS IN THEIR HAND
    setPseudoHand(player.hand);
  }, [player]);

  return (
    <div>
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
