import PlayerVsBot from "./PlayerVsBot/PlayerVsBot";
import PlayerVsPlayer from "./PlayerVsPlayer/PlayerVsPlayer";
import { useState } from "react";
import type { HomeViewState } from "../../types/commonTypes";

export default function Home() {
  const [view, setView] = useState<HomeViewState>(null);

  if (view === "BOT") {
    return <PlayerVsBot setHomeView={setView} />;
  }
  if (view === "PVP") {
    return <PlayerVsPlayer setHomeView={setView} />;
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
