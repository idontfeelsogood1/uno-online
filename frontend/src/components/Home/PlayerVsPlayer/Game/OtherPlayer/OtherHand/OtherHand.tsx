import type { OtherHandProps } from "../../../../../../types/commonTypes";
import { getCardCoverImgPath } from "../../../../../../api/helper";

export default function OtherHand({ otherHand }: OtherHandProps) {
  function renderHand(): React.ReactElement[] {
    const img: React.ReactElement[] = [];
    for (let i = 0; i < 7; i++) {
      if (otherHand[i] !== undefined) {
        img.push(
          <img
            className="w-50 h-77.5"
            src={getCardCoverImgPath()}
            alt="Card cover"
          />,
        );
      }
    }
    return img;
  }

  return (
    <div className="flex flex-warp gap-3 p-3 border bg-black">
      {renderHand()}
    </div>
  );
}
