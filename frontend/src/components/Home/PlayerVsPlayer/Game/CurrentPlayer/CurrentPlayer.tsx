import type { CurrentPlayerProps } from "../../../../../types/commonTypes";

export default function CurrentPlayer({ player }: CurrentPlayerProps) {
  return <div>CurrentPlayer component {player.username}</div>;
}
