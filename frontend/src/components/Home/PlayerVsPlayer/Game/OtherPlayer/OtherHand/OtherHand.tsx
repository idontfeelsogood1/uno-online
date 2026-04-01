import type { OtherHandProps } from "../../../../../../types/commonTypes";
import { getCardCoverImgPath } from "../../../../../../api/helper";

export default function OtherHand({ otherHand }: OtherHandProps) {
  return (
    <div className="flex flex-warp gap-3 p-3 border">
      {otherHand.map(() => {
        return <img src={getCardCoverImgPath()} alt="Card cover" />;
      })}
    </div>
  );
}
