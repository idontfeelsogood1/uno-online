import type { CreateGameLobbyProps } from "../../../types/commonTypes";
import { useContext } from "react";
import { GameModeSocket } from "../../../api/GameModeSocket";

export default function CreateGameLobby({
  setHomeView,
  setMaxPlayers,
}: CreateGameLobbyProps) {
  const socket = useContext(GameModeSocket)!;

  function createGame(maxPlayers: string): void {
    socket.emit("create-game", {
      maxPlayers: maxPlayers,
    });
    setMaxPlayers(maxPlayers);
  }

  return (
    <dialog
      open
      className="flex flex-col gap-3 p-3 text-center fixed inset-0 m-auto h-fit z-99 border"
    >
      <div className="border p-3">SELECT THE NUMBER OF PLAYERS!</div>
      <div className="border flex flex-col justify-center items-center gap-3 p-3">
        <div
          className="border w-full"
          onClick={(e) => {
            createGame(e.currentTarget.dataset.value!);
          }}
          data-value="2"
        >
          2
        </div>
        <div
          className="border w-full"
          onClick={(e) => {
            createGame(e.currentTarget.dataset.value!);
          }}
          data-value="3"
        >
          3
        </div>
        <div
          className="border w-full"
          onClick={(e) => {
            createGame(e.currentTarget.dataset.value!);
          }}
          data-value="4"
        >
          4
        </div>
      </div>
      <button className="border" onClick={() => setHomeView(null)}>
        EXIT
      </button>
    </dialog>
  );
}
