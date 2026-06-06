import { useContext } from "react";
import type { OtherPlayerProps } from "../../../types/commonTypes";
import OtherHand from "./other-hand/OtherHand";
import { RenderTurn } from "../../../api/RenderTurn";
import { useRenderIndicator } from "../../../api/helper";
import { motion } from "motion/react";
import { IsMobileView } from "../../../api/IsMobileView";

export default function OtherPlayer({
  otherPlayer,
  gridPosition,
  carouselSlot,
}: OtherPlayerProps) {
  const renderContext = useContext(RenderTurn);
  const isMobileView = useContext(IsMobileView);

  const { isIndicatorTurn } = useRenderIndicator(renderContext!, otherPlayer);

  let textOrientation = "";

  if (gridPosition.position === "left") {
    textOrientation = "[writing-mode:vertical-rl] rotate-180";
  } else if (gridPosition.position === "right") {
    textOrientation = "[writing-mode:vertical-rl]";
  } else {
    textOrientation = "";
  }

  function getIndicatorStyle(): string {
    return isIndicatorTurn ? "border-green-500" : "";
  }

  return (
    <motion.div
      key={otherPlayer.socketId}
      layoutId={otherPlayer.socketId}
      className={`flex flex-1 ${isMobileView ? carouselSlot.gridPlacement : gridPosition.placement} ${getIndicatorStyle()} justify-center align-middle border p-1`}
      style={{
        zIndex: isMobileView ? carouselSlot.zIndex : "",
      }}
      onAnimationComplete={() => {
        // empty for now
      }}
      animate={
        isMobileView
          ? {
              scale: carouselSlot.scale,
              opacity: carouselSlot.opacity,
            }
          : {}
      }
      transition={
        isMobileView
          ? {
              layout: {
                type: "spring",
                stiffness: 80,
                damping: 14,
                // delay: , COMPUTE LATER WITH useAnimationOrchestrator
              },
              scale: { type: "tween", duration: 0.6 },
            }
          : {}
      }
    >
      <div className="border flex items-center justify-center text-center">
        <span className={`${textOrientation}`}>{otherPlayer.username}</span>
      </div>
      <OtherHand
        otherHand={otherPlayer.hand}
        position={gridPosition.position}
        gridPositionIndex={gridPosition.index}
      />
    </motion.div>
  );
}
