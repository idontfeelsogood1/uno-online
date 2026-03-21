import type { ChooseColorProps } from "../../../../../../types/commonTypes";

export default function ChooseColor({ actionCallback }: ChooseColorProps) {
  return (
    <dialog open>
      <div>CHOOSE A COLOR</div>
      <div onClick={() => actionCallback("RED")}>RED</div>
      <div onClick={() => actionCallback("GREEN")}>GREEN</div>
      <div onClick={() => actionCallback("BLUE")}>BLUE</div>
      <div onClick={() => actionCallback("YELLOW")}>YELLOW</div>
    </dialog>
  );
}
