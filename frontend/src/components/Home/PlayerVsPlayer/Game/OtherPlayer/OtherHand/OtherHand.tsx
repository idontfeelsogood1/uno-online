import type { OtherHandProps } from "../../../../../../types/commonTypes";
import { getCardCoverImgPath } from "../../../../../../api/helper";

export default function OtherHand({ otherHand }: OtherHandProps) {
  return (
    <div>
      {otherHand.map(() => {
        return <img src={getCardCoverImgPath()} alt="Card cover" />;
      })}
    </div>
  );
}
