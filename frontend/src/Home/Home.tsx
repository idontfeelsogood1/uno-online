import PlayerVsBot from "../PlayerVsBot/PlayerVsBot";
import PlayerVsPlayer from "../PlayerVsPlayer/PlayerVsPlayer";
import { useState } from "react";

export default function Home() {
  const [view, setView] = useState<string | null>(null);

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
