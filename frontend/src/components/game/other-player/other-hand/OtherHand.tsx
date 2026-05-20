import type { OtherHandProps } from "../../../../types/commonTypes";
import { useCardsAnimation } from "../../../../api/helper";
import { useContext } from "react";
import { GameInitialize } from "../../../../api/GameInitialize";
import { GameAction } from "../../../../api/GameAction";

export default function OtherHand({
  otherHand,
  position,
  gridPositionIndex,
}: OtherHandProps) {
  const initializeContext = useContext(GameInitialize);
  const action = useContext(GameAction);
  const { renderHandContainer } = useCardsAnimation(
    position,
    gridPositionIndex,
    otherHand,
    initializeContext!,
    action!,
    () => {},
    false,
  );

  return <div className="flex-1">{renderHandContainer()}</div>;
}
