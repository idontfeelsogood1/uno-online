import type { GameProps } from "../../../../types/commonTypes";

export default function Game({ gameState }: GameProps) {
  console.log(gameState);
  return <div>Game Component</div>;
}
