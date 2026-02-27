import type { OtherHand } from "../../../../../../types/commonTypes";
import { getCardCoverImgPath } from "../../../../../../api/helper";

export default function OtherHand({ otherHand }: OtherHand) {
  {
    return otherHand.map(() => {
      return <img src={getCardCoverImgPath()} alt="Card cover" />;
    });
  }
}
