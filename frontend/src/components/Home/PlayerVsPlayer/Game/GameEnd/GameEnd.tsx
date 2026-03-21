import type { GameEndProps } from "../../../../../types/commonTypes";
import { socket } from "../../../../../api/socket";

export default function GameEnd({
  players,
  ownerSocketId,
  setHomeView,
  continueGame,
}: GameEndProps) {
  return (
    <dialog open>
      <h1>GAME ENDED</h1>
      <div>
        <ul>
          {players.map((player) => {
            return (
              <li>
                <span>{player.username}</span>
                {player.socketId === ownerSocketId && <span>(OWNER)</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <button onClick={() => setHomeView()}>HOME</button>
        {players.length > 1 && socket.id === ownerSocketId && (
          <button onClick={() => continueGame()}>CONTINUE</button>
        )}
      </div>
    </dialog>
  );
}
