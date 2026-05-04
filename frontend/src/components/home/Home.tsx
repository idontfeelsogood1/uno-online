import PlayerVsBot from "../player-vs-bot/PlayerVsBot";
import PlayerVsPlayer from "../player-vs-player/PlayerVsPlayer";
import { useState } from "react";
import type { HomeViewState } from "../../types/commonTypes";
import { GameModeSocket } from "../../api/GameModeSocket";
import { socket as BotSocket } from "../../api/bot-socket";
import { socket as PlayerSocket } from "../../api/player-socket";

export default function Home() {
  const [view, setView] = useState<HomeViewState>(null);

  if (view === "BOT") {
    return (
      <GameModeSocket.Provider value={BotSocket}>
        <PlayerVsBot setHomeView={setView} />
      </GameModeSocket.Provider>
    );
  }
  if (view === "PVP") {
    return (
      <GameModeSocket.Provider value={PlayerSocket}>
        <PlayerVsPlayer setHomeView={setView} />{" "}
      </GameModeSocket.Provider>
    );
  }

  return (
    <div className="flex m-auto justify-center items-center gap-7">
      <button
        onClick={() => {
          setView("BOT");
        }}
        className="border"
      >
        Player Vs Bot
      </button>
      <button
        onClick={() => {
          setView("PVP");
        }}
        className="border"
      >
        Multiplayer
      </button>
    </div>
  );
}
