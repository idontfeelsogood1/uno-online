import type { GameBoardProps } from "../../../../../types/commonTypes";
import { getCardImgPath, getCardCoverImgPath } from "../../../../../api/helper";
import { socket } from "../../../../../api/socket";

export default function GameBoard({ topCard, enforcedColor }: GameBoardProps) {
  return (
    <div>
      <button
        onClick={() => {
          socket.emit("draw-card");
        }}
      >
        <img src={getCardCoverImgPath()} alt="Draw cards" />
      </button>

      <img
        src={getCardImgPath(topCard)}
        alt={topCard.color + " " + topCard.value}
      />

      <div>{topCard.color}</div>

      <div>
        {topCard.color === "BLACK" ? enforcedColor : "No enforced color"}
      </div>
    </div>
  );
}
