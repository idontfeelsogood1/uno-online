import { getCardImgPath } from "../../../../../../api/helper";
import type {
  Card,
  PlayHandProps,
  PageProps,
} from "../../../../../../types/commonTypes";
import { socket } from "../../../../../../api/socket";
import ChooseColor from "../ChooseColor/ChooseColor";
import { useContext, useEffect, useState } from "react";
import { GameAction } from "../../../../../../api/GameAction";

export default function PlayHand({
  pseudoHand,
  pseudoPlayHand,
  setPseudoPlayHand,
  setPseudoHand,
}: PlayHandProps) {
  const action = useContext(GameAction);
  const [showChooseColor, setShowChooseColor] = useState<boolean>(false);
  const [showChooseColorActionCb, setShowChooseColorActionCb] =
    useState<CallableFunction | null>(null);
  const [hasEditCard, setHasEditCard] = useState<boolean>(false);
  const [page, setPage] = useState<PageProps>({
    startIndex: 0,
    endIndex: 6,
    currentPage: 1,
  });

  useEffect(() => {
    if (
      action!.actionType === "played-cards" &&
      socket.id === action!.actionSocketId
    ) {
      setPseudoPlayHand([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  useEffect(() => {
    onPlayHandChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pseudoPlayHand]);

  function onPlayHandChange() {
    const pseudoPlayHandEndIndex: number = pseudoPlayHand.length - 1;

    if (pseudoPlayHandEndIndex - page.startIndex <= -1) {
      switchPage("left");
    }
    if (pseudoPlayHandEndIndex - page.startIndex >= 7 && !hasEditCard) {
      switchPage("right");
    }

    setHasEditCard(false);
  }

  function renderHand(): React.ReactElement[] {
    const htmlList: React.ReactElement[] = [];
    let pseudoPlayHandOffset: number =
      page.endIndex - (pseudoPlayHand.length - 1);

    if (pseudoPlayHandOffset <= -1) pseudoPlayHandOffset = 0;

    for (
      let i = page.startIndex;
      i <= page.endIndex - pseudoPlayHandOffset;
      i++
    ) {
      htmlList.push(
        <img
          key={pseudoPlayHand[i].id}
          src={getCardImgPath(pseudoPlayHand[i])}
          onClick={() => {
            removeCardFromPlayHand(pseudoPlayHand[i]);
          }}
          alt={pseudoPlayHand[i].name}
          className="shrink h-full max-h-64 aspect-2/3"
        ></img>,
      );
    }
    return htmlList;
  }

  function switchPage(direction: "left" | "right") {
    let start: number = page.startIndex;
    let end: number = page.endIndex;
    const offset: number = page.endIndex - (pseudoPlayHand.length - 1);
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

  function removeCardFromPlayHand(card: Card) {
    const pseudoPlayHandEndIndex: number = pseudoPlayHand.length - 1;

    if (
      pseudoPlayHandEndIndex - page.startIndex > 6 &&
      pseudoPlayHandEndIndex > page.endIndex
    ) {
      setHasEditCard(true);
    }

    setPseudoPlayHand(
      pseudoPlayHand.filter((pseudoCard) => {
        return card.id !== pseudoCard.id;
      }),
    );
    setPseudoHand([...pseudoHand, card]);
  }

  function playCondition(action: CallableFunction) {
    if (
      pseudoPlayHand[pseudoPlayHand.length - 1].value === "WILD" ||
      pseudoPlayHand[pseudoPlayHand.length - 1].value === "+4"
    ) {
      setShowChooseColor(true);
      setShowChooseColorActionCb(() => action);
    } else {
      action();
    }
  }

  function playCards() {
    const callback = (wildColor?: string) => {
      const cardIds: string[] = [];
      pseudoPlayHand.forEach((card) => {
        cardIds.push(card.id);
      });

      socket.emit("play-cards", {
        cardsToPlayIds: cardIds,
        wildColor: wildColor,
      });

      setShowChooseColor(false);
    };
    playCondition(callback);
  }

  function uno() {
    const callback = (wildColor?: string) => {
      const cardIds: string[] = [];
      pseudoPlayHand.forEach((card) => {
        cardIds.push(card.id);
      });

      socket.emit("uno", {
        cardsToPlayIds: cardIds,
        wildColor: wildColor,
      });

      setShowChooseColor(false);
    };
    playCondition(callback);
  }

  return (
    <>
      {/* THIS MIGHT BE THE PROBLEM */}
      <div className="@container border p-1 flex flex-1 justify-center min-h-0 min-w-0 h-full">
        <button
          onClick={() => {
            switchPage("left");
          }}
          className="border shrink-0"
        >
          PREV
        </button>
        <div className="grow flex flex-col min-h-0">
          <div
            className="flex justify-center items-center p-1 border grow min-h-0      
            -space-x-2"
          >
            {renderHand()}
          </div>
          <div className="flex justify-center border p-1 gap-1 shrink-0">
            <button onClick={playCards} className="border">
              PLAY CARDS
            </button>
            <button onClick={uno} className="border">
              UNO (Play cards while yelling uno)
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            switchPage("right");
          }}
          className="border shrink-0"
        >
          NEXT
        </button>
      </div>
      {showChooseColor && (
        <ChooseColor actionCallback={showChooseColorActionCb!} />
      )}
    </>
  );
}
