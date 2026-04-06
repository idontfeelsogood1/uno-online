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
  // FIGURE OUT THE ROTATION/POSITION FOR THE USERNAME AND THE HAND
  // USING gridPostion.position
  return (
    <div className={`flex ${gridPosition.placement} border gap-3 p-3`}>
      <div className="border">{otherPlayer.username}</div>
      <OtherHand
        otherHand={otherPlayer.hand}
        rotation={gridPosition.rotation}
      />
    </div>
  );
}
