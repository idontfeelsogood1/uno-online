import type { CreateGameLobbyProps } from "../../../../types/commonTypes";
import { useContext } from "react";
import { GameModeSocket } from "../../../../api/GameModeSocket";

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
      className="flex flex-col justify-center items-center border p-3 gap-3"
    >
      <div className="border">SELECT THE NUMBER OF PLAYERS!</div>
      <div className="border flex justify-center items-center gap-3">
        <div
          className="border"
          onClick={(e) => {
            createGame(e.currentTarget.dataset.value!);
          }}
          data-value="2"
        >
          2
        </div>
        <div
          className="border"
          onClick={(e) => {
            createGame(e.currentTarget.dataset.value!);
          }}
          data-value="3"
        >
          3
        </div>
        <div
          className="border"
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
