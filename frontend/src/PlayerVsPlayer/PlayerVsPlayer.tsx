import PlayerLobby from "../PlayerLobby/PlayerLobby";
import Room from "../Room/Room";
import Game from "../Game/Game";
import { useState } from "react";

interface PlayerVsPlayerProps {
  setHomeView: (view: null) => void;
}

// ESTABLISH A CONNECTION
export default function PlayerVsPlayer({ setHomeView }: PlayerVsPlayerProps) {
  const [view, setView] = useState<string>("LOBBY");

  if (view === "LOBBY") {
    return <PlayerLobby setHomeView={setHomeView} setWrapperView={setView} />;
  }
  if (view === "ROOM") {
    return <Room />;
  }
  if (view === "GAME") {
    return <Game />;
  }
}
