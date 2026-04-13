import type { OtherHandProps } from "../../../../../../types/commonTypes";
import { getCardCoverImgPath } from "../../../../../../api/helper";

export default function OtherHand({ otherHand, rotation }: OtherHandProps) {
  function renderHand(): React.ReactElement[] {
    const img: React.ReactElement[] = [];
    for (let i = 0; i < 7; i++) {
      if (otherHand[i] !== undefined) {
        img.push(
          <img
            key={otherHand[i].id}
            className="shrink h-full max-h-44 aspect-2/3"
            src={getCardCoverImgPath()}
            alt="Card cover"
          />,
        );
      }
    }
    return img;
  }

  return (
    <div className={`flex ${rotation} justify-center items-center border`}>
      {renderHand()}
    </div>
  );
}
