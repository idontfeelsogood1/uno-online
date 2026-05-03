import type { GameEndProps } from "../../../../types/commonTypes";
import { GameModeSocket } from "../../../../api/GameModeSocket";
import { useContext } from "react";

export default function GameEnd({
  players,
  ownerSocketId,
  setHomeView,
  continueGame,
}: GameEndProps) {
  const socket = useContext(GameModeSocket)!;

  return (
    <dialog
      open
      className="flex flex-col text-center gap-3 p-3 fixed inset-0 m-auto h-fit z-99 border"
    >
      <h1>GAME ENDED</h1>
      <div>
        <ul className="flex flex-col border gap-3 p-3">
          {players.map((player) => {
            return (
              <li className="flex gap-3 border">
                <span>{player.username}</span>
                {player.socketId === ownerSocketId && <span>(OWNER)</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <button onClick={() => setHomeView()} className="border">
          HOME
        </button>
        {players.length > 1 && socket.id === ownerSocketId && (
          <button onClick={() => continueGame()} className="border">
            CONTINUE
          </button>
        )}
      </div>
    </dialog>
  );
}
