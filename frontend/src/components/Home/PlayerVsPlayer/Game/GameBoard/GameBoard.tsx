import type {
  GameBoardProps,
  GamePlayer,
} from "../../../../../types/commonTypes";
import { getCardImgPath, getCardCoverImgPath } from "../../../../../api/helper";
import { socket } from "../../../../../api/socket";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

export default function GameBoard({
  topCard,
  enforcedColor,
  gridPosition,
  players,
  setPlayers,
}: GameBoardProps) {
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  useEffect(() => {
    function setCardsForPlayers(): void {
      const tmpPlayers: GamePlayer[] = [];

      players.forEach((player) => {
        tmpPlayers.push(player);
      });

      setPlayers(tmpPlayers);
      setHasInitialized(true);
    }

    setCardsForPlayers();
    setHasInitialized(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderTempHand(): React.ReactElement {
    const elements: React.ReactElement[] = [];

    players.map((player) =>
      player.hand.map((card) =>
        elements.push(
          <motion.div
            key={card.id}
            layoutId={card.id}
            className="absolute inset-0 w-full h-full shadow-sm"
          >
            <div className="w-full h-full relative transform-3d rotate-y-180">
              <img
                src={getCardCoverImgPath()}
                alt="Card cover"
                className="absolute inset-0 w-full h-full object-cover backface-hidden rounded-md"
              />
            </div>
          </motion.div>,
        ),
      ),
    );

    return (
      <div className="relative shrink h-full max-h-64 aspect-2/3">
        {elements}
      </div>
    );
  }

  return (
    <div
      className={`${gridPosition} 4 flex justify-center items-center gap-1 p-1 text-center border`}
    >
      {!hasInitialized ? (
        renderTempHand()
      ) : (
        <button
          onClick={() => {
            socket.emit("draw-card");
          }}
        >
          <img
            src={getCardCoverImgPath()}
            alt="Draw cards"
            className="shrink h-full max-h-64 aspect-2/3"
          />
        </button>
      )}

      <img
        src={getCardImgPath(topCard)}
        alt={topCard.color + " " + topCard.value}
        className="shrink h-full max-h-64 aspect-2/3"
      />

      <div className="border">{topCard.color}</div>

      <div className="border">
        {topCard.color === "BLACK" ? enforcedColor : "No enforced color"}
      </div>
    </div>
  );
}
