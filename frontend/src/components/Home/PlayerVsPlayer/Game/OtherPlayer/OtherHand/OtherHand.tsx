import type { OtherHandProps } from "../../../../../../types/commonTypes";
import { getCardCoverImgPath } from "../../../../../../api/helper";

export default function OtherHand({ otherHand }: OtherHandProps) {
  function renderHand(): React.ReactElement[] {
    const htmlList: React.ReactElement[] = [];

    for (let i = 0; i < 7; i++) {
      if (otherHand[i] !== undefined) {
        htmlList.push(<img src={getCardCoverImgPath()} alt="Card Cover"></img>);
      } else {
        return htmlList;
      }
    }

    return htmlList;
  }

  return <div>{renderHand()}</div>;
}
