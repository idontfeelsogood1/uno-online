import type { RoomProps } from "../../../types/commonTypes";
import { useContext } from "react";
import { GameModeSocket } from "../../../api/GameModeSocket";

export default function Room({ roomState }: RoomProps) {
  const socket = useContext(GameModeSocket)!;

  function leaveRoom() {
    socket.emit("leave-room");
  }

  function startGame() {
    socket.emit("start-room");
  }

  return (
    <dialog
      open
      className="flex flex-col gap-3 p-3 text-center fixed inset-0 m-auto h-fit z-99 border"
    >
      <h1>Waiting for players or owner to start the game...</h1>
      <ul className="flex flex-col gap-3 p-3 border">
        {roomState.currentPlayers.map((player) => {
          return (
            <li className="border">
              {player.username}{" "}
              {player.socketId === roomState.ownerSocketId && (
                <span>(Owner)</span>
              )}
            </li>
          );
        })}
      </ul>
      <span>This room can contain {roomState.maxPlayers} players max</span>
      {socket.id === roomState.ownerSocketId && (
        <button onClick={startGame} className="border">
          START GAME
        </button>
      )}
      <button onClick={leaveRoom} className="border">
        BACK
      </button>
    </dialog>
  );
}
