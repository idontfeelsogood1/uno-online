import type { BotGameEndProps } from "../../../../types/commonTypes";

export default function GameEnd({
  setHomeView,
  continueGame,
}: BotGameEndProps) {
  return (
    <dialog
      open
      className="flex flex-col text-center gap-3 p-3 fixed inset-0 m-auto h-fit z-99 border"
    >
      <h1>GAME ENDED</h1>
      <div className="flex gap-3">
        <button onClick={() => setHomeView(null)} className="border">
          HOME
        </button>
        <button onClick={() => continueGame(null)} className="border">
          CONTINUE
        </button>
      </div>
    </dialog>
  );
}
