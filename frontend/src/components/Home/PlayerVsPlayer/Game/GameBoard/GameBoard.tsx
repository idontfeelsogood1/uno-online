import type { GameBoardProps } from "../../../../../types/commonTypes";
import { getCardImgPath, getCardCoverImgPath } from "../../../../../api/helper";
import { socket } from "../../../../../api/socket";

export default function GameBoard({
  topCard,
  enforcedColor,
  gridPosition,
}: GameBoardProps) {
  return (
    <div
      className={`${gridPosition} 4 flex justify-center items-center gap-1 p-1 text-center border`}
    >
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
