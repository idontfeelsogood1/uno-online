import type {
  GridPosition,
  OtherPlayerProps,
} from "../../../../../types/commonTypes";
import OtherHand from "./OtherHand/OtherHand";

export default function OtherPlayer({
  otherPlayer,
  gridPosition,
}: OtherPlayerProps & {
  gridPosition: GridPosition;
}) {
  // gridPostion.position MAY BE THE KEY
  return (
    <div
      className={`flex ${gridPosition.placement} justify-center align-middle border gap-3 p-3`}
    >
      <div className="border">{otherPlayer.username}</div>
      <OtherHand
        otherHand={otherPlayer.hand}
        rotation={gridPosition.rotation}
      />
    </div>
  );
}
