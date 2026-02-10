import PlayerVsBot from "../PlayerVsBot/PlayerVsBot";
import PlayerVsPlayer from "../PlayerVsPlayer/PlayerVsPlayer";
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
    <div>
      <button
        onClick={() => {
          setView("BOT");
        }}
      >
        Player Vs Bot
      </button>
      <button
        onClick={() => {
          setView("PVP");
        }}
      >
        Multiplayer
      </button>
    </div>
  );
}
