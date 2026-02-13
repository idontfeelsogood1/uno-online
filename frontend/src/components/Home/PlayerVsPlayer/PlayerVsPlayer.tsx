import PlayerLobby from "./PlayerLobby/PlayerLobby";
import Room from "./Room/Room";
import Game from "./Game/Game";
import { useState, useEffect } from "react";
import type {
  PlayerVsPlayerProps,
  WrapperViewState,
  RoomData,
  GameData,
} from "../../../types/commonTypes";
import type {
  RoomStateUpdateDto,
  GameStateUpdateDto,
  RoomDto,
  LobbyDto,
} from "../../../types/dtos/commonDtos";
import { socket } from "../../../api/socket";

export default function PlayerVsPlayer({ setHomeView }: PlayerVsPlayerProps) {
  const [view, setView] = useState<WrapperViewState>("LOBBY");
  // const [errMsg, setErrMsg] = useState<string | null>(null);
  const [lobbyState, setLobbyState] = useState<RoomData[]>([]);
  const [roomState, setRoomState] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameData | null>(null);

  useEffect(() => {
    socket.connect();
    socket.on("get-lobby-success", (data: LobbyDto) => {
      setLobbyState(data.lobbyState);
    });
    socket.on("create-room-success", (data: RoomDto) => {
      setRoomState(data.roomState);
      setView("ROOM");
    });
    socket.on("join-room-success", (data: RoomDto) => {
      setRoomState(data.roomState);
      setView("ROOM");
    });
    socket.on("leave-room-success", () => {
      setRoomState(null);
      setView("LOBBY");
    });
    socket.on("player-joined-room", (data: RoomStateUpdateDto) => {
      setRoomState(data.roomState);
    });
    socket.on("player-left-room", (data: RoomStateUpdateDto) => {
      setRoomState(data.roomState);
    });
    socket.on("game-started", (data: GameStateUpdateDto) => {
      setView("GAME");
      socket.emit("get-room-state", (ack: RoomDto) => {
        setRoomState(ack.roomState);
      });
      setGameState(data.gameState);
    });
    socket.on("game-state-update", (data: GameStateUpdateDto) => {
      socket.emit("get-room-state", (ack: RoomDto) => {
        setRoomState(ack.roomState);
      });
      setGameState(data.gameState);
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
      socket.off("get-lobby-success");
      socket.off("create-room-success");
      socket.off("join-room-success");
      socket.off("leave-room-success");
      socket.off("player-joined-room");
      socket.off("player-left-room");
      socket.off("game-started");
      socket.off("game-state-update");
      socket.off("validation-exception");
      socket.off("room-exception");
      socket.off("game-exception");
    };
  }, []);

  if (view === "LOBBY") {
    return <PlayerLobby lobbyState={lobbyState} setHomeView={setHomeView} />;
  }
  if (view === "ROOM") {
    return <Room roomState={roomState!} />;
  }
  if (view === "GAME") {
    return <Game gameState={gameState!} />;
  }
}
