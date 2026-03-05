import { getCardImgPath } from "../../../../../../api/helper";
import type { Card, PlayHandProps } from "../../../../../../types/commonTypes";
import { socket } from "../../../../../../api/socket";
import ChooseColor from "../ChooseColor/ChooseColor";
import { useContext, useEffect, useState } from "react";
import { GameAction } from "../../../../../../api/GameAction";

interface PageProps {
  start: number;
  end: number;
}

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
  const [page, setPage] = useState<PageProps>({
    start: 0,
    end: 6,
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

  function renderHand(): React.ReactElement[] {
    const htmlList: React.ReactElement[] = [];
    const offset: number = page.end - (pseudoPlayHand.length - 1);

    for (let i = page.start; i <= page.end - offset; i++) {
      htmlList.push(
        <img
          src={getCardImgPath(pseudoPlayHand[i])}
          onClick={() => {
            removeCardFromPlayHand(pseudoPlayHand[i]);
          }}
          alt={pseudoPlayHand[i].name}
        ></img>,
      );
    }
    return htmlList;
  }

  function switchPage(direction: "left" | "right") {
    let start: number = page.start;
    let end: number = page.end;
    const offset: number = page.end - (pseudoPlayHand.length - 1);

    if (direction === "left" && start > 0) {
      end = start - 1;
      start = end - 6;
    }

    if (direction === "right" && offset === 0) {
      start = end + 1;
      end = start + 6;
    }

    setPage({
      start: start,
      end: end,
    });
  }

  function removeCardFromPlayHand(card: Card) {
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
      <div>
        <button
          onClick={() => {
            switchPage("left");
          }}
        >
          PREV
        </button>
        <div>
          <div>{renderHand()}</div>
          <div>
            <button onClick={playCards}>PLAY CARDS</button>
            <button onClick={uno}>UNO (Play cards while yelling uno)</button>
          </div>
        </div>
        <button
          onClick={() => {
            switchPage("right");
          }}
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
