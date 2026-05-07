import type { Card } from "../types/commonTypes";

export function getCardImgPath(card: Card) {
  return `/card-images/${card.color + "_" + card.value + ".jpg"}`;
}

export function getCardCoverImgPath() {
  return `/card-images/${"COVER" + ".jpg"}`;
}

export function generateCardPaths(): string[] {
  const colors = ["RED", "BLUE", "GREEN", "YELLOW"];
  const values = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "SKIP",
    "REVERSE",
    "+2",
  ];

  const deckPaths: string[] = [];

  // Generate normal cards
  colors.forEach((color) => {
    values.forEach((value) => {
      deckPaths.push(`/card-images/${color + "_" + value + ".jpg"}`);
    });
  });

  // Generate wild cards
  deckPaths.push(`/card-images/${"BLACK" + "_" + "WILD" + ".jpg"}`);
  deckPaths.push(`/card-images/${"BLACK" + "_" + "+4" + ".jpg"}`);

  // Generate card's cover
  deckPaths.push(`/card-images/${"COVER" + ".jpg"}`);

  return deckPaths;
}
