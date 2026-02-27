import type { OtherPlayerProps } from "../../../../../types/commonTypes";
import OtherHand from "./OtherHand/OtherHand";

export default function OtherPlayer({ otherPlayer }: OtherPlayerProps) {
  return (
    <div>
      <div>{otherPlayer.username}</div>
      <OtherHand otherHand={otherPlayer.hand} />
    </div>
  );
}
