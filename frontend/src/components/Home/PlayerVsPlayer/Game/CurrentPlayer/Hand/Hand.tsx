import { getCardImgPath } from "../../../../../../api/helper";
import type {
  Card,
  HandProps,
  PageProps,
} from "../../../../../../types/commonTypes";
import { useEffect, useState } from "react";

export default function Hand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
  setPseudoHand,
}: HandProps) {
  const [hasEditCard, setHasEditCard] = useState<boolean>(false);
  const [page, setPage] = useState<PageProps>({
    startIndex: 0,
    endIndex: 6,
    currentPage: 1,
  });

  useEffect(() => {
    onHandChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pseudoHand]);

  function onHandChange() {
    const pseudoHandEndIndex: number = pseudoHand.length - 1;

    if (pseudoHandEndIndex - page.startIndex <= -1) {
      switchPage("left");
    }
    if (pseudoHandEndIndex - page.startIndex >= 7 && !hasEditCard) {
      switchPage("right");
    }

    setHasEditCard(false);
  }

  function switchPage(direction: "left" | "right") {
    let start: number = page.startIndex;
    let end: number = page.endIndex;
    const offset: number = page.endIndex - (pseudoHand.length - 1);
    let currentPage: number = page.currentPage;

    if (direction === "left" && start > 0) {
      end = start - 1;
      start = end - 6;
      currentPage--;
    }

    if (direction === "right" && offset < 0) {
      start = end + 1;
      end = start + 6;
      currentPage++;
    }

    setPage({
      startIndex: start,
      endIndex: end,
      currentPage: currentPage,
    });
  }

  function addCardToPlayHand(card: Card) {
    setPseudoHand(
      pseudoHand.filter((pseudoCard) => {
        return pseudoCard.id !== card.id;
      }),
    );
    setPseudoPlayHand([...pseudoPlayHand, card]);
    setHasEditCard(true);
  }

  function renderHand(): React.ReactElement[] {
    const htmlList: React.ReactElement[] = [];
    let pseudoHandOffset: number = page.endIndex - (pseudoHand.length - 1);

    if (pseudoHandOffset <= -1) pseudoHandOffset = 0;

    for (let i = page.startIndex; i <= page.endIndex - pseudoHandOffset; i++) {
      htmlList.push(
        <img
          src={getCardImgPath(pseudoHand[i])}
          onClick={() => {
            addCardToPlayHand(pseudoHand[i]);
          }}
          alt={pseudoHand[i].name}
          className="w-50 h-77.5"
        ></img>,
      );
    }
    return htmlList;
  }

  return (
    <div className="border p-3">
      <button onClick={() => switchPage("left")} className="border">
        PREV
      </button>
      <div className="flex flex-warp justify-center -space-x-20.5 p-3 border bg-black">
        {renderHand()}
      </div>
      <button onClick={() => switchPage("right")} className="border">
        NEXT
      </button>
    </div>
  );
}
