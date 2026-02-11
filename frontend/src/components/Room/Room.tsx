import type { RoomProps } from "../../types/commonTypes";
import { socket } from "../../api/socket";

export default function Room({ roomState }: RoomProps) {
  function leaveRoom() {
    socket.emit("leave-room");
  }

  return (
    <dialog open>
      <h1>Waiting for players or owner to start the game...</h1>
      <ul>
        {roomState.currentPlayers.map((player) => {
          return (
            <li>
              {player.username}{" "}
              {player.socketId === roomState.ownerSocketId && (
                <span>(Owner)</span>
              )}
            </li>
          );
        })}
      </ul>
      <span>This room can contain max {roomState.maxPlayers} players</span>
      {socket.id === roomState.ownerSocketId && <button>START GAME</button>}
      <button onClick={leaveRoom}>BACK</button>
    </dialog>
  );
}
