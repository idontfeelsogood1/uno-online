import PlayerLobby from "../PlayerLobby/PlayerLobby";
import Room from "../Room/Room";
import Game from "../Game/Game";
import { useState, useEffect } from "react";
import type {
  PlayerVsPlayerProps,
  WrapperViewState,
  RoomData,
  GameData,
} from "../../types/commonTypes";
import { socket } from "../../api/socket";

export default function PlayerVsPlayer({ setHomeView }: PlayerVsPlayerProps) {
  const [view, setView] = useState<WrapperViewState>("LOBBY");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameData | null>(null);

  useEffect(() => {
    socket.connect();
    socket.on("create-room-success", (data) => {
      console.log(data);
    });
    socket.on("join-room-success", (data) => {
      console.log(data);
    });
    socket.on("leave-room-success", (data) => {
      console.log(data);
    });
    socket.on("game-started", (data) => {
      console.log(data);
    });
    socket.on("validation-exception", (data) => {
      console.log(data);
    });
    socket.on("room-exception", (data) => {
      console.log(data);
    });
    socket.on("game-exception", (data) => {
      console.log(data);
    });

    return () => {
      socket.disconnect();
      socket.off("create-room-success");
      socket.off("player-joined-room");
      socket.off("leave-room");
      socket.off("game-started");
      socket.off("validation-exception");
      socket.off("room-exception");
      socket.off("game-exception");
    };
  }, []);

  if (view === "LOBBY") {
    return <PlayerLobby setHomeView={setHomeView} />;
  }
  if (view === "ROOM") {
    return <Room />;
  }
  if (view === "GAME") {
    return <Game />;
  }
}
