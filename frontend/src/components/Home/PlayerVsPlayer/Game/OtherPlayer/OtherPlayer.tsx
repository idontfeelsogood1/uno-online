import type { OtherPlayerProps } from "../../../../../types/commonTypes";
import OtherHand from "./OtherHand/OtherHand";

export default function OtherPlayer({
  otherPlayer,
  gridPosition,
}: OtherPlayerProps) {
  return (
    <div className={`${gridPosition} flex flex-col border gap-3 p-3`}>
      <div className="border">{otherPlayer.username}</div>
      <OtherHand otherHand={otherPlayer.hand} />
    </div>
  );
}
