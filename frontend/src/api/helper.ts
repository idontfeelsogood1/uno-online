import { useEffect, useState } from "react";
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

export function preloadCardImages(imagesPath: string[]): Promise<void[]> {
  const promises: Promise<void>[] = imagesPath.map((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      // When the image finishes downloading to RAM, resolve the promise
      img.onload = () => resolve();
      img.onerror = () => reject();
    });
  });
  return Promise.all(promises);
}

export function usePreloadCardAssets(): {
  isLoading: boolean;
  loadError: string | null;
} {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function preloadCardAssets(): Promise<void> {
      try {
        await preloadCardImages(generateCardPaths());
        setIsLoading(false);
        console.log("Card's images successfully pre-loaded.");
      } catch (err) {
        setLoadError("An error happened while loading component.");
        setIsLoading(false);
        console.log(`An error happened while pre-loading card images: ${err}`);
      }
    }

    preloadCardAssets();
  }, []);

  return { isLoading, loadError };
}
