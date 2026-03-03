import { getCardImgPath } from "../../../../../../api/helper";
import type { Card, HandProps } from "../../../../../../types/commonTypes";

export default function Hand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
  setPseudoHand,
}: HandProps) {
  function addCardToPlayHand(card: Card) {
    setPseudoHand(
      pseudoHand.filter((pseudoCard) => {
        return pseudoCard.id !== card.id;
      }),
    );
    setPseudoPlayHand([...pseudoPlayHand, card]);
  }
  return (
    <div>
      <div>
        {pseudoHand.map((card) => {
          return (
            <img
              src={getCardImgPath(card)}
              onClick={() => {
                addCardToPlayHand(card);
              }}
              alt={card.name}
            />
          );
        })}
      </div>
    </div>
  );
}
