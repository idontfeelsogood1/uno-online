import type {
  GridPosition,
  OtherPlayerProps,
} from "../../../../types/commonTypes";
import OtherHand from "./other-hand/OtherHand";

export default function OtherPlayer({
  otherPlayer,
  gridPosition,
}: OtherPlayerProps & {
  gridPosition: GridPosition;
}) {
  let textOrientation = "";

  if (gridPosition.position === "left") {
    textOrientation = "[writing-mode:vertical-rl] rotate-180";
  } else if (gridPosition.position === "right") {
    textOrientation = "[writing-mode:vertical-rl]";
  } else {
    textOrientation = "";
  }

  return (
    <div
      className={`flex flex-1 ${gridPosition.placement} justify-center align-middle border gap-1 p-1`}
    >
      <div className="border flex items-center justify-center text-center">
        <span className={`${textOrientation}`}>{otherPlayer.username}</span>
      </div>
      <OtherHand
        otherHand={otherPlayer.hand}
        position={gridPosition.position}
      />
    </div>
  );
}
